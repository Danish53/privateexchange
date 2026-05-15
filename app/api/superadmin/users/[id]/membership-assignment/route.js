import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireMembershipManage } from '@/lib/authHelpers';
import User from '@/lib/models/User';
import { getUserMembershipAssignmentLean } from '@/lib/userMembershipAssignmentService';

export const runtime = 'nodejs';

export async function GET(request, context) {
  try {
    const auth = await requireMembershipManage(request);
    if ('error' in auth) return auth.error;

    const params = await Promise.resolve(context.params);
    const id = params?.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid id.' }, { status: 400 });
    }

    await connectDB();
    const target = await User.findById(id).select('role').lean();
    if (!target) {
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }
    if (target.role !== 'user') {
      return NextResponse.json({ ok: true, assignment: null, message: 'Membership applies to user accounts only.' });
    }

    const assignment = await getUserMembershipAssignmentLean(id);
    return NextResponse.json({ ok: true, assignment });
  } catch (e) {
    console.error('superadmin/users/[id]/membership-assignment GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load assignment.' }, { status: 500 });
  }
}
