import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { loadRequestActor, requireUsersModule } from '@/lib/authHelpers';
import { mergeAdminPermissions, userHasUsersPermission } from '@/lib/adminPermissions';

export const runtime = 'nodejs';

/** Soft-delete a user (not superadmin; not self). Delegated admins cannot archive other admins. */
export async function DELETE(request, context) {
  try {
    const auth = await requireUsersModule(request, 'delete');
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
    if (!auth.isSuperAdmin && target.role === 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Only a super admin can archive administrator accounts.' },
        { status: 403 }
      );
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

/** Update a user or admin (not superadmin). Superadmin may set adminPermissions on admins. */
export async function PATCH(request, context) {
  try {
    const act = await loadRequestActor(request);
    if ('error' in act) return act.error;
    const actor = act.user;
    const isSuper = actor.role === 'superadmin';

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

    const profileKeys = ['name', 'phone', 'country', 'timezone', 'emailVerified', 'role', 'email', 'isVip'];
    const touchesProfile = profileKeys.some((k) => body[k] !== undefined);
    const touchesAdminPerms = body.adminPermissions !== undefined;

    if (!touchesProfile && !touchesAdminPerms) {
      return NextResponse.json({ ok: false, error: 'No updates provided.' }, { status: 400 });
    }

    /** Role after this request (body.role wins when sent). */
    let roleAfterPatch = String(target.role);
    if (body.role !== undefined && isSuper) {
      const r = String(body.role || '').toLowerCase();
      roleAfterPatch = r === 'member' ? 'user' : r;
    }

    if (touchesAdminPerms) {
      if (!isSuper) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      }
      if (roleAfterPatch !== 'admin') {
        return NextResponse.json(
          {
            ok: false,
            error: 'Wallet and user-module permissions apply only when the account role is administrator.',
          },
          { status: 400 }
        );
      }
    }

    if (touchesProfile) {
      if (!isSuper && !userHasUsersPermission(actor, 'edit')) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      }
      if (!isSuper && target.role === 'admin') {
        return NextResponse.json(
          { ok: false, error: 'You cannot edit administrator profiles.' },
          { status: 403 }
        );
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
      if (body.isVip !== undefined) {
        target.isVip = Boolean(body.isVip);
      }
      if (body.role !== undefined) {
        if (!isSuper) {
          return NextResponse.json(
            { ok: false, error: 'You cannot change account roles.' },
            { status: 403 }
          );
        }
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
    }

    await target.save();

    /**
     * Write adminPermissions via the native collection so new nested paths (e.g. walletsView)
     * are never stripped by a stale Mongoose model cached under Next.js hot reload.
     * Model.updateOne / doc.set cast updates against whatever schema was registered first.
     */
    if (touchesAdminPerms && isSuper && roleAfterPatch === 'admin') {
      const mergedAdminPerms = mergeAdminPermissions(body.adminPermissions);
      await User.collection.updateOne(
        { _id: target._id },
        { $set: { adminPermissions: mergedAdminPerms } }
      );
    }

    const saved = await User.findById(target._id).lean();
    if (!saved) {
      return NextResponse.json({ ok: false, error: 'User not found after save.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: String(saved._id),
        email: saved.email,
        name: saved.name || '',
        role: saved.role,
        isVip: !!saved.isVip,
        emailVerified: !!saved.emailVerified,
        phone: saved.phone || '',
        country: saved.country || '',
        timezone: saved.timezone || '',
        avatarUrl: saved.avatarUrl || '',
        createdAt: saved.createdAt ? new Date(saved.createdAt).toISOString() : null,
        updatedAt: saved.updatedAt ? new Date(saved.updatedAt).toISOString() : null,
        deletedAt: saved.deletedAt ? new Date(saved.deletedAt).toISOString() : null,
        adminPermissions:
          saved.role === 'admin' ? mergeAdminPermissions(saved.adminPermissions) : undefined,
      },
    });
  } catch (e) {
    console.error('superadmin/users/[id] PATCH', e);
    return NextResponse.json({ ok: false, error: 'Failed to update user.' }, { status: 500 });
  }
}
