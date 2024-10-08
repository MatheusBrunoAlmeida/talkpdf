import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import {
  privateProcedure,
  publicProcedure,
  router,
} from './trpc'
import { TRPCError } from '@trpc/server'
import { db } from '@/db'
import { z } from 'zod'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { absoluteUrl } from '@/lib/utils'
import {
  getUserSubscriptionPlan,
  stripe,
} from '@/lib/stripe'
import { PLANS } from '@/config/stripe'
import { CohereEmbeddings } from '@langchain/cohere'
import { getPineconeClient } from '@/lib/pinecone'
import { PineconeStore } from '@langchain/pinecone'

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession()
    const user = getUser()

    if (!user.id || !user.email)
      throw new TRPCError({ code: 'UNAUTHORIZED' })

    // check if the user is in the database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    })

    if (!dbUser) {
      // create user in db
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
          userPlan: 'free'
        },
      })
    }

    return { success: true }
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx

    return await db.file.findMany({
      where: {
        userId,
      },
    })
  }),

  createStripeSession: privateProcedure
    .input(z.object({ plan: z.string() }))
    .mutation(
      async ({ ctx, input }) => {
        const { userId } = ctx

        const billingUrl = absoluteUrl('/dashboard/billing')

        if (!userId)
          throw new TRPCError({ code: 'UNAUTHORIZED' })

        const dbUser = await db.user.findFirst({
          where: {
            id: userId,
          },
        })

        if (!dbUser)
          throw new TRPCError({ code: 'UNAUTHORIZED' })

        const subscriptionPlan =
          await getUserSubscriptionPlan()

        if (
          subscriptionPlan.isSubscribed &&
          dbUser.stripeCustomerId
        ) {
          const stripeSession =
            await stripe.billingPortal.sessions.create({
              customer: dbUser.stripeCustomerId,
              return_url: billingUrl,
              locale: 'pt-BR'
            })

          return { url: stripeSession.url }
        }

        console.log('sub')

        const stripeSession =
          await stripe.checkout.sessions.create({
            success_url: billingUrl,
            cancel_url: billingUrl,
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'auto',
            line_items: [
              {
                price: PLANS.find(
                  (plan) => plan.name === input.plan
                )?.price.priceIds.test,
                quantity: 1,
              },
            ],
            metadata: {
              userId: userId,
            },
          })

        return { url: stripeSession.url }
      }
    ),

  getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx
      const { fileId, cursor } = input
      const limit = input.limit ?? INFINITE_QUERY_LIMIT

      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      })

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        // @ts-ignore
        nextCursor = nextItem?.id
      }

      return {
        messages,
        nextCursor,
      }
    }),

  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        },
      })

      if (!file) return { status: 'PENDING' as const }

      return { status: file.uploadStatus }
    }),

  cancelSubiscription: publicProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Cancela a assinatura no Stripe
      const deletedSubscription = await stripe.subscriptions.cancel(input.subscriptionId)

      const user = await db.user.findFirst({
        where: {
          stripeSubscriptionId: deletedSubscription.id
        }
      })

      const userUpdated = await db.user.update({
        where: {
          id: user?.id
        },
        data: {
          stripeCurrentPeriodEnd: null,
          stripeCustomerId: null,
          stripePriceId: null,
          stripeSubscriptionId: null,
          userPlan: 'free'
        }
      })

      console.log('assinatura', deletedSubscription)

      return { deletedSubscription, userUpdated }
    }),


  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      console.log('input trcp', input)

      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId,
        },
      })

      const cohereEmbeddings = new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY,
        model: 'embed-multilingual-v2.0',
      })

      const pinecone = await getPineconeClient()
      const pineconeIndex = pinecone.Index('talkpdf')
      const vectorStore = await PineconeStore.fromExistingIndex(
        cohereEmbeddings,
        {
          pineconeIndex,
          namespace: file?.id,
        }
      )

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      // const results = await vectorStore.similaritySearch(message, 4)


      return file
    }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      })

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      await db.file.delete({
        where: {
          id: input.id,
        },
      })

      return file
    }),
})

export type AppRouter = typeof appRouter
