import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import type Stripe from 'stripe'

// Desativa o processamento automático do corpo no Next.js
export const config = {
  api: {
    bodyParser: false, // Isso garante que o corpo não seja convertido para JSON automaticamente
  },
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('Stripe-Signature') ?? ''

  let event: Stripe.Event

  try {
    // Verifica a assinatura do webhook com o corpo cru
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
    
    // Processa o evento do Stripe
    const session = event.data.object as Stripe.Checkout.Session

    console.log('session', session)

    if (!session?.metadata?.userId) {
      return new Response(null, { status: 200 })
    }

    if (event.type === 'checkout.session.completed') {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      )

      console.log('webhook called')

      await db.user.update({
        where: { id: session.metadata.userId },
        data: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      })
    }

    if (event.type === 'invoice.payment_succeeded') {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      )

      await db.user.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      })
    }

    return new Response(null, { status: 200 })
  } catch (err) {
    // Captura qualquer erro relacionado à verificação da assinatura ou ao processamento do evento
    console.error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`)
    return new Response(
      `Webhook Error: ${
        err instanceof Error ? err.message : 'Unknown Error'
      }`,
      { status: 400 }
    )
  }
}
