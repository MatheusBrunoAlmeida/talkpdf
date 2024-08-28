import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import type Stripe from 'stripe'

export const runtime = 'edge'

export async function POST(request: Request) {
  let body = await request.text()
  const signature = headers().get('stripe-signature') ?? ''

  // Ensure body is a string
  if (typeof body !== 'string') {
    body = await request.text()
  }

  // Parse the body as JSON
  let event: Stripe.Event
  try {
    event = JSON.parse(body) as Stripe.Event
  } catch (error) {
    console.error('Error parsing webhook body:', error)
    return new Response('Invalid JSON', { status: 400 })
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      // Handle checkout session completed
      break
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice
      // Handle invoice payment succeeded
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  // Log the raw body and content-type for debugging
  console.log('Webhook raw body:', body)
  console.log('Content-Type:', request.headers.get('content-type'))

  // Parse the body as JSON
  let jsonBody;
  try {
    jsonBody = JSON.parse(body);
    console.log('Parsed JSON body:', jsonBody);
  } catch (error) {
    console.error('Error parsing JSON body:', error);
    return new Response('Invalid JSON', { status: 400 });
  }

  // Verify the event type
  if (jsonBody.type !== 'invoice.payment_succeeded') {
    console.log(`Unhandled event type ${jsonBody.type}`);
    return new Response(null, { status: 200 });
  }

  // Extract relevant information from the event
  const session = jsonBody.data.object;

  // Ensure we're using the raw body, not parsed JSON
  if (request.headers.get('content-type') === 'application/json') {
    console.warn('Received JSON content-type, but using raw body for webhook')
    try {
      // Attempt to parse and stringify to normalize any potential JSON
      body = JSON.stringify(JSON.parse(body))
    } catch (error) {
      console.error('Error parsing JSON body:', error)
    }
  }

  // Log the received webhook for debugging
  console.log('Received Stripe webhook:', {
    signature,
    bodyLength: body.length,
  })

  try {
    event = stripe.webhooks.constructEvent(
      jsonBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`,
      { status: 400 }
    )
  }

  // const session = event.data.object as Stripe.Checkout.Session

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
