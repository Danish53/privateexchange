'use client';

import { useCallback, useEffect, useState } from 'react';
import { Headphones, Loader2, MessageSquare, X } from 'lucide-react';
import FeedbackMessage from '@/components/ui/FeedbackMessage';
import { useAuth } from '@/components/auth-context';
import { SUPPORT_STATUS_LABELS, SUPPORT_TICKET_STATUSES } from '@/lib/supportTickets';
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

export default function SuperAdminSupportTicketsPage() {
  const { token, ready } = useAuth();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('pending');
  const [adminReply, setAdminReply] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!ready || !token) return;
    setLoading(true);
    setError('');
    try {
      const qs = filter ? `?status=${encodeURIComponent(filter)}` : '';
      const res = await fetch(`/api/superadmin/support-tickets${qs}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || 'Could not load tickets.');
        return;
      }
      setRows(Array.isArray(json.tickets) ? json.tickets : []);
    } catch {
      setError('Network error while loading tickets.');
    } finally {
      setLoading(false);
    }
  }, [ready, token, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openTicket = (row) => {
    setSelected(row);
    setStatus(row.status || 'pending');
    setAdminReply(row.adminReply || '');
    setSuccess('');
    setError('');
  };

  const closePanel = () => {
    setSelected(null);
    setAdminReply('');
    setSuccess('');
  };

  const onSave = async () => {
    if (!selected?.id || !token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/superadmin/support-tickets/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminReply: adminReply.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || 'Could not update ticket.');
        return;
      }
      const saved = json.ticket;
      setRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      setSelected(saved);
      setSuccess('Ticket updated. The member will see your reply on their Support page.');
    } catch {
      setError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-8">
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Support tickets</h1>
            <p className="mt-1 max-w-2xl text-sm text-brand-muted">
              Member requests from the user dashboard. Update status and send a reply visible to the user.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm">
            <Headphones className="h-4 w-4 text-brand-accent" aria-hidden />
            <span className="text-brand-muted">
              Pending: <span className="font-semibold tabular-nums text-brand-heading">{pendingCount}</span>
            </span>
          </div>
        </div>
      </div>

      <FeedbackMessage tone="error" message={error} />
      {success ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('')}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
            !filter ? 'border-brand-accent/40 bg-brand-accent/15 text-brand-accent' : 'border-white/10 text-brand-muted hover:text-brand-heading'
          )}
        >
          All
        </button>
        {SUPPORT_TICKET_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
              filter === s
                ? 'border-brand-accent/40 bg-brand-accent/15 text-brand-accent'
                : 'border-white/10 text-brand-muted hover:text-brand-heading'
            )}
          >
            {SUPPORT_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-accent" aria-hidden />
            </div>
          ) : rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-brand-muted">No tickets in this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-black/40 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                    <th className="px-5 py-3">Member</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.03]',
                        selected?.id === row.id && 'bg-brand-accent/[0.06]'
                      )}
                      onClick={() => openTicket(row)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-brand-heading">{row.user?.name || '—'}</p>
                        <p className="text-xs text-brand-muted">{row.user?.email || ''}</p>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3.5 font-medium text-brand-heading">
                        {row.subject}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="px-5 py-3.5 text-brand-muted">{formatWhen(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected ? (
          <aside className="sticky top-4 h-fit rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c0d12] to-black/90 p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-2 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-accent" aria-hidden />
                <h2 className="text-sm font-semibold text-brand-heading">Respond</h2>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg border border-white/10 p-1.5 text-brand-muted hover:text-brand-heading"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-lg font-semibold text-brand-heading">{selected.subject}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {selected.user?.name} · {selected.user?.email}
            </p>

            <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/30 p-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">Member message</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">{selected.detail}</p>
              <p className="mt-2 text-xs text-brand-subtle">{formatWhen(selected.createdAt)}</p>
            </div>

            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-subtle">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading"
              >
                {SUPPORT_TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {SUPPORT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-subtle">Reply to member</span>
              <textarea
                rows={6}
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading"
                placeholder="Your answer will appear on the user's Support page…"
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="btn-primary mt-5 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save status & reply'}
            </button>
          </aside>
        ) : (
          <aside className="hidden rounded-2xl border border-dashed border-white/[0.1] bg-black/20 p-8 text-center text-sm text-brand-muted xl:block">
            Select a ticket from the table to update status and reply.
          </aside>
        )}
      </div>
    </div>
  );
}
