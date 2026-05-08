import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { connectDB } from '@/lib/db';
import Drawing from '@/lib/models/Drawing';
import DrawingJoin from '@/lib/models/DrawingJoin';
import mongoose from 'mongoose';
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
    is_winner: Boolean(d.is_winner),
    draw_date: d.draw_date ? new Date(d.draw_date).toISOString() : '',
    status: d.status || 'active',
  };
}

export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can view drawings.' },
        { status: 403 }
      );
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(auth.userId);
    const drawings = await Drawing.find({
      $or: [{ status: 'active' }, { status: 'completed', winner_user_id: userObjectId }],
    })
      .populate('reward_token_id', 'name symbol slug')
      .populate('entry_token_id', 'name symbol slug')
      .sort({ status: 1, draw_date: 1, createdAt: -1 })
      .lean();

    const drawingIds = drawings.map((d) => d._id);
    const joinedCounts = await DrawingJoin.aggregate([
      { $match: { drawingId: { $in: drawingIds } } },
      { $group: { _id: '$drawingId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(joinedCounts.map((r) => [String(r._id), Number(r.count || 0)]));
    const enriched = drawings.map((d) => ({
      ...d,
      joined_count: countMap.get(String(d._id)) || 0,
      is_winner: d.winner_user_id ? String(d.winner_user_id) === String(auth.userId) : false,
    }));

    return NextResponse.json({
      ok: true,
      drawings: enriched.map((d) => serializeDrawing(d)),
    });
  } catch (e) {
    console.error('user/drawings GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load drawings.' }, { status: 500 });
  }
}

