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

function prizeLine(row) {
  const type = String(row.reward_type || '').toLowerCase();
  if (type === 'token' && row.reward_token_symbol) {
    return `${row.reward_token_amount || '0'} ${row.reward_token_symbol}`.trim();
  }
  if (row.prize_title) return row.prize_title;
  if (type === 'event_access') return 'Event access';
  if (type === 'physical') return 'Physical prize';
  return 'Prize';
}

function activeRewardSummary(draw) {
  const type = String(draw.reward_type || '').toLowerCase();
  if (type === 'token' && draw.reward_token?.symbol) {
    return `${draw.reward_token_amount || '0'} ${draw.reward_token.symbol}`.trim();
  }
  if (draw.prize_title) return draw.prize_title;
  if (type === 'event_access') return 'Event access';
  if (type === 'physical') return 'Physical prize';
  if (type === 'custom') return draw.prize_title || 'Custom reward';
  return '—';
}

export default function DrawingsPage() {
  const { token, ready, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [winnerRows, setWinnerRows] = useState([]);
  const [winnersLoading, setWinnersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
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
          setError(json.error || 'Could not load drawings.');
          return;
        }
        setRows(Array.isArray(json.drawings) ? json.drawings : []);
      } catch {
        setError('Network error while loading drawings.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [ready, token]);

  useEffect(() => {
    const loadWinners = async () => {
      setWinnersLoading(true);
      try {
        const res = await fetch('/api/drawings/winners', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) return;
        setWinnerRows(Array.isArray(json.winners) ? json.winners : []);
      } catch {
        // Keep section graceful on network errors.
      } finally {
        setWinnersLoading(false);
      }
    };
    void loadWinners();
  }, []);

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
        setJoinError(json.error || 'Could not load join info.');
        return;
      }
      setJoinPreview({ ...(json.preview || null), slug });
    } catch {
      setJoinError('Network error while loading join info.');
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
        setJoinError(json.error || 'Failed to join drawing.');
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
      setJoinSuccess(json.message || 'Drawing joined successfully.');
    } catch {
      setJoinError('Network error while joining drawing.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">Rewards</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Drawings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">Live drawings published by superadmin are listed here.</p>
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
              Dismiss
            </button>
          </div>
        ) : null}

        {loading ? (
          <Panel title="Active drawings" subtitle="Loading your pools…">
            <div className="grid gap-4 sm:grid-cols-2">
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
          <Panel title="Active drawings" subtitle="Could not load drawings">
            <p className="text-sm leading-relaxed text-red-200/90">{error}</p>
          </Panel>
        ) : rows.length > 0 ? (
          <Panel
            title="Active drawings"
            subtitle="Open pools you can join, plus drawings you participated in that have finished."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((draw) => {
                const total = Number(draw.total_entries || 0);
                const joined = Number(draw.joined_count || 0);
                const isFull = total > 0 && joined >= total;
                const isActive = draw.status === 'active';
                const isWinner = draw.status === 'completed' && draw.is_winner;
                const cover = String(draw.drawing_image || draw.prize_image || '').trim();
                const drawWhen = draw.draw_date
                  ? new Date(draw.draw_date).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'TBD';
                const entrySym = draw.entry_token?.symbol || draw.entry_token?.name || '—';
                const rewardText = activeRewardSummary(draw);
                const fillPct = total > 0 ? Math.min(100, Math.round((joined / total) * 100)) : null;

                return (
                  <article
                    key={draw.id || draw.slug}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0d0f14] via-[#0a0b10] to-[#060709] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition ${
                      isWinner
                        ? 'border-emerald-400/35 ring-1 ring-emerald-400/15'
                        : isActive
                          ? 'border-white/[0.1] hover:border-cyan-400/30'
                          : 'border-white/[0.08] hover:border-white/[0.14]'
                    }`}
                  >
                    <div
                      className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl transition ${
                        isWinner
                          ? 'bg-emerald-500/[0.12]'
                          : isActive
                            ? 'bg-cyan-500/[0.08] group-hover:bg-cyan-500/[0.14]'
                            : 'bg-white/[0.04]'
                      }`}
                      aria-hidden
                    />

                    <div className="relative flex flex-wrap items-start justify-between gap-2">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/95">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden />
                          Live pool
                        </span>
                      ) : isWinner ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                          <Trophy className="h-3.5 w-3.5" aria-hidden />
                          You won
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.05] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                          Ended
                        </span>
                      )}
                    </div>

                    <div className="relative mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-black/40">
                      {cover ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageSrc(cover)}
                            alt={draw.title || 'Drawing'}
                            className="aspect-[21/9] w-full object-cover sm:aspect-[2.2/1]"
                          />
                        </>
                      ) : (
                        <div className="flex aspect-[21/9] items-center justify-center bg-gradient-to-br from-brand-accent/10 to-transparent sm:aspect-[2.2/1]">
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-accent/25 bg-brand-accent/10 text-brand-accent">
                            <Gift className="h-7 w-7" strokeWidth={1.6} aria-hidden />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="relative mt-4 min-w-0">
                      <h3 className="text-lg font-semibold tracking-tight text-brand-heading">{draw.title}</h3>
                      <p className="mt-1 text-sm text-brand-muted">
                        <span className="text-brand-subtle">Prize</span>{' '}
                        <span className="font-medium text-brand-heading/95">{draw.prize_title || '—'}</span>
                      </p>
                      {draw.description ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-brand-muted">{draw.description}</p>
                      ) : null}
                    </div>

                    {isWinner ? (
                      <div className="relative mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2.5 text-xs font-medium leading-relaxed text-emerald-100">
                        Congratulations — you were selected for this drawing. Open the detail page for full information.
                      </div>
                    ) : null}

                    {total > 0 ? (
                      <div className="relative mt-4">
                        <div className="mb-1 flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" aria-hidden />
                            Pool fill
                          </span>
                          <span className="tabular-nums text-brand-muted">
                            {joined.toLocaleString()} / {total.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull ? 'bg-amber-500/70' : 'bg-gradient-to-r from-cyan-500/70 to-brand-accent'
                            }`}
                            style={{ width: `${fillPct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="relative mt-3 text-xs text-brand-muted">
                        <span className="font-semibold text-brand-heading">{joined.toLocaleString()}</span> members joined
                        · no fixed cap
                      </p>
                    )}

                    <div className="relative mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 p-3">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/80" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                            Draw date
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-brand-heading">{drawWhen}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 p-3">
                        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                            Entry
                          </p>
                          <p className="mt-0.5 truncate text-sm font-medium text-brand-heading">
                            {[String(draw.entry_cost ?? ''), entrySym !== '—' ? entrySym : '']
                              .filter(Boolean)
                              .join(' ') || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-black/30 p-3 sm:col-span-2">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/85" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                            Reward
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-brand-heading">{rewardText}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Link
                        href={`/dashboard/user/drawings/${encodeURIComponent(draw.slug)}`}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2.5 text-sm font-semibold text-brand-heading transition hover:border-brand-accent/35 hover:bg-brand-accent/10 sm:flex-initial sm:px-5"
                      >
                        View details
                        <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                      </Link>
                      {isActive ? (
                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => {
                            if (isFull) {
                              setJoinError('Drawing capacity is full. Join is closed.');
                              setJoinSuccess('');
                              return;
                            }
                            void loadJoinPreview(draw.slug);
                          }}
                          className={`btn-primary inline-flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold sm:flex-initial sm:px-6 ${
                            isFull ? 'pointer-events-none opacity-50' : ''
                          }`}
                        >
                          {isFull ? 'Join closed' : 'Join drawing'}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>
        ) : (
          <Panel title="Active drawings" subtitle="No pools are open at the moment.">
            <div className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-black/20 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] text-brand-muted">
                <Sparkles className="h-7 w-7" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
                When the next drawing is scheduled, it will show up here with entry cost, rewards, and how full the pool
                is — so you can join in one tap.
              </p>
            </div>
          </Panel>
        )}

        <Panel title="Recent winners" subtitle="Latest completed drawings and who won each pool.">
          {winnersLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
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
              No winners announced yet. Completed drawings with a selected winner will appear here.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {winnerRows.map((row) => {
                const isYou = user?.id && row.winner?.id && String(user.id) === String(row.winner.id);
                const name = row.winner?.name || 'Member';
                const drawLabel = row.draw_date
                  ? new Date(row.draw_date).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—';
                const prize = prizeLine(row);
                const detailHref = row.slug ? `/dashboard/user/drawings/${encodeURIComponent(row.slug)}` : '';

                return (
                  <article
                    key={row.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0d0f14] via-[#0a0b10] to-[#060709] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-amber-400/25 ${
                      isYou
                        ? 'border-amber-400/35 ring-1 ring-amber-400/20'
                        : 'border-white/[0.1]'
                    }`}
                  >
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/[0.07] blur-2xl transition group-hover:bg-amber-500/[0.12]"
                      aria-hidden
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-200/95">
                        <Trophy className="h-3.5 w-3.5" aria-hidden />
                        Win
                      </span>
                      {isYou ? (
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200">
                          You
                        </span>
                      ) : null}
                    </div>

                    <div className="relative mt-4 flex gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-base font-bold text-amber-100 shadow-inner"
                        aria-hidden
                      >
                        {winnerInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold tracking-tight text-brand-heading">{name}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-brand-muted">
                          <span className="text-brand-subtle">won drawing</span>{' '}
                          <span className="font-medium text-brand-heading/95">&ldquo;{row.title || 'Untitled'}&rdquo;</span>
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-4 grid gap-2 rounded-xl border border-white/[0.06] bg-black/30 p-3.5">
                      <div className="flex items-start gap-2 text-sm">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/80" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Prize</p>
                          <p className="mt-0.5 font-medium text-brand-heading">{prize}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 border-t border-white/[0.05] pt-2 text-sm">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-subtle" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                            Draw completed
                          </p>
                          <p className="mt-0.5 text-brand-muted">{drawLabel}</p>
                        </div>
                      </div>
                    </div>

                    {detailHref ? (
                      <Link
                        href={detailHref}
                        className="relative mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.04] py-2.5 text-sm font-semibold text-brand-heading transition hover:border-amber-400/30 hover:bg-amber-500/10 hover:text-amber-50"
                      >
                        <Sparkles className="h-4 w-4 text-amber-300/90" aria-hidden />
                        View drawing
                        <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#07080c] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-6">
            <h3 className="text-lg font-semibold text-brand-heading">Confirm drawing join</h3>
            <p className="mt-1 text-sm text-brand-muted">
              Joining this drawing will deduct entry cost from your wallet.
            </p>
            <p className="mt-1 text-xs text-brand-subtle">
              This deduction will be added to your transaction history.
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
                  Entry token: <span className="text-brand-heading">{joinPreview?.entryToken?.symbol || '—'}</span>
                </p>
                <p className="text-brand-muted">
                  Entry cost: <span className="text-brand-heading">{joinPreview?.entryCost ?? '—'}</span>
                </p>
                <p className="text-brand-muted">
                  Your balance: <span className="text-brand-heading">{formatToTwoDecimals(joinPreview?.walletBalance)}</span>
                </p>
                <p className="text-brand-muted">
                  Balance after join:{' '}
                  <span className="text-brand-heading">{joinPreview?.walletBalanceAfterJoin ?? '—'}</span>
                </p>
                <p className="text-brand-muted">
                  Deduction:{' '}
                  <span className="text-rose-300">
                    -{joinPreview?.entryCost ?? '—'} {joinPreview?.entryToken?.symbol || ''}
                  </span>
                </p>
                <p className="text-brand-muted">
                  Reward:{' '}
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
                Cancel
              </button>
              <button
                type="button"
                disabled={isJoining || joinPreviewLoading || !joinPreview?.canJoin}
                onClick={onConfirmJoin}
                className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {isJoining ? 'Joining...' : 'Confirm join'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
