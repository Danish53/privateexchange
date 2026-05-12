'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Crown,
  ExternalLink,
  FileText,
  Gift,
  Megaphone,
  Shield,
  Sparkles,
  Tag,
  Trophy,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useAuth } from '@/components/auth-context';

const TYPE_LABELS = {
  drawing_launch: 'Drawing launch',
  drawing_result: 'Drawing results',
  maintenance: 'Maintenance',
  wallet_token: 'Wallet & tokens',
  membership: 'Membership',
  security: 'Security',
  policy: 'Policy',
  promotion: 'Promotion',
  general: 'General',
};

const AUDIENCE_LABELS = {
  all_users: 'All members',
  vip_only: 'VIP members',
  non_vip_only: 'Standard members',
};

function typeLabel(type) {
  return TYPE_LABELS[type] || TYPE_LABELS.general;
}

function audienceLabel(audience) {
  return AUDIENCE_LABELS[audience] || audience || 'All members';
}

function priorityBadgeClass(priority) {
  if (priority === 'critical') return 'border-rose-500/40 bg-rose-500/[0.14] text-rose-100';
  if (priority === 'high') return 'border-amber-500/40 bg-amber-500/[0.14] text-amber-100';
  return 'border-brand-accent/35 bg-brand-accent/[0.12] text-[color:var(--brand-accent-hover)]';
}

function typeBadgeClass(type) {
  const t = String(type || 'general');
  if (t === 'security') return 'border-rose-400/25 bg-rose-500/[0.08] text-rose-100/90';
  if (t === 'maintenance') return 'border-sky-400/25 bg-sky-500/[0.1] text-sky-100/90';
  if (t === 'drawing_launch' || t === 'drawing_result' || t === 'promotion')
    return 'border-brand-accent/30 bg-brand-accent/[0.1] text-amber-100/95';
  return 'border-white/[0.12] bg-white/[0.06] text-brand-muted';
}

function AnnouncementTypeIcon({ type }) {
  const t = String(type || 'general');
  const cls = 'h-6 w-6';
  switch (t) {
    case 'drawing_launch':
      return <Gift className={cls} strokeWidth={1.75} aria-hidden />;
    case 'drawing_result':
      return <Trophy className={cls} strokeWidth={1.75} aria-hidden />;
    case 'maintenance':
      return <Wrench className={cls} strokeWidth={1.75} aria-hidden />;
    case 'wallet_token':
      return <Wallet className={cls} strokeWidth={1.75} aria-hidden />;
    case 'membership':
      return <Crown className={cls} strokeWidth={1.75} aria-hidden />;
    case 'security':
      return <Shield className={cls} strokeWidth={1.75} aria-hidden />;
    case 'policy':
      return <FileText className={cls} strokeWidth={1.75} aria-hidden />;
    case 'promotion':
      return <Sparkles className={cls} strokeWidth={1.75} aria-hidden />;
    default:
      return <Megaphone className={cls} strokeWidth={1.75} aria-hidden />;
  }
}

function ctaHref(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/')) return u;
  return `/${u}`;
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(href);
}

