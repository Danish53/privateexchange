import { NextResponse } from 'next/server';
import { listManualCryptoOptionsPublic } from '@/lib/cryptoDepositConfig';

export const runtime = 'nodejs';

/** GET /api/user/deposit/crypto-config — public manual crypto deposit options */
export async function GET() {
  return NextResponse.json({
    ok: true,
    options: listManualCryptoOptionsPublic(),
  });
}
