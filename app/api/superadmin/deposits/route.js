import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import User from '@/lib/models/User';
import { userHasWalletsAdjust } from '@/lib/adminPermissions';

export const runtime = 'nodejs';

/**
 * GET /api/superadmin/deposits
 * List deposits with optional filtering (status, paymentMethod, userId).
 * Query params:
 *   - status: pending|completed|cancelled (optional)
 *   - paymentMethod: paypal|crypto (optional)
 *   - userId: filter by user (optional)
 *   - limit: number of results (default 50)
 *   - offset: pagination offset (default 0)
 */
export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    // Only superadmin or admin with wallets adjust permission can access
    if (!userHasWalletsAdjust(auth.user)) {
      return NextResponse.json(
        { ok: false, error: 'Insufficient permissions.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const filter = {};
    if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }
    if (paymentMethod && ['paypal', 'crypto'].includes(paymentMethod)) {
      filter.paymentMethod = paymentMethod;
    }
    if (userId) {
      filter.userId = userId;
    }

    const [deposits, total] = await Promise.all([
      Deposit.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Deposit.countDocuments(filter),
    ]);

    // Enrich with user info
    const userIds = [...new Set(deposits.map(d => d.userId))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id email firstName lastName')
      .lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    const enriched = deposits.map(deposit => ({
      id: deposit._id,
      userId: deposit.userId,
      user: userMap[deposit.userId.toString()] || null,
      amount: deposit.amount,
      token: deposit.token,
      paymentMethod: deposit.paymentMethod,
      status: deposit.status,
      note: deposit.note,
      externalRef: deposit.externalRef,
      approvedAt: deposit.approvedAt,
      approvedBy: deposit.approvedBy,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
    }));

    return NextResponse.json({
      ok: true,
      deposits: enriched,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + deposits.length < total,
      },
    });
  } catch (e) {
    console.error('superadmin/deposits GET', e);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch deposits.' },
      { status: 500 }
    );
  }
}