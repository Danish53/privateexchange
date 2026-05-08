import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Drawing from '@/lib/models/Drawing';
import '@/lib/models/User';
import '@/lib/models/Token';

export const runtime = 'nodejs';

function displayName(user) {
  const name = String(user?.name || '').trim();
  if (name) return name;
  const email = String(user?.email || '').trim();
  if (!email) return 'Member';
  return email.split('@')[0] || 'Member';
}

function serializeWinnerRow(doc) {
  const d = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const winner = d.winner_user_id;
  return {
    id: String(d._id),
    title: d.title || '',
    slug: d.slug || '',
    draw_date: d.draw_date ? new Date(d.draw_date).toISOString() : '',
    prize_title: d.prize_title || '',
    reward_type: d.reward_type || 'physical',
    reward_token_amount:
      d.reward_token_amount && typeof d.reward_token_amount.toString === 'function'
        ? d.reward_token_amount.toString()
        : String(d.reward_token_amount || '0'),
    reward_token_symbol: d?.reward_token_id?.symbol || '',
    winner: winner
      ? {
          id: String(winner._id),
          name: displayName(winner),
        }
      : null,
  };
}

export async function GET() {
  try {
    await connectDB();
    const rows = await Drawing.find({
      status: 'completed',
      winner_user_id: { $ne: null },
    })
      .populate('winner_user_id', 'name email')
      .populate('reward_token_id', 'symbol name')
      .sort({ draw_date: -1, updatedAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      ok: true,
      winners: rows.map((r) => serializeWinnerRow(r)),
    });
  } catch (e) {
    console.error('drawings/winners GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load winners.' }, { status: 500 });
  }
}
