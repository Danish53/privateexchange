'use client';

import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Send, CalendarClock, Users, AlertTriangle } from 'lucide-react';
import FeedbackMessage from '@/components/ui/FeedbackMessage';
import { useAuth } from '@/components/auth-context';

const ANNOUNCEMENT_TYPES = [
  { value: 'drawing_launch', label: 'Drawing launch' },
  { value: 'drawing_result', label: 'Drawing result / winner' },
  { value: 'maintenance', label: 'Maintenance / downtime' },
  { value: 'wallet_token', label: 'Wallet / token update' },
  { value: 'membership', label: 'Membership / VIP update' },
  { value: 'security', label: 'Security notice' },
  { value: 'policy', label: 'Policy / terms update' },
  { value: 'promotion', label: 'Campaign / promotion' },
  { value: 'general', label: 'General platform notice' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all_users', label: 'All users' },
  { value: 'vip_only', label: 'VIP users only' },
  { value: 'non_vip_only', label: 'Non-VIP users only' },
];

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const CHANNEL_OPTIONS = [
  { key: 'dashboardBanner', label: 'Dashboard banner' },
  { key: 'inAppNotice', label: 'In-app notice' },
  { key: 'emailNotice', label: 'Email notice' },
];

const INITIAL_FORM = {
  title: '',
  type: 'general',
  audience: 'all_users',
  priority: 'normal',
  summary: '',
  details: '',
  startsAt: '',
  endsAt: '',
  actionLabel: '',
  actionUrl: '',
  dashboardBanner: true,
  inAppNotice: true,
  emailNotice: false,
};

export default function SuperAdminCommunityAnnouncementsPage() {
  const { token, ready } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [rows, setRows] = useState([]);

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

  const minStartDateTime = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const tzOffset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  }, []);

  const onField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.summary.trim() || !form.details.trim() || !form.startsAt) {
      setError('Title, summary, details and publish start are required.');
      return;
    }
    if (form.endsAt && new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
      setError('End date/time must be after publish start.');
      return;
    }
    if (!form.dashboardBanner && !form.inAppNotice && !form.emailNotice) {
      setError('Select at least one delivery channel.');
      return;
    }
    if ((form.actionLabel && !form.actionUrl) || (!form.actionLabel && form.actionUrl)) {
      setError('Action label and action URL should be filled together.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      audience: form.audience,
      priority: form.priority,
      summary: form.summary.trim(),
      details: form.details.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      cta:
        form.actionLabel && form.actionUrl
          ? { label: form.actionLabel.trim(), url: form.actionUrl.trim() }
          : null,
      channels: CHANNEL_OPTIONS.filter((c) => form[c.key]).map((c) => c.label),
    };

    if (!token) {
      setError('Unauthorized. Please login again.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/superadmin/community-announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          channels: {
            dashboardBanner: form.dashboardBanner,
            inAppNotice: form.inAppNotice,
            emailNotice: form.emailNotice,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || 'Could not create announcement.');
        return;
      }
      const created = json.announcement || null;
      if (created) {
        setRows((prev) => [created, ...prev]);
      }
      setPreview(payload);
      setSuccess(json.message || 'Announcement created successfully.');
      setForm(INITIAL_FORM);
    } catch {
      setError('Network error while creating announcement.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">
          Community Announcements
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-brand-muted">
          Create platform announcements for drawings, maintenance, token updates, membership notices, and user-wide
          alerts.
        </p>
      </div>

      {error ? <FeedbackMessage tone="error" title="Validation error" message={error} /> : null}
      {success ? <FeedbackMessage tone="success" title="Ready to publish" message={success} /> : null}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-accent/25 bg-[var(--brand-accent-soft)]/40 text-brand-accent">
              <Megaphone className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-brand-heading">Announcement composer</h2>
              <p className="mt-0.5 text-xs text-brand-muted">Fill details and publish to database.</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
            {isSaving ? 'Publishing...' : 'Publish announcement'}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Title *</span>
            <input
              name="title"
              value={form.title}
              onChange={onField}
              placeholder="Example: Drawing #42 joins now open"
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Type</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Audience</span>
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

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Priority</span>
            <select
              name="priority"
              value={form.priority}
              onChange={onField}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Summary *</span>
            <input
              name="summary"
              value={form.summary}
              onChange={onField}
              placeholder="One-line summary users will read first."
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Details *</span>
            <textarea
              rows={5}
              name="details"
              value={form.details}
              onChange={onField}
              placeholder="Full details of the announcement..."
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-white/[0.08] bg-black/20 p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
            Schedule
          </p>

          <label className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">
              <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Publish start *
            </span>
            <input
              type="datetime-local"
              min={minStartDateTime}
              name="startsAt"
              value={form.startsAt}
              onChange={onField}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Publish end</span>
            <input
              type="datetime-local"
              name="endsAt"
              value={form.endsAt}
              onChange={onField}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-white/[0.08] bg-black/20 p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
            Call to action (optional)
          </p>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Action label</span>
            <input
              name="actionLabel"
              value={form.actionLabel}
              onChange={onField}
              placeholder="View drawing"
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Action URL</span>
            <input
              name="actionUrl"
              value={form.actionUrl}
              onChange={onField}
              placeholder="/dashboard/user/drawings"
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-white/[0.08] bg-black/20 p-4">
          <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
            <Users className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Delivery channels
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {CHANNEL_OPTIONS.map((channel) => (
              <label
                key={channel.key}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-sm text-brand-muted transition hover:border-white/[0.12]"
              >
                <input
                  type="checkbox"
                  name={channel.key}
                  checked={Boolean(form[channel.key])}
                  onChange={onField}
                  className="h-4 w-4 rounded border-white/[0.16] bg-black/40 text-brand-accent"
                />
                <span className="text-brand-heading">{channel.label}</span>
              </label>
            ))}
          </div>
        </div>
      </form>

      {/* <div className="rounded-2xl border border-white/[0.08] bg-black/[0.22] p-5 sm:p-6">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">
          <AlertTriangle className="h-4 w-4 text-amber-300" strokeWidth={2} aria-hidden />
          Suggested announcement use-cases
        </p>
        <div className="mt-3 grid gap-2 text-sm text-brand-muted sm:grid-cols-2">
          <p>- Drawing launch / joins open / winner declared</p>
          <p>- Scheduled maintenance / temporary downtime</p>
          <p>- Wallet credit delay or transfer issue notice</p>
          <p>- Token listing or token status change</p>
          <p>- Membership tier / VIP policy updates</p>
          <p>- Security warning (phishing / password reset advisory)</p>
        </div>
      </div> */}

      <div className="rounded-2xl border border-white/[0.08] bg-black/[0.22] p-5 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-brand-subtle">Recent announcements</h3>
        {isLoading ? (
          <div className="mt-3 space-y-2 animate-pulse">
            <div className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.03]" />
            <div className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.03]" />
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-brand-muted">No announcements created yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {rows.slice(0, 8).map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-white/[0.08] bg-black/35 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-heading">{row.title || '—'}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md border border-white/[0.12] bg-black/35 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-subtle">
                      {row.type || 'general'}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] ${
                        row.priority === 'critical'
                          ? 'border-rose-500/35 bg-rose-500/[0.14] text-rose-200'
                          : row.priority === 'high'
                            ? 'border-amber-500/35 bg-amber-500/[0.14] text-amber-200'
                            : 'border-emerald-500/35 bg-emerald-500/[0.12] text-emerald-200'
                      }`}
                    >
                      {row.priority || 'normal'}
                    </span>
                  </div>
                </div>

                <p className="mt-1 text-xs text-brand-muted">
                  Audience: <span className="text-brand-heading">{row.audience || 'all_users'}</span>
                </p>

                <div className="mt-2 grid gap-1 text-xs text-brand-muted sm:grid-cols-2">
                  <p>
                    Start: <span className="text-brand-heading">{row.startsAt ? new Date(row.startsAt).toLocaleString() : '—'}</span>
                  </p>
                  <p>
                    End: <span className="text-brand-heading">{row.endsAt ? new Date(row.endsAt).toLocaleString() : 'Not set'}</span>
                  </p>
                  <p className="sm:col-span-2">
                    Created: <span className="text-brand-heading">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</span>
                  </p>
                </div>

                <div className="mt-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-subtle">Summary</p>
                  <p className="mt-1 text-sm text-brand-muted">{row.summary || '—'}</p>
                </div>

                <div className="mt-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-subtle">Details</p>
                  <p className="mt-1 text-sm text-brand-muted whitespace-pre-wrap">{row.details || '—'}</p>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-brand-subtle">Channels:</span>
                  {row.channels?.dashboardBanner ? (
                    <span className="rounded-md border border-white/[0.12] bg-black/30 px-2 py-0.5 text-brand-heading">Dashboard</span>
                  ) : null}
                  {row.channels?.inAppNotice ? (
                    <span className="rounded-md border border-white/[0.12] bg-black/30 px-2 py-0.5 text-brand-heading">In-app</span>
                  ) : null}
                  {row.channels?.emailNotice ? (
                    <span className="rounded-md border border-white/[0.12] bg-black/30 px-2 py-0.5 text-brand-heading">Email</span>
                  ) : null}
                </div>

                {row.cta?.label || row.cta?.url ? (
                  <div className="mt-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-xs text-brand-muted">
                    CTA:{' '}
                    <span className="text-brand-heading">
                      {row.cta?.label || '—'} {row.cta?.url ? `(${row.cta.url})` : ''}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
