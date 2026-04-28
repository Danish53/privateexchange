import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Token from '@/lib/models/Token';
import Wallet from '@/lib/models/Wallet';
import WalletTokenBalance from '@/lib/models/WalletTokenBalance';
import LedgerEntry from '@/lib/models/LedgerEntry';
import { PLATFORM_TOKEN_SEED } from '@/lib/tokenCatalog';

function formatAmount(n) {
  const x = Number(n) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(x);
}

function formatUsd(n) {
  const x = Number(n) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(x);
}

/** Upsert the five platform tokens (idempotent). */
export async function ensurePlatformTokens() {
  await connectDB();
  for (const row of PLATFORM_TOKEN_SEED) {
    await Token.updateOne(
      { slug: row.slug },
      {
        $setOnInsert: {
          slug: row.slug,
          name: row.name,
          symbol: row.symbol,
          sortOrder: row.sortOrder,
          usdPerUnit: row.usdPerUnit,
          isActive: true,
        },
      },
      { upsert: true }
    );
  }
}

/**
 * Create wallet + one balance row per token (all zero) for a member account.
 * No-op for non-member roles. Safe to call multiple times.
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
export async function ensureWalletForMemberUser(userId) {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user || user.role !== 'user') {
    return null;
  }

  await ensurePlatformTokens();

  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }

  const tokens = await Token.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  for (const t of tokens) {
    await WalletTokenBalance.updateOne(
      { wallet: wallet._id, token: t._id },
      { $setOnInsert: { wallet: wallet._id, token: t._id, balance: 0 } },
      { upsert: true }
    );
  }

  return wallet;
}

const barBySlug = Object.fromEntries(PLATFORM_TOKEN_SEED.map((t) => [t.slug, t.bar]));

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<{ ok: true, tokens: Array<{ name: string; symbol: string; slug: string; balance: string; value: string; bar: string }>; totalUsd: number; totalUsdFormatted: string } | { ok: false, error: string }>}
 */
export async function getWalletSummaryForUserId(userId) {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user || user.role !== 'user') {
    return { ok: false, error: 'NOT_MEMBER' };
  }

  await ensureWalletForMemberUser(userId);

  const wallet = await Wallet.findOne({ user: userId }).lean();
  if (!wallet) {
    return { ok: false, error: 'NO_WALLET' };
  }

  const rows = await WalletTokenBalance.find({ wallet: wallet._id })
    .populate('token')
    .lean();

  let totalUsd = 0;
  const tokens = rows
    .filter((r) => r.token && typeof r.token === 'object')
    .sort((a, b) => (a.token.sortOrder ?? 0) - (b.token.sortOrder ?? 0))
    .map((r) => {
      const bal = Number(r.balance) || 0;
      const unit = Number(r.token.usdPerUnit) || 1;
      const usd = bal * unit;
      totalUsd += usd;
      const slug = r.token.slug;
      return {
        name: r.token.name,
        symbol: r.token.symbol,
        slug,
        balance: formatAmount(bal),
        value: formatUsd(usd),
        bar: barBySlug[slug] || 'bg-slate-500',
        isActive: r.token.isActive,
      };
    });

  return {
    ok: true,
    tokens,
    totalUsd,
    totalUsdFormatted: formatUsd(totalUsd),
  };
}

const LEDGER_SYMBOLS = new Set(PLATFORM_TOKEN_SEED.map((t) => String(t.symbol).toUpperCase()));

function formatShortDate(d) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(d));
  } catch {
    return '—';
  }
}

function ledgerTypeLabel(type) {
  const map = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer: 'Transfer',
    fee: 'Fee',
    admin_credit: 'Admin credit',
    admin_debit: 'Admin debit',
  };
  return map[type] || String(type || '').replace(/_/g, ' ');
}

function formatSignedAmount(direction, amount) {
  const n = Number(amount) || 0;
  const s = formatAmount(n);
  return direction === 'credit' ? `+${s}` : `-${s}`;
}

/**
 * @param {string} raw query param `all` | token symbol | slug
 * @returns {string|null} uppercase symbol for Mongo filter, or null = all tokens
 */
export function parseLedgerTokenFilter(raw) {
  const v = String(raw ?? 'all').trim().toLowerCase();
  if (!v || v === 'all') return null;
  const upper = String(raw).trim().toUpperCase();
  if (LEDGER_SYMBOLS.has(upper)) return upper;
  const bySlug = PLATFORM_TOKEN_SEED.find((t) => t.slug === v);
  if (bySlug) return String(bySlug.symbol).toUpperCase();
  return null;
}

/**
 * Append-only ledger lines for the signed-in member (proposal: deposits, transfers, fees, admin).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ token?: string; limit?: number }} opts
 */
export async function getUserLedgerHistory(userId, opts = {}) {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user || user.role !== 'user') {
    return { ok: false, error: 'NOT_MEMBER' };
  }

  const limitRaw = Number(opts.limit) || 100;
  const limit = Math.min(200, Math.max(1, limitRaw));
  const tokenSym = parseLedgerTokenFilter(opts.token);
  const query = tokenSym ? { userId, token: tokenSym } : { userId };

  const [totalForUser, entries] = await Promise.all([
    LedgerEntry.countDocuments({ userId }),
    LedgerEntry.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
  ]);

  const rows = entries.map((e) => ({
    id: String(e._id),
    type: e.type,
    typeLabel: ledgerTypeLabel(e.type),
    token: e.token,
    amountSigned: formatSignedAmount(e.direction, e.amount),
    isCredit: e.direction === 'credit',
    date: e.createdAt ? new Date(e.createdAt).toISOString() : '',
    dateDisplay: e.createdAt ? formatShortDate(e.createdAt) : '—',
    status: 'completed',
    note: e.note || '',
  }));

  return {
    ok: true,
    totalForUser,
    entries: rows,
  };
}

