'use client';

import {
  Coins,
  Info,
  Layers,
  Scale,
  Shield,
  Zap,
  ArrowRightLeft,
  Wallet,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TOKENS = [
  {
    code: '759',
    name: '759',
    tier: 'Primary',
    role: 'Core ecosystem token',
    accent: 'from-amber-500/25 via-amber-500/5 to-transparent',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    pill: 'text-amber-100/90 border-amber-500/25 bg-amber-500/10',
  },
  {
    code: 'CRS',
    name: 'Cristalino',
    tier: 'Premium',
    role: 'Premium tier positioning',
    accent: 'from-sky-400/25 via-sky-400/5 to-transparent',
    border: 'border-sky-400/20',
    dot: 'bg-sky-400',
    pill: 'text-sky-100/90 border-sky-400/25 bg-sky-400/10',
  },
  {
    code: 'ANJ',
    name: 'Añejo',
    tier: 'Reserve',
    role: 'Reserve / long-hold narrative',
    accent: 'from-orange-500/25 via-orange-500/5 to-transparent',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
    pill: 'text-orange-100/90 border-orange-500/25 bg-orange-500/10',
  },
  {
    code: 'RFL',
    name: 'Raffle',
    tier: 'Entries',
    role: 'Drawing & raffle entries',
    accent: 'from-violet-500/25 via-violet-500/5 to-transparent',
    border: 'border-violet-500/20',
    dot: 'bg-violet-500',
    pill: 'text-violet-100/90 border-violet-500/25 bg-violet-500/10',
  },
  {
    code: 'SUS',
    name: 'Susu',
    tier: 'Community',
    role: 'Community / pool mechanics',
    accent: 'from-emerald-500/25 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
    pill: 'text-emerald-100/90 border-emerald-500/25 bg-emerald-500/10',
  },
];

const RULE_ROWS = [
  {
    label: 'Reference valuation',
    detail: 'Internal USD mapping for display & VIP thresholds (utility disclaimer in product copy).',
    icon: Scale,
  },
  {
    label: 'Transfer fee',
    detail: 'Default $0.50 equivalent per transfer; VIP waiver hooks here when membership engine is live.',
    icon: ArrowRightLeft,
  },
  {
    label: 'Deposit / withdrawal rails',
    detail: 'PayPal, future Stripe, crypto rails — token-specific eligibility toggles per phase.',
    icon: Wallet,
  },
  {
    label: 'Drawing eligibility',
    detail: 'Which tokens may enter which pools; min entry and lock rules.',
    icon: Layers,
  },
];

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/[0.28] px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-black/40 text-brand-accent">
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
      </span>
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-brand-heading">{value}</p>
      </div>
    </div>
  );
}

export default function SuperAdminTokensPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Tokens</h1>
        <p className="mt-1 max-w-3xl text-sm text-brand-muted">
          Configure the five ecosystem assets: symbols, display rules, fee behaviour, and how each token participates
          in transfers, deposits, and drawings—aligned with the 759 platform proposal.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-brand-accent/15 bg-gradient-to-br from-[var(--brand-accent-soft)]/22 via-black/20 to-[#060708] p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-black/30 text-brand-accent">
            <Info className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-heading">Design scope (requirements)</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-muted">
              <strong className="font-medium text-brand-subtle">Token engine</strong> will support multi-token
              balances, internal value mapping, and rule-based usage. This screen is the control surface for{' '}
              <strong className="font-medium text-brand-subtle">create / edit</strong> token metadata, optional
              reference values, and per-token policies—without implying equity or profit distribution.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip icon={Coins} label="Ecosystem tokens" value="5 configured" />
        <StatChip icon={Shield} label="Compliance" value="Utility framing" />
        <StatChip icon={Zap} label="Transfer engine" value="Fee + VIP hooks" />
        <StatChip icon={Settings2} label="Admin edits" value="Audit-friendly" />
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-subtle">Asset catalogue</h2>
            <p className="mt-1 text-xs text-brand-muted">
              One card per listed token · fields below are layout placeholders until APIs are connected
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {TOKENS.map((t) => (
            <div
              key={t.code}
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-gradient-to-b from-black/[0.45] to-[#07080c] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
                t.border
              )}
            >
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90',
                  t.accent
                )}
                aria-hidden
              />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 font-bold tabular-nums text-brand-heading shadow-inner',
                      t.border
                    )}
                  >
                    {t.code}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-brand-heading">{t.name}</h3>
                      <span
                        className={cn(
                          'rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em]',
                          t.pill
                        )}
                      >
                        {t.tier}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-brand-muted">{t.role}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10 sm:mt-2',
                    t.dot
                  )}
                  title="Status placeholder"
                  aria-hidden
                />
              </div>

              <dl className="relative mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Reference (USD)
                  </dt>
                  <dd className="mt-1 font-mono text-sm tabular-nums text-brand-heading">—</dd>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Transfers
                  </dt>
                  <dd className="mt-1 text-sm text-brand-muted">P2P · fee rules</dd>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Deposits / rails
                  </dt>
                  <dd className="mt-1 text-sm text-brand-muted">PayPal · Crypto · Stripe (phase)</dd>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Drawings
                  </dt>
                  <dd className="mt-1 text-sm text-brand-muted">Entry token · min stake</dd>
                </div>
              </dl>

              <div className="relative mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  Ledger symbol: {t.code}
                </span>
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  VIP fee waiver
                </span>
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  Admin adjustments
                </span>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-brand-accent/30 bg-brand-accent/15 px-4 py-2 text-xs font-semibold text-brand-heading opacity-60"
                  title="Connect API in a later phase"
                >
                  Edit token
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-brand-border-muted bg-black/30 px-4 py-2 text-xs font-semibold text-brand-muted opacity-60"
                >
                  Fee schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-black/[0.22] p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-subtle">
          Rule categories (per proposal)
        </h2>
        <p className="mt-1 text-xs text-brand-muted">
          These rows map to backend modules later; visual structure only for now.
        </p>
        <ul className="mt-5 divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden">
          {RULE_ROWS.map((row) => (
            <li key={row.label} className="flex gap-4 bg-black/[0.2] px-4 py-4 sm:px-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-brand-accent">
                <row.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-heading">{row.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">{row.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
