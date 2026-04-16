import { NextResponse } from 'next/server';
import { requireWalletsView } from '@/lib/authHelpers';
import { getMemberAdminAdjustmentHistory } from '@/lib/walletService';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await requireWalletsView(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const userId = String(searchParams.get('userId') || '').trim();
    const limitRaw = parseInt(String(searchParams.get('limit') || '50'), 10);
    const limit = Number.isFinite(limitRaw) ? limitRaw : 50;

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId is required.' }, { status: 400 });
    }

    const result = await getMemberAdminAdjustmentHistory(userId, { limit });
    if (!result.ok) {
      const status = result.error === 'NOT_MEMBER' ? 404 : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, entries: result.entries });
  } catch (e) {
    console.error('superadmin/wallets/member-history', e);
    return NextResponse.json({ ok: false, error: 'Failed to load history.' }, { status: 500 });
  }
}
