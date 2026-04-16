import { NextResponse } from 'next/server';
import { requireWalletsAdjust } from '@/lib/authHelpers';
import { applyAdminWalletAdjustment } from '@/lib/walletService';

export const runtime = 'nodejs';

const ERROR_STATUS = {
  INVALID_USER: 400,
  INVALID_DIRECTION: 400,
  INVALID_AMOUNT: 400,
  INVALID_TOKEN: 400,
  NOT_MEMBER: 404,
  NO_WALLET: 404,
  TOKEN_NOT_FOUND: 500,
  NO_BALANCE_ROW: 500,
  INSUFFICIENT_BALANCE: 400,
  UPDATE_FAILED: 500,
  LEDGER_WRITE_FAILED: 500,
  SUMMARY_FAILED: 500,
};

export async function POST(request) {
  try {
    const auth = await requireWalletsAdjust(request);
    if ('error' in auth) return auth.error;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const userId = String(body?.userId ?? '').trim();
    const token = String(body?.token ?? body?.symbol ?? '').trim();
    const direction = String(body?.direction ?? '').trim().toLowerCase();
    const amount = body?.amount;
    const note = body?.note != null ? String(body.note) : '';

    if (!userId || !token || !direction) {
      return NextResponse.json({ ok: false, error: 'userId, token, and direction are required.' }, { status: 400 });
    }
    if (direction !== 'credit' && direction !== 'debit') {
      return NextResponse.json({ ok: false, error: 'direction must be credit or debit.' }, { status: 400 });
    }

    const result = await applyAdminWalletAdjustment({
      targetUserId: userId,
      tokenSymbolUpper: token,
      direction,
      amount,
      note,
      actorUserId: auth.userId,
    });

    if (!result.ok) {
      const code = result.error || 'UNKNOWN';
      const status = ERROR_STATUS[code] ?? 400;
      const messages = {
        INSUFFICIENT_BALANCE: 'Debit would exceed this token balance for the member.',
        NOT_MEMBER: 'Member not found or account is not eligible.',
        INVALID_TOKEN: 'Unsupported token. Use a platform token symbol (e.g. CRS, RFL).',
        INVALID_AMOUNT: 'Enter a valid positive amount.',
      };
      return NextResponse.json(
        { ok: false, error: messages[code] || code },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      token: result.token,
      balanceAfter: result.balanceAfter,
      summary: result.summary,
    });
  } catch (e) {
    console.error('superadmin/wallets/adjust POST', e);
    return NextResponse.json({ ok: false, error: 'Adjustment failed.' }, { status: 500 });
  }
}
