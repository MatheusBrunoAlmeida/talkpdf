import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { PLANS } from '@/config/stripe'
import { getPineconeClient } from '@/lib/pinecone'
import { PineconeStore } from '@langchain/pinecone'
import { CohereEmbeddings } from '@langchain/cohere'
import * as fs from 'fs'
import Cookies from 'js-cookie'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const f = createUploadthing()

const middleware = async () => {
  try {
    console.log('Iniciando middleware...')
    const session = await getKindeServerSession()

    if (!session) {
      console.error('Sessão não encontrada. Unauthorized.')
      throw new Error('Unauthorized')
    }

    const user = session.getUser()

    if (!user || !user.id) {
      console.error('Usuário não encontrado ou sem ID. Unauthorized.')
      throw new Error('Unauthorized')
    }

    console.log('Usuário autenticado:', user.id)
    const subscriptionPlan = await getUserSubscriptionPlan()
    console.log('Plano de assinatura recuperado:', subscriptionPlan)

    return { subscriptionPlan, userId: user.id }

  } catch (err) {
    console.error('Erro no middleware:', err)
  }
}

const onUploadComplete = async ({ metadata, file }: { metadata: Awaited<ReturnType<typeof middleware>>, file: { key: string, name: string, url: string } }) => {
  console.log('Upload completo. Iniciando processamento do arquivo...', file)

  try {
    const isFileExist = await db.file.findFirst({ where: { key: file.key } })

    if (isFileExist) {
      console.log('O arquivo já existe no banco de dados:', file.key)
      return
    }

    console.log('Arquivo não encontrado. Criando novo registro no banco de dados...')
    const createdFile = await db.file.create({
      data: {
        key: file.key,
        name: file.name,
        userId: metadata?.userId,
        url: file.url,
        uploadStatus: 'PROCESSING',
      },
    })

    console.log('Arquivo criado no banco de dados:', createdFile)

    const response = await fetch(file.url)
    const blob = await response.blob()

    console.log('Arquivo baixado com sucesso:', file.url)

    const tempFilePath = `/tmp/${file.name}`
    fs.writeFileSync(tempFilePath, Buffer.from(await blob.arrayBuffer()))

    console.log('Arquivo temporário salvo em:', tempFilePath)

    const loader = new PDFLoader(tempFilePath)
    const pageLevelDocs = await loader.load()

    console.log('Conteúdo do PDF carregado:', pageLevelDocs.length, 'páginas')

    const cohereEmbeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: 'embed-multilingual-v2.0',
    })

    const pinecone = await getPineconeClient()
    const pineconeIndex = pinecone.Index('talkpdf')

    console.log('Conectado ao Pinecone:', pineconeIndex)

    const pineconeStore = await PineconeStore.fromDocuments(pageLevelDocs, cohereEmbeddings, {
      pineconeIndex,
      namespace: createdFile.id,
    })

    console.log('Embeddings armazenados no Pinecone:', pineconeStore)

    await db.file.update({
      data: {
        uploadStatus: 'SUCCESS',
      },
      where: {
        id: createdFile.id,
      },
    })

    console.log('Status do arquivo atualizado para SUCCESS no banco de dados.')

    fs.unlinkSync(tempFilePath)
    console.log('Arquivo temporário removido:', tempFilePath)

  } catch (err) {
    console.error('Erro no processamento do arquivo:', err)

    // if (metadata?.userId) {
    //   console.log('Atualizando o status do arquivo para FAILED no banco de dados...')
    //   await db.file.update({
    //     data: {
    //       uploadStatus: 'FAILED',
    //     },
    //     where: {
    //       userId: metadata.userId,
    //       key: file.key,
    //     },
    //   })
    // }
  }
}

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: '4MB' } })
  // @ts-ignore
    .middleware(middleware)
    // @ts-ignore
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: '16MB' } })
  // @ts-ignore
    .middleware(middleware)
    // @ts-ignore
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
