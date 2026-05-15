'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Megaphone, Tag, Users } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useAuth } from '@/components/auth-context';

const TYPE_LABELS = {
  // drawing_launch: 'Drawing launch',
  // drawing_result: 'Drawing results',
  // maintenance: 'Maintenance',
  // wallet_token: 'Wallet & tokens',
  // membership: 'Membership',
  // security: 'Security',
  // policy: 'Policy',
  promotion: 'Campaigns / Events',
  // general: 'General',
};

const AUDIENCE_LABELS = {
  all_users: 'All users',
  vip_only: 'VIP users only',
  non_vip_only: 'Non-VIP users only',
};

function typeLabel(type) {
  return TYPE_LABELS[type] || TYPE_LABELS.general;
}

function audienceLabel(audience) {
  return AUDIENCE_LABELS[audience] || audience || 'All users';
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
              Official notices: title, type, audience, event date, and message — as published by admins.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/[0.1] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-accent-hover)]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent shadow-[0_0_8px_var(--brand-accent-glow)]" />
              {user?.isVip && user?.membershipEntitlements?.executive_events
                ? 'Executive events audience'
                : 'Member audience'}
            </span>
          </div>
        </div>
      </header>

      {loading ? (
        <Panel title="Latest updates" subtitle="Loading…">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-brand-border-muted bg-black/20 p-4"
              >
                <div className="h-4 w-1/3 rounded bg-white/[0.06]" />
                <div className="mt-3 h-3 w-full rounded bg-white/[0.04]" />
                <div className="mt-2 h-20 rounded-lg bg-white/[0.03]" />
              </div>
            ))}
          </div>
        </Panel>
      ) : error ? (
        <Panel title="Latest updates" subtitle="Unable to fetch">
          <p className="text-sm leading-relaxed text-rose-200/90">{error}</p>
        </Panel>
      ) : (
        <Panel
          title="Latest updates"
          // subtitle="Newest first. Title, type, audience, event date, and message."
        >
          {rows.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-brand-border-muted bg-black/20 px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-accent/25 bg-brand-accent/[0.08] text-brand-accent">
                <Megaphone className="h-6 w-6" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
                No announcements for your audience right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => {
                const when = row.startsAt
                  ? new Date(row.startsAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—';

                return (
                  <article
                    key={row.id}
                    className="min-w-0 overflow-hidden rounded-xl border border-brand-border-muted bg-black/20 p-4 sm:p-5"
                  >
                    <div className="flex min-w-0 flex-wrap items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-accent/30 bg-brand-accent/10 text-brand-accent">
                        <Megaphone className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold tracking-tight text-brand-heading sm:text-xl">
                          {row.title || 'Update'}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-muted">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5 shrink-0 text-brand-accent" aria-hidden />
                            <span className="text-brand-subtle">Type</span>{' '}
                            <span className="font-medium text-brand-heading">{typeLabel(row.type)}</span>
                          </span>
                          {/* <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 shrink-0 text-brand-accent" aria-hidden />
                            <span className="text-brand-subtle">Audience</span>{' '}
                            <span className="font-medium text-brand-heading">{audienceLabel(row.audience)}</span>
                          </span> */}
                        </div>
                        <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-xs text-brand-muted">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-brand-accent" aria-hidden />
                          <span className="text-brand-subtle">Event date</span>
                          <span className="font-medium text-brand-heading">{when}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-3 sm:px-4 sm:py-4">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-brand-subtle">
                        Message
                      </p>
                      <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">
                        {row.details || '—'}
                      </div>
                    </div>
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
