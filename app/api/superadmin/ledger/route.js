import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import LedgerEntry from '@/lib/models/LedgerEntry';
import User from '@/lib/models/User';
import { requireSuperAdmin } from '@/lib/authHelpers';

export const runtime = 'nodejs';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 15;

const SORT_FIELDS = {
  createdAt: 'createdAt',
  type: 'type',
  token: 'token',
  amount: 'amount',
};

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if ('error' in auth) return auth.error;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(String(searchParams.get('page') || '1'), 10) || 1);
    const limitRaw = parseInt(String(searchParams.get('limit') || String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, limitRaw), MAX_LIMIT);
    const sortBy = SORT_FIELDS[searchParams.get('sortBy')] || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const type = searchParams.get('type')?.trim();
    const token = searchParams.get('token')?.trim().toUpperCase();
    const userSearch = searchParams.get('user')?.trim();
    const dateFrom = searchParams.get('dateFrom')?.trim();
    const dateTo = searchParams.get('dateTo')?.trim();

    const filter = {};

    if (type && ['deposit', 'withdrawal', 'buy', 'transfer', 'fee', 'admin_credit', 'admin_debit'].includes(type)) {
      filter.type = type;
    }
    if (token) {
      filter.token = token;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (!Number.isNaN(d.getTime())) filter.createdAt.$gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = d;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    if (userSearch) {
      const rx = new RegExp(escapeRegex(userSearch), 'i');
      const users = await User.find({ $or: [{ email: rx }, { name: rx }] })
        .select('_id')
        .lean();
      const ids = users.map((u) => u._id);
      filter.userId = { $in: ids };
    }

    const skip = (page - 1) * limit;

    const [total, rows, totalAllTime, last24h, byTypeAgg] = await Promise.all([
      LedgerEntry.countDocuments(filter),
      LedgerEntry.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email name')
        .populate('counterpartyUserId', 'email name')
        .lean(),
      LedgerEntry.countDocuments({}),
      LedgerEntry.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 86400000) },
      }),
      LedgerEntry.aggregate([
        { $match: Object.keys(filter).length ? filter : {} },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    const byType = {};
    for (const row of byTypeAgg) {
      if (row._id) byType[row._id] = row.count;
    }

    const entries = rows.map((e) => {
      const u = e.userId;
      const cp = e.counterpartyUserId;
      const signed =
        e.direction === 'credit' ? e.amount : -e.amount;
      return {
        id: String(e._id),
        createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
        type: e.type,
        token: e.token,
        amount: e.amount,
        direction: e.direction,
        signedAmount: signed,
        externalRef: e.externalRef || '',
        note: e.note || '',
        balanceAfter: e.balanceAfter,
        user: u
          ? {
              id: String(u._id || u),
              email: u.email || '',
              name: u.name || '',
            }
          : { id: '', email: '', name: '' },
        counterparty: cp
          ? {
              id: String(cp._id || cp),
              email: cp.email || '',
              name: cp.name || '',
            }
          : null,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      ok: true,
      entries,
      total,
      page,
      limit,
      totalPages,
      summary: {
        totalAllTime,
        last24h,
        byType,
        /** Count matching current filters (not global) */
        filteredTotal: total,
      },
    });
  } catch (e) {
    console.error('superadmin/ledger', e);
    return NextResponse.json({ ok: false, error: 'Failed to load ledger.' }, { status: 500 });
  }
}
