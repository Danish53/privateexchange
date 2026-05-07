import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import Drawing from '@/lib/models/Drawing';
import DrawingJoin from '@/lib/models/DrawingJoin';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'user') {
      return NextResponse.json({ ok: false, error: 'Only members can view joins.' }, { status: 403 });
    }

    const p = await params;
    const slug = String(p?.slug || '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Invalid drawing slug.' }, { status: 400 });
    }

    await connectDB();
    const drawing = await Drawing.findOne({ slug, status: 'active' }).lean();
    if (!drawing) {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }

    const joins = await DrawingJoin.find({ drawingId: drawing._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      ok: true,
      totalJoined: joins.length,
      users: joins.map((j) => ({
        userId: j.userId?._id ? String(j.userId._id) : '',
        name: j.userId?.name || '',
        email: j.userId?.email || '',
        entryCost: Number(j.entryCost || 0),
        entryTokenSymbol: j.entryTokenSymbol || '',
        joinedAt: j.createdAt ? new Date(j.createdAt).toISOString() : '',
      })),
    });
  } catch (e) {
    console.error('user/drawings/[slug]/joins GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load joined users.' }, { status: 500 });
  }
}

