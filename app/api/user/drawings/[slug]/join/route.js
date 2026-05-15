import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import Drawing from '@/lib/models/Drawing';
import DrawingJoin from '@/lib/models/DrawingJoin';
import Wallet from '@/lib/models/Wallet';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import LedgerEntry from '@/lib/models/LedgerEntry';
import { ensureWalletForMemberUser } from '@/lib/walletService';
import { getMemberMembershipEntitlements } from '@/lib/membershipEntitlements';
import { canMemberViewDrawing } from '@/lib/drawingAudience';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  let session;
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'user') {
      return NextResponse.json({ ok: false, error: 'Only members can join drawings.' }, { status: 403 });
    }

    const p = await params;
    const slug = String(p?.slug || '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Invalid drawing slug.' }, { status: 400 });
    }

    await connectDB();

    const entitlements = await getMemberMembershipEntitlements(auth.userId);
    const drawingAccessCheck = await Drawing.findOne({ slug, status: 'active' }).lean();
    if (!drawingAccessCheck) {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }
    if (!canMemberViewDrawing(drawingAccessCheck, entitlements)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'You do not have access to this drawing for your membership or audience.',
          code: 'DRAWING_ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    // Ensure base wallet rows exist before opening a transaction.
    await ensureWalletForMemberUser(auth.userId);
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      session = await mongoose.startSession();
      try {
        session.startTransaction();

        const drawing = await Drawing.findOne({ slug, status: 'active' })
          .populate('entry_token_id', 'name symbol')
          .session(session);
        if (!drawing) {
          throw new Error('DRAWING_NOT_FOUND');
        }
        if (!drawing.entry_token_id) {
          throw new Error('ENTRY_TOKEN_MISSING');
        }

        const joinedAlready = await DrawingJoin.exists({
          drawingId: drawing._id,
          userId: auth.userId,
        }).session(session);
        if (joinedAlready) {
          throw new Error('ALREADY_JOINED');
        }
        const joinedCount = await DrawingJoin.countDocuments({ drawingId: drawing._id }).session(session);
        const capacity = Number(drawing.total_entries || 0);
        if (capacity > 0 && joinedCount >= capacity) {
          throw new Error('DRAWING_FULL');
        }

        const wallet = await Wallet.findOne({ user: auth.userId }).session(session);
        if (!wallet) {
          throw new Error('WALLET_NOT_FOUND');
        }

        const balRow = await WalletTokenBalance.findOne({
          wallet: wallet._id,
          token: drawing.entry_token_id._id,
        }).session(session);
        if (!balRow) {
          throw new Error('BALANCE_ROW_NOT_FOUND');
        }

        const entryCost = Number(drawing.entry_cost || 0);
        const balanceBefore = Number(balRow.balance || 0);
        if (!Number.isFinite(entryCost) || entryCost <= 0) {
          throw new Error('INVALID_ENTRY_COST');
        }
        if (balanceBefore < entryCost) {
          throw new Error(`INSUFFICIENT_BALANCE:${drawing.entry_token_id.symbol}:${entryCost}:${balanceBefore}`);
        }

        balRow.balance = balanceBefore - entryCost;
        await balRow.save({ session });

        const balanceAfter = Number(balRow.balance || 0);
        const tokenUpper = String(drawing.entry_token_id.symbol || '').toUpperCase();
        const note = `Drawing join: ${drawing.title}`;

        await DrawingJoin.create(
          [
            {
              drawingId: drawing._id,
              userId: auth.userId,
              entryTokenId: drawing.entry_token_id._id,
              entryTokenSymbol: tokenUpper,
              entryCost,
              balanceBefore,
              balanceAfter,
              note,
            },
          ],
          { session }
        );

        await LedgerEntry.create(
          [
            {
              userId: auth.userId,
              type: 'fee',
              token: tokenUpper,
              amount: entryCost,
              direction: 'debit',
              note,
              balanceAfter,
              externalRef: `drawing_join:${drawing._id}`,
            },
          ],
          { session }
        );

        await session.commitTransaction();
        session.endSession();
        session = null;

        return NextResponse.json({
          ok: true,
          message: 'Joined drawing successfully.',
          join: {
            drawingId: String(drawing._id),
            drawingSlug: drawing.slug,
            token: tokenUpper,
            entryCost,
            balanceAfter,
          },
        });
      } catch (txError) {
        await session.abortTransaction();
        session.endSession();
        session = null;

        const transient =
          txError?.code === 112 ||
          txError?.errorLabels?.includes?.('TransientTransactionError') ||
          txError?.errorLabelSet?.has?.('TransientTransactionError');

        if (transient && attempt < MAX_RETRIES) {
          continue;
        }
        throw txError;
      }
    }

    throw new Error('JOIN_RETRY_FAILED');
  } catch (e) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    const msg = String(e?.message || '');
    if (msg === 'DRAWING_NOT_FOUND') {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }
    if (msg === 'ALREADY_JOINED') {
      return NextResponse.json({ ok: false, error: 'You already joined this drawing.' }, { status: 400 });
    }
    if (msg === 'DRAWING_FULL') {
      return NextResponse.json({ ok: false, error: 'Drawing capacity is full. Join is closed.' }, { status: 400 });
    }
    if (msg.startsWith('INSUFFICIENT_BALANCE:')) {
      const [, sym, need, have] = msg.split(':');
      return NextResponse.json(
        { ok: false, error: `Insufficient ${sym} balance. Required ${need}, available ${have}.` },
        { status: 400 }
      );
    }
    if (msg === 'ENTRY_TOKEN_MISSING') {
      return NextResponse.json({ ok: false, error: 'Entry token is not configured.' }, { status: 400 });
    }
    if (msg === 'WALLET_NOT_FOUND' || msg === 'BALANCE_ROW_NOT_FOUND') {
      return NextResponse.json(
        { ok: false, error: 'Wallet balance row not found for this token.' },
        { status: 400 }
      );
    }
    if (msg === 'INVALID_ENTRY_COST') {
      return NextResponse.json({ ok: false, error: 'Drawing entry cost is invalid.' }, { status: 400 });
    }
    console.error('user/drawings/[slug]/join POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to join drawing.' }, { status: 500 });
  }
}

