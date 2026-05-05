import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PlatformSetting from '@/lib/models/PlatformSetting';
import { loadRequestActor } from '@/lib/authHelpers';
import { hasAnySettingsPermission } from '@/lib/adminPermissions';

export const runtime = 'nodejs';

async function requireSettingsAccess(request) {
  const act = await loadRequestActor(request);
  if ('error' in act) return act;
  if (!hasAnySettingsPermission(act.user)) {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return act;
}

export async function GET(request) {
  try {
    const auth = await requireSettingsAccess(request);
    if ('error' in auth) return auth.error;

    await connectDB();
    const doc =
      (await PlatformSetting.findOne({ key: 'global' }).lean()) ||
      (await PlatformSetting.create({ key: 'global' })).toObject();

    return NextResponse.json({
      ok: true,
      settings: {
        transferFeeAmount:
          typeof doc.transferFeeAmount === 'number' && Number.isFinite(doc.transferFeeAmount)
            ? doc.transferFeeAmount
            : 0,
        transferFeeType: doc.transferFeeType === 'percentage' ? 'percentage' : 'fixed',
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
      },
    });
  } catch (e) {
    console.error('superadmin/settings/transfer-fee GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to load transfer fee settings.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireSettingsAccess(request);
    if ('error' in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const rawAmount = Number(body.transferFeeAmount);
    const transferFeeType = body.transferFeeType === 'percentage' ? 'percentage' : body.transferFeeType === 'fixed' ? 'fixed' : null;

    if (!Number.isFinite(rawAmount) || rawAmount < 0) {
      return NextResponse.json(
        { ok: false, error: 'Transfer fee amount must be a valid non-negative number.' },
        { status: 400 }
      );
    }
    if (!transferFeeType) {
      return NextResponse.json(
        { ok: false, error: 'Transfer fee type must be fixed or percentage.' },
        { status: 400 }
      );
    }
    await connectDB();
    const updated = await PlatformSetting.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          transferFeeAmount: rawAmount,
          transferFeeType,
          updatedBy: auth.userId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      ok: true,
      settings: {
        transferFeeAmount: updated.transferFeeAmount,
        transferFeeType: updated.transferFeeType,
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : null,
      },
      message: 'Transfer fee settings saved.',
    });
  } catch (e) {
    console.error('superadmin/settings/transfer-fee PATCH', e);
    return NextResponse.json({ ok: false, error: 'Failed to save transfer fee settings.' }, { status: 500 });
  }
}
