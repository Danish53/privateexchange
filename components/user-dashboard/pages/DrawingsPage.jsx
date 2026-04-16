import Link from 'next/link';
import { Gift, Wallet } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { DRAWINGS } from '@/components/user-dashboard/constants';

export default function DrawingsPage() {
  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">Rewards</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Drawings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Token-based drawings will list here with schedule, entry rules, and prize details once pools are live on
              the platform.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {DRAWINGS.length > 0 ? (
          <Panel title="Active drawings" subtitle="Open pools you can enter with your wallet balance.">
            <div className="space-y-5">
              {DRAWINGS.map((draw) => (
                <article
                  key={`${draw.name}-${draw.date}`}
                  className="rounded-2xl border border-white/[0.08] bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/40 text-brand-accent">
                        <Gift className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-brand-heading">{draw.name}</h3>
                        <p className="mt-1 text-sm text-brand-muted">
                          Draw date · {draw.date} · {draw.entries.toLocaleString()} entries
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                        Prize
                      </p>
                      <p className="mt-0.5 text-lg font-semibold text-brand-accent">{draw.prize}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Active drawings" subtitle="No pools are open at the moment.">
            <p className="text-sm leading-relaxed text-brand-muted">
              When the next drawing is scheduled, it will appear in this list with dates and how to enter using your
              tokens.
            </p>
          </Panel>
        )}

        <div className="rounded-2xl border border-brand-border-muted bg-black/[0.22] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-brand-muted">
              Fund your wallet first so you are ready when entries open.
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
