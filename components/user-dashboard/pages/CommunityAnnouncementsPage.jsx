'use client';

import { useEffect, useState } from 'react';
import { Megaphone, CalendarClock, Bell, AlertTriangle } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useAuth } from '@/components/auth-context';

function priorityBadgeClass(priority) {
  if (priority === 'critical') return 'border-rose-500/35 bg-rose-500/[0.14] text-rose-200';
  if (priority === 'high') return 'border-amber-500/35 bg-amber-500/[0.14] text-amber-200';
  return 'border-emerald-500/35 bg-emerald-500/[0.12] text-emerald-200';
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
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Community
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Announcements
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Platform updates, drawings news, maintenance alerts, and policy notices relevant to your account.
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            Audience · {user?.isVip ? 'VIP' : 'Member'}
          </p>
        </div>
      </header>

      {loading ? (
        <Panel title="Latest updates" subtitle="Loading announcements...">
          <div className="space-y-3 animate-pulse">
            <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
            <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
            <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
          </div>
        </Panel>
      ) : error ? (
        <Panel title="Latest updates" subtitle="Unable to fetch updates">
          <p className="text-sm text-rose-300">{error}</p>
        </Panel>
      ) : (
        <Panel title="Latest updates" >
          {rows.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4 text-sm text-brand-muted">
              No active announcements right now.
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/[0.3] to-[#07080c] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/40 text-brand-accent">
                        <Megaphone className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-brand-heading">{row.title || 'Announcement'}</h3>
                        <p className="mt-1 text-sm text-brand-muted">{row.summary || '—'}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-md border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] ${priorityBadgeClass(row.priority)}`}
                    >
                      {row.priority || 'normal'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 rounded-xl border border-white/[0.08] bg-black/20 p-3 text-xs text-brand-muted sm:grid-cols-2">
                    <p className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-brand-subtle" strokeWidth={2} aria-hidden />
                      Start: <span className="text-brand-heading">{row.startsAt ? new Date(row.startsAt).toLocaleString() : '—'}</span>
                    </p>
                    <p>
                      End: <span className="text-brand-heading">{row.endsAt ? new Date(row.endsAt).toLocaleString() : 'Not set'}</span>
                    </p>
                    <p>Type: <span className="text-brand-heading">{row.type === 'drawing_launch' ? "Drawing Launch" : row.type  || 'general'}</span></p>
                    <p>Audience: <span className="text-brand-heading">{row.audience || 'all_users'}</span></p>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 p-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-subtle">Details</p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-muted whitespace-pre-wrap">{row.details || '—'}</p>
                  </div>

                  {/* <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-brand-subtle">
                      <Bell className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Channels:
                    </span>
                    {row.channels?.dashboardBanner ? (
                      <span className="rounded-md border border-white/[0.12] bg-black/30 px-2 py-0.5 text-brand-heading">Dashboard</span>
                    ) : null}
                    {row.channels?.inAppNotice ? (
                      <span className="rounded-md border border-white/[0.12] bg-black/30 px-2 py-0.5 text-brand-heading">In-app</span>
                    ) : null}
                    {row.channels?.emailNotice ? (
                      <span className="rounded-md border border-white/[0.12] bg-black/30 px-2 py-0.5 text-brand-heading">Email</span>
                    ) : null}
                  </div> */}

                  {row.cta?.label && row.cta?.url ? (
                    <div className="mt-3 rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/20 p-3 text-xs text-brand-muted">
                      CTA: <span className="font-semibold text-brand-heading">{row.cta.label}</span> ({row.cta.url})
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Panel>
      )}

    </>
  );
}
