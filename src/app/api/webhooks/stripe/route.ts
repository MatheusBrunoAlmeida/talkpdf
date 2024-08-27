import { db } from '@/db';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { buffer } from 'micro';

export async function POST(request: Request) {
  const signature = headers().get('stripe-signature') ?? '';
  const rawBody = await request.text();

  console.log(rawBody)

  if (!rawBody) {
    throw new Error('Body is empty or not raw');
  }

  let event: Stripe.Event;

  try {
    // Verifica a assinatura do webhook com o corpo cru
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    // Processa o evento do Stripe
    const session = event.data.object as Stripe.Checkout.Session;

    console.log('session', session);

    if (!session?.metadata?.userId) {
      return NextResponse.json({}, { status: 200 });
    }

    if (event.type === 'checkout.session.completed') {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      console.log('webhook called');

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
      });
    }

    if (event.type === 'invoice.payment_succeeded') {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await db.user.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });
    }

    return NextResponse.json({}, { status: 200 });
  } catch (err) {
    // Captura qualquer erro relacionado à verificação da assinatura ou ao processamento do evento
    console.error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}` },
      { status: 400 }
    );
  }
}
