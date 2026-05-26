import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe';
import { creditDepositById } from '@/lib/depositCredit';

export const runtime = 'nodejs';

function statusFromEventType(type) {
  if (type === 'payment_intent.payment_failed' || type === 'payment_intent.canceled') {
    return 'failed';
  }
  if (type === 'payment_intent.succeeded') {
    return 'succeeded';
  }
  return 'pending';
}

export async function POST(request) {
  try {
    const signature = request.headers.get('stripe-signature') || '';
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
      return NextResponse.json({ ok: false, error: 'Stripe webhook secret is missing.' }, { status: 500 });
    }

    const rawBody = await request.text();
    const stripe = getStripeClient();
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json({ ok: false, error: `Invalid Stripe signature: ${err?.message || 'unknown'}` }, { status: 400 });
    }

    const type = String(event.type || '');
    const object = event?.data?.object || {};
    const metadata = object.metadata || {};
    const depositId = String(metadata.depositId || '').trim();
    if (!depositId) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'No deposit id metadata.' });
    }

    await connectDB();
    const deposit = await Deposit.findById(depositId);
    if (!deposit || deposit.paymentMethod !== 'stripe') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    deposit.stripePaymentIntentId = String(object.id || deposit.stripePaymentIntentId || '');
    deposit.stripePaymentStatus = statusFromEventType(type);

    if (deposit.stripePaymentStatus === 'failed' && deposit.status !== 'completed') {
      deposit.status = 'cancelled';
      deposit.note = 'Stripe payment failed or expired';
      await deposit.save();
      return NextResponse.json({ ok: true, status: deposit.status });
    }

    if (deposit.stripePaymentStatus !== 'succeeded') {
      if (deposit.status !== 'completed') {
        deposit.status = 'pending';
        await deposit.save();
      }
      return NextResponse.json({ ok: true, status: deposit.status });
    }

    if (deposit.status === 'completed' && deposit.creditedAt) {
      return NextResponse.json({ ok: true, status: 'completed', alreadyCredited: true });
    }

    await deposit.save();
    await creditDepositById(deposit._id, {
      ledgerNote: 'Stripe deposit confirmed and credited',
      completedNote: 'Stripe payment confirmed and wallet credited',
    });

    return NextResponse.json({ ok: true, status: 'completed' });
  } catch (e) {
    console.error('webhooks/stripe POST', e);
    return NextResponse.json({ ok: false, error: 'Webhook processing failed.' }, { status: 500 });
  }
}
