import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireSupportTicketsManage } from '@/lib/authHelpers';
import SupportTicket from '@/lib/models/SupportTicket';
import { serializeSupportTicket } from '@/lib/supportTickets';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await requireSupportTicketsManage(request);
    if ('error' in auth) return auth.error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get('status') || '').trim();

    const filter = {};
    if (status && ['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      filter.status = status;
    }

    const rows = await SupportTicket.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      ok: true,
      tickets: rows.map((r) => serializeSupportTicket(r, { includeUser: true })),
    });
  } catch (e) {
    console.error('superadmin/support-tickets GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load tickets.' }, { status: 500 });
  }
}
