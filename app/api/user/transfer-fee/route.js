import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PlatformSetting from '@/lib/models/PlatformSetting';
import { requireAuthUser } from '@/lib/authHelpers';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = requireAuthUser(request);
    if ('error' in auth) return auth.error;

    await connectDB();
    const doc =
      (await PlatformSetting.findOne({ key: 'global' }).lean()) ||
      (await PlatformSetting.create({ key: 'global' })).toObject();

    return NextResponse.json({
      ok: true,
      transferFee: {
        amount:
          typeof doc.transferFeeAmount === 'number' && Number.isFinite(doc.transferFeeAmount)
            ? doc.transferFeeAmount
            : 0,
        type: doc.transferFeeType === 'percentage' ? 'percentage' : 'fixed',
      },
    });
  } catch (e) {
    console.error('user/transfer-fee GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load transfer fee.' }, { status: 500 });
  }
}
