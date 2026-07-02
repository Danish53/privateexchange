'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Megaphone, Pencil, Send, Trash2 } from 'lucide-react';
import FeedbackMessage from '@/components/ui/FeedbackMessage';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { openDateInputPicker } from '@/lib/openDateInputPicker';

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

function getAnnouncementTypes(t) {
  return [{ value: 'promotion', label: t('superadmin.announcements.types.promotion') }];
}

function getAudienceOptions(t) {
  return [
    { value: 'all_users', label: t('superadmin.announcements.audiences.all_users') },
    { value: 'vip_only', label: t('superadmin.announcements.audiences.vip_only') },
    { value: 'non_vip_only', label: t('superadmin.announcements.audiences.non_vip_only') },
  ];
}

function audienceDisplay(value, t, audienceOptions) {
  const opt = audienceOptions.find((o) => o.value === value);
  return opt ? opt.label : value || t('superadmin.announcements.audiences.all_users');
}

function typeDisplay(value, t) {
  const key = `superadmin.announcements.types.${value}`;
  const label = t(key);
  return label !== key ? label : value || '—';
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
  const { t, locale } = useWebsiteT();
  const { token, ready } = useAuth();
  const announcementTypes = useMemo(() => getAnnouncementTypes(t), [t]);
  const audienceOptions = useMemo(() => getAudienceOptions(t), [t]);
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
          setError(json.error || t('superadmin.announcements.errors.couldNotLoad'));
          return;
        }
        setRows(Array.isArray(json.announcements) ? json.announcements : []);
      } catch {
        setError(t('superadmin.announcements.errors.networkLoad'));
      } finally {
        setIsLoading(false);
      }
    };
    void loadAnnouncements();
  }, [ready, token, t]);

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
      setError(t('superadmin.announcements.errors.requiredFields'));
      return;
    }

    if (!token) {
      setError(t('superadmin.announcements.errors.unauthorized'));
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
        setError(
          json.error ||
            (editingId
              ? t('superadmin.announcements.errors.couldNotUpdate')
              : t('superadmin.announcements.errors.couldNotCreate'))
        );
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
      setSuccess(
        json.message ||
          (editingId
            ? t('superadmin.announcements.successMessages.updated')
            : t('superadmin.announcements.successMessages.created'))
      );
      setForm(INITIAL_FORM);
      setEditingId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError(
        editingId
          ? t('superadmin.announcements.errors.networkUpdate')
          : t('superadmin.announcements.errors.networkCreate')
      );
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
      setError(t('superadmin.announcements.errors.unauthorized'));
      return;
    }
    const title = String(row.title || t('superadmin.announcements.untitled')).trim();
    if (!window.confirm(t('superadmin.announcements.deleteConfirm', { title }))) return;
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
        setError(json.error || t('superadmin.announcements.errors.couldNotDelete'));
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (editingId === row.id) {
        cancelEdit();
      }
      setSuccess(json.message || t('superadmin.announcements.successMessages.deleted'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError(t('superadmin.announcements.errors.networkDelete'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">
          {t('superadmin.announcements.title')}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-brand-muted">{t('superadmin.announcements.subtitle')}</p>
      </div>

      <div className="space-y-3" aria-live="polite" aria-relevant="additions text">
        {error ? (
          <FeedbackMessage
            tone="error"
            title={t('superadmin.announcements.errorTitle')}
            message={error}
            className="border-2 border-rose-400/40 shadow-lg shadow-black/20"
          />
        ) : null}
        {success ? (
          <FeedbackMessage
            tone="success"
            title={t('superadmin.announcements.successTitle')}
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
                {t('superadmin.announcements.dismissError')}
              </button>
            ) : null}
            {success ? (
              <button
                type="button"
                onClick={() => setSuccess('')}
                className="rounded-lg border border-white/15 px-2 py-1 font-semibold text-brand-muted hover:text-brand-heading"
              >
                {t('superadmin.announcements.dismissMessage')}
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
                {editingId ? t('superadmin.announcements.editTitle') : t('superadmin.announcements.newTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-brand-muted">
                {editingId ? t('superadmin.announcements.editHint') : t('superadmin.announcements.newHint')}
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
                {t('superadmin.common.cancel')}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
              {isSaving
                ? editingId
                  ? t('superadmin.common.saving')
                  : t('superadmin.announcements.publishing')
                : editingId
                  ? t('superadmin.announcements.saveChanges')
                  : t('superadmin.announcements.publish')}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">
              {t('superadmin.announcements.titleLabel')}
            </span>
            <input
              name="title"
              value={form.title}
              onChange={onField}
              placeholder={t('superadmin.announcements.titlePlaceholder')}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">
              {t('superadmin.announcements.typeLabel')}
            </span>
            <select
              name="type"
              value={form.type}
              onChange={onField}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            >
              {announcementTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">
              {t('superadmin.announcements.audienceLabel')}
            </span>
            <select
              name="audience"
              value={form.audience}
              onChange={onField}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            >
              {audienceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">
              {t('superadmin.announcements.detailsLabel')}
            </span>
            <textarea
              rows={6}
              name="details"
              value={form.details}
              onChange={onField}
              placeholder={t('superadmin.announcements.detailsPlaceholder')}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>

          <label
            className="block cursor-pointer space-y-1.5 sm:col-span-2"
            onClick={() => openDateInputPicker(eventDateInputRef.current)}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">
              <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {t('superadmin.announcements.eventDateLabel')}
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
        <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-brand-subtle">
          {t('superadmin.announcements.allAnnouncements')}
        </h3>
        {isLoading ? (
          <div className="mt-3 space-y-2 animate-pulse">
            <div className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.03]" />
            <div className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.03]" />
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-brand-muted">{t('superadmin.announcements.noAnnouncements')}</p>
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
                      <span className="text-brand-subtle">{t('superadmin.announcements.type')}</span>{' '}
                      <span className="text-brand-heading">{typeDisplay(row.type, t)}</span>
                      <span className="mx-2 text-brand-border-muted">·</span>
                      <span className="text-brand-subtle">{t('superadmin.announcements.audience')}</span>{' '}
                      <span className="text-brand-heading">{audienceDisplay(row.audience, t, audienceOptions)}</span>
                    </p>
                    <p className="mt-2 text-xs text-brand-muted">
                      <span className="text-brand-subtle">{t('superadmin.announcements.eventDate')}</span>{' '}
                      <span className="font-medium text-brand-heading">
                        {row.startsAt ? new Date(row.startsAt).toLocaleString(locale === 'es' ? 'es' : 'en') : '—'}
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
                      {t('superadmin.common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(row)}
                      disabled={deletingId === row.id || Boolean(deletingId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/[0.1] px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/[0.18] disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {deletingId === row.id ? '…' : t('superadmin.common.delete')}
                    </button>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-brand-subtle">
                    {t('superadmin.announcements.message')}
                  </p>
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
