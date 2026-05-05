'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Users, Wallet, ShieldCheck, UserPlus, ArrowUpRight, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { hasAnyUsersModulePermission } from '@/lib/adminPermissions';
import { AdminStatsRowSkeleton, AdminChartsRowSkeleton } from '@/components/ui/content-skeletons';

const ACCENT = '#c9a227';
const ACCENT_FAINT = 'rgba(201, 162, 39, 0.12)';
const GRID = 'rgba(255,255,255,0.06)';
const AXIS = 'rgba(148, 163, 184, 0.45)';

function formatInt(n) {
  return typeof n === 'number' ? n.toLocaleString() : '—';
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="rounded-lg border border-brand-border-muted bg-[var(--brand-page)]/95 px-3 py-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)] backdrop-blur-sm">
      {label != null && label !== '' ? (
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-brand-subtle">{String(label)}</p>
      ) : null}
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-heading">{formatInt(Number(v))}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, href, trend }) {
  const inner = (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/[0.45] via-black/25 to-[#07080c] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_24px_48px_-28px_rgba(0,0,0,0.55)] transition-[transform,box-shadow,border-color] duration-300 hover:border-brand-accent/20 hover:shadow-[0_28px_56px_-32px_rgba(201,162,39,0.18)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_100%_0%,rgba(201,162,39,0.09),transparent_55%)] opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-black/50 text-brand-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
        </span>
        {trend != null && trend !== '' ? (
          <span
            className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums ${
              trend.startsWith('-')
                ? 'border-amber-500/25 bg-amber-500/[0.08] text-amber-100/90'
                : 'border-emerald-500/20 bg-emerald-500/[0.1] text-emerald-200/95'
            }`}
          >
            {trend}
          </span>
        ) : null}
      </div>
      <p className="relative mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-subtle">{label}</p>
      <p className="relative mt-1.5 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
        {value}
      </p>
      {hint ? <p className="relative mt-1.5 text-xs leading-snug text-brand-muted">{hint}</p> : null}
      {href ? (
        <div className="relative mt-4 flex items-center gap-1 text-xs font-medium text-brand-accent/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Open
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-page)]">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function SuperAdminOverviewPage() {
  const { token, ready, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not load overview.');
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError('Network error.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const stats = data?.stats;
  const daily = data?.dailySignups ?? [];
  const weekly = data?.weeklyTotals ?? [];

  const signupTrend =
    stats && typeof stats.newAccountsPrev7d === 'number'
      ? stats.newAccountsPrev7d === 0 && stats.newAccounts7d === 0
        ? null
        : stats.newAccountsPrev7d === 0 && stats.newAccounts7d > 0
          ? 'New'
          : stats.newAccountsPrev7d > 0
            ? `${stats.newAccounts7d >= stats.newAccountsPrev7d ? '+' : ''}${Math.round(
                ((stats.newAccounts7d - stats.newAccountsPrev7d) / stats.newAccountsPrev7d) * 100
              )}% vs prior 7d`
            : null
      : null;

  const isSuperAdmin = user?.role === 'superadmin';
  const usersHref =
    isSuperAdmin || hasAnyUsersModulePermission(user) ? '/dashboard/superadmin/users' : undefined;
  const walletsHref = isSuperAdmin ? '/dashboard/superadmin/wallets' : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Overview</h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-muted">
            {isSuperAdmin ? (
              <>
                Live counts from your database. Charts show registration cadence—useful for capacity and onboarding
                reviews.
              </>
            ) : (
              <>
                Same live registration metrics as the control center. Charts reflect all non–super-admin accounts;
                shortcuts below only link to sections your administrator enabled.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {usersHref ? (
            <Link
              href={usersHref}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-border-muted bg-black/30 px-4 py-2.5 text-sm font-medium text-brand-heading transition hover:border-brand-accent/25 hover:bg-[var(--brand-surface-hover)]"
            >
              Manage users
              <ArrowUpRight className="h-4 w-4 text-brand-accent" strokeWidth={2} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          <AdminStatsRowSkeleton cards={4} />
          <AdminChartsRowSkeleton />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
          {error}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total users"
              value={formatInt(stats?.totalUsers)}
              hint="All roles, including operators."
              href={usersHref}
            />
            <StatCard
              icon={Wallet}
              label="User wallets"
              value={formatInt(stats?.memberWallets)}
              hint="One custodial wallet per user account."
              href={walletsHref}
            />
            <StatCard
              icon={ShieldCheck}
              label="Verified accounts"
              value={formatInt(stats?.verifiedAccounts)}
              hint="Email-verified identities."
            />
            <StatCard
              icon={UserPlus}
              label="New (last 7 days)"
              value={formatInt(stats?.newAccounts7d)}
              hint="Registrations in the rolling week."
              trend={signupTrend}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-6">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_0%,rgba(201,162,39,0.06),transparent_60%)]"
                aria-hidden
              />
              <div className="relative mb-5 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-brand-heading">Daily registrations</h2>
                  <p className="mt-0.5 text-xs text-brand-muted">UTC · Last 7 days</p>
                </div>
              </div>
              <div className="relative h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="saAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: AXIS, fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: GRID }}
                    />
                    <YAxis
                      tick={{ fill: AXIS, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={36}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: ACCENT_FAINT, strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={ACCENT}
                      strokeWidth={2}
                      fill="url(#saAreaFill)"
                      dot={{ r: 3, fill: ACCENT, stroke: '#0a0a0c', strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-6">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(201,162,39,0.05),transparent_55%)]"
                aria-hidden
              />
              <div className="relative mb-5">
                <h2 className="text-sm font-semibold text-brand-heading">Weekly intake</h2>
                <p className="mt-0.5 text-xs text-brand-muted">Four rolling 7-day blocks</p>
              </div>
              <div className="relative h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: AXIS, fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: GRID }}
                      interval={0}
                      height={48}
                    />
                    <YAxis
                      tick={{ fill: AXIS, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={36}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: ACCENT_FAINT }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={ACCENT} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* <p className="text-center text-[0.65rem] font-medium uppercase tracking-[0.14em] text-brand-subtle/80">
            Live data · MongoDB
          </p> */}
        </>
      )}
    </div>
  );
}
