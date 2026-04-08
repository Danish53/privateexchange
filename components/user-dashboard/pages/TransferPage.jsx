'use client';

import Link from 'next/link';
import { ArrowRightLeft, ShieldCheck, Wallet, Sparkles, Info } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { TOKENS, MEMBERSHIP } from '@/components/user-dashboard/constants';

export default function TransferPage() {
  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Move funds
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Transfer
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Peer-to-peer send to email or username. Fees apply unless your tier qualifies (demo).
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            Demo · no chain execution
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[var(--brand-accent-soft)]/25 via-black/25 to-[#060708] p-6 shadow-[0_28px_64px_-36px_rgba(201,162,39,0.28)] sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_100%_0%,rgba(201,162,39,0.1),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-[var(--brand-accent-soft)]/40 text-brand-accent">
                <ArrowRightLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-brand-muted">Standard transfer fee</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-brand-heading">
                  $0.50
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300/95">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Waived for {MEMBERSHIP.tier} — applied on this demo
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link
                href="/dashboard/user/wallet"
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
              >
                <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
                Wallet balances
              </Link>
            </div>
          </div>
        </section>

        <Panel title="Send tokens" subtitle="Choose recipient, asset, and amount — review before confirming.">
          <form className="mx-auto max-w-xl space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="auth-label" htmlFor="rcp">
                Recipient
              </label>
              <p className="mb-2 text-xs text-brand-subtle">Email address or platform username</p>
              <input
                id="rcp"
                className="auth-input"
                placeholder="user@example.com or @username"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="auth-label" htmlFor="tok">
                Token
              </label>
              <div className="relative">
                <select
                  id="tok"
                  className="auth-input appearance-none pr-10"
                  defaultValue={TOKENS[0]?.symbol}
                >
                  {TOKENS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.name} — {t.balance} available
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-subtle"
                  aria-hidden
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <label className="auth-label" htmlFor="amt">
                Amount
              </label>
              <input
                id="amt"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="auth-input tabular-nums"
                placeholder="0.00"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/[0.28] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" strokeWidth={2} aria-hidden />
                  <p className="text-xs leading-relaxed text-brand-muted">
                    Transfers are irreversible once submitted. Double-check the recipient and token before
                    confirming.
                  </p>
                </div>
              </div>
              <div className="space-y-3 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">Network / transfer fee</span>
                  <span className="font-semibold tabular-nums text-brand-heading">$0.50</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">VIP fee waiver</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300/95">
                    <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Applied
                  </span>
                </div>
                <div className="border-t border-dashed border-white/[0.08] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-heading">You pay (demo)</span>
                    <span className="text-lg font-semibold tabular-nums text-brand-accent">$0.00</span>
                  </div>
                  <p className="mt-1 text-xs text-brand-subtle">Fee waived for {MEMBERSHIP.tier} — preview only</p>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center rounded-xl py-3.5 text-sm font-semibold">
              Review & send
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}
