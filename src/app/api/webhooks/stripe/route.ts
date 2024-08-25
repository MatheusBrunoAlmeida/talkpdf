import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const signature = headers().get('Stripe-Signature') ?? ''

  // Capture o corpo como um buffer ao invés de texto.
  const body = await request.arrayBuffer()
  const rawBody = Buffer.from(body)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,  // Passando o corpo como buffer
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )

    console.log(event)
  } catch (err) {
    // @ts-ignore
    console.error(`Webhook Error: ${err.message}`)
    return new Response(
      `Webhook Error: ${
        err instanceof Error ? err.message : 'Unknown Error'
      }`,
      { status: 400 }
    )
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (!session?.metadata?.userId) {
    return new Response(null, { status: 200 })
  }

  if (event.type === 'checkout.session.completed') {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

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
}
