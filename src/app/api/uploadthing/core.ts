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
  const session = await getKindeServerSession()

  if (!session) throw new Error('Unauthorized')

  const user = session.getUser()

  if (!user || !user.id) throw new Error('Unauthorized')

  const subscriptionPlan = await getUserSubscriptionPlan()

  return { subscriptionPlan, userId: user.id }
}

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>
  file: {
    key: string
    name: string
    url: string
  }
}) => {
  console.log('chegou aqui')
  const isFileExist = await db.file.findFirst({
    where: {
      key: file.key,
    },
  })

  if (isFileExist) {
    console.log('File existe')
    return
  }

  let createdFile

  try {
    const createdFileData = await db.file.create({
      data: {
        key: file.key,
        name: file.name,
        userId: metadata.userId,
        url: file.url,
        uploadStatus: 'PROCESSING',
      },
    })

    createdFile = createdFileData
  } catch (error) {
    return console.log(error)
  }

  try {

    console.log('file created', createdFile)

    const response = await fetch(file.url)
    const blob = await response.blob()

    console.log('response fetch', response)

    // Salvar o blob como um arquivo temporário no sistema de arquivos
    const tempFilePath = `/tmp/${file.name}`
    fs.writeFileSync(tempFilePath, Buffer.from(await blob.arrayBuffer()))

    // Carregar o conteúdo do PDF
    const loader = new PDFLoader(tempFilePath)
    const pageLevelDocs = await loader.load()

    const texts = pageLevelDocs.map((doc) => doc.pageContent)

    // Configurar o cliente de embeddings do Cohere
    const cohereEmbeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: 'embed-multilingual-v2.0', // Modelo usado para gerar embeddings
    })

    // Conectar ao Pinecone
    const pinecone = await getPineconeClient()
    const pineconeIndex = pinecone.Index('talkpdf')

    // Armazenar os embeddings no Pinecone
    const pineconeStore = await PineconeStore.fromDocuments(
      pageLevelDocs,
      cohereEmbeddings,
      {
        pineconeIndex,
        namespace: createdFile.id,
      }
    )

    console.log('Pinecone Store:', pineconeStore)

    // Atualizando o status do arquivo no banco de dados
    await db.file.update({
      data: {
        uploadStatus: 'SUCCESS',
      },
      where: {
        id: createdFile.id,
      },
    })

    // Remover o arquivo temporário
    fs.unlinkSync(tempFilePath)

  } catch (err) {
    console.error('Erro no processamento do arquivo:', err)
    // await db.file.update({
    //   data: {
    //     uploadStatus: 'FAILED',
    //   },
    //   where: {
    //     id: createdFile.id,
    //   },
    // })
  }
}

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: '4MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: '16MB' } })
    .middleware(middleware)
    .onUploadError((error)=> console.log('error',error))
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
