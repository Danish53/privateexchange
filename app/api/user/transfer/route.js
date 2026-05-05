import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import User from '@/lib/models/User';
import Token from '@/lib/models/Token';
import Wallet from '@/lib/models/Wallet';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import LedgerEntry from '@/lib/models/LedgerEntry';
import PlatformSetting from '@/lib/models/PlatformSetting';
import { ensureWalletForMemberUser } from '@/lib/walletService';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function feeForTransfer(baseAmount, feeSettings, isVip) {
  if (isVip) return 0;
  const n = Number(baseAmount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (feeSettings.type === 'percentage') return (n * feeSettings.amount) / 100;
  return feeSettings.amount;
}

export async function POST(request) {
  let session;
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    const sender = auth.user;
    if (!sender || sender.role !== 'user') {
      return NextResponse.json({ ok: false, error: 'Member transfers only.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const recipientEmail = String(body.recipientEmail || '').trim().toLowerCase();
    const tokenSymbol = String(body.tokenSymbol || '').trim().toUpperCase();
    const amount = Number(body.amount);

    if (!EMAIL_RE.test(recipientEmail)) {
      return NextResponse.json({ ok: false, error: 'Valid recipient email is required.' }, { status: 400 });
    }
    if (!tokenSymbol) {
      return NextResponse.json({ ok: false, error: 'Token is required.' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'Amount must be greater than zero.' }, { status: 400 });
    }

    await connectDB();
    const recipient = await User.findOne({ email: recipientEmail, role: 'user', deletedAt: null }).lean();
    if (!recipient) {
      return NextResponse.json({ ok: false, error: 'Recipient not found.' }, { status: 404 });
    }
    if (String(recipient._id) === auth.userId) {
      return NextResponse.json({ ok: false, error: 'You cannot transfer to yourself.' }, { status: 400 });
    }

    const tokenDoc = await Token.findOne({ symbol: tokenSymbol, isActive: true }).lean();
    if (!tokenDoc) {
      return NextResponse.json({ ok: false, error: 'Selected token is unavailable.' }, { status: 400 });
    }

    const settings =
      (await PlatformSetting.findOne({ key: 'global' }).lean()) ||
      (await PlatformSetting.create({ key: 'global' })).toObject();
    const feeSettings = {
      amount:
        typeof settings.transferFeeAmount === 'number' && Number.isFinite(settings.transferFeeAmount)
          ? settings.transferFeeAmount
          : 0,
      type: settings.transferFeeType === 'percentage' ? 'percentage' : 'fixed',
    };

    const feeAmount = feeForTransfer(amount, feeSettings, !!sender.isVip);
    const totalDebit = amount + feeAmount;

    session = await mongoose.startSession();
    session.startTransaction();

    await ensureWalletForMemberUser(auth.userId);
    await ensureWalletForMemberUser(recipient._id);

    const [senderWallet, recipientWallet] = await Promise.all([
      Wallet.findOne({ user: auth.userId }).session(session),
      Wallet.findOne({ user: recipient._id }).session(session),
    ]);
    if (!senderWallet || !recipientWallet) {
      throw new Error('Wallet not found.');
    }

    let senderBal = await WalletTokenBalance.findOne({
      wallet: senderWallet._id,
      token: tokenDoc._id,
    }).session(session);
    if (!senderBal) {
      senderBal = (await WalletTokenBalance.create(
        [{ wallet: senderWallet._id, token: tokenDoc._id, balance: 0, purchasedBalance: 0 }],
        { session }
      ))[0];
    }

    let recipientBal = await WalletTokenBalance.findOne({
      wallet: recipientWallet._id,
      token: tokenDoc._id,
    }).session(session);
    if (!recipientBal) {
      recipientBal = (await WalletTokenBalance.create(
        [{ wallet: recipientWallet._id, token: tokenDoc._id, balance: 0, purchasedBalance: 0 }],
        { session }
      ))[0];
    }

    if ((Number(senderBal.balance) || 0) < totalDebit) {
      throw new Error(
        `INSUFFICIENT_BALANCE:${tokenSymbol}:${totalDebit.toFixed(8)}:${Number(senderBal.balance || 0).toFixed(8)}`
      );
    }

    senderBal.balance = (Number(senderBal.balance) || 0) - totalDebit;
    recipientBal.balance = (Number(recipientBal.balance) || 0) + amount;
    await senderBal.save({ session });
    await recipientBal.save({ session });

    const txRef = `transfer:${new mongoose.Types.ObjectId().toString()}`;

    const ledgerRows = [
      {
        userId: auth.userId,
        type: 'transfer',
        token: tokenSymbol,
        amount,
        direction: 'debit',
        counterpartyUserId: recipient._id,
        note: `Transferred to ${recipient.email}`,
        balanceAfter: senderBal.balance + feeAmount,
        externalRef: txRef,
      },
      {
        userId: recipient._id,
        type: 'transfer',
        token: tokenSymbol,
        amount,
        direction: 'credit',
        counterpartyUserId: auth.userId,
        note: `Received from ${sender.email}`,
        balanceAfter: recipientBal.balance,
        externalRef: txRef,
      },
    ];
    if (feeAmount > 0) {
      ledgerRows.push({
        userId: auth.userId,
        type: 'fee',
        token: tokenSymbol,
        amount: feeAmount,
        direction: 'debit',
        counterpartyUserId: null,
        note: `Transfer fee (${feeSettings.type})`,
        balanceAfter: senderBal.balance,
        externalRef: txRef,
      });
    }
    await LedgerEntry.create(ledgerRows, { session, ordered: true });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      ok: true,
      message: `Transferred ${amount} ${tokenSymbol} to ${recipient.email}.`,
      data: {
        token: tokenSymbol,
        amount,
        feeAmount,
        feeType: feeSettings.type,
        totalDebit,
        recipient: {
          email: recipient.email,
          name: String(recipient.name || '').trim() || recipient.email.split('@')[0],
          isVip: !!recipient.isVip,
        },
      },
    });
  } catch (e) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    if (String(e?.message || '').startsWith('INSUFFICIENT_BALANCE:')) {
      const [, sym, required, available] = String(e.message).split(':');
      return NextResponse.json(
        {
          ok: false,
          error: `Insufficient ${sym} balance. Required ${required}, available ${available}.`,
        },
        { status: 400 }
      );
    }
    console.error('user/transfer POST', e);
    return NextResponse.json({ ok: false, error: 'Transfer failed.' }, { status: 500 });
  }
}
