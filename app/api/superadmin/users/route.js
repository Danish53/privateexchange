import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { requireAnyUsersModuleAccess, requireUsersModule, serializeUser } from '@/lib/authHelpers';
import { provisionVerifiedUser } from '@/lib/superadminProvisionUser';
import { mergeAdminPermissions } from '@/lib/adminPermissions';

export const runtime = 'nodejs';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SORT_FIELDS = {
  email: 'email',
  name: 'name',
  role: 'role',
  createdAt: 'createdAt',
  emailVerified: 'emailVerified',
  deletedAt: 'deletedAt',
};

export async function GET(request) {
  try {
    const auth = await requireAnyUsersModuleAccess(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(String(searchParams.get('page') || '1'), 10) || 1);
    const limitRaw = parseInt(String(searchParams.get('limit') || String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, limitRaw), MAX_LIMIT);
    const search = String(searchParams.get('search') || '').trim();
    const status = searchParams.get('status') === 'archived' ? 'archived' : 'active';
    const defaultSort = status === 'archived' ? 'deletedAt' : 'createdAt';
    const sortBy = SORT_FIELDS[searchParams.get('sortBy')] || defaultSort;
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const filter = {
      role: { $ne: 'superadmin' },
    };
    if (status === 'archived') {
      filter.deletedAt = { $ne: null };
    } else {
      filter.deletedAt = null;
    }

    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ email: rx }, { name: rx }];
    }

    const role = String(searchParams.get('role') || 'user');
    if (role !== 'all') {
      filter.role = role;
    }

    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select(
          'email name role isVip emailVerified phone country timezone avatarUrl createdAt updatedAt deletedAt adminPermissions'
        )
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const users = rows.map((u) => ({
      id: String(u._id),
      email: u.email,
      name: u.name || '',
      role: u.role,
      isVip: !!u.isVip,
      emailVerified: !!u.emailVerified,
      phone: u.phone || '',
      country: u.country || '',
      timezone: u.timezone || '',
      avatarUrl: u.avatarUrl || '',
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : null,
      deletedAt: u.deletedAt ? new Date(u.deletedAt).toISOString() : null,
      adminPermissions:
        u.role === 'admin' ? mergeAdminPermissions(u.adminPermissions) : undefined,
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      ok: true,
      users,
      total,
      page,
      limit,
      totalPages,
      status,
    });
  } catch (e) {
    console.error('superadmin/users', e);
    return NextResponse.json({ ok: false, error: 'Failed to load users.' }, { status: 500 });
  }
}

/** Superadmin or delegated admin (usersCreate): create a verified member or admin (not superadmin). */
export async function POST(request) {
  try {
    const auth = await requireUsersModule(request, 'create');
    if ('error' in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    let roleRaw = String(body.role || 'user').toLowerCase();
    let role = roleRaw === 'member' ? 'user' : roleRaw;
    if (!auth.isSuperAdmin) {
      role = 'user';
    }

    const result = await provisionVerifiedUser(request, {
      email: body.email,
      password: body.password,
      name: body.name,
      role,
      isVip: body.isVip,
      adminPermissions:
        auth.isSuperAdmin && role === 'admin' && body.adminPermissions
          ? body.adminPermissions
          : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    const mailResult = result.credentialsEmailSent;
    const isAdmin = result.user.role === 'admin';
    return NextResponse.json({
      ok: true,
      user: serializeUser(result.user),
      message: mailResult
        ? isAdmin
          ? 'Admin created. Login details were sent to their email.'
          : 'User created. Login details were sent to their email.'
        : isAdmin
          ? 'Admin created. Configure SMTP to email credentials automatically; they can still sign in with the password you set.'
          : 'User created. Configure SMTP to email credentials automatically; they can still sign in with the password you set.',
      credentialsEmailSent: mailResult,
    });
  } catch (e) {
    console.error('superadmin/users POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to create user.' }, { status: 500 });
  }
}
