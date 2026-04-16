import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { getUserLedgerHistory } from '@/lib/walletService';

export const runtime = 'nodejs';

/**
 * Member ledger history (deposits, transfers, fees, admin). Query: token=all|symbol|slug, limit=1–200.
 */
export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || 'all';
    const limit = parseInt(String(searchParams.get('limit') || '100'), 10) || 100;

    const result = await getUserLedgerHistory(auth.userId, { token, limit });
    if (!result.ok) {
      const status = result.error === 'NOT_MEMBER' ? 403 : 500;
      return NextResponse.json(
        { ok: false, error: result.error === 'NOT_MEMBER' ? 'Member history only.' : 'Failed.' },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      totalForUser: result.totalForUser,
      entries: result.entries,
    });
  } catch (e) {
    console.error('user/wallet/history', e);
    return NextResponse.json({ ok: false, error: 'Failed to load history.' }, { status: 500 });
  }
}