export default function CommunityAnnouncementsPage() {
  const { token, ready, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!ready || !token) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/user/community-announcements', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setError(json.error || 'Could not load announcements.');
          return;
        }
        setRows(Array.isArray(json.announcements) ? json.announcements : []);
      } catch {
        setError('Network error while loading announcements.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [ready, token]);

  useEffect(() => {
    const markAllAsRead = async () => {
      if (!ready || !token) return;
      try {
        await fetch('/api/user/community-announcements/read-all', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // No UI blocker for read tracking failures.
      }
    };
    void markAllAsRead();
  }, [ready, token]);

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">Community</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Announcements
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Official updates: drawings, maintenance, wallet and membership notices — matched to your account.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/[0.1] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-accent-hover)]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent shadow-[0_0_8px_var(--brand-accent-glow)]" />
              {user?.isVip ? 'VIP audience' : 'Member audience'}
            </span>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-brand-subtle">
              Showing what applies to you
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <Panel title="Latest updates" subtitle="Loading announcements…">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0d0f14] to-[#060709] p-5"
              >
                <div className="flex gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-24 rounded bg-white/[0.06]" />
                    <div className="h-5 w-4/5 max-w-md rounded bg-white/[0.08]" />
                    <div className="h-4 w-full rounded bg-white/[0.04]" />
                  </div>
                </div>
                <div className="mt-4 h-20 rounded-xl bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </Panel>
      ) : error ? (
        <Panel title="Latest updates" subtitle="Unable to fetch updates">
          <p className="text-sm leading-relaxed text-rose-200/90">{error}</p>
        </Panel>
      ) : (
        <Panel
          title="Latest updates"
          subtitle="Newest first. Dates show when the notice is visible on the platform."
        >
          {rows.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-black/20 px-6 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-accent/25 bg-brand-accent/[0.08] text-brand-accent">
                <Megaphone className="h-7 w-7" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
                There are no active announcements for your audience right now. When something important is published,
                it will appear here with full detail and any action link.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {rows.map((row) => {
                const href = ctaHref(row.cta?.url);
                const external = href ? isExternalHref(href) : false;
                const posted = row.createdAt
                  ? new Date(row.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : null;

                return (
                  <article
                    key={row.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-[#0d0f14] via-[#0a0b10] to-[#060709] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-brand-accent/25 sm:p-6"
                  >
                    <div
                      className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-[color:var(--brand-accent)]/[0.06] blur-3xl transition group-hover:bg-[color:var(--brand-accent)]/[0.1]"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/35 to-transparent"
                      aria-hidden
                    />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-accent/35 bg-brand-accent/[0.1] text-brand-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                          <AnnouncementTypeIcon type={row.type} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-accent/90">
                            Announcement
                          </p>
                          <h2 className="mt-1 text-lg font-semibold tracking-tight text-brand-heading sm:text-xl">
                            {row.title || 'Update'}
                          </h2>
                          {posted ? (
                            <p className="mt-1 text-xs text-brand-subtle">Posted {posted}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${typeBadgeClass(row.type)}`}
                        >
                          <Tag className="h-3 w-3 opacity-80" aria-hidden />
                          {typeLabel(row.type)}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${priorityBadgeClass(row.priority)}`}
                        >
                          {row.priority === 'critical'
                            ? 'Critical'
                            : row.priority === 'high'
                              ? 'High priority'
                              : 'Standard'}
                        </span>
                      </div>
                    </div>

                    {row.summary ? (
                      <p className="relative mt-4 border-l-2 border-brand-accent/45 pl-4 text-sm font-medium leading-relaxed text-brand-heading/95">
                        {row.summary}
                      </p>
                    ) : null}

                    <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 p-3">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
                        <div className="min-w-0 text-xs">
                          <p className="font-semibold uppercase tracking-[0.12em] text-brand-subtle">Visible from</p>
                          <p className="mt-1 text-sm font-medium text-brand-heading">
                            {row.startsAt ? new Date(row.startsAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }) : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 p-3">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-subtle" aria-hidden />
                        <div className="min-w-0 text-xs">
                          <p className="font-semibold uppercase tracking-[0.12em] text-brand-subtle">Visible until</p>
                          <p className="mt-1 text-sm font-medium text-brand-heading">
                            {row.endsAt
                              ? new Date(row.endsAt).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : 'No end date'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 p-3 sm:col-span-2">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" aria-hidden />
                        <div className="min-w-0 text-xs">
                          <p className="font-semibold uppercase tracking-[0.12em] text-brand-subtle">Audience</p>
                          <p className="mt-1 text-sm font-medium text-brand-heading">{audienceLabel(row.audience)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-4 rounded-xl border border-white/[0.08] bg-black/25 p-4">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                        Full message
                      </p>
                      <div className="mt-2 max-w-none text-sm leading-relaxed text-brand-muted whitespace-pre-wrap">
                        {row.details || '—'}
                      </div>
                    </div>

                    {row.channels?.dashboardBanner || row.channels?.inAppNotice || row.channels?.emailNotice ? (
                      <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.1em] text-brand-subtle">
                          <Bell className="h-3.5 w-3.5 text-brand-accent/80" strokeWidth={2} aria-hidden />
                          Also on
                        </span>
                        {row.channels?.dashboardBanner ? (
                          <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-medium text-brand-heading">
                            Dashboard
                          </span>
                        ) : null}
                        {row.channels?.inAppNotice ? (
                          <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-medium text-brand-heading">
                            In-app
                          </span>
                        ) : null}
                        {row.channels?.emailNotice ? (
                          <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-medium text-brand-heading">
                            Email
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {row.cta?.label && href ? (
                      <div className="relative mt-4 flex flex-wrap items-center gap-3">
                        {external ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                          >
                            {row.cta.label}
                            <ExternalLink className="h-4 w-4 opacity-90" aria-hidden />
                          </a>
                        ) : (
                          <Link
                            href={href}
                            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                          >
                            {row.cta.label}
                            <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
                          </Link>
                        )}
                        <span className="max-w-full truncate text-xs text-brand-subtle" title={href}>
                          {href}
                        </span>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      )}
    </>
  );
}
