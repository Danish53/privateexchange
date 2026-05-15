import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import CommunityAnnouncement from '@/lib/models/CommunityAnnouncement';
import CommunityAnnouncementView from '@/lib/models/CommunityAnnouncementView';
import { buildAnnouncementAudienceFilter } from '@/lib/communityAnnouncements';
import { getMemberMembershipEntitlements } from '@/lib/membershipEntitlements';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can update announcements.' },
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
    if (!announcements.length) {
      return NextResponse.json({ ok: true, marked: 0 });
    }

    const ops = announcements.map((a) => ({
      updateOne: {
        filter: { userId: auth.userId, announcementId: a._id },
        update: { $set: { viewedAt: new Date() } },
        upsert: true,
      },
    }));
    await CommunityAnnouncementView.bulkWrite(ops, { ordered: false });

    return NextResponse.json({ ok: true, marked: announcements.length });
  } catch (e) {
    console.error('user/community-announcements/read-all POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to mark announcements as viewed.' }, { status: 500 });
  }
}
