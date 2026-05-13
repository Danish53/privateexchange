'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Gift, ArrowLeft, Wallet } from 'lucide-react';
import { useAuth } from '@/components/auth-context';

function imageSrc(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw;
  return `/${raw.replace(/\\/g, '/')}`;
}

export default function DrawingDetailPage() {
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
        setError(json.error || 'Could not load drawing.');
        return;
      }
      setDrawing(json.drawing || null);
    } catch {
      setError('Network error while loading drawing.');
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
        setJoinError(json.error || 'Could not load join info.');
        return;
      }
      setJoinPreview(json.preview || null);
    } catch {
      setJoinError('Network error while loading join info.');
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
        setJoinError(json.error || 'Failed to join drawing.');
        return;
      }
      setShowJoinModal(false);
      setJoinSuccess(json.message || 'Drawing joined successfully.');
      await loadDetail();
    } catch {
      setJoinError('Network error while joining drawing.');
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
        Back to drawings
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
                  Draw date: {drawing.draw_date ? new Date(drawing.draw_date).toLocaleString() : 'TBD'}
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
              {drawing.status || 'active'}
            </span>
          </div>

          <section className="mt-6 rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              Drawing details
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {drawing.drawing_image ? (
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Drawing image</p>
                  <div className="mt-2 w-fit overflow-hidden rounded-lg border border-white/[0.08] bg-black/25 h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc(drawing.drawing_image)} alt={drawing.title || 'Drawing image'} className="w-fit object-cover h-56" />
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Title</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">{drawing.title || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Draw date</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">
                  {drawing.draw_date ? new Date(drawing.draw_date).toLocaleString() : 'TBD'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:col-span-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Description</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">{drawing.description || '—'}</p>
              </div>
              
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              Prize details
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {drawing.prize_image ? (
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:col-span-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Prize image</p>
                  <div className="mt-2 w-fit overflow-hidden rounded-lg border border-white/[0.08] bg-black/25 h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc(drawing.prize_image)} alt={drawing.prize_title || drawing.title} className="w-fit object-cover h-56" />
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Prize</p>
                <p className="mt-1 text-sm font-semibold text-brand-accent">{drawing.prize_title || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Reward</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">
                  {drawing.reward_type === 'token'
                    ? `${drawing.reward_token_amount || '0'} ${drawing.reward_token?.symbol || ''}`.trim()
                    : drawing.reward_type === "event_access" ? "Event Access" : drawing.reward_type || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:col-span-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Prize description</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">{drawing.prize_description || '—'}</p>
              </div>
              
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              Entry details
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Entry token</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">
                  {drawing.entry_token?.symbol || drawing.entry_token?.name || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Entry cost</p>
                <p className="mt-1 text-sm font-semibold text-brand-heading">{drawing.entry_cost || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Total slots</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-brand-heading">
                  {drawing.total_entries ? drawing.total_entries.toLocaleString() : '0'}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Joined users</p>
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
                    setJoinError('Drawing capacity is full. Join is closed.');
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
                  ? 'Join closed'
                  : 'Join'}
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
          Drawing not found.
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
                  Your balance: <span className="text-brand-heading">{joinPreview?.walletBalance?.toFixed(2) ?? '—'}</span>
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
                      : joinPreview?.reward?.type === "event_access" ? "Event Access" : joinPreview?.reward?.type || '—'}
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

    </div>
  );
}

