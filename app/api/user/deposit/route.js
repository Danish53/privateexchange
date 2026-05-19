import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';
import { connectDB } from '@/lib/db';
import Deposit from '@/lib/models/Deposit';
import { ensureWalletForMemberUser } from '@/lib/walletService';
import Token from '@/lib/models/Token';
import { getStripeClient, isStripeConfigured } from '@/lib/stripe';
import { getManualCryptoOption, MANUAL_CRYPTO_IDS } from '@/lib/cryptoDepositConfig';

export const runtime = 'nodejs';

/**
 * GET /api/user/deposit
 * List the signed-in member's deposit requests (all statuses by default).
 * Query: status=pending|completed|cancelled (optional), limit (default 50, max 100)
 */
export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can view deposit history.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);

    const filter = { userId: auth.userId };
    if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const deposits = await Deposit.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const list = deposits.map((d) => ({
      id: d._id,
      amount: d.amount,
      token: d.token,
      paymentMethod: d.paymentMethod,
      status: d.status,
      note: d.note,
      externalRef: d.externalRef,
      payCurrency: d.payCurrency || '',
      payAmount: d.payAmount ?? null,
      payAddress: d.payAddress || '',
      transactionHash: d.transactionHash || '',
      proofImageUrl: d.proofImageUrl || '',
      nowPaymentsPaymentStatus: d.nowPaymentsPaymentStatus || '',
      nowPaymentsPaymentId: d.nowPaymentsPaymentId || '',
      stripeSessionId: d.stripeSessionId || '',
      stripePaymentIntentId: d.stripePaymentIntentId || '',
      stripePaymentStatus: d.stripePaymentStatus || '',
      creditedAt: d.creditedAt || null,
      rejectionReason: d.rejectionReason || '',
      approvedAt: d.approvedAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return NextResponse.json({ ok: true, deposits: list });
  } catch (e) {
    console.error('user/deposit GET', e);
    return NextResponse.json(
      { ok: false, error: 'Failed to load deposits.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/deposit
 * Create a deposit request.
 * Body: { amount: number, token: string, paymentMethod: 'paypal' | 'crypto' | 'stripe', payCurrency?: string, transactionHash?: string, proofImageUrl?: string }
 */
export async function POST(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    // Only regular members can deposit
    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can deposit.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { amount, token, paymentMethod, payCurrency, transactionHash, proofImageUrl } = body;

    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Valid positive amount is required.' },
        { status: 400 }
      );
    }
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Token symbol is required.' },
        { status: 400 }
      );
    }
    if (!paymentMethod || !['paypal', 'crypto', 'stripe'].includes(paymentMethod)) {
      return NextResponse.json(
        { ok: false, error: 'Payment method must be paypal, crypto, or stripe.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify token exists and is active
    const tokenDoc = await Token.findOne({
      symbol: token.toUpperCase(),
      isActive: true,
    }).lean();
    if (!tokenDoc) {
      return NextResponse.json(
        { ok: false, error: 'Token not found or inactive.' },
        { status: 400 }
      );
    }

    // Ensure user has a wallet
    await ensureWalletForMemberUser(auth.userId);

    const isCrypto = paymentMethod === 'crypto';
    const isStripe = paymentMethod === 'stripe';
    let deposit;
    let paymentDetails = null;

    if (isCrypto) {
      if (!payCurrency || typeof payCurrency !== 'string' || !payCurrency.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Select a cryptocurrency (BTC, ETH, or SOL).' },
          { status: 400 }
        );
      }
      const normalizedPayCurrency = payCurrency.trim().toLowerCase();
      if (!MANUAL_CRYPTO_IDS.includes(normalizedPayCurrency)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid cryptocurrency. Choose BTC, ETH, or SOL.' },
          { status: 400 }
        );
      }

      const cryptoOption = getManualCryptoOption(normalizedPayCurrency);
      if (!cryptoOption?.address) {
        return NextResponse.json(
          { ok: false, error: 'Crypto deposit address is not configured.' },
          { status: 503 }
        );
      }

      const txHash =
        typeof transactionHash === 'string' ? transactionHash.trim() : '';
      const proofUrl =
        typeof proofImageUrl === 'string' ? proofImageUrl.trim() : '';

      if (!txHash && !proofUrl) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Provide a transaction hash/ID or upload a payment screenshot.',
          },
          { status: 400 }
        );
      }

      deposit = await Deposit.create({
        userId: auth.userId,
        amount,
        token: token.toUpperCase(),
        paymentMethod,
        status: 'pending',
        note: `Manual crypto deposit (${cryptoOption.name} / ${cryptoOption.network}) pending admin approval`,
        externalRef: txHash,
        transactionHash: txHash,
        proofImageUrl: proofUrl,
        payCurrency: normalizedPayCurrency,
        payAddress: cryptoOption.address,
      });

      paymentDetails = {
        payAddress: cryptoOption.address,
        payCurrency: cryptoOption.network,
        cryptoName: cryptoOption.name,
        qrImage: cryptoOption.qrImage,
        transactionHash: txHash,
        proofImageUrl: proofUrl,
      };
    } else if (isStripe) {
      if (!isStripeConfigured()) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Stripe deposits are temporarily unavailable. Configure STRIPE_SECRET_KEY.',
          },
          { status: 503 }
        );
      }

      deposit = await Deposit.create({
        userId: auth.userId,
        amount,
        token: token.toUpperCase(),
        paymentMethod,
        status: 'pending',
        note: 'Stripe deposit initiated',
        externalRef: '',
      });

      const stripe = getStripeClient();

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
          payment_method_options: {
            card: {
              request_three_d_secure: 'automatic',
            },
          },
          receipt_email: auth.user?.email || undefined,
          metadata: {
            depositId: String(deposit._id),
            userId: String(auth.userId),
            token: token.toUpperCase(),
            amount: String(amount),
          },
        });

        deposit.stripePaymentIntentId = String(paymentIntent.id || '');
        deposit.stripePaymentStatus = String(paymentIntent.status || 'requires_payment_method');
        deposit.externalRef = String(paymentIntent.id || '');
        await deposit.save();

        paymentDetails = {
          clientSecret: String(paymentIntent.client_secret || ''),
          paymentIntentId: String(paymentIntent.id || ''),
          paymentStatus: String(paymentIntent.status || 'requires_payment_method'),
        };
      } catch (err) {
        deposit.status = 'cancelled';
        deposit.note = `Stripe init failed: ${err?.message || 'unknown error'}`;
        await deposit.save();
        const e = new Error(err?.message || 'Failed to initialize Stripe payment.');
        e.statusCode = 502;
        throw e;
      }
    } else {
      deposit = await Deposit.create({
        userId: auth.userId,
        amount,
        token: token.toUpperCase(),
        paymentMethod,
        status: 'pending',
        note: 'PayPal deposit (pending admin approval)',
        externalRef: '',
      });
    }

    // Return success with deposit details
    return NextResponse.json({
      ok: true,
      deposit: {
        id: String(deposit._id),
        amount: deposit.amount,
        token: deposit.token,
        paymentMethod: deposit.paymentMethod,
        status: deposit.status,
        note: deposit.note,
        payment: paymentDetails,
        createdAt: deposit.createdAt,
      },
      message: isCrypto
        ? 'Crypto deposit request submitted. Admin will review and credit your wallet after verification.'
        : isStripe
          ? 'Stripe payment initialized. Enter card details to complete secure payment.'
        : 'PayPal deposit request submitted. It will be processed after admin approval.',
    });
  } catch (e) {
    console.error('user/deposit POST', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to create deposit.' },
      { status: Number(e?.statusCode) || 500 }
    );
  }
}