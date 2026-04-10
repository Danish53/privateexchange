'use client';

import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Gift,
  Info,
  Lock,
  PlayCircle,
  Settings2,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { DRAWINGS } from '@/components/user-dashboard/constants';
import { cn } from '@/lib/utils';

const WORKFLOW = [
  {
    step: '01',
    title: 'Define campaign',
    detail: 'Prize copy, eligible tokens (e.g. RFL), windows, and compliance text.',
    icon: Gift,
  },
  {
    step: '02',
    title: 'Entry window',
    detail: 'Accept entries, enforce caps, and surface pool size to members in real time.',
    icon: Users,
  },
  {
    step: '03',
    title: 'Lock & draw',
    detail: 'Freeze entries, run verifiable selection, and record winners with timestamps.',
    icon: Lock,
  },
  {
    step: '04',
    title: 'Audit & export',
    detail: 'Immutable logs, CSV exports, and support tooling for disputes.',
    icon: FileSpreadsheet,
  },
];

function StatChip({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/[0.28] px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-black/40 text-brand-accent">
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
      </span>
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">{label}</p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-heading">{value}</p>
        {hint ? <p className="mt-0.5 text-[0.65rem] text-brand-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    live: {
      label: 'Live',
      className: 'border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-100/95',
    },
    scheduled: {
      label: 'Scheduled',
      className: 'border-sky-500/30 bg-sky-500/[0.1] text-sky-100/90',
    },
    closed: {
      label: 'Closed',
      className: 'border-white/[0.1] bg-white/[0.05] text-brand-muted',
    },
  };
  const m = map[status] || map.closed;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em]',
        m.className
      )}
    >
      {m.label}
    </span>
  );
}

export default function SuperAdminDrawingsPage() {
  const totalEntries = DRAWINGS.reduce((acc, d) => acc + d.entries, 0);
  const rows = DRAWINGS.map((d, i) => ({
    ...d,
    id: `demo-${i}`,
    status: i === 0 ? 'live' : 'closed',
    entryToken: 'RFL',
  }));

  return (
    <div className="space-y-8">
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Drawings</h1>
        <p className="mt-1 max-w-3xl text-sm text-brand-muted">
          Operate raffle and drawing campaigns: schedules, entry pools, winner selection, and audit trails. Below is a
          full layout using demo pool data until drawing APIs are connected.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.12] via-black/20 to-[#060708] p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.14),transparent_68%)]"
          aria-hidden
        />
        <div className="relative flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-black/35 text-violet-200">
            <Info className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-heading">Operator scope</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-muted">
              Superadmin controls <strong className="font-medium text-brand-subtle">when</strong> drawings open and
              close, <strong className="font-medium text-brand-subtle">who</strong> is eligible, and{' '}
              <strong className="font-medium text-brand-subtle">how</strong> outcomes are logged. Member-facing entry
              UX stays on the user dashboard; this screen is for governance, exports, and incident review.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip icon={Trophy} label="Active campaigns" value={String(DRAWINGS.length)} hint="Demo seed data" />
        <StatChip
          icon={Users}
          label="Entries (all pools)"
          value={totalEntries.toLocaleString()}
          hint="Aggregated demo counts"
        />
        <StatChip icon={Shield} label="Fairness" value="Audit-ready" hint="Logs + exports (planned)" />
        <StatChip icon={Sparkles} label="Entry token" value="RFL" hint="Configure under Tokens" />
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-subtle">Campaign pipeline</h2>
            <p className="mt-1 text-xs text-brand-muted">
              Intended lifecycle for each drawing — buttons are visual placeholders until backend hooks exist.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-muted opacity-60"
            >
              <PlayCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
              New campaign
            </button>
            <Link
              href="/dashboard/superadmin/tokens"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-accent/25 bg-[var(--brand-accent-soft)]/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-heading transition hover:bg-[var(--brand-accent-soft)]/55"
            >
              <Settings2 className="h-4 w-4 text-brand-accent" strokeWidth={2} aria-hidden />
              Token rules
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW.map((w) => (
            <div
              key={w.step}
              className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.4] to-[#07080c] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_0%_0%,rgba(201,162,39,0.06),transparent_55%)]"
                aria-hidden
              />
              <div className="relative flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/40 text-brand-accent">
                  <w.icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-semibold tabular-nums text-brand-subtle">{w.step}</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-heading">{w.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-brand-muted">{w.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,162,39,0.05),transparent_55%)]"
          aria-hidden
        />
        <div className="relative border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-subtle">Campaigns</h2>
              <p className="mt-1 text-xs text-brand-muted">
                Same demo pools as the member drawings page — replace with API-driven rows when live.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium text-brand-subtle">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/90" strokeWidth={2} aria-hidden />
              Read-only preview
            </span>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-black/40">
                <th className="whitespace-nowrap px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle sm:pl-6">
                  Campaign
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Draw date
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Entries
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Prize
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle sm:pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-white/[0.05] transition-colors hover:bg-white/[0.03]',
                    i % 2 === 1 && 'bg-black/[0.15]'
                  )}
                >
                  <td className="px-5 py-4 sm:pl-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/[0.08] text-violet-200/95">
                        <Gift className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-brand-heading">{row.name}</p>
                        <p className="mt-0.5 text-xs text-brand-muted">Entry token · {row.entryToken}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="inline-flex items-center gap-1.5 text-sm text-brand-muted">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-brand-subtle" strokeWidth={2} aria-hidden />
                      {row.date}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="tabular-nums text-brand-heading">{row.entries.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="font-medium text-brand-accent">{row.prize}</span>
                  </td>
                  <td className="px-5 py-4 text-right sm:pr-6">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled
                        className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-brand-muted opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-brand-muted opacity-50"
                      >
                        Export
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
