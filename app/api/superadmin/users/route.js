import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { requireSuperAdmin } from '@/lib/authHelpers';

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
    const auth = await requireSuperAdmin(request);
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

    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select(
          'email name role emailVerified phone country timezone avatarUrl createdAt updatedAt deletedAt'
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
      emailVerified: !!u.emailVerified,
      phone: u.phone || '',
      country: u.country || '',
      timezone: u.timezone || '',
      avatarUrl: u.avatarUrl || '',
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : null,
      deletedAt: u.deletedAt ? new Date(u.deletedAt).toISOString() : null,
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
