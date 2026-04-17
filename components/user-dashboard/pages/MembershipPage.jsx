import Link from 'next/link';
import { Shield, CheckCircle2, Gift, ArrowRightLeft, Headphones, Wallet } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { MEMBERSHIP } from '@/components/user-dashboard/constants';

const BENEFITS = [
  {
    title: 'Transfers',
    description: 'Send tokens to other users by email or username when transfers are enabled.',
    icon: ArrowRightLeft,
  },
  {
    title: 'Drawings',
    description: 'Enter published pools according to each pool’s rules and your token balance.',
    icon: Gift,
  },
  {
    title: 'Support',
    description: 'Use standard support channels for account and billing questions.',
    icon: Headphones,
  },
];

const TIER_LADDER = [
  { name: 'Member', feeWaiver: false, drawings: 'Standard', limits: 'Default', current: true },
  { name: 'VIP', feeWaiver: true, drawings: 'Priority where offered', limits: 'Raised where offered', highlight: true },
];

export default function MembershipPage() {
  const progress = MEMBERSHIP.progress;
  const remaining = 100 - progress;

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">Account</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Membership
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Your current tier and what it includes. VIP adds fee waivers and higher limits where the program offers
              them.
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">Tier · {MEMBERSHIP.tier}</p>
        </div>
      </header>

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-[var(--brand-accent-soft)]/8 via-[#0a0b0f] to-black/50 p-6 sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_15%_0%,rgba(201,162,39,0.1),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-white/[0.12] bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-heading">
                {MEMBERSHIP.tier}
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-brand-heading sm:text-[1.65rem]">
                You are on the {MEMBERSHIP.tier} plan
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                VIP is offered when you meet the platform’s activity and compliance criteria. Eligibility and perks are
                defined in the membership terms.
              </p>
            </div>
            <div className="w-full max-w-md shrink-0 rounded-xl border border-white/[0.08] bg-black/35 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-brand-muted">Progress toward VIP</span>
                <span className="font-semibold tabular-nums text-brand-heading">{progress}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-accent/90 to-amber-200/90"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-brand-subtle">
                <span className="font-semibold tabular-nums text-brand-heading">{remaining}%</span>
                <span className="text-brand-muted"> remaining — updates when your account qualifies.</span>
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
              <Shield className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
              Account status
            </div>
            <p className="mt-2 text-lg font-semibold text-brand-heading">Active</p>
            <p className="mt-1 text-xs text-brand-muted">No restrictions on file for this account.</p>
          </div>
          <div className="rounded-2xl border border-brand-border-muted bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">Next tier</div>
            <p className="mt-2 text-lg font-semibold text-brand-heading">VIP</p>
            <p className="mt-1 text-xs text-brand-muted">Fee waivers and higher limits where the program applies.</p>
          </div>
          <div className="rounded-2xl border border-brand-border-muted bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">Benefits</div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-brand-heading">{BENEFITS.length}</p>
            <p className="mt-1 text-xs text-brand-muted">Highlights for your tier — see table below.</p>
          </div>
        </div>

        <Panel title="Included today" subtitle="What your membership covers under normal platform operation.">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <li
                  key={b.title}
                  className="flex gap-4 rounded-xl border border-white/[0.06] bg-black/[0.22] p-4"
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

        <Panel title="Tier comparison" subtitle="Member compared to VIP. Exact limits are set in program rules.">
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
                            Current
                          </span>
                        ) : null}
                        {row.highlight ? (
                          <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[0.65rem] font-medium text-brand-muted">
                            Upgrade
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
            Token balances and transfers are managed from your wallet.
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
