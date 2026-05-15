import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import SupportTicket from '@/lib/models/SupportTicket';
import { serializeSupportTicket } from '@/lib/supportTickets';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'user') {
      return NextResponse.json({ ok: false, error: 'Members only.' }, { status: 403 });
    }

    const p = await params;
    const id = String(p?.id || '').trim();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid ticket id.' }, { status: 400 });
    }

    await connectDB();
    const row = await SupportTicket.findOne({ _id: id, user: auth.userId }).lean();
    if (!row) {
      return NextResponse.json({ ok: false, error: 'Ticket not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ticket: serializeSupportTicket(row) });
  } catch (e) {
    console.error('user/support-tickets/[id] GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load ticket.' }, { status: 500 });
  }
}
