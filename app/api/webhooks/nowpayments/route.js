import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import Wallet from '@/lib/models/Wallet';
import Token from '@/lib/models/Token';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import LedgerEntry from '@/lib/models/LedgerEntry';
import { verifyNowPaymentsIpnSignature } from '@/lib/nowpayments';

export const runtime = 'nodejs';

const CREDIT_STATUSES = new Set(['confirmed', 'finished']);
const CANCEL_STATUSES = new Set(['failed', 'expired', 'refunded']);

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-nowpayments-sig') || '';
    if (!verifyNowPaymentsIpnSignature(rawBody, signature)) {
      return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const orderId = String(payload.order_id || '').trim();
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Missing order_id.' }, { status: 400 });
    }

    await connectDB();
    const deposit = await Deposit.findById(orderId);
    if (!deposit || deposit.paymentMethod !== 'crypto') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    deposit.nowPaymentsPaymentId = String(payload.payment_id || deposit.nowPaymentsPaymentId || '');
    deposit.nowPaymentsPaymentStatus = String(payload.payment_status || '').toLowerCase();
    if (typeof payload.pay_amount === 'number' && Number.isFinite(payload.pay_amount)) {
      deposit.payAmount = payload.pay_amount;
    }
    if (payload.pay_currency) {
      deposit.payCurrency = String(payload.pay_currency).toLowerCase();
    }
    if (payload.pay_address) {
      deposit.payAddress = String(payload.pay_address);
    }

    const paymentStatus = deposit.nowPaymentsPaymentStatus;
    if (CANCEL_STATUSES.has(paymentStatus) && deposit.status !== 'completed') {
      deposit.status = 'cancelled';
      deposit.note = `Crypto payment ${paymentStatus}`;
      await deposit.save();
      return NextResponse.json({ ok: true, status: deposit.status });
    }

    if (!CREDIT_STATUSES.has(paymentStatus)) {
      if (deposit.status !== 'completed') {
        deposit.status = 'pending';
        await deposit.save();
      }
      return NextResponse.json({ ok: true, status: deposit.status });
    }

    if (deposit.status === 'completed' && deposit.creditedAt) {
      return NextResponse.json({ ok: true, status: 'completed', alreadyCredited: true });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const locked = await Deposit.findById(deposit._id).session(session);
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
              note: 'Crypto deposit confirmed via NowPayments',
              balanceAfter: Number(updatedBalanceDoc?.balance || 0),
              externalRef: locked.nowPaymentsPaymentId || String(locked._id),
            },
          ],
          { session, ordered: true }
        );

        locked.status = 'completed';
        locked.creditedAt = new Date();
        locked.note = 'Crypto payment confirmed and wallet credited';
        locked.externalRef = locked.nowPaymentsPaymentId || locked.externalRef || '';
        await locked.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ ok: true, status: 'completed' });
  } catch (e) {
    console.error('webhooks/nowpayments POST', e);
    return NextResponse.json({ ok: false, error: 'Webhook processing failed.' }, { status: 500 });
  }
}
