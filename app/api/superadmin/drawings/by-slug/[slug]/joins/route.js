import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireDrawingsManage } from '@/lib/authHelpers';
import Drawing from '@/lib/models/Drawing';
import DrawingJoin from '@/lib/models/DrawingJoin';
import '@/lib/models/User';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const auth = await requireDrawingsManage(request);
    if ('error' in auth) return auth.error;

    const p = await params;
    const slug = String(p?.slug || '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Invalid drawing slug.' }, { status: 400 });
    }

    await connectDB();
    const drawing = await Drawing.findOne({ slug }).lean();
    if (!drawing) {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }

    const joins = await DrawingJoin.find({ drawingId: drawing._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return NextResponse.json({
      ok: true,
      drawing: {
        id: String(drawing._id),
        slug: drawing.slug || '',
        title: drawing.title || '',
        status: drawing.status || 'active',
        winnerUserId: drawing.winner_user_id ? String(drawing.winner_user_id) : '',
      },
      totalJoined: joins.length,
      users: joins.map((j) => ({
        userId: j.userId?._id ? String(j.userId._id) : '',
        name: j.userId?.name || '',
        email: j.userId?.email || '',
        entryCost: Number(j.entryCost || 0),
        entryTokenSymbol: j.entryTokenSymbol || '',
        joinedAt: j.createdAt ? new Date(j.createdAt).toISOString() : '',
        isWinner: drawing.winner_user_id ? String(j.userId?._id || '') === String(drawing.winner_user_id) : false,
      })),
    });
  } catch (e) {
    console.error('superadmin/drawings/by-slug/[slug]/joins GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load joined users.' }, { status: 500 });
  }
}

