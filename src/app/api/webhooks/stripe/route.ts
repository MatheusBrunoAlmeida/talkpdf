import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request
  const signature = headers().get('Stripe-Signature') ?? ''

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      String(body),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )

    console.log(event)
  } catch (err) {
    return new Response(
      `Webhook Error on construct: ${
        err instanceof Error ? err.message : 'Unknown Error'
      }`,
      { status: 400 }
    )
  }

  const session = event.data
    .object as Stripe.Checkout.Session

    console.log('session',session)

  if (!session?.metadata?.userId) {
    return new Response(null, {
      status: 200,
    })
  }

  if (event.type === 'checkout.session.completed') {
    const subscription =
      await stripe.subscriptions.retrieve(
        session.subscription as string
      )

      console.log('web hook called')

    await db.user.update({
      where: {
        id: session.metadata.userId,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
        userPlan: 'pro'
      },
    })
  }

  if (event.type === 'invoice.payment_succeeded') {
    // Retrieve the subscription details from Stripe.
    const subscription =
      await stripe.subscriptions.retrieve(
        session.subscription as string
      )

    await db.user.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
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