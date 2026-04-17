import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { requireWalletsView } from '@/lib/authHelpers';
import { getWalletSummaryForUserId } from '@/lib/walletService';

export const runtime = 'nodejs';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SORT_FIELDS = {
  email: 'email',
  name: 'name',
  createdAt: 'createdAt',
};

/**
 * Member custodial wallets: one row per active member (role user, not archived).
 * Per-token balances and USD aggregate from `WalletTokenBalance` + token rates.
 */
export async function GET(request) {
  try {
    const auth = await requireWalletsView(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);

    const forUser = String(searchParams.get('forUser') || '').trim();
    if (forUser) {
      if (!mongoose.isValidObjectId(forUser)) {
        return NextResponse.json({ ok: false, error: 'Invalid user id.' }, { status: 400 });
      }
      const u = await User.findOne({ _id: forUser })
        .select('email name role emailVerified country avatarUrl createdAt deletedAt')
        .lean();
      if (!u) {
        return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
      }
      if (u.deletedAt) {
        return NextResponse.json({
          ok: true,
          memberWallet: false,
          archived: true,
          role: u.role,
          email: u.email,
          name: u.name || '',
          avatarUrl: u.avatarUrl || '',
        });
      }
      if (u.role !== 'user') {
        return NextResponse.json({
          ok: true,
          memberWallet: false,
          role: u.role,
          email: u.email,
          name: u.name || '',
          avatarUrl: u.avatarUrl || '',
        });
      }
      const summary = await getWalletSummaryForUserId(u._id);
      const base = {
        walletId: String(u._id),
        memberEmail: u.email,
        memberName: u.name || '',
        emailVerified: !!u.emailVerified,
        country: u.country || '',
        avatarUrl: u.avatarUrl || '',
        openedAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      };
      if (summary.ok) {
        return NextResponse.json({
          ok: true,
          memberWallet: true,
          wallet: {
            ...base,
            balanceDisplay: summary.totalUsdFormatted,
            totalUsd: summary.totalUsd,
            tokens: summary.tokens,
          },
        });
      }
      return NextResponse.json({
        ok: true,
        memberWallet: true,
        wallet: { ...base, balanceDisplay: '—', totalUsd: 0, tokens: [] },
      });
    }

    const page = Math.max(1, parseInt(String(searchParams.get('page') || '1'), 10) || 1);
    const limitRaw = parseInt(String(searchParams.get('limit') || String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, limitRaw), MAX_LIMIT);
    const search = String(searchParams.get('search') || '').trim();
    const sortBy = SORT_FIELDS[searchParams.get('sortBy')] || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const filter = {
      role: 'user',
      deletedAt: null,
    };

    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ email: rx }, { name: rx }];
    }

    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('email name emailVerified country avatarUrl createdAt')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const wallets = [];
    for (const u of rows) {
      const summary = await getWalletSummaryForUserId(u._id);
      const base = {
        walletId: String(u._id),
        memberEmail: u.email,
        memberName: u.name || '',
        emailVerified: !!u.emailVerified,
        country: u.country || '',
        avatarUrl: u.avatarUrl || '',
        openedAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      };
      if (summary.ok) {
        wallets.push({
          ...base,
          balanceDisplay: summary.totalUsdFormatted,
          totalUsd: summary.totalUsd,
          tokens: summary.tokens,
        });
      } else {
        wallets.push({
          ...base,
          balanceDisplay: '—',
          totalUsd: 0,
          tokens: [],
        });
      }
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      ok: true,
      wallets,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (e) {
    console.error('superadmin/wallets', e);
    return NextResponse.json({ ok: false, error: 'Failed to load wallets.' }, { status: 500 });
  }
}
