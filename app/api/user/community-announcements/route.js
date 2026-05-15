import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import CommunityAnnouncement from '@/lib/models/CommunityAnnouncement';
import { buildAnnouncementAudienceFilter } from '@/lib/communityAnnouncements';
import { getMemberMembershipEntitlements } from '@/lib/membershipEntitlements';

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
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
  };
}

export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can view announcements.' },
        { status: 403 }
      );
    }

    await connectDB();

    const entitlements = await getMemberMembershipEntitlements(auth.userId);
    const rows = await CommunityAnnouncement.find(
      buildAnnouncementAudienceFilter(auth.user, entitlements.executiveEventsAccess)
    )
      .sort({ createdAt: -1, startsAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      ok: true,
      announcements: rows.map((r) => serializeAnnouncement(r)),
    });
  } catch (e) {
    console.error('user/community-announcements GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load announcements.' }, { status: 500 });
  }
}
