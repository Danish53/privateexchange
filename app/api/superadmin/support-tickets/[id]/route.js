import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireSupportTicketsManage } from '@/lib/authHelpers';
import SupportTicket from '@/lib/models/SupportTicket';
import { normalizeSupportTicketStatus, serializeSupportTicket } from '@/lib/supportTickets';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const auth = await requireSupportTicketsManage(request);
    if ('error' in auth) return auth.error;

    const p = await params;
    const id = String(p?.id || '').trim();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid ticket id.' }, { status: 400 });
    }

    await connectDB();
    const row = await SupportTicket.findById(id).populate('user', 'name email').lean();
    if (!row) {
      return NextResponse.json({ ok: false, error: 'Ticket not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      ticket: serializeSupportTicket(row, { includeUser: true }),
    });
  } catch (e) {
    console.error('superadmin/support-tickets/[id] GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load ticket.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireSupportTicketsManage(request);
    if ('error' in auth) return auth.error;

    const p = await params;
    const id = String(p?.id || '').trim();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid ticket id.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const status = body.status !== undefined ? normalizeSupportTicketStatus(body.status) : null;
    const adminReply =
      body.adminReply !== undefined ? String(body.adminReply || '').trim() : undefined;

    if (body.status !== undefined && !status) {
      return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 });
    }

    await connectDB();
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ ok: false, error: 'Ticket not found.' }, { status: 404 });
    }

    if (status) ticket.status = status;
    if (adminReply !== undefined) {
      ticket.adminReply = adminReply || null;
      if (adminReply) {
        ticket.repliedAt = new Date();
        ticket.repliedBy = auth.userId;
        if (ticket.status === 'pending') ticket.status = 'in_progress';
      }
    }

    await ticket.save();
    const populated = await SupportTicket.findById(ticket._id).populate('user', 'name email').lean();

    return NextResponse.json({
      ok: true,
      ticket: serializeSupportTicket(populated, { includeUser: true }),
    });
  } catch (e) {
    console.error('superadmin/support-tickets/[id] PATCH', e);
    return NextResponse.json({ ok: false, error: 'Failed to update ticket.' }, { status: 500 });
  }
}
