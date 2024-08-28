// import { db } from '@/db'
// import { stripe } from '@/lib/stripe'
// import { headers } from 'next/headers'
// import type Stripe from 'stripe'

// // Update the POST function to use the new Edge Runtime
// export const runtime = 'edge'

// export async function POST(request: Request) {
//   let body = await request.text()
//   const signature = headers().get('Stripe-Signature') ?? ''

//   let event: Stripe.Event

  // Ensure body is a string and handle raw payload
//   if (typeof body !== 'string') {
//     body = await request.text()
//   }

//   // Handle JSON content type
//   if (request.headers.get('content-type') === 'application/json') {
//     try {
//       const jsonBody = await request.json()
//       body = JSON.stringify(jsonBody)
//     } catch (error) {
//       console.error('Error parsing JSON body:', error)
//       return new Response('Invalid JSON', { status: 400 })
//     }
//   }

//   // Log the received webhook for debugging
//   console.log('Received Stripe webhook:', {
//     headers: Object.fromEntries(request.headers),
//     body: body.substring(0, 500) + (body.length > 500 ? '...' : ''),
//   })

//   // try {
//   event = await stripe.webhooks.constructEventAsync(
//     body,
//     signature,
//     process.env.STRIPE_WEBHOOK_SECRET || ''
//   )
//   // } catch (err) {
//   //   return new Response(
//   //     `Webhook Error on construct: ${err instanceof Error ? err.message : 'Unknown Error'
//   //     }`,
//   //     { status: 400 }
//   //   )
//   // }

//   const session = event.data
//     .object as Stripe.Checkout.Session

//   console.log('session', session)

//   if (!session?.metadata?.userId) {
//     return new Response(null, {
//       status: 200,
//     })
//   }

//   if (event.type === 'checkout.session.completed') {
//     const subscription =
//       await stripe.subscriptions.retrieve(
//         session.subscription as string
//       )

//     console.log('web hook called')

//     await db.user.update({
//       where: {
//         id: session.metadata.userId,
//       },
//       data: {
//         stripeSubscriptionId: subscription.id,
//         stripeCustomerId: subscription.customer as string,
//         stripePriceId: subscription.items.data[0]?.price.id,
//         stripeCurrentPeriodEnd: new Date(
//           subscription.current_period_end * 1000
//         ),
//         userPlan: 'pro'
//       },
//     })
//   }

//   if (event.type === 'invoice.payment_succeeded') {
//     // Retrieve the subscription details from Stripe.
//     const subscription =
//       await stripe.subscriptions.retrieve(
//         session.subscription as string
//       )

//     await db.user.update({
//       where: {
//         stripeSubscriptionId: subscription.id,
//       },
//       data: {
//         stripePriceId: subscription.items.data[0]?.price.id,
//         stripeCurrentPeriodEnd: new Date(
//           subscription.current_period_end * 1000
//         ),
//       },
//     })
//   }

//   return new Response(null, { status: 200 })
// }

import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import type Stripe from 'stripe'

export const runtime = 'edge'

export async function POST(request: Request) {
  let body = await request.text()
  const signature = headers().get('Stripe-Signature') ?? ''

  let event: Stripe.Event

  if (typeof body !== 'string') {
    body = await request.text()
  }

  // Do not parse JSON, use raw body
  if (request.headers.get('content-type') === 'application/json') {
    console.warn('Received JSON content-type, but using raw body for webhook')
  }

  // Log the received webhook for debugging
  console.log('Received Stripe webhook:', {
    signature,
    bodyLength: body.length,
  })

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`,
      { status: 400 }
    )
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (!session?.metadata?.userId) {
    return new Response(null, { status: 200 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(session)
      break
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(session)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return new Response(null, { status: 200 })
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  await db.user.update({
    where: {
      id: session.metadata?.userId,
    },
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

async function handleInvoicePaymentSucceeded(session: Stripe.Checkout.Session) {
  const subscription = await stripe.subscriptions.retrieve(
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
