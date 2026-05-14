import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { syncAutomaticMembershipForUser } from '@/lib/userMembershipAssignmentService';
import { getWalletSummaryForUserId } from '@/lib/walletService';

export const runtime = 'nodejs';

/** Member wallet: five token rows + USD aggregate (balances from DB). */
export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    const summary = await getWalletSummaryForUserId(auth.userId);
    if (!summary.ok) {
      const status = summary.error === 'NOT_MEMBER' ? 403 : 404;
      return NextResponse.json(
        { ok: false, error: summary.error === 'NOT_MEMBER' ? 'Member wallet only.' : 'Wallet not found.' },
        { status }
      );
    }

    if (auth.user?.role === 'user') {
      try {
        await syncAutomaticMembershipForUser(auth.userId, { portfolioUsd: summary.portfolioUsd });
      } catch (e) {
        console.error('user/wallet syncAutomaticMembershipForUser', e);
      }
    }

    return NextResponse.json({
      ok: true,
      tokens: summary.tokens,
      totalUsd: summary.totalUsd,
      totalUsdFormatted: summary.totalUsdFormatted,
      usdTokenBalance: summary.usdTokenBalance,
      usdTokenBalanceFormatted: summary.usdTokenBalanceFormatted,
      portfolioUsd: summary.portfolioUsd,
      portfolioUsdFormatted: summary.portfolioUsdFormatted,
    });
  } catch (e) {
    console.error('user/wallet GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load wallet.' }, { status: 500 });
  }
}
