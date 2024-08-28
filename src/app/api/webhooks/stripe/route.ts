import { PLANS } from '@/config/stripe'
import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import type Stripe from 'stripe'

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

  let jsonBody;
  try {
    jsonBody = JSON.parse(body);
    console.log('Parsed JSON body:', jsonBody);
  } catch (error) {
    console.error('Error parsing JSON body:', error);
    return new Response('Invalid JSON', { status: 400 });
  }


  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutSessionCompleted(session, jsonBody)

      // Handle checkout session completed
      break
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaymentSucceeded(invoice)
      // Handle invoice payment succeeded
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  // Log the raw body and content-type for debugging
  console.log('Webhook raw body:', body)
  console.log('Content-Type:', request.headers.get('content-type'))

  // // Verify the event type
  // if (jsonBody.type !== 'invoice.payment_succeeded') {
  //   console.log(`Unhandled event type ${jsonBody.type}`);
  //   return new Response(null, { status: 200 });
  // }

  // Redirect to the billing route
  // The redirect doesn't work in this context because this is a server-side API route
  // We can't perform client-side redirects from here
  // Instead, we should handle the webhook event and update the user's subscription status
  
  // const invoice = jsonBody.data.object as Stripe.Invoice;
  // await handleInvoicePaymentSucceeded(invoice);

  // Return a success response to Stripe
  return new Response(null, { 
    status: 200,
  });
  // return new Response(null, { 
  //   status: 303, 
  //   headers: { 'Location': '/dashboard/billing' } 
  // })
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, jsonBody: any) {
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  const value = jsonBody.data.object.amount_paid /  100

  const plan = PLANS.find((plan) => plan.price.amount === value)

  console.log('plan', plan)

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
      userPlan: plan?.slug,
    },
  })
}

async function handleInvoicePaymentSucceeded(session: Stripe.Invoice) {
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
