import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import Wallet from '@/lib/models/Wallet';
import Token from '@/lib/models/Token';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import LedgerEntry from '@/lib/models/LedgerEntry';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe';

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

async function creditDeposit(depositId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const locked = await Deposit.findById(depositId).session(session);
      if (!locked) return;
      if (locked.status === 'completed' && locked.creditedAt) return;

      const wallet = await Wallet.findOne({ user: locked.userId }).session(session);
      if (!wallet) throw new Error('Wallet not found.');

      const tokenDoc = await Token.findOne({
        symbol: locked.token.toUpperCase(),
        isActive: true,
      })
        .select('_id symbol')
        .session(session);
      if (!tokenDoc) throw new Error('Token not found.');

      const updatedBalanceDoc = await WalletTokenBalance.findOneAndUpdate(
        { wallet: wallet._id, token: tokenDoc._id },
        { $inc: { balance: locked.amount } },
        { new: true, upsert: true, session, setDefaultsOnInsert: true }
      );

      await LedgerEntry.create(
        [
          {
            userId: locked.userId,
            type: 'deposit',
            token: locked.token.toUpperCase(),
            amount: locked.amount,
            direction: 'credit',
            note: 'Stripe deposit confirmed and credited',
            balanceAfter: Number(updatedBalanceDoc?.balance || 0),
            externalRef: locked.stripePaymentIntentId || locked.stripeSessionId || String(locked._id),
          },
        ],
        { session, ordered: true }
      );

      locked.status = 'completed';
      locked.creditedAt = new Date();
      locked.note = 'Stripe payment confirmed and wallet credited';
      locked.externalRef = locked.stripePaymentIntentId || locked.stripeSessionId || locked.externalRef || '';
      await locked.save({ session });
    });
  } finally {
    await session.endSession();
  }
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
    await creditDeposit(deposit._id);

    return NextResponse.json({ ok: true, status: 'completed' });
  } catch (e) {
    console.error('webhooks/stripe POST', e);
    return NextResponse.json({ ok: false, error: 'Webhook processing failed.' }, { status: 500 });
  }
}
