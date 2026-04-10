import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireSuperAdmin } from '@/lib/authHelpers';

export const runtime = 'nodejs';

/** Soft-delete a user (not superadmin; not self). */
export async function DELETE(request, context) {
  try {
    const auth = await requireSuperAdmin(request);
    if ('error' in auth) return auth.error;

    const params = await Promise.resolve(context.params);
    const id = params?.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid id.' }, { status: 400 });
    }

    await connectDB();
    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }
    if (target.role === 'superadmin') {
      return NextResponse.json({ ok: false, error: 'Cannot archive a super admin account.' }, { status: 403 });
    }
    if (String(target._id) === auth.userId) {
      return NextResponse.json({ ok: false, error: 'You cannot archive your own session.' }, { status: 403 });
    }
    if (target.deletedAt) {
      return NextResponse.json({ ok: false, error: 'Account is already archived.' }, { status: 400 });
    }

    target.deletedAt = new Date();
    await target.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('superadmin/users/[id] DELETE', e);
    return NextResponse.json({ ok: false, error: 'Failed to archive user.' }, { status: 500 });
  }
}

/** Update a user or admin (not superadmin). */
export async function PATCH(request, context) {
  try {
    const auth = await requireSuperAdmin(request);
    if ('error' in auth) return auth.error;

    const params = await Promise.resolve(context.params);
    const id = params?.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid id.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    await connectDB();
    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }
    if (target.role === 'superadmin') {
      return NextResponse.json({ ok: false, error: 'Cannot edit a super admin account.' }, { status: 403 });
    }

    if (body.name !== undefined) {
      target.name = String(body.name || '').trim();
    }
    if (body.phone !== undefined) {
      target.phone = String(body.phone || '').trim();
    }
    if (body.country !== undefined) {
      target.country = String(body.country || '').trim();
    }
    if (body.timezone !== undefined) {
      target.timezone = String(body.timezone || '').trim();
    }
    if (body.emailVerified !== undefined) {
      target.emailVerified = Boolean(body.emailVerified);
    }
    if (body.role !== undefined) {
      const r = String(body.role || '').toLowerCase();
      const nextRole = r === 'member' ? 'user' : r;
      if (nextRole !== 'user' && nextRole !== 'admin') {
        return NextResponse.json(
          { ok: false, error: 'Role must be member (user) or admin.' },
          { status: 400 }
        );
      }
      target.role = nextRole;
    }
    if (body.email !== undefined) {
      const email = String(body.email || '')
        .trim()
        .toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ ok: false, error: 'Valid email is required.' }, { status: 400 });
      }
      if (email !== target.email) {
        const taken = await User.findOne({ email, _id: { $ne: target._id } });
        if (taken) {
          return NextResponse.json(
            { ok: false, error: 'Another account already uses this email.' },
            { status: 409 }
          );
        }
        target.email = email;
      }
    }

    await target.save();

    const u = target.toObject();
    return NextResponse.json({
      ok: true,
      user: {
        id: String(u._id),
        email: u.email,
        name: u.name || '',
        role: u.role,
        emailVerified: !!u.emailVerified,
        phone: u.phone || '',
        country: u.country || '',
        timezone: u.timezone || '',
        avatarUrl: u.avatarUrl || '',
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : null,
        deletedAt: u.deletedAt ? new Date(u.deletedAt).toISOString() : null,
      },
    });
  } catch (e) {
    console.error('superadmin/users/[id] PATCH', e);
    return NextResponse.json({ ok: false, error: 'Failed to update user.' }, { status: 500 });
  }
}
