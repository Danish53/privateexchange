import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { requireDrawingsManage } from '@/lib/authHelpers';
import Drawing from '@/lib/models/Drawing';
import DrawingJoin from '@/lib/models/DrawingJoin';
import Wallet from '@/lib/models/Wallet';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import LedgerEntry from '@/lib/models/LedgerEntry';
import { ensureWalletForMemberUser } from '@/lib/walletService';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  let session;
  try {
    const auth = await requireDrawingsManage(request);
    if ('error' in auth) return auth.error;

    const p = await params;
    const slug = String(p?.slug || '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Invalid drawing slug.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const winnerUserId = String(body?.winnerUserId || '').trim();
    if (!mongoose.isValidObjectId(winnerUserId)) {
      return NextResponse.json({ ok: false, error: 'Invalid winner user id.' }, { status: 400 });
    }

    await connectDB();
    await ensureWalletForMemberUser(winnerUserId);
    session = await mongoose.startSession();
    session.startTransaction();

    const drawing = await Drawing.findOne({ slug })
      .populate('reward_token_id', 'symbol name')
      .session(session);
    if (!drawing) {
      throw new Error('DRAWING_NOT_FOUND');
    }

    const joined = await DrawingJoin.exists({ drawingId: drawing._id, userId: winnerUserId }).session(session);
    if (!joined) {
      throw new Error('WINNER_NOT_JOINED');
    }

    if (drawing.winner_user_id) {
      if (String(drawing.winner_user_id) === winnerUserId) {
        await session.commitTransaction();
        session.endSession();
        session = null;
        return NextResponse.json({ ok: true, message: 'Winner already selected.' });
      }
      throw new Error('WINNER_ALREADY_SELECTED');
    }

    if (drawing.reward_type === 'token') {
      if (!drawing.reward_token_id) {
        throw new Error('REWARD_TOKEN_MISSING');
      }
      const rewardTokenId = drawing.reward_token_id?._id || drawing.reward_token_id;
      const rewardTokenSymbol = String(drawing.reward_token_id?.symbol || '').toUpperCase();
      const rewardAmount = Number(drawing.reward_token_amount || 0);
      if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
        throw new Error('INVALID_REWARD_AMOUNT');
      }

      const winnerWallet = await Wallet.findOne({ user: winnerUserId }).session(session);
      if (!winnerWallet) {
        throw new Error('WINNER_WALLET_NOT_FOUND');
      }

      const updatedBal = await WalletTokenBalance.findOneAndUpdate(
        { wallet: winnerWallet._id, token: rewardTokenId },
        { $inc: { balance: rewardAmount } },
        { new: true, upsert: true, session }
      );
      if (!updatedBal) {
        throw new Error('REWARD_CREDIT_FAILED');
      }

      await LedgerEntry.create(
        [
          {
            userId: winnerUserId,
            type: 'admin_credit',
            token: rewardTokenSymbol,
            amount: rewardAmount,
            direction: 'credit',
            note: `Drawing winner reward: ${drawing.title}`,
            balanceAfter: Number(updatedBal.balance || 0),
            externalRef: `drawing_winner:${drawing._id}`,
          },
        ],
        { session }
      );
    }

    drawing.winner_user_id = winnerUserId;
    drawing.status = 'completed';
    await drawing.save({ session });

    await session.commitTransaction();
    session.endSession();
    session = null;

    return NextResponse.json({ ok: true, message: 'Winner selected successfully.' });
  } catch (e) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    const msg = String(e?.message || '');
    if (msg === 'DRAWING_NOT_FOUND') {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }
    if (msg === 'WINNER_NOT_JOINED') {
      return NextResponse.json(
        { ok: false, error: 'Selected user has not joined this drawing.' },
        { status: 400 }
      );
    }
    if (msg === 'WINNER_ALREADY_SELECTED') {
      return NextResponse.json(
        { ok: false, error: 'Winner already selected for this drawing.' },
        { status: 400 }
      );
    }
    if (msg === 'REWARD_TOKEN_MISSING') {
      return NextResponse.json({ ok: false, error: 'Reward token is not configured.' }, { status: 400 });
    }
    if (msg === 'INVALID_REWARD_AMOUNT') {
      return NextResponse.json({ ok: false, error: 'Reward token amount is invalid.' }, { status: 400 });
    }
    if (msg === 'WINNER_WALLET_NOT_FOUND' || msg === 'REWARD_CREDIT_FAILED') {
      return NextResponse.json({ ok: false, error: 'Could not credit winner wallet.' }, { status: 400 });
    }
    console.error('superadmin/drawings/by-slug/[slug]/winner POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to select winner.' }, { status: 500 });
  }
}

