import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { connectDB } from '@/lib/db';
import Drawing from '@/lib/models/Drawing';
import DrawingJoin from '@/lib/models/DrawingJoin';
import '@/lib/models/Token';

export const runtime = 'nodejs';

function serializeDrawing(doc) {
  const d = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const rewardToken = d.reward_token_id;
  const entryToken = d.entry_token_id;
  return {
    id: String(d._id),
    title: d.title || '',
    slug: d.slug || '',
    description: d.description || '',
    drawing_image: d.drawing_image || '',
    prize_title: d.prize_title || '',
    prize_description: d.prize_description || '',
    prize_image: d.prize_image || '',
    reward_type: d.reward_type || 'physical',
    reward_token: rewardToken
      ? {
          id: String(rewardToken._id || rewardToken),
          symbol: rewardToken.symbol || '',
          name: rewardToken.name || '',
        }
      : null,
    reward_token_amount:
      d.reward_token_amount && typeof d.reward_token_amount.toString === 'function'
        ? d.reward_token_amount.toString()
        : String(d.reward_token_amount || '0'),
    entry_token: entryToken
      ? {
          id: String(entryToken._id || entryToken),
          symbol: entryToken.symbol || '',
          name: entryToken.name || '',
        }
      : null,
    entry_cost:
      d.entry_cost && typeof d.entry_cost.toString === 'function'
        ? d.entry_cost.toString()
        : String(d.entry_cost || '0'),
    total_entries: Number(d.total_entries || 0),
    joined_count: Number(d.joined_count || 0),
    joined_by_me: Boolean(d.joined_by_me),
    is_winner: Boolean(d.is_winner),
    draw_date: d.draw_date ? new Date(d.draw_date).toISOString() : '',
    status: d.status || 'active',
  };
}

export async function GET(request, { params }) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can view drawings.' },
        { status: 403 }
      );
    }

    const p = await params;
    const slug = String(p?.slug || '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Invalid drawing slug.' }, { status: 400 });
    }

    await connectDB();
    // Active: any member. Completed with an announced winner: any member (read-only recap).
    // Completed without a winner remains restricted (not listed in this query shape for typical flows).
    const drawing = await Drawing.findOne({
      slug,
      $or: [
        { status: 'active' },
        { status: 'completed', winner_user_id: { $ne: null } },
      ],
    })
      .populate('reward_token_id', 'name symbol slug')
      .populate('entry_token_id', 'name symbol slug')
      .lean();
    if (!drawing) {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }

    const [joinedCount, joinedByMe] = await Promise.all([
      DrawingJoin.countDocuments({ drawingId: drawing._id }),
      DrawingJoin.exists({ drawingId: drawing._id, userId: auth.userId }),
    ]);

    return NextResponse.json({
      ok: true,
      drawing: serializeDrawing({
        ...drawing,
        joined_count: Number(joinedCount || 0),
        joined_by_me: Boolean(joinedByMe),
        is_winner: drawing.winner_user_id ? String(drawing.winner_user_id) === String(auth.userId) : false,
      }),
    });
  } catch (e) {
    console.error('user/drawings/[slug] GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load drawing.' }, { status: 500 });
  }
}

