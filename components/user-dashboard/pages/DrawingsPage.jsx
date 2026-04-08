import Link from 'next/link';
import { Gift, Calendar, Users, Trophy, Sparkles, ArrowRight, Wallet } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { DRAWINGS } from '@/components/user-dashboard/constants';

export default function DrawingsPage() {
  const totalParticipants = DRAWINGS.reduce((acc, d) => acc + d.entries, 0);

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Rewards
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Drawings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Enter active pools with your tokens. Dates and prizes are illustrative (demo).
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            {DRAWINGS.length} active · demo
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[var(--brand-accent-soft)]/35 via-black/20 to-black/35 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
              <Trophy className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
              Pools
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-brand-heading">{DRAWINGS.length}</p>
            <p className="mt-1 text-xs text-brand-muted">Open for entry</p>
          </div>
          <div className="rounded-2xl border border-brand-border-muted bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
              <Users className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
              Community
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-brand-heading">
              {totalParticipants.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-brand-muted">Total entries (all pools)</p>
          </div>
          <div className="rounded-2xl border border-brand-border-muted bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
              <Sparkles className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
              Your entries
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-brand-heading">12</p>
            <p className="mt-1 text-xs text-brand-muted">Demo placeholder</p>
          </div>
        </section>

        <Panel title="Active drawings" subtitle="Tap enter to simulate — no real deduction in demo.">
          <div className="space-y-5">
            {DRAWINGS.map((draw) => (
              <article
                key={`${draw.name}-${draw.date}`}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 via-black/25 to-[#060708] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition duration-300 hover:border-brand-accent/30 hover:shadow-[0_24px_48px_-32px_rgba(201,162,39,0.12)] sm:p-6"
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.12),transparent_70%)]"
                  aria-hidden
                />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/45 text-brand-accent">
                      <Gift className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-brand-heading">{draw.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-brand-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-brand-subtle" strokeWidth={2} aria-hidden />
                          Draw date · {draw.date}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-brand-subtle" strokeWidth={2} aria-hidden />
                          {draw.entries.toLocaleString()} in pool
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                        Prize pool
                      </p>
                      <p className="mt-0.5 text-xl font-semibold text-brand-accent sm:text-2xl">{draw.prize}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border-brand-border px-5 py-3 text-sm font-semibold transition duration-200 group-hover:border-brand-accent/35 group-hover:bg-[var(--brand-surface-hover)]"
                    >
                      Enter drawing
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="rounded-2xl border border-brand-border-muted bg-black/[0.22] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-brand-muted">
              Need tokens first?{' '}
              <span className="text-brand-heading">Fund your wallet</span> then return here.
            </p>
            <Link
              href="/dashboard/user/wallet"
              className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
              Go to wallet
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
