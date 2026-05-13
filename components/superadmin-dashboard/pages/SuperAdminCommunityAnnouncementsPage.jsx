'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Megaphone, Pencil, Send, Trash2 } from 'lucide-react';
import FeedbackMessage from '@/components/ui/FeedbackMessage';
import { useAuth } from '@/components/auth-context';
import { openDateInputPicker } from '@/lib/openDateInputPicker';

const TYPE_LABELS_ALL = {
  // drawing_launch: 'Drawing launch',
  // drawing_result: 'Drawing result / winner',
  // maintenance: 'Maintenance / downtime',
  // wallet_token: 'Wallet / token update',
  // membership: 'Membership / VIP update',
  // security: 'Security notice',
  // policy: 'Policy / terms update',
  promotion: 'Campaigns / Events',
  // general: 'General platform notice',
};

const ANNOUNCEMENT_TYPES = [
  // { value: 'drawing_launch', label: TYPE_LABELS_ALL.drawing_launch },
  // { value: 'drawing_result', label: TYPE_LABELS_ALL.drawing_result },
  // { value: 'maintenance', label: TYPE_LABELS_ALL.maintenance },
  // { value: 'wallet_token', label: TYPE_LABELS_ALL.wallet_token },
  // { value: 'membership', label: TYPE_LABELS_ALL.membership },
  // { value: 'security', label: TYPE_LABELS_ALL.security },
  // { value: 'policy', label: TYPE_LABELS_ALL.policy },
  { value: 'promotion', label: TYPE_LABELS_ALL.promotion },
  // { value: 'general', label: TYPE_LABELS_ALL.general },
];

const AUDIENCE_OPTIONS = [
  { value: 'all_users', label: 'All users' },
  { value: 'vip_only', label: 'VIP users only' },
  { value: 'non_vip_only', label: 'Non-VIP users only' },
];

const DEFAULT_CHANNELS = {
  dashboardBanner: true,
  inAppNotice: true,
  emailNotice: false,
};

const INITIAL_FORM = {
  title: '',
  type: 'promotion',
  audience: 'all_users',
  priority: 'normal',
  details: '',
  startsAt: '',
};

function audienceDisplay(value) {
  const opt = AUDIENCE_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : value || 'All users';
}

function typeDisplay(value) {
  return TYPE_LABELS_ALL[value] || value || '—';
}

function rowToForm(row) {
  const toLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };
  return {
    title: row.title || '',
    type: row.type || 'general',
    audience: row.audience || 'all_users',
    priority: row.priority || 'normal',
    details: row.details || '',
    startsAt: toLocal(row.startsAt),
  };
}

