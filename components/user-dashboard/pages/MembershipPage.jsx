import Link from 'next/link';
import {
  Shield,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Gift,
  ArrowRightLeft,
  Headphones,
  Crown,
  Wallet,
} from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { MEMBERSHIP } from '@/components/user-dashboard/constants';

const BENEFITS = [
  {
    title: 'Transfer fee waiver',
    description: 'Eligible sends skip the standard $0.50 network fee.',
    icon: ArrowRightLeft,
  },
  {
    title: 'Priority drawings',
    description: 'Earlier access windows and boosted visibility in select pools.',
    icon: Gift,
  },
  {
    title: 'Higher limits',
    description: 'Elevated daily transfer and withdrawal caps vs. standard.',
    icon: TrendingUp,
  },
  {
    title: 'Concierge support',
    description: 'Dedicated queue for account and verification questions.',
    icon: Headphones,
  },
];

const TIER_LADDER = [
  { name: 'Standard', feeWaiver: false, drawings: 'Standard', limits: 'Base' },
  { name: 'VIP', feeWaiver: true, drawings: 'Priority', limits: 'Raised', current: true },
  { name: 'Elite', feeWaiver: true, drawings: 'Priority+', limits: 'Highest', highlight: true },
];

export default function MembershipPage() {
  const progress = MEMBERSHIP.progress;
  const remaining = 100 - progress;

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Account
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Membership
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Your tier, progress toward the next level, and included benefits (demo).
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            Current · {MEMBERSHIP.tier}
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-[var(--brand-accent-soft)]/4 via-[#0a0b0f] to-black/50 p-6 shadow-[0_32px_64px_-40px_rgba(201,162,39,0.35)] sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_15%_0%,rgba(201,162,39,0.14),transparent_55%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(99,102,241,0.06),transparent_50%)]" aria-hidden />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand-accent/35 bg-gradient-to-br from-[var(--brand-accent-soft)]/5 to-black/50 text-brand-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_40px_-12px_rgba(201,162,39,0.35)]">
                <Crown className="h-8 w-8" strokeWidth={1.25} aria-hidden />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/30 bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    {MEMBERSHIP.tier} member
                  </span>
                  <span className="text-xs font-medium text-brand-subtle">Active benefits unlocked</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-heading sm:text-[1.65rem]">
                  You&apos;re on the {MEMBERSHIP.tier} track
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-muted">
                  Keep activity and volume healthy to reach Elite — fee perks and limits scale with tier
                  (illustrative).
                </p>
              </div>
            </div>
            <div className="w-full max-w-md shrink-0 rounded-xl border border-white/[0.08] bg-black/35 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-brand-muted">Tier progress</span>
                <span className="font-semibold tabular-nums text-brand-heading">{progress}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-accent/90 to-amber-200/90 shadow-[0_0_20px_-4px_rgba(201,162,39,0.65)] transition-all duration-700"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-brand-subtle">
                <span className="text-brand-muted">About </span>
                <span className="font-semibold tabular-nums text-brand-heading">{remaining}%</span>
                <span className="text-brand-muted"> to next milestone (demo).</span>
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-black/30 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
              <Shield className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
              Status
            </div>
            <p className="mt-2 text-lg font-semibold text-brand-heading">Good standing</p>
            <p className="mt-1 text-xs text-brand-muted">No holds on this demo account</p>
          </div>
          <div className="rounded-2xl border border-brand-border-muted bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
              <TrendingUp className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
              Trajectory
            </div>
            <p className="mt-2 text-lg font-semibold text-brand-heading">On track</p>
            <p className="mt-1 text-xs text-brand-muted">Activity supports next tier (demo)</p>
          </div>
          <div className="rounded-2xl border border-brand-border-muted bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
              <Gift className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
              Perks in use
            </div>
            <p className="mt-2 text-lg font-semibold text-brand-heading">4 active</p>
            <p className="mt-1 text-xs text-brand-muted">Listed under benefits below</p>
          </div>
        </div>

        <Panel title="Your benefits" subtitle="Included with your current tier — subject to program rules.">
          <ul className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <li
                  key={b.title}
                  className="flex gap-4 rounded-xl border border-white/[0.06] bg-black/[0.22] p-4 transition duration-200 hover:border-brand-accent/25 hover:bg-[var(--brand-surface-hover)]/50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/35 text-brand-accent">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-heading">{b.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-muted">{b.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Tier overview" subtitle="How VIP compares — Elite is the next step in this demo ladder.">
          <div className="overflow-x-auto rounded-xl border border-white/[0.05] bg-black/[0.2]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                  <th className="px-4 py-3 sm:px-5">Tier</th>
                  <th className="px-4 py-3 sm:px-5">Transfer fee waiver</th>
                  <th className="px-4 py-3 sm:px-5">Drawings</th>
                  <th className="px-4 py-3 sm:px-5">Limits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {TIER_LADDER.map((row) => (
                  <tr
                    key={row.name}
                    className={
                      row.current
                        ? 'bg-[var(--brand-accent-soft)]/[0.12]'
                        : row.highlight
                          ? 'bg-white/[0.02]'
                          : undefined
                    }
                  >
                    <td className="px-4 py-3.5 sm:px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-heading">{row.name}</span>
                        {row.current ? (
                          <span className="rounded-full border border-brand-accent/35 bg-black/30 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-accent">
                            You
                          </span>
                        ) : null}
                        {row.highlight ? (
                          <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[0.65rem] font-medium text-brand-muted">
                            Next goal
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-brand-muted sm:px-5">
                      {row.feeWaiver ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300/95">
                          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                          Yes
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-brand-muted sm:px-5">{row.drawings}</td>
                    <td className="px-4 py-3.5 text-brand-muted sm:px-5">{row.limits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="rounded-2xl border border-brand-border-muted bg-black/[0.22] px-5 py-5 sm:flex sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-brand-muted">
            Grow balances and activity to climb tiers.{' '}
            <span className="text-brand-heading">Wallet</span> is the hub for your tokens.
          </p>
          <Link
            href="/dashboard/user/wallet"
            className="btn-primary mt-4 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold sm:mt-0 sm:w-auto"
          >
            <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
            Open wallet
          </Link>
        </div>
      </div>
    </>
  );
}
