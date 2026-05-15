import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAnnouncementsManage } from '@/lib/authHelpers';
import { normalizeSuperadminAnnouncementBody } from '@/lib/communityAnnouncementNormalize';
import CommunityAnnouncement from '@/lib/models/CommunityAnnouncement';

export const runtime = 'nodejs';

function serializeAnnouncement(doc) {
  const d = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(d._id),
    title: d.title || '',
    type: d.type || 'general',
    audience: d.audience || 'all_users',
    priority: d.priority || 'normal',
    summary: d.summary || '',
    details: d.details || '',
    startsAt: d.startsAt ? new Date(d.startsAt).toISOString() : '',
    endsAt: d.endsAt ? new Date(d.endsAt).toISOString() : '',
    cta: {
      label: d?.cta?.label || '',
      url: d?.cta?.url || '',
    },
    channels: {
      dashboardBanner: Boolean(d?.channels?.dashboardBanner),
      inAppNotice: Boolean(d?.channels?.inAppNotice),
      emailNotice: Boolean(d?.channels?.emailNotice),
    },
    createdBy: d.createdBy ? String(d.createdBy) : '',
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : '',
  };
}

export async function GET(request) {
  try {
    const auth = await requireAnnouncementsManage(request);
    if ('error' in auth) return auth.error;

    await connectDB();
    const rows = await CommunityAnnouncement.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      ok: true,
      announcements: rows.map((r) => serializeAnnouncement(r)),
    });
  } catch (e) {
    console.error('superadmin/community-announcements GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load announcements.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAnnouncementsManage(request);
    if ('error' in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = normalizeSuperadminAnnouncementBody(body);
    if (parsed.error) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    await connectDB();
    const created = await CommunityAnnouncement.create({
      ...parsed.data,
      createdBy: auth.userId,
    });

    return NextResponse.json({
      ok: true,
      announcement: serializeAnnouncement(created),
      message: 'Announcement created successfully.',
    });
  } catch (e) {
    console.error('superadmin/community-announcements POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to create announcement.' }, { status: 500 });
  }
}