export default function SuperAdminCommunityAnnouncementsPage() {
  const { token, ready } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const eventDateInputRef = useRef(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!ready || !token) return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/superadmin/community-announcements', {
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
        setIsLoading(false);
      }
    };
    void loadAnnouncements();
  }, [ready, token]);

  const onField = (event) => {
    const { name, value } = event.target;
    setError('');
    setSuccess('');
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.details.trim() || !form.startsAt) {
      setError('Title, details, and event date are required.');
      return;
    }

    if (!token) {
      setError('Unauthorized. Please login again.');
      return;
    }

    const existing = editingId ? rows.find((r) => r.id === editingId) : null;
    const summary = form.details.trim().slice(0, 280) || form.title.trim().slice(0, 280);

    const payload = {
      title: form.title.trim(),
      type: form.type,
      audience: form.audience,
      priority: form.priority,
      summary,
      details: form.details.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: existing?.endsAt ? existing.endsAt : null,
      cta: { label: '', url: '' },
      channels: { ...DEFAULT_CHANNELS },
    };

    setIsSaving(true);
    try {
      const url = editingId
        ? `/api/superadmin/community-announcements/${encodeURIComponent(editingId)}`
        : '/api/superadmin/community-announcements';
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || (editingId ? 'Could not update announcement.' : 'Could not create announcement.'));
        return;
      }
      const saved = json.announcement || null;
      if (saved) {
        if (editingId) {
          setRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        } else {
          setRows((prev) => [saved, ...prev]);
        }
      }
      setSuccess(json.message || (editingId ? 'Announcement updated successfully.' : 'Announcement created successfully.'));
      setForm(INITIAL_FORM);
      setEditingId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError(editingId ? 'Network error while updating announcement.' : 'Network error while creating announcement.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (row) => {
    setError('');
    setSuccess('');
    setForm(rowToForm(row));
    setEditingId(row.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError('');
    setSuccess('');
  };

  const onDelete = async (row) => {
    if (!token) {
      setError('Unauthorized. Please login again.');
      return;
    }
    const title = String(row.title || 'Untitled').trim();
    if (!window.confirm(`Delete announcement "${title}"? This cannot be undone.`)) return;
    setError('');
    setSuccess('');
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/superadmin/community-announcements/${encodeURIComponent(row.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || 'Could not delete announcement.');
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (editingId === row.id) {
        cancelEdit();
      }
      setSuccess(json.message || 'Announcement deleted successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Network error while deleting announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">
          Community announcements
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-brand-muted">
          Create and manage notices: title, type, audience, message, and event date (when the campaign or event is).
        </p>
      </div>

      <div className="space-y-3" aria-live="polite" aria-relevant="additions text">
        {error ? (
          <FeedbackMessage
            tone="error"
            title="Error"
            message={error}
            className="border-2 border-rose-400/40 shadow-lg shadow-black/20"
          />
        ) : null}
        {success ? (
          <FeedbackMessage
            tone="success"
            title="Success"
            message={success}
            className="border-2 border-emerald-400/40 shadow-lg shadow-black/20"
          />
        ) : null}
        {error || success ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {error ? (
              <button
                type="button"
                onClick={() => setError('')}
                className="rounded-lg border border-white/15 px-2 py-1 font-semibold text-brand-muted hover:text-brand-heading"
              >
                Dismiss error
              </button>
            ) : null}
            {success ? (
              <button
                type="button"
                onClick={() => setSuccess('')}
                className="rounded-lg border border-white/15 px-2 py-1 font-semibold text-brand-muted hover:text-brand-heading"
              >
                Dismiss message
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-6"
      >
        <div className="mb-4 flex flex-col gap-4 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-[var(--brand-accent-soft)]/40 text-brand-accent">
              <Megaphone className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-brand-heading">
                {editingId ? 'Edit announcement' : 'New announcement'}
              </h2>
              <p className="mt-0.5 text-xs text-brand-muted">
                {editingId ? 'Update the fields below, then save.' : 'Fill every field, then publish.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSaving}
                className="rounded-xl border border-white/[0.12] bg-black/30 px-4 py-2 text-sm font-semibold text-brand-muted transition hover:border-white/[0.18] hover:text-brand-heading disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
              {isSaving ? (editingId ? 'Saving…' : 'Publishing…') : editingId ? 'Save changes' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Title *</span>
            <input
              name="title"
              value={form.title}
              onChange={onField}
              placeholder="Announcement title"
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Type *</span>
            <select
              name="type"
              value={form.type}
              onChange={onField}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            >
              {ANNOUNCEMENT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Audience *</span>
            <select
              name="audience"
              value={form.audience}
              onChange={onField}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Details *</span>
            <textarea
              rows={6}
              name="details"
              value={form.details}
              onChange={onField}
              placeholder="Full message members will read…"
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>

          <label
            className="block cursor-pointer space-y-1.5 sm:col-span-2"
            onClick={() => openDateInputPicker(eventDateInputRef.current)}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">
              <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Event date *
            </span>
            <input
              ref={eventDateInputRef}
              type="datetime-local"
              name="startsAt"
              value={form.startsAt}
              onChange={onField}
              onClick={() => openDateInputPicker(eventDateInputRef.current)}
              onFocus={() => openDateInputPicker(eventDateInputRef.current)}
              className="w-full cursor-pointer rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>
        </div>
      </form>

      <div className="rounded-2xl border border-white/[0.08] bg-black/[0.22] p-5 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-brand-subtle">All announcements</h3>
        {isLoading ? (
          <div className="mt-3 space-y-2 animate-pulse">
            <div className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.03]" />
            <div className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.03]" />
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-brand-muted">No announcements yet.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-brand-border-muted bg-black/35 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-brand-heading">{row.title || '—'}</p>
                    <p className="mt-2 text-xs text-brand-muted">
                      <span className="text-brand-subtle">Type</span>{' '}
                      <span className="text-brand-heading">{typeDisplay(row.type)}</span>
                      <span className="mx-2 text-brand-border-muted">·</span>
                      <span className="text-brand-subtle">Audience</span>{' '}
                      <span className="text-brand-heading">{audienceDisplay(row.audience)}</span>
                    </p>
                    <p className="mt-2 text-xs text-brand-muted">
                      <span className="text-brand-subtle">Event date</span>{' '}
                      <span className="font-medium text-brand-heading">
                        {row.startsAt ? new Date(row.startsAt).toLocaleString() : '—'}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      disabled={Boolean(deletingId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-black/40 px-3 py-1.5 text-xs font-semibold text-brand-heading transition hover:border-brand-accent/40 hover:text-brand-accent disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(row)}
                      disabled={deletingId === row.id || Boolean(deletingId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/[0.1] px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/[0.18] disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {deletingId === row.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-brand-subtle">Message</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">{row.details || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
