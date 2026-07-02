'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Gift, ArrowLeft, Wallet } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { getDrawingPrizeLine } from '@/lib/i18n/dashboard-helpers';

function getDrawingStatusLabel(status, t) {
  const map = {
    active: t('dashboard.drawings.statusActive'),
    pending: t('dashboard.drawings.statusPending'),
    completed: t('dashboard.drawings.statusCompleted'),
  };
  return map[status] || status || t('dashboard.drawings.statusActive');
}

function imageSrc(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw;
  return `/${raw.replace(/\\/g, '/')}`;
}

export default function DrawingDetailPage() {
  const { t, locale, translateRowFields } = useWebsiteT();
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : params?.slug?.[0] || '';
  const { token, ready } = useAuth();

  const [drawing, setDrawing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinPreview, setJoinPreview] = useState(null);
  const [joinPreviewLoading, setJoinPreviewLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const loadDetail = async () => {
    if (!ready || !token || !slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/user/drawings/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || t('dashboard.drawings.errors.couldNotLoad'));
        return;
      }
      const draw = json.drawing || null;
      if (draw) {
        const [translated] = await translateRowFields([draw], ['title', 'prize_title', 'description', 'prize_description']);
        setDrawing(translated || draw);
      } else {
        setDrawing(null);
      }
    } catch {
      setError(t('dashboard.drawings.errors.networkLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [ready, token, slug]);

  const loadJoinPreview = async () => {
    if (!token) return;
    setShowJoinModal(true);
    setJoinPreview(null);
    setJoinPreviewLoading(true);
    setJoinError('');
    setJoinSuccess('');
    try {
      const res = await fetch(`/api/user/drawings/${encodeURIComponent(slug)}/join-preview`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setJoinError(json.error || t('dashboard.drawings.errors.couldNotLoadJoinInfo'));
        return;
      }
      setJoinPreview(json.preview || null);
    } catch {
      setJoinError(t('dashboard.drawings.errors.networkJoinInfo'));
    } finally {
      setJoinPreviewLoading(false);
    }
  };

  const onConfirmJoin = async () => {
    if (!token) return;
    setIsJoining(true);
    setJoinError('');
    try {
      const res = await fetch(`/api/user/drawings/${encodeURIComponent(slug)}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setJoinError(json.error || t('dashboard.drawings.errors.joinFailed'));
        return;
      }
      setShowJoinModal(false);
      setJoinSuccess(json.message || t('dashboard.drawings.joinSuccess'));
      await loadDetail();
    } catch {
      setJoinError(t('dashboard.drawings.errors.networkJoin'));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/user/drawings"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        {t('dashboard.drawings.viewDrawing')}
      </Link>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
            <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
            <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
            <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.08] p-6 text-sm text-red-200/95">
          {error}
        </div>
      ) : drawing ? (
        <article className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/[0.35] to-[#07080c] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/45 text-brand-accent">
                <Gift className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-heading">{drawing.title}</h1>
                <p className="mt-1 text-sm text-brand-muted">
                  {t('dashboard.common.date')}: {drawing.draw_date ? new Date(drawing.draw_date).toLocaleString(locale === 'es' ? 'es' : 'en') : '—'}
                </p>
              </div>
            </div>
            <span className={`w-fit rounded-md border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] ${
              drawing.status === 'completed'
                ? 'border-violet-400/30 bg-violet-400/[0.12] text-violet-100'
                : drawing.status === 'pending'
                  ? 'border-sky-500/30 bg-sky-500/[0.1] text-sky-100/90'
                  : 'border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-100/95'
            }`}>
              {getDrawingStatusLabel(drawing.status, t)}
            </span>
          </div>

          <section className="mt-6 rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              {t('dashboard.drawings.drawingDetails')}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {drawing.drawing_image ? (
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.drawingImage')}</p>
                  <div className="mt-2 w-fit overflow-hidden rounded-lg border border-white/[0.08] bg-black/25 h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc(drawing.drawing_image)} alt={drawing.title || t('dashboard.drawings.drawingImage')} className="w-fit object-cover h-56" />
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.title')}</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">{drawing.title || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.common.date')}</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">
                  {drawing.draw_date ? new Date(drawing.draw_date).toLocaleString(locale === 'es' ? 'es' : 'en') : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:col-span-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.description')}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">{drawing.description || '—'}</p>
              </div>
              
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              {t('dashboard.drawings.prizeDetails')}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {drawing.prize_image ? (
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.prizeImage')}</p>
                  <div className="mt-2 w-fit overflow-hidden rounded-lg border border-white/[0.08] bg-black/25 h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc(drawing.prize_image)} alt={drawing.prize_title || drawing.title} className="w-fit object-cover h-56" />
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.prize')}</p>
                <p className="mt-1 text-sm font-semibold text-brand-accent">{drawing.prize_title || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.prize')}</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">
                  {getDrawingPrizeLine(drawing, t)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:col-span-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.prizeDescription')}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">{drawing.prize_description || '—'}</p>
              </div>
              
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              {t('dashboard.drawings.entryDetails')}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.entryToken')}</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">
                  {drawing.entry_token?.symbol || drawing.entry_token?.name || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.entryCost')}</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">{drawing.entry_cost || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.totalSlots')}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-brand-heading">
                  {drawing.total_entries ? drawing.total_entries.toLocaleString() : '0'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('dashboard.drawings.joinedUsers')}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-brand-heading">
                  {drawing.joined_count ? drawing.joined_count.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </section>

          {drawing.status === 'active' ? (
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (
                    Number(drawing.total_entries || 0) > 0 &&
                    Number(drawing.joined_count || 0) >= Number(drawing.total_entries || 0)
                  ) {
                    setJoinError(t('dashboard.drawings.capacityFull'));
                    setJoinSuccess('');
                    setShowJoinModal(true);
                    return;
                  }
                  void loadJoinPreview();
                }}
                className={`btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${
                  Number(drawing.total_entries || 0) > 0 &&
                  Number(drawing.joined_count || 0) >= Number(drawing.total_entries || 0)
                    ? 'pointer-events-none opacity-50'
                    : ''
                }`}
              >
                <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
                {Number(drawing.total_entries || 0) > 0 &&
                Number(drawing.joined_count || 0) >= Number(drawing.total_entries || 0)
                  ? t('dashboard.drawings.joinClosed')
                  : t('dashboard.drawings.join')}
              </button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-brand-muted">
              This drawing is no longer open for joins. You can still review the details above.
            </p>
          )}
        </article>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-black/[0.25] p-6 text-sm text-brand-muted">
          {t('dashboard.drawings.notFound')}
        </div>
      )}

      {joinSuccess ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
          {joinSuccess}
        </div>
      ) : null}

      {showJoinModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#07080c] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-6">
            <h3 className="text-lg font-semibold text-brand-heading">{t('dashboard.drawings.confirmJoin')}</h3>
            <p className="mt-1 text-sm text-brand-muted">
              {t('dashboard.drawings.joinModalHint')}
            </p>
            <p className="mt-1 text-xs text-brand-subtle">
              {t('dashboard.drawings.deductionHistoryNote')}
            </p>
            {joinPreviewLoading ? (
              <div className="mt-4 grid gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-4 animate-pulse">
                <div className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04]" />
                <div className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04]" />
                <div className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04]" />
                <div className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04]" />
                <div className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04]" />
                <div className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04]" />
              </div>
            ) : (
              <div className="mt-4 grid gap-2 rounded-xl border border-white/[0.08] bg-black/25 p-4 text-sm">
                <p className="text-brand-muted">
                  {t('dashboard.drawings.entryToken')}: <span className="text-brand-heading">{joinPreview?.entryToken?.symbol || '—'}</span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.drawings.entryCost')}: <span className="text-brand-heading">{joinPreview?.entryCost ?? '—'}</span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.drawings.yourBalance')}: <span className="text-brand-heading">{joinPreview?.walletBalance?.toFixed(2) ?? '—'}</span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.drawings.balanceAfterJoin')}:{' '}
                  <span className="text-brand-heading">{joinPreview?.walletBalanceAfterJoin ?? '—'}</span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.drawings.deduction')}:{' '}
                  <span className="text-rose-300">
                    -{joinPreview?.entryCost ?? '—'} {joinPreview?.entryToken?.symbol || ''}
                  </span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.drawings.reward')}:{' '}
                  <span className="text-brand-heading">
                    {joinPreview?.reward?.type === 'token'
                      ? `${joinPreview?.reward?.tokenAmount || '0'} ${joinPreview?.reward?.token?.symbol || ''}`.trim()
                      : joinPreview?.reward?.type === "event_access" ? t('dashboard.drawings.eventAccessLabel') : joinPreview?.reward?.type || '—'}
                  </span>
                </p>
              </div>
            )}
            {joinError ? <p className="mt-3 text-sm text-rose-300">{joinError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinPreviewLoading(false);
                }}
                className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-brand-muted"
              >
                {t('dashboard.common.cancel')}
              </button>
              <button
                type="button"
                disabled={isJoining || joinPreviewLoading || !joinPreview?.canJoin}
                onClick={onConfirmJoin}
                className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {isJoining ? t('dashboard.drawings.joining') : t('dashboard.drawings.confirmJoin')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

