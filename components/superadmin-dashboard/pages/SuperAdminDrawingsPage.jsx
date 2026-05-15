'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Gift, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openDateInputPicker } from '@/lib/openDateInputPicker';
import { useAuth } from '@/components/auth-context';

const STATUS_OPTIONS = ['pending', 'active', 'completed'];
const REWARD_OPTIONS = ['physical', 'token', 'event_access', 'custom'];

const AUDIENCE_OPTIONS = [
  { value: 'all_users', label: 'All users' },
  { value: 'vip_only', label: 'VIP users only' },
  { value: 'non_vip_only', label: 'Non-VIP users only' },
];

function audienceLabel(value) {
  const opt = AUDIENCE_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : value || 'All users';
}

const initialFormState = {
  title: '',
  description: '',
  drawing_image_name: '',
  prize_title: '',
  prize_description: '',
  prize_image_name: '',
  reward_type: 'physical',
  reward_token_id: '',
  reward_token_amount: '0',
  entry_token_id: '',
  entry_cost: '',
  total_entries: '0',
  draw_date: '',
  audience: 'all_users',
};

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
    active: {
      label: 'Active',
      className: 'border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-100/95',
    },
    pending: {
      label: 'Pending',
      className: 'border-sky-500/30 bg-sky-500/[0.1] text-sky-100/90',
    },
    completed: {
      label: 'Completed',
      className: 'border-violet-400/30 bg-violet-400/[0.12] text-violet-100',
    },
  };
  const m = map[status] || map.pending;
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
  const { token, ready } = useAuth();
  const [rows, setRows] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDrawingId, setEditingDrawingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [tokenOptions, setTokenOptions] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [drawingImageFile, setDrawingImageFile] = useState(null);
  const [prizeImageFile, setPrizeImageFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const drawDateInputRef = useRef(null);

  const totalEntries = useMemo(
    () => rows.reduce((acc, drawing) => acc + Number(drawing.total_entries || 0), 0),
    [rows]
  );

  const onFormField = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nowInputMin = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const tzOffset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  }, []);

  const loadDrawings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setListError('');
    try {
      const res = await fetch('/api/superadmin/drawings', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setListError(json.error || 'Could not load drawings.');
        return;
      }
      setRows(Array.isArray(json.drawings) ? json.drawings : []);
    } catch {
      setListError('Network error while loading drawings.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadTokens = useCallback(async () => {
    setLoadingTokens(true);
    try {
      const res = await fetch('/api/superadmin/tokens', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      const raw = json?.data || [];
      const withoutUsd = Array.isArray(raw)
        ? raw.filter((t) => String(t?.slug || '').toLowerCase() !== 'usd')
        : [];
      setTokenOptions(withoutUsd);
    } catch {
      setTokenOptions([]);
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  const onPrizeImageSelect = (event) => {
    const file = event.target.files?.[0] || null;
    setPrizeImageFile(file);
    setFormData((prev) => ({
      ...prev,
      prize_image_name: file?.name || '',
    }));
  };

  const onDrawingImageSelect = (event) => {
    const file = event.target.files?.[0] || null;
    setDrawingImageFile(file);
    setFormData((prev) => ({
      ...prev,
      drawing_image_name: file?.name || '',
    }));
  };

  const closeModal = () => {
    setFormData(initialFormState);
    setDrawingImageFile(null);
    setPrizeImageFile(null);
    setFormError('');
    setShowCreateModal(false);
    setEditingDrawingId('');
  };

  const openCreateModal = () => {
    setEditingDrawingId('');
    setFormData(initialFormState);
    setDrawingImageFile(null);
    setPrizeImageFile(null);
    setFormError('');
    setShowCreateModal(true);
  };

  const openEditModal = (row) => {
    setEditingDrawingId(String(row.id || ''));
    setFormData({
      title: row.title || '',
      description: row.description || '',
      drawing_image_name: row.drawing_image ? String(row.drawing_image).split('/').pop() : '',
      prize_title: row.prize_title || '',
      prize_description: row.prize_description || '',
      prize_image_name: row.prize_image ? String(row.prize_image).split('/').pop() : '',
      reward_type: row.reward_type || 'physical',
      reward_token_id: row.reward_token_id || '',
      reward_token_amount: row.reward_token_amount || '0',
      entry_token_id: row.entry_token_id || '',
      entry_cost: row.entry_cost || '',
      total_entries: String(row.total_entries ?? 0),
      draw_date: row.draw_date ? String(row.draw_date).slice(0, 16) : '',
      audience: row.audience || 'all_users',
    });
    setDrawingImageFile(null);
    setPrizeImageFile(null);
    setFormError('');
    setShowCreateModal(true);
  };

  useEffect(() => {
    if (!ready || !token) return;
    void loadDrawings();
  }, [ready, token, loadDrawings]);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  const openDrawDatePicker = () => {
    openDateInputPicker(drawDateInputRef.current);
  };

  const onSubmitCreate = async (event) => {
    event.preventDefault();
    setFormError('');

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.prize_title.trim() ||
      !formData.prize_description.trim() ||
      !formData.entry_token_id ||
      !formData.entry_cost ||
      !formData.total_entries ||
      !formData.draw_date
    ) {
      setFormError('Please fill all required fields.');
      return;
    }
    if (!drawingImageFile && !formData.drawing_image_name) {
      setFormError('Drawing image is required.');
      return;
    }
    if (!prizeImageFile && !formData.prize_image_name) {
      setFormError('Prize image is required.');
      return;
    }
    if (formData.reward_type === 'token' && !formData.reward_token_id) {
      setFormError('Reward token is required when reward type is token.');
      return;
    }
    if (!String(formData.reward_token_amount || '').trim()) {
      setFormError('Reward amount is required.');
      return;
    }
    if (formData.draw_date && new Date(formData.draw_date).getTime() <= Date.now()) {
      setFormError('Draw date must be in the future.');
      return;
    }

    if (!token) {
      setFormError('Unauthorized. Please login again.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('description', formData.description.trim());
      payload.append('prize_title', formData.prize_title.trim());
      payload.append('prize_description', formData.prize_description.trim());
      payload.append('reward_type', formData.reward_type);
      payload.append('reward_token_id', formData.reward_token_id || '');
      payload.append('reward_token_amount', formData.reward_token_amount || '0');
      payload.append('entry_token_id', formData.entry_token_id);
      payload.append('entry_cost', formData.entry_cost);
      payload.append('total_entries', formData.total_entries || '0');
      payload.append('draw_date', formData.draw_date || '');
      payload.append('audience', formData.audience || 'all_users');
      if (drawingImageFile) {
        payload.append('drawing_image', drawingImageFile);
      }
      if (prizeImageFile) {
        payload.append('prize_image', prizeImageFile);
      }

      const isEdit = Boolean(editingDrawingId);
      const endpoint = isEdit ? `/api/superadmin/drawings/${encodeURIComponent(editingDrawingId)}` : '/api/superadmin/drawings';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setFormError(json.error || `Could not ${isEdit ? 'update' : 'create'} drawing.`);
        return;
      }
      closeModal();
      await loadDrawings();
    } catch {
      setFormError('Network error while creating drawing.');
    } finally {
      setIsSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!token || !deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/drawings/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setListError(json.error || 'Could not delete drawing.');
        return;
      }
      setDeleteTarget(null);
      await loadDrawings();
    } catch {
      setListError('Network error while deleting drawing.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Drawings</h1>
            <p className="mt-1 max-w-3xl text-sm text-brand-muted">
              Superadmin can create drawings from this page and view all created records in the table.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Create drawing
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip icon={Gift} label="Total drawings" value={String(rows.length)} hint="Current listing rows" />
        <StatChip
          icon={Calendar}
          label="Recipients (all pools)"
          value={totalEntries.toLocaleString()}
          hint="Aggregated from table data"
        />
        <StatChip icon={Gift} label="Reward types" value={String(REWARD_OPTIONS.length)} hint="physical / token / event / custom" />
        <StatChip icon={Gift} label="Statuses" value={String(STATUS_OPTIONS.length)} hint="pending / active / completed" />
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#07080c] p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-heading">{editingDrawingId ? 'Update' : 'Create'}</h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-white/[0.1] p-2 text-brand-subtle transition hover:text-brand-heading"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <form onSubmit={onSubmitCreate} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-1">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Title *</span>
                  <input required name="title" value={formData.title} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60" />
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Drawing image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onDrawingImageSelect}
                  required={!formData.drawing_image_name}
                  className="w-full cursor-pointer rounded-lg border border-white/[0.12] bg-[#0a0c12] px-3 py-2 text-sm text-brand-heading transition hover:border-brand-accent/45 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-white/[0.2] file:bg-[#374151] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-200"
                />
                {drawingImageFile ? <p className="text-xs text-brand-muted">Selected: {drawingImageFile.name}</p> : null}
                {!drawingImageFile && formData.drawing_image_name ? (
                  <p className="text-xs text-brand-muted">Current: {formData.drawing_image_name}</p>
                ) : null}
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Description</span>
                <textarea required name="description" rows={3} value={formData.description} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <p className="sm:col-span-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Prize fields
                </p>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Prize title *</span>
                  <input required name="prize_title" value={formData.prize_title} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Prize image</span>
                  {/* <div className="rounded-xl border border-white/[0.08] bg-black/30 p-2"> */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onPrizeImageSelect}
                      required={!formData.prize_image_name}
                      className="w-full cursor-pointer rounded-lg border border-white/[0.12] bg-[#0a0c12] px-3 py-2 text-sm text-brand-heading transition hover:border-brand-accent/45 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-white/[0.2] file:bg-[#374151] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-200"
                    />
                  {/* </div> */}
                  {prizeImageFile ? <p className="text-xs text-brand-muted">Selected: {prizeImageFile.name}</p> : null}
                  {!prizeImageFile && formData.prize_image_name ? (
                    <p className="text-xs text-brand-muted">Current: {formData.prize_image_name}</p>
                  ) : null}
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Prize description</span>
                <textarea required name="prize_description" rows={2} value={formData.prize_description} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <p className="sm:col-span-2 lg:col-span-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Reward fields
                </p>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Reward type</span>
                  <select required name="reward_type" value={formData.reward_type} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60">
                    {REWARD_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
                {formData.reward_type === 'token' ? (
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Reward token *</span>
                    <select required name="reward_token_id" value={formData.reward_token_id} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60">
                      <option value="">{loadingTokens ? 'Loading tokens...' : 'Select token'}</option>
                      {tokenOptions.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.symbol} - {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  null
                )}
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Reward amount</span>
                  <input required type="number" step="0.00000001" name="reward_token_amount" value={formData.reward_token_amount} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="sm:col-span-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Entry fields
                </p>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Entry token *</span>
                  <select required name="entry_token_id" value={formData.entry_token_id} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60">
                    <option value="">{loadingTokens ? 'Loading tokens...' : 'Select token'}</option>
                    {tokenOptions.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.symbol} - {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Entry cost *</span>
                  <input required type="number" step="0.00000001" name="entry_cost" value={formData.entry_cost} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Total recipients</span>
                  <input required type="number" min="0" name="total_entries" value={formData.total_entries} onChange={onFormField} className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60" />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Audience *</span>
                  <select
                    required
                    name="audience"
                    value={formData.audience}
                    onChange={onFormField}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-brand-muted">
                    Shown only to members who match this audience and have VIP drawings on their plan.
                  </p>
                </label>
                <label className="space-y-1.5 cursor-pointer" onClick={openDrawDatePicker}>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-subtle">Draw date</span>
                  <input required ref={drawDateInputRef} min={nowInputMin} type="datetime-local" name="draw_date" value={formData.draw_date} onChange={onFormField} onClick={openDrawDatePicker} onFocus={openDrawDatePicker} className="w-full cursor-pointer rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-brand-heading outline-none focus:border-brand-accent/60" />
                </label>
              </div>

              {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-brand-muted"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60">
                  {isSaving ? 'Saving...' : editingDrawingId ? 'Update drawing' : 'Save drawing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#07080c] p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-brand-heading">Delete drawing?</h3>
            <p className="mt-2 text-sm text-brand-muted">
              Are you sure you want to delete <span className="font-semibold text-brand-heading">{deleteTarget.title}</span>? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-brand-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirmDelete}
                className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Confirm delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="relative border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-subtle">Drawings list</h2>
              <p className="mt-1 text-xs text-brand-muted">All drawings created by superadmin are visible here.</p>
            </div>
            <span className="text-xs font-medium text-brand-subtle">Total rows: {rows.length}</span>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3 p-5 sm:p-6 animate-pulse">
              <div className="h-10 rounded-xl border border-white/[0.08] bg-black/[0.25]" />
              <div className="h-14 rounded-xl border border-white/[0.08] bg-black/[0.25]" />
              <div className="h-14 rounded-xl border border-white/[0.08] bg-black/[0.25]" />
              <div className="h-14 rounded-xl border border-white/[0.08] bg-black/[0.25]" />
            </div>
          ) : (
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-black/40">
                <th className="whitespace-nowrap px-5 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle sm:pl-6">
                  Title / slug
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Draw date
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Prize
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Audience
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Reward type
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Actions
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle sm:pr-6">
                  Total recipients
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || row.slug}
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
                        <p className="font-medium text-brand-heading">{row.title}</p>
                        <p className="mt-0.5 text-xs text-brand-muted">{row.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="inline-flex items-center gap-1.5 text-sm text-brand-muted">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-brand-subtle" strokeWidth={2} aria-hidden />
                      {row.draw_date ? new Date(row.draw_date).toLocaleString() : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="font-medium text-brand-accent">{row.prize_title || '—'}</span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="text-sm text-brand-muted">{audienceLabel(row.audience)}</span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="capitalize text-brand-muted">{row.reward_type === "event_access" ? "Event Access" : row.reward_type || '—'}</span>
                    <p className="mt-0.5 text-xs text-brand-subtle">Entry cost: {row.entry_cost || '—'}</p>
                  </td>
                  <td className="px-4 py-4 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(row)}
                        className="rounded-md border border-white/[0.1] px-2.5 py-1 text-xs font-semibold text-brand-subtle transition hover:border-brand-accent/40 hover:text-brand-heading"
                      >
                        Edit
                      </button>
                      <Link
                        href={`/dashboard/superadmin/drawings/${encodeURIComponent(row.slug)}`}
                        className="rounded-md border border-brand-accent/35 px-2.5 py-1 text-xs font-semibold text-brand-accent transition hover:bg-brand-accent/10"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: row.id, title: row.title })}
                        className="rounded-md border border-rose-500/35 px-2.5 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-brand-heading sm:pr-6">
                    {Number(row.total_entries || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
          {!isLoading && listError ? (
            <p className="px-5 py-4 text-sm text-rose-300 sm:px-6">{listError}</p>
          ) : null}
          {!isLoading && !listError && rows.length === 0 ? (
            <p className="px-5 py-4 text-sm text-brand-muted sm:px-6">No drawings found.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
