'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Gift, Clock3, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/components/auth-context';

function imageSrc(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  const normalized = raw.startsWith('/') ? raw.replace(/\\/g, '/') : `/${raw.replace(/\\/g, '/')}`;
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return base ? `${base}${normalized}` : normalized;
}

export default function SuperAdminDrawingDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : params?.slug?.[0] || '';
  const { token, ready } = useAuth();
  const [drawing, setDrawing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const statusTone = {
    active: 'border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-100/95',
    pending: 'border-sky-500/30 bg-sky-500/[0.1] text-sky-100/90',
    completed: 'border-violet-400/30 bg-violet-400/[0.12] text-violet-100',
  };

  useEffect(() => {
    const load = async () => {
      if (!ready || !token || !slug) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/superadmin/drawings/by-slug/${encodeURIComponent(slug)}`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setError(json.error || 'Could not load drawing details.');
          return;
        }
        setDrawing(json.drawing || null);
      } catch {
        setError('Network error while loading drawing details.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [ready, token, slug]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/superadmin/drawings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Back to drawings
        </Link>
        <Link
          href={`/dashboard/superadmin/drawings/${encodeURIComponent(slug)}/joins`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-brand-subtle transition hover:border-brand-accent/40 hover:text-brand-heading"
        >
          <Users className="h-4 w-4" strokeWidth={2} aria-hidden />
          Joined users
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-52 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
            <div className="h-52 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
            <div className="h-52 rounded-2xl border border-white/[0.08] bg-black/[0.25]" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.08] p-6 text-sm text-rose-300">
          {error}
        </div>
      ) : !drawing ? (
        <div className="rounded-2xl border border-white/[0.08] bg-black/[0.25] p-6 text-sm text-brand-muted">
          Drawing not found.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-black/[0.35] to-[#07080c] p-6">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_100%_0%,rgba(201,162,39,0.08),transparent_58%)]"
              aria-hidden
            />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/40 text-brand-accent">
                  <Gift className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-brand-heading">{drawing.title}</h1>
                  <p className="mt-1 text-sm text-brand-muted">{drawing.slug}</p>
                </div>
              </div>
              <span
                className={`rounded-md border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] ${
                  statusTone[drawing.status] || statusTone.active
                }`}
              >
                {drawing.status || 'active'}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-sm text-brand-muted">
                <Calendar className="h-4 w-4 text-brand-subtle" strokeWidth={2} aria-hidden />
                Draw date: {drawing.draw_date ? new Date(drawing.draw_date).toLocaleString() : 'TBD'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-sm text-brand-muted">
                <Clock3 className="h-4 w-4 text-brand-subtle" strokeWidth={2} aria-hidden />
                Created: {drawing.createdAt ? new Date(drawing.createdAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">Prize Info</h2>
              <p className="mt-2 text-base font-semibold text-brand-accent">{drawing.prize_title || '—'}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{drawing.prize_description || 'No prize details.'}</p>
              {drawing.prize_image ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 h-40 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc(drawing.prize_image)} alt={drawing.prize_title || drawing.title} className="h-40 object-cover" />
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">Reward Info</h2>
              <p className="mt-2 text-sm text-brand-muted">
                Type: <span className="capitalize text-brand-heading">{drawing.reward_type || '—'}</span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Token:{' '}
                <span className="text-brand-heading">
                  {drawing.reward_token?.symbol || drawing.reward_token?.name || 'N/A'}
                </span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Reward amount: <span className="text-brand-heading">{drawing.reward_token_amount || '0'}</span>
              </p>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">Entry Info</h2>
              <p className="mt-2 text-sm text-brand-muted">
                Entry token:{' '}
                <span className="text-brand-heading">
                  {drawing.entry_token?.symbol || drawing.entry_token?.name || '—'}
                </span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Entry cost: <span className="text-brand-heading">{drawing.entry_cost || '0'}</span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Total entries: <span className="text-brand-heading">{Number(drawing.total_entries || 0).toLocaleString()}</span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Joined entries: <span className="text-brand-heading">{Number(drawing.joined_count || 0).toLocaleString()}</span>
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-xs text-brand-muted">
                <Ticket className="h-3.5 w-3.5 text-brand-subtle" strokeWidth={2} aria-hidden />
                Entry deduction happens from selected entry token.
              </div>
            </section>
          </div>

          {drawing.description ? (
            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">Drawing Description</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{drawing.description}</p>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

