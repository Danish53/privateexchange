'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Wallet } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useAuth } from '@/components/auth-context';

const formatToTwoDecimals = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export default function DrawingsPage() {
  const { token, ready } = useAuth();
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

        {loading ? (
          <Panel title="Active drawings" subtitle="Loading...">
            <div className="space-y-4 animate-pulse">
              <div className="h-24 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
              <div className="h-24 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
              <div className="h-24 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
            </div>
          </Panel>
        ) : error ? (
          <Panel title="Active drawings" subtitle="Could not load drawings">
            <p className="text-sm leading-relaxed text-red-200/90">{error}</p>
          </Panel>
        ) : rows.length > 0 ? (
          <Panel title="Active drawings" subtitle="Join open drawings from this list.">
            <div className="space-y-5">
              {rows.map((draw) => (
                <article
                  key={draw.id || draw.slug}
                  className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/[0.3] to-[#07080c] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        {draw.prize_image ? (
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageSrc(draw.prize_image)} alt={draw.prize_title || draw.title} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/40 text-brand-accent">
                            <Gift className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold tracking-tight text-brand-heading">{draw.title}</h3>
                          <p className="mt-1 text-sm text-brand-muted">Prize: {draw.prize_title || '—'}</p>
                          {draw.description ? (
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-brand-muted">{draw.description}</p>
                          ) : null}
                        </div>
                      </div>
                      <span className="w-fit rounded-md border border-emerald-500/30 bg-emerald-500/[0.12] px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-emerald-100/95">
                        {draw.status === 'completed' ? (draw.is_winner ? 'Winner' : 'Completed') : 'Active'}
                      </span>
                    </div>

                    {draw.status === 'completed' && draw.is_winner ? (
                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-xs font-semibold text-emerald-200">
                        Congratulations! You won this drawing.
                      </div>
                    ) : null}

                    <div className="grid gap-2 rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:grid-cols-2 lg:grid-cols-4">
                      <p className="text-xs text-brand-muted">
                        Draw date:{' '}
                        <span className="text-brand-heading">
                          {draw.draw_date ? new Date(draw.draw_date).toLocaleString() : 'TBD'}
                        </span>
                      </p>
                      <p className="text-xs text-brand-muted">
                        Joined users: {' '}
                        <span className="text-brand-heading">
                           {draw.joined_count ? draw.joined_count.toLocaleString() : '0'} / {' '}
                           { draw.total_entries ? draw.total_entries.toLocaleString() : '0'}
                        </span>
                      </p>
                      <p className="text-xs text-brand-muted">
                        Entry token:{' '}
                        <span className="text-brand-heading">
                          {draw.entry_token?.symbol || draw.entry_token?.name || '—'}
                        </span>
                      </p>
                      <p className="text-xs text-brand-muted">
                        Entry cost: <span className="text-brand-heading">{draw.entry_cost || '—'}</span>
                      </p>
                      <p className="text-xs text-brand-muted">
                        Reward:{' '}
                        <span className="text-brand-heading">
                          {draw.reward_type === 'token'
                            ? `${draw.reward_token_amount || '0'} ${draw.reward_token?.symbol || ''}`.trim()
                            : draw.reward_type === "event_access" ? "Event Access" : draw.reward_type || '—'}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/user/drawings/${encodeURIComponent(draw.slug)}`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-brand-subtle transition hover:border-brand-accent/40 hover:text-brand-heading"
                      >
                        Detail
                      </Link>
                      {draw.status === 'active' ? (
                        <Link
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if ((Number(draw.total_entries || 0) > 0) && Number(draw.joined_count || 0) >= Number(draw.total_entries || 0)) {
                              setJoinError('Drawing capacity is full. Join is closed.');
                              setJoinSuccess('');
                              return;
                            }
                            void loadJoinPreview(draw.slug);
                          }}
                          className={`btn-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ${
                            (Number(draw.total_entries || 0) > 0) && Number(draw.joined_count || 0) >= Number(draw.total_entries || 0)
                              ? 'pointer-events-none opacity-50'
                              : ''
                          }`}
                        >
                          {(Number(draw.total_entries || 0) > 0) && Number(draw.joined_count || 0) >= Number(draw.total_entries || 0)
                            ? 'Join closed'
                            : 'Join'}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Active drawings" subtitle="No pools are open at the moment.">
            <p className="text-sm leading-relaxed text-brand-muted">
              When the next drawing is scheduled, it will appear in this list with dates and how to enter using your
              tokens.
            </p>
          </Panel>
        )}

        <Panel title="Recent winners" subtitle="Latest completed drawings and winning users.">
          {winnersLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-12 rounded-xl border border-white/[0.08] bg-black/[0.25]" />
              <div className="h-12 rounded-xl border border-white/[0.08] bg-black/[0.25]" />
            </div>
          ) : winnerRows.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4 text-sm text-brand-muted">
              No winners announced yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-black/[0.2]">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    <th className="px-4 py-3 sm:px-5">Drawing</th>
                    <th className="px-4 py-3 sm:px-5">Winner</th>
                    <th className="px-4 py-3 sm:px-5">Prize</th>
                    <th className="px-4 py-3 sm:px-5">Draw date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {winnerRows.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5 sm:px-5">
                        <p className="font-medium text-brand-heading">{row.title || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-brand-muted sm:px-5">
                        {row.winner?.name || 'Member'}
                      </td>
                      <td className="px-4 py-3.5 text-brand-muted sm:px-5">
                        {row.prize_title || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-brand-muted sm:px-5">
                        {row.draw_date ? new Date(row.draw_date).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
