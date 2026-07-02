'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Calendar,
  ChevronRight,
  Gift,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { getDrawingPrizeLine } from '@/lib/i18n/dashboard-helpers';

const formatToTwoDecimals = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

function winnerInitials(name) {
  const n = String(name || '').trim();
  if (!n) return 'M';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || '';
    const b = parts[1][0] || '';
    const pair = `${a}${b}`.toUpperCase();
    if (pair) return pair.slice(0, 2);
  }
  return n.slice(0, 2).toUpperCase() || 'M';
}

export default function DrawingsPage() {
  const { t, locale, translateRowFields } = useWebsiteT();
  const { token, ready, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [winnerRows, setWinnerRows] = useState([]);
  const [winnersLoading, setWinnersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tierDrawingsEnabled, setTierDrawingsEnabled] = useState(true);
  const [error, setError] = useState('');
  const [joinPreview, setJoinPreview] = useState(null);
  const [joinPreviewLoading, setJoinPreviewLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!ready || !token) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/user/drawings', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setError(json.error || t('dashboard.drawings.errors.couldNotLoad'));
          return;
        }
        setTierDrawingsEnabled(json.tier_drawings_enabled !== false);
        const nextRows = Array.isArray(json.drawings) ? json.drawings : [];
        setRows(await translateRowFields(nextRows, ['title', 'prize_title']));
      } catch {
        setError(t('dashboard.drawings.errors.networkLoad'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [ready, token, translateRowFields, t, locale]);

  useEffect(() => {
    const loadWinners = async () => {
      setWinnersLoading(true);
      try {
        const res = await fetch('/api/drawings/winners', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) return;
        const winners = Array.isArray(json.winners) ? json.winners : [];
        setWinnerRows(await translateRowFields(winners, ['title', 'prize_title']));
      } catch {
        // Keep section graceful on network errors.
      } finally {
        setWinnersLoading(false);
      }
    };
    void loadWinners();
  }, [translateRowFields, locale]);

  const imageSrc = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw;
    return `/${raw.replace(/\\/g, '/')}`;
  };

  const loadJoinPreview = async (slug) => {
    if (!token || !slug) return;
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
      setJoinPreview({ ...(json.preview || null), slug });
    } catch {
      setJoinError(t('dashboard.drawings.errors.networkJoinInfo'));
    } finally {
      setJoinPreviewLoading(false);
    }
  };

  const onConfirmJoin = async () => {
    if (!token || !joinPreview?.slug) return;
    setIsJoining(true);
    setJoinError('');
    try {
      const res = await fetch(`/api/user/drawings/${encodeURIComponent(joinPreview.slug)}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setJoinError(json.error || t('dashboard.drawings.errors.joinFailed'));
        return;
      }

      setRows((prev) =>
        prev.map((row) =>
          row.slug === joinPreview.slug
            ? {
                ...row,
                joined_count: Number(row.joined_count || 0) + 1,
              }
            : row
        )
      );
      setShowJoinModal(false);
      setJoinPreview(null);
      setJoinPreviewLoading(false);
      setJoinSuccess(json.message || t('dashboard.drawings.joinSuccess'));
    } catch {
      setJoinError(t('dashboard.drawings.errors.networkJoin'));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              {t('dashboard.drawings.eyebrow')}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              {t('dashboard.drawings.title')}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              {t('dashboard.drawings.subtitle')}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {joinSuccess ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
            {joinSuccess}
          </div>
        ) : null}

        {joinError && !showJoinModal ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-100">
            <span>{joinError}</span>
            <button
              type="button"
              onClick={() => setJoinError('')}
              className="shrink-0 rounded-lg border border-white/10 px-2 py-0.5 text-xs font-semibold text-brand-muted transition hover:border-white/20 hover:text-brand-heading"
            >
              {t('dashboard.common.dismiss')}
            </button>
          </div>
        ) : null}

        {loading ? (
          <Panel title={t('dashboard.drawings.activeDrawings')} subtitle={t('dashboard.drawings.activeDrawingsLoading')}>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0d0f14] to-[#060709] p-5"
                >
                  <div className="h-28 rounded-xl bg-white/[0.05]" />
                  <div className="mt-4 h-5 w-2/3 rounded bg-white/[0.06]" />
                  <div className="mt-2 h-3 w-full rounded bg-white/[0.04]" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="h-16 rounded-lg bg-white/[0.04]" />
                    <div className="h-16 rounded-lg bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : error ? (
          <Panel title={t('dashboard.drawings.activeDrawings')} subtitle={t('dashboard.drawings.activeDrawingsError')}>
            <p className="text-sm leading-relaxed text-red-200/90">{error}</p>
          </Panel>
        ) : rows.length > 0 ? (
          <Panel
            title={t('dashboard.drawings.activeDrawings')}
            subtitle={t('dashboard.drawings.activeDrawingsSub')}
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {rows.map((draw) => {
                const total = Number(draw.total_entries || 0);
                const joined = Number(draw.joined_count || 0);
                const isFull = total > 0 && joined >= total;
                const isActive = draw.status === 'active';
                const isWinner = draw.status === 'completed' && draw.is_winner;
                const cover = String(draw.drawing_image || draw.prize_image || '').trim();
                const drawWhen = draw.draw_date
                  ? new Date(draw.draw_date).toLocaleString(locale === 'es' ? 'es' : 'en', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—';
                const entrySym = draw.entry_token?.symbol || draw.entry_token?.name || '—';
                const rewardText = getDrawingPrizeLine(draw, t);
                const fillPct = total > 0 ? Math.min(100, Math.round((joined / total) * 100)) : null;

                return (
                  <article
                    key={draw.id || draw.slug}
                    className={`flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-black/20 p-4 sm:p-5 ${
                      isWinner
                        ? 'border-emerald-500/35'
                        : isActive
                          ? 'border-brand-accent/30'
                          : 'border-brand-border-muted'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/35 bg-brand-accent/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-[color:var(--brand-accent-hover)]">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-accent" aria-hidden />
                          {t('dashboard.drawings.activeDrawings')}
                        </span>
                      ) : isWinner ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200">
                          <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {t('dashboard.drawings.you')} {t('dashboard.drawings.won')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                          {t('dashboard.drawings.joinClosed')}
                        </span>
                      )}
                    </div>

                    <div className="relative z-0 mt-3 overflow-hidden rounded-lg border border-brand-border-muted bg-black/30">
                      {cover ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageSrc(cover)}
                            alt={draw.title || t('dashboard.drawings.drawingAlt')}
                            className="h-32 w-full object-cover sm:h-36"
                          />
                        </>
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-brand-accent/[0.06] sm:h-36">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-accent/30 bg-brand-accent/10 text-brand-accent">
                            <Gift className="h-6 w-6" strokeWidth={1.6} aria-hidden />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 min-w-0">
                      <h3 className="truncate text-base font-semibold text-brand-heading sm:text-lg">{draw.title}</h3>
                      <p className="mt-1 text-sm text-brand-muted">
                        <span className="text-brand-subtle">{t('dashboard.drawings.prize')}</span>{' '}
                        <span className="font-medium text-brand-heading">{draw.prize_title || '—'}</span>
                      </p>
                      {draw.description ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-brand-muted">{draw.description}</p>
                      ) : null}
                    </div>

                    {isWinner ? (
                      <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-xs leading-relaxed text-emerald-100">
                        {t('dashboard.drawings.winnerBanner')}
                      </div>
                    ) : null}

                    {total > 0 ? (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <Users className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-brand-accent' : ''}`} aria-hidden />
                            <span className="truncate">{t('dashboard.drawings.poolFill')}</span>
                          </span>
                          <span className="shrink-0 tabular-nums text-brand-muted">
                            {joined.toLocaleString()} / {total.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull
                                ? 'bg-amber-500/80'
                                : isActive
                                  ? 'bg-gradient-to-r from-brand-accent/80 to-[color:var(--brand-accent-hover)]'
                                  : 'bg-white/20'
                            }`}
                            style={{ width: `${fillPct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-brand-muted">
                        {t('dashboard.drawings.joinedNoCap', { count: joined.toLocaleString(locale === 'es' ? 'es' : 'en') })}
                      </p>
                    )}

                    <dl className="mt-3 space-y-2.5 rounded-lg border border-brand-border-muted bg-black/25 px-3 py-3 text-sm">
                      <div className="flex gap-2.5">
                        <Calendar
                          className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-brand-accent' : 'text-brand-subtle'}`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                            {t('dashboard.common.date')}
                          </dt>
                          <dd className="mt-0.5 break-words font-medium text-brand-heading">{drawWhen}</dd>
                        </div>
                      </div>
                      <div className="flex gap-2.5 border-t border-white/[0.06] pt-2.5">
                        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                            {t('dashboard.membership.entry')}
                          </dt>
                          <dd className="mt-0.5 break-words font-medium text-brand-heading">
                            {[String(draw.entry_cost ?? ''), entrySym !== '—' ? entrySym : '']
                              .filter(Boolean)
                              .join(' ') || '—'}
                          </dd>
                        </div>
                      </div>
                      <div className="flex gap-2.5 border-t border-white/[0.06] pt-2.5">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent/90" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                            {t('dashboard.drawings.prize')}
                          </dt>
                          <dd className="mt-0.5 break-words font-medium text-brand-heading">{rewardText}</dd>
                        </div>
                      </div>
                    </dl>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Link
                        href={`/dashboard/user/drawings/${encodeURIComponent(draw.slug)}`}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-brand-border-muted bg-black/30 py-2.5 text-sm font-semibold text-brand-heading transition hover:border-brand-accent/40 hover:bg-brand-accent/10 sm:flex-initial sm:px-4"
                      >
                        {t('dashboard.drawings.viewDrawing')}
                        <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                      </Link>
                      {isActive ? (
                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => {
                            if (isFull) {
                              setJoinError(t('dashboard.drawings.capacityFull'));
                              setJoinSuccess('');
                              return;
                            }
                            void loadJoinPreview(draw.slug);
                          }}
                          className={`btn-primary inline-flex flex-1 items-center justify-center rounded-lg py-2.5 text-sm font-semibold sm:flex-initial sm:px-5 ${
                            isFull ? 'pointer-events-none opacity-50' : ''
                          }`}
                        >
                          {isFull ? t('dashboard.drawings.joinClosed') : t('dashboard.drawings.join')}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>
        ) : (
          <Panel
            title={t('dashboard.drawings.activeDrawings')}
            subtitle={t('dashboard.drawings.activeDrawingsEmpty')}
          >
            <div className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-black/20 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] text-brand-muted">
                <Sparkles className="h-7 w-7" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
                {t('dashboard.drawings.activeDrawingsEmptySub', {
                  allUsers: t('dashboard.announcements.allUsers'),
                })}
                {!tierDrawingsEnabled ? (
                  <>
                    {' '}
                    <Link href="/dashboard/user/membership" className="font-semibold text-brand-accent hover:underline">
                      {t('dashboard.support.viewMembership')}
                    </Link>{' '}
                    {t('dashboard.drawings.exclusivePoolsHint')}
                  </>
                ) : null}
              </p>
            </div>
          </Panel>
        )}

        <Panel title={t('dashboard.drawings.recentWinners')} subtitle={t('dashboard.drawings.recentWinnersSub')}>
          {winnersLoading ? (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/40 to-black/20 p-5"
                >
                  <div className="h-4 w-24 rounded bg-white/[0.06]" />
                  <div className="mt-4 flex gap-4">
                    <div className="h-14 w-14 shrink-0 rounded-full bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full rounded bg-white/[0.06]" />
                      <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
                    </div>
                  </div>
                  <div className="mt-4 h-10 rounded-xl bg-white/[0.04]" />
                </div>
              ))}
            </div>
          ) : winnerRows.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-6 text-center text-sm text-brand-muted">
              {t('dashboard.drawings.noWinnersYet')}
            </div>
          ) : (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {winnerRows.map((row) => {
                const isYou = user?.id && row.winner?.id && String(user.id) === String(row.winner.id);
                const name = row.winner?.name || t('dashboard.drawings.member');
                const drawLabel = row.draw_date
                  ? new Date(row.draw_date).toLocaleString(locale === 'es' ? 'es' : 'en', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—';
                const prize = getDrawingPrizeLine(row, t);
                const detailHref = row.slug ? `/dashboard/user/drawings/${encodeURIComponent(row.slug)}` : '';

                return (
                  <article
                    key={row.id}
                    className={`relative z-0 flex min-w-0 flex-col overflow-hidden rounded-xl border bg-black/20 p-4 sm:p-5 ${
                      isYou ? 'border-brand-accent/35' : 'border-brand-border-muted'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-[color:var(--brand-accent-hover)]">
                        <Trophy className="h-3.5 w-3.5 shrink-0 text-brand-accent" aria-hidden />
                        {t('dashboard.drawings.win')}
                      </span>
                      {isYou ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200">
                          {t('dashboard.drawings.you')}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex min-w-0 gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-border-muted bg-brand-accent/10 text-sm font-bold text-brand-accent"
                        aria-hidden
                      >
                        {winnerInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-brand-heading">{name}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-brand-muted">
                          <span className="text-brand-subtle">{t('dashboard.drawings.won')}</span>{' '}
                          <span className="font-medium text-brand-heading">
                            &ldquo;{row.title || t('dashboard.drawings.untitled')}&rdquo;
                          </span>
                        </p>
                      </div>
                    </div>

                    <dl className="mt-3 space-y-2 rounded-lg border border-brand-border-muted bg-black/25 px-3 py-3 text-sm">
                      <div className="flex gap-2">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
                        <div className="min-w-0">
                          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                            {t('dashboard.drawings.prize')}
                          </dt>
                          <dd className="mt-0.5 break-words font-medium text-brand-heading">{prize}</dd>
                        </div>
                      </div>
                      <div className="flex gap-2 border-t border-white/[0.06] pt-2">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-subtle" aria-hidden />
                        <div className="min-w-0">
                          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                            {t('dashboard.drawings.drawCompleted')}
                          </dt>
                          <dd className="mt-0.5 break-words text-brand-muted">{drawLabel}</dd>
                        </div>
                      </div>
                    </dl>

                    {detailHref ? (
                      <Link
                        href={detailHref}
                        scroll
                        className="mt-3 inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-lg border border-brand-border-muted bg-black/30 py-2.5 text-sm font-semibold text-brand-heading transition hover:border-brand-accent/40 hover:bg-brand-accent/10"
                      >
                        <Sparkles className="h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
                        <span className="truncate">{t('dashboard.drawings.viewDrawing')}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      </Link>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

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
                  {t('dashboard.drawings.entryToken')}:{' '}
                  <span className="text-brand-heading">{joinPreview?.entryToken?.symbol || '—'}</span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.drawings.entryCost')}:{' '}
                  <span className="text-brand-heading">{joinPreview?.entryCost ?? '—'}</span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.transfer.availableBalance', { token: t('dashboard.common.token'), amount: formatToTwoDecimals(joinPreview?.walletBalance) })}:{' '}
                  <span className="text-brand-heading">{formatToTwoDecimals(joinPreview?.walletBalance)}</span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.transfer.estimatedTotal')}:{' '}
                  <span className="text-brand-heading">{joinPreview?.walletBalanceAfterJoin ?? '—'}</span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.common.out')}:{' '}
                  <span className="text-rose-300">
                    -{joinPreview?.entryCost ?? '—'} {joinPreview?.entryToken?.symbol || ''}
                  </span>
                </p>
                <p className="text-brand-muted">
                  {t('dashboard.drawings.prize')}:{' '}
                  <span className="text-brand-heading">
                    {joinPreview?.reward?.type === 'token'
                      ? `${joinPreview?.reward?.tokenAmount || '0'} ${joinPreview?.reward?.token?.symbol || ''}`.trim()
                      : joinPreview?.reward?.type || '—'}
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
                  setJoinPreview(null);
                  setJoinPreviewLoading(false);
                  setJoinError('');
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
    </>
  );
}