const MAX_ADMIN_ADJUST = 1e12;
const ADMIN_NOTE_MAX = 500;

/** Superadmin-only: credit or debit a member token row + ledger; user wallet reflects immediately. */
export async function applyAdminWalletAdjustment({
  targetUserId,
  tokenSymbolUpper,
  direction,
  amount,
  note,
  actorUserId,
}) {
  await connectDB();
  if (!mongoose.isValidObjectId(targetUserId)) {
    return { ok: false, error: 'INVALID_USER' };
  }
  if (direction !== 'credit' && direction !== 'debit') {
    return { ok: false, error: 'INVALID_DIRECTION' };
  }
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > MAX_ADMIN_ADJUST) {
    return { ok: false, error: 'INVALID_AMOUNT' };
  }

  const symIn = String(tokenSymbolUpper ?? '').trim().toUpperCase();
  const seed = PLATFORM_TOKEN_SEED.find((t) => String(t.symbol).toUpperCase() === symIn);
  if (!seed || !LEDGER_SYMBOLS.has(symIn)) {
    return { ok: false, error: 'INVALID_TOKEN' };
  }

  const noteTrim = String(note ?? '')
    .trim()
    .slice(0, ADMIN_NOTE_MAX);
  const auditNote = [
    noteTrim || 'Admin balance adjustment',
    `(by ${String(actorUserId)})`,
  ].join(' ');

  const user = await User.findById(targetUserId).lean();
  if (!user || user.role !== 'user' || user.deletedAt) {
    return { ok: false, error: 'NOT_MEMBER' };
  }

  await ensureWalletForMemberUser(targetUserId);
  const wallet = await Wallet.findOne({ user: targetUserId });
  if (!wallet) {
    return { ok: false, error: 'NO_WALLET' };
  }

  const tokenDoc = await Token.findOne({ slug: seed.slug }).lean();
  if (!tokenDoc) {
    return { ok: false, error: 'TOKEN_NOT_FOUND' };
  }

  const wtb = await WalletTokenBalance.findOne({ wallet: wallet._id, token: tokenDoc._id });
  if (!wtb) {
    return { ok: false, error: 'NO_BALANCE_ROW' };
  }

  const ledgerSym = symIn;

  let updated = null;

  if (direction === 'credit') {
    updated = await WalletTokenBalance.findByIdAndUpdate(
      wtb._id,
      { $inc: { balance: amountNum } },
      { new: true }
    );
  } else {
    updated = await WalletTokenBalance.findOneAndUpdate(
      { _id: wtb._id, balance: { $gte: amountNum } },
      { $inc: { balance: -amountNum } },
      { new: true }
    );
    if (!updated) {
      return { ok: false, error: 'INSUFFICIENT_BALANCE' };
    }
  }

  if (!updated) {
    return { ok: false, error: 'UPDATE_FAILED' };
  }

  const balanceAfter = Number(updated.balance) || 0;

  try {
    await LedgerEntry.create({
      userId: targetUserId,
      type: direction === 'credit' ? 'admin_credit' : 'admin_debit',
      token: ledgerSym,
      amount: amountNum,
      direction: direction === 'credit' ? 'credit' : 'debit',
      note: auditNote,
      balanceAfter,
      externalRef: '',
    });
  } catch (e) {
    await WalletTokenBalance.findByIdAndUpdate(wtb._id, {
      $inc: { balance: direction === 'credit' ? -amountNum : amountNum },
    });
    console.error('applyAdminWalletAdjustment ledger rollback', e);
    return { ok: false, error: 'LEDGER_WRITE_FAILED' };
  }

  const summary = await getWalletSummaryForUserId(targetUserId);
  if (!summary.ok) {
    return { ok: false, error: summary.error || 'SUMMARY_FAILED' };
  }

  return {
    ok: true,
    token: ledgerSym,
    balanceAfter,
    summary,
  };
}

/**
 * Ledger lines for admin credit/debit on a member (superadmin wallet panel history).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ limit?: number }} opts
 */
export async function getMemberAdminAdjustmentHistory(userId, opts = {}) {
  await connectDB();
  if (!mongoose.isValidObjectId(userId)) {
    return { ok: false, error: 'INVALID_USER' };
  }
  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 50));
  const user = await User.findById(userId).lean();
  if (!user || user.role !== 'user') {
    return { ok: false, error: 'NOT_MEMBER' };
  }

  const rows = await LedgerEntry.find({
    userId,
    type: { $in: ['admin_credit', 'admin_debit'] },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const entries = rows.map((e) => {
    const amt = Number(e.amount) || 0;
    const balAfter = e.balanceAfter != null ? Number(e.balanceAfter) : null;
    return {
      id: String(e._id),
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : '',
      type: e.type,
      token: e.token,
      direction: e.direction,
      amount: amt,
      amountFormatted: formatAmount(amt),
      signedLabel: e.direction === 'credit' ? `+${formatAmount(amt)}` : `−${formatAmount(amt)}`,
      balanceAfterFormatted: balAfter != null && Number.isFinite(balAfter) ? formatAmount(balAfter) : null,
      note: e.note || '',
    };
  });

  return { ok: true, entries };
}
