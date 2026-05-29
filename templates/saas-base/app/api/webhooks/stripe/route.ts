import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Sem assinatura' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  const supabase = await createAdminClient();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Mapeia priceId → plano
      const priceId = subscription.items.data[0]?.price.id ?? '';
      const plano = priceId === process.env.STRIPE_PRICE_PRO ? 'pro'
        : priceId === process.env.STRIPE_PRICE_BASICO ? 'basico'
        : 'gratuito';

      await supabase
        .from('profiles')
        .update({ plano, stripe_subscription_id: subscription.id })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('profiles')
        .update({ plano: 'gratuito', stripe_subscription_id: null })
        .eq('stripe_customer_id', subscription.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
