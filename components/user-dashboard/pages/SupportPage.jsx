'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Headphones,
  Loader2,
  MessageSquare,
  Send,
  ShieldAlert,
} from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import FeedbackMessage from '@/components/ui/FeedbackMessage';
import { useAuth } from '@/components/auth-context';
import { SUPPORT_STATUS_LABELS } from '@/lib/supportTickets';
import { cn } from '@/lib/utils';

function StatusPill({ status }) {
  const map = {
    pending: 'border-amber-500/35 bg-amber-500/10 text-amber-100',
    in_progress: 'border-sky-500/35 bg-sky-500/10 text-sky-100',
    resolved: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100',
    closed: 'border-white/15 bg-white/5 text-brand-muted',
  };
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
        map[status] || map.pending
      )}
    >
      {SUPPORT_STATUS_LABELS[status] || status}
    </span>
  );
}

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export default function SupportPage() {
  const { token, ready, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [prioritySupport, setPrioritySupport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const canSubmit =
    prioritySupport ||
    user?.membershipEntitlements?.priority_support === true;

  const load = useCallback(async () => {
    if (!ready || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/user/support-tickets', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || 'Could not load support tickets.');
        return;
      }
      const list = Array.isArray(json.tickets) ? json.tickets : [];
      setTickets(list);
      setPrioritySupport(Boolean(json.priority_support));
      setSelectedId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id || '';
      });
    } catch {
      setError('Network error while loading tickets.');
    } finally {
      setLoading(false);
    }
  }, [ready, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = tickets.find((t) => t.id === selectedId) || null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !token) return;
    setSubmitting(true);
    setError('');
    setSubmitSuccess('');
    try {
      const res = await fetch('/api/user/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject: subject.trim(), detail: detail.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || 'Could not submit ticket.');
        return;
      }
      setSubject('');
      setDetail('');
      setSubmitSuccess('Your ticket was submitted. Our team will respond here.');
      if (json.ticket?.id) setSelectedId(json.ticket.id);
      await load();
    } catch {
      setError('Network error while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">Help</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Support
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Submit a request with a subject and details. Track status and read replies from the platform team.
            </p>
          </div>
          {canSubmit ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/[0.1] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-accent-hover)]">
              <Headphones className="h-3.5 w-3.5" aria-hidden />
              Priority support active
            </span>
          ) : null}
        </div>
      </header>

      <FeedbackMessage tone="error" message={error} />
      {submitSuccess ? (
        <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
          {submitSuccess}
        </div>
      ) : null}

      {!canSubmit && !loading ? (
        <Panel title="Priority support required" subtitle="Upgrade your membership to open tickets">
          <div className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-black/20 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-300">
              <ShieldAlert className="h-7 w-7" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
              Your plan must include <span className="font-semibold text-brand-heading">Priority support</span> and
              VIP status before you can send tickets. View membership tiers to see what is included.
            </p>
            <Link
              href="/dashboard/user/membership"
              className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              View membership
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Panel>
      ) : null}

      {canSubmit ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Panel title="New ticket" subtitle="Subject and details are sent to the admin team">
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Subject *</span>
                <input
                  required
                  maxLength={200}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="auth-input w-full"
                  placeholder="Brief summary of your issue"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Details *</span>
                <textarea
                  required
                  rows={5}
                  maxLength={8000}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="auth-input w-full resize-y"
                  placeholder="Describe your question or issue in detail…"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-60 sm:w-auto sm:px-6"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
                {submitting ? 'Sending…' : 'Submit ticket'}
              </button>
            </form>
          </Panel>

          <div className="space-y-4">
            <Panel title="Your tickets" subtitle={loading ? 'Loading…' : `${tickets.length} total`}>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-accent" aria-hidden />
                </div>
              ) : tickets.length === 0 ? (
                <p className="py-8 text-center text-sm text-brand-muted">
                  No tickets yet. Submit your first request on the left.
                </p>
              ) : (
                <ul className="divide-y divide-white/[0.06]">
                  {tickets.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-1 py-3.5 text-left transition',
                          selectedId === t.id ? 'bg-brand-accent/[0.06]' : 'hover:bg-white/[0.03]'
                        )}
                      >
                        <MessageSquare
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0',
                            selectedId === t.id ? 'text-brand-accent' : 'text-brand-subtle'
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-brand-heading">{t.subject}</p>
                          <p className="mt-1 text-xs text-brand-muted">{formatWhen(t.createdAt)}</p>
                        </div>
                        <StatusPill status={t.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {selected ? (
              <Panel title="Ticket detail">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-brand-heading">{selected.subject}</h3>
                    <StatusPill status={selected.status} />
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                      Your message
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">
                      {selected.detail}
                    </p>
                    <p className="mt-3 text-xs text-brand-subtle">Submitted {formatWhen(selected.createdAt)}</p>
                  </div>
                  {selected.adminReply ? (
                    <div className="rounded-xl border border-brand-accent/25 bg-[var(--brand-accent-soft)]/10 p-4">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-accent">
                        Team response
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-heading">
                        {selected.adminReply}
                      </p>
                      {selected.repliedAt ? (
                        <p className="mt-3 text-xs text-brand-muted">Replied {formatWhen(selected.repliedAt)}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-muted">
                      Status is <span className="font-medium text-brand-heading">{SUPPORT_STATUS_LABELS[selected.status]}</span>.
                      {' '}You will see the admin reply here when available.
                    </p>
                  )}
                </div>
              </Panel>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
