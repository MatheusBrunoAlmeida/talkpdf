import { db } from '@/db'
import { getPineconeClient } from '@/lib/pinecone'
import { SendMessageValidator } from '@/lib/validators/SendMessageValidator'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { CohereEmbeddings } from '@langchain/cohere'
import { PineconeStore } from '@langchain/pinecone'
import { CohereClient } from 'cohere-ai'
import { NextRequest } from 'next/server'
import Cookies from 'js-cookie'
// import { cohere } from '@/lib/cohereClient' // Importe o cliente Cohere configurado

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
})

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json()

    // Obtém a sessão do usuário
    const session = await getKindeServerSession()

    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const user = session.getUser()

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = user.id

    // Valida o corpo da requisição
    const { fileId, message } = SendMessageValidator.parse(body)

    // Verifica se o arquivo pertence ao usuário
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    })

    if (!file) {
      return new Response('File not found', { status: 404 })
    }

    // Salva a mensagem do usuário no banco de dados
    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        userId,
        fileId,
      },
    })

    // Recuperar mensagens anteriores para o contexto
    const prevMessages = await db.message.findMany({
      where: {
        fileId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 6, // Ajuste conforme necessário
    })

    const formattedPrevMessages = prevMessages.map((msg) => ({
      role: msg.isUserMessage ? 'user' : 'assistant',
      content: msg.text,
    }))

    const cohereEmbeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: 'embed-multilingual-v2.0', // Modelo usado para gerar embeddings
    })

    // Conectar ao Pinecone
    const pinecone = await getPineconeClient()
    const pineconeIndex = pinecone.Index('talkpdf')

    // Armazenar os embeddings no Pinecone
    const vectorStore = await PineconeStore.fromExistingIndex(
      cohereEmbeddings,
      {
        pineconeIndex,
        namespace: file.id,
      }
    )

    const results = await vectorStore.similaritySearch(
      message,
      4
    )

    console.log(results)

    // Preparar o prompt para a API do Cohere
    const prompt = `
      Use o contexto fornecido ou a conversa anterior, se necessário, para responder à pergunta do usuário. Responda em markdown.
      Se não souber a resposta, diga que não sabe e não tente inventar.

      ----------------
      CONVERSA ANTERIOR:
      ${formattedPrevMessages
        .map((message) =>
          message.role === 'user'
            ? `Usuário: ${message.content}\n`
            : `Assistente: ${message.content}\n`
        )
        .join('')}
      ----------------
      CONTEXTO:
      ${results.map((r) => r.pageContent).join('\n\n')} 
      ----------------
      MENSAGEM DO USUÁRIO: ${message}`

    // Gerar uma resposta usando a API do Cohere
    const generateResponse = await cohere.generate({
      model: 'command-xlarge-nightly', // Use o modelo adequado da Cohere
      prompt: prompt,
      maxTokens: 150, // Ajuste conforme necessário
      stopSequences: ["\n"],
      temperature: 0,
    })

    // if (generateResponse.status !== 200 || !generateResponse.body.generations) {
    //   return new Response('Failed to generate response', { status: 500 })
    // }

    const responseText = generateResponse.generations[0].text.trim()

    // Salva a resposta gerada no banco de dados
    await db.message.create({
      data: {
        text: responseText,
        isUserMessage: false,
        fileId,
        userId,
      },
    })

    return new Response(responseText, { status: 200 })
  } catch (error) {
    console.error('Internal server error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
