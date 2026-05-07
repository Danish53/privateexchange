import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import Drawing from '@/lib/models/Drawing';
import DrawingJoin from '@/lib/models/DrawingJoin';
import Wallet from '@/lib/models/Wallet';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import { ensureWalletForMemberUser } from '@/lib/walletService';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
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
    const drawing = await Drawing.findOne({ slug, status: 'active' })
      .populate('entry_token_id', 'name symbol slug')
      .populate('reward_token_id', 'name symbol slug')
      .lean();
    if (!drawing) {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }
    if (!drawing.entry_token_id) {
      return NextResponse.json({ ok: false, error: 'Entry token is not configured for this drawing.' }, { status: 400 });
    }

    await ensureWalletForMemberUser(auth.userId);
    const wallet = await Wallet.findOne({ user: auth.userId }).lean();
    if (!wallet) {
      return NextResponse.json({ ok: false, error: 'Wallet not found.' }, { status: 404 });
    }

    const balRow = await WalletTokenBalance.findOne({
      wallet: wallet._id,
      token: drawing.entry_token_id._id,
    }).lean();
    const balance = Number(balRow?.balance || 0);
    const entryCost = Number(drawing.entry_cost || 0);
    const balanceAfterJoin = Math.max(balance - entryCost, 0);
    const [alreadyJoined, joinedCount] = await Promise.all([
      DrawingJoin.exists({ drawingId: drawing._id, userId: auth.userId }),
      DrawingJoin.countDocuments({ drawingId: drawing._id }),
    ]);
    const capacity = Number(drawing.total_entries || 0);
    const isFull = capacity > 0 && joinedCount >= capacity;
    const remainingSlots = capacity > 0 ? Math.max(capacity - joinedCount, 0) : null;

    return NextResponse.json({
      ok: true,
      preview: {
        drawingTitle: drawing.title,
        entryCost,
        entryToken: {
          id: String(drawing.entry_token_id._id),
          symbol: drawing.entry_token_id.symbol || '',
          name: drawing.entry_token_id.name || '',
        },
        walletBalance: balance,
        walletBalanceAfterJoin: balanceAfterJoin,
        canJoin: !Boolean(alreadyJoined) && !isFull && balance >= entryCost,
        alreadyJoined: Boolean(alreadyJoined),
        isFull,
        joinedCount,
        capacity,
        remainingSlots,
        reward: {
          type: drawing.reward_type || 'physical',
          token: drawing.reward_token_id
            ? {
                id: String(drawing.reward_token_id._id),
                symbol: drawing.reward_token_id.symbol || '',
                name: drawing.reward_token_id.name || '',
              }
            : null,
          tokenAmount:
            drawing.reward_token_amount && typeof drawing.reward_token_amount.toString === 'function'
              ? drawing.reward_token_amount.toString()
              : String(drawing.reward_token_amount || '0'),
        },
      },
    });
  } catch (e) {
    console.error('user/drawings/[slug]/join-preview GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load join preview.' }, { status: 500 });
  }
}

