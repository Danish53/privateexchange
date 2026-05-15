import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import CommunityAnnouncement from '@/lib/models/CommunityAnnouncement';
import CommunityAnnouncementView from '@/lib/models/CommunityAnnouncementView';
import { buildAnnouncementAudienceFilter } from '@/lib/communityAnnouncements';
import { getMemberMembershipEntitlements } from '@/lib/membershipEntitlements';

export const runtime = 'nodejs';

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
    const announcements = await CommunityAnnouncement.find(
      buildAnnouncementAudienceFilter(auth.user, entitlements.executiveEventsAccess)
    )
      .select('_id')
      .lean();
    const ids = announcements.map((a) => a._id);
    if (ids.length === 0) {
      return NextResponse.json({ ok: true, unreadCount: 0 });
    }

    const readCount = await CommunityAnnouncementView.countDocuments({
      userId: auth.userId,
      announcementId: { $in: ids },
    });

    return NextResponse.json({
      ok: true,
      unreadCount: Math.max(0, ids.length - Number(readCount || 0)),
    });
  } catch (e) {
    console.error('user/community-announcements/unread-count GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load announcement count.' }, { status: 500 });
  }
}
