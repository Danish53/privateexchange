import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { requireSuperAdmin } from '@/lib/authHelpers';

export const runtime = 'nodejs';

const DAY_MS = 86400000;
const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Active accounts only (exclude superadmin from member-facing totals; superadmin still exists in DB). */
const nonSuperActive = { deletedAt: null, role: { $ne: 'superadmin' } };

function utcStartOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function GET(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if ('error' in auth) return auth.error;

    const now = new Date();

    const t = now.getTime();
    const [
      totalUsers,
      memberWallets,
      verifiedAccounts,
      adminOperators,
      newAccounts7d,
      newAccountsPrev7d,
    ] = await Promise.all([
      User.countDocuments(nonSuperActive),
      User.countDocuments({ deletedAt: null, role: 'user' }),
      User.countDocuments({ ...nonSuperActive, emailVerified: true }),
      User.countDocuments({ deletedAt: null, role: { $in: ['admin', 'superadmin'] } }),
      User.countDocuments({
        ...nonSuperActive,
        createdAt: { $gte: new Date(t - 7 * DAY_MS) },
      }),
      User.countDocuments({
        ...nonSuperActive,
        createdAt: {
          $gte: new Date(t - 14 * DAY_MS),
          $lt: new Date(t - 7 * DAY_MS),
        },
      }),
    ]);

    const base = utcStartOfDay(now);
    const dailySignups = await Promise.all(
      Array.from({ length: 7 }, async (_, idx) => {
        const i = 6 - idx;
        const start = new Date(base);
        start.setUTCDate(start.getUTCDate() - i);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);
        const count = await User.countDocuments({
          role: { $ne: 'superadmin' },
          createdAt: { $gte: start, $lt: end },
        });
        return {
          label: WEEK_LABELS[start.getUTCDay()],
          date: start.toISOString().slice(0, 10),
          count,
        };
      })
    );

    const weeklyLabels = ['0–7d', '8–14d', '15–21d', '22–28d'];
    const weeklyTotals = await Promise.all(
      Array.from({ length: 4 }, async (_, w) => {
        const upper = new Date(Date.now() - w * 7 * DAY_MS);
        const lower = new Date(upper.getTime() - 7 * DAY_MS);
        const count = await User.countDocuments({
          role: { $ne: 'superadmin' },
          createdAt: { $gte: lower, $lt: upper },
        });
        return {
          label: weeklyLabels[w] ?? `Period ${w + 1}`,
          count,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers,
        memberWallets,
        verifiedAccounts,
        adminOperators,
        newAccounts7d,
        newAccountsPrev7d,
      },
      dailySignups,
      weeklyTotals,
    });
  } catch (e) {
    console.error('superadmin/overview', e);
    return NextResponse.json({ ok: false, error: 'Failed to load overview.' }, { status: 500 });
  }
}
