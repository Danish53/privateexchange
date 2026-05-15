import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import SupportTicket from '@/lib/models/SupportTicket';
import { getMemberMembershipEntitlements } from '@/lib/membershipEntitlements';
import { serializeSupportTicket } from '@/lib/supportTickets';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'user') {
      return NextResponse.json({ ok: false, error: 'Members only.' }, { status: 403 });
    }

    await connectDB();
    const entitlements = await getMemberMembershipEntitlements(auth.userId);
    const rows = await SupportTicket.find({ user: auth.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      ok: true,
      tickets: rows.map((r) => serializeSupportTicket(r)),
      priority_support: entitlements.prioritySupport,
    });
  } catch (e) {
    console.error('user/support-tickets GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load tickets.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'user') {
      return NextResponse.json({ ok: false, error: 'Members only.' }, { status: 403 });
    }

    await connectDB();
    const entitlements = await getMemberMembershipEntitlements(auth.userId);
    if (!entitlements.prioritySupport) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Priority support is not included in your current membership plan.',
          code: 'PRIORITY_SUPPORT_REQUIRED',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const subject = String(body.subject || '').trim();
    const detail = String(body.detail || '').trim();

    if (!subject || subject.length < 3) {
      return NextResponse.json(
        { ok: false, error: 'Subject must be at least 3 characters.' },
        { status: 400 }
      );
    }
    if (!detail || detail.length < 10) {
      return NextResponse.json(
        { ok: false, error: 'Please provide at least 10 characters in the details.' },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.create({
      user: auth.userId,
      subject,
      detail,
      status: 'pending',
    });

    return NextResponse.json({
      ok: true,
      ticket: serializeSupportTicket(ticket),
    });
  } catch (e) {
    console.error('user/support-tickets POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to create ticket.' }, { status: 500 });
  }
}
