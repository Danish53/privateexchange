'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Gift, Clock3, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

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

function rewardTypeLabel(type, t) {
  if (!type) return '—';
  const key = `superadmin.drawings.rewardType.${type}`;
  const label = t(key);
  return label !== key ? label : type;
}

export default function SuperAdminDrawingDetailPage() {
  const { t, locale } = useWebsiteT();
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

  const statusLabel = (status) => {
    const key = `superadmin.drawings.status.${status}`;
    const label = t(key);
    return label !== key ? label : status || t('superadmin.drawings.status.active');
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
          setError(json.error || t('superadmin.drawings.detail.couldNotLoad'));
          return;
        }
        setDrawing(json.drawing || null);
      } catch {
        setError(t('superadmin.drawings.detail.networkLoad'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [ready, token, slug, t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/superadmin/drawings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {t('superadmin.drawings.detail.backToDrawings')}
        </Link>
        <Link
          href={`/dashboard/superadmin/drawings/${encodeURIComponent(slug)}/joins`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-brand-subtle transition hover:border-brand-accent/40 hover:text-brand-heading"
        >
          <Users className="h-4 w-4" strokeWidth={2} aria-hidden />
          {t('superadmin.drawings.detail.joinedUsers')}
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
          {t('superadmin.drawings.detail.notFound')}
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
                {statusLabel(drawing.status)}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-sm text-brand-muted">
                <Calendar className="h-4 w-4 text-brand-subtle" strokeWidth={2} aria-hidden />
                {t('superadmin.drawings.detail.drawDate', {
                  date: drawing.draw_date ? new Date(drawing.draw_date).toLocaleString(locale === 'es' ? 'es' : 'en') : t('superadmin.drawings.detail.tbd'),
                })}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-sm text-brand-muted">
                <Clock3 className="h-4 w-4 text-brand-subtle" strokeWidth={2} aria-hidden />
                {t('superadmin.drawings.detail.created', {
                  date: drawing.createdAt ? new Date(drawing.createdAt).toLocaleString(locale === 'es' ? 'es' : 'en') : '—',
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('superadmin.drawings.detail.drawingImage')}</h2>
              {drawing.drawing_image ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 h-40 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc(drawing.drawing_image)} alt={drawing.title || t('superadmin.drawings.detail.drawingImageAlt')} className="h-40 object-cover" />
                </div>
              ) : (
                <p className="mt-2 text-sm text-brand-muted">{t('superadmin.drawings.detail.noDrawingImage')}</p>
              )}
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('superadmin.drawings.detail.prizeInfo')}</h2>
              <p className="mt-2 text-base font-semibold text-brand-accent">{drawing.prize_title || '—'}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{drawing.prize_description || t('superadmin.drawings.detail.noPrizeDetails')}</p>
              {drawing.prize_image ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 h-40 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc(drawing.prize_image)} alt={drawing.prize_title || drawing.title} className="h-40 object-cover" />
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('superadmin.drawings.detail.rewardInfo')}</h2>
              <p className="mt-2 text-md text-brand-muted">
                {t('superadmin.drawings.detail.type')}{' '}
                <span className="capitalize text-brand-heading">{rewardTypeLabel(drawing.reward_type, t)}</span>
              </p>
              {drawing.reward_type === 'token' ? (
              <p className="mt-1 text-md text-brand-muted">
                {t('superadmin.drawings.detail.token')}{' '}
                <span className="text-brand-heading">
                  {drawing.reward_token?.symbol || drawing.reward_token?.name || t('superadmin.drawings.detail.na')}
                </span>
              </p>
              ) : null}
              <p className="mt-1 text-md text-brand-muted">
                {t('superadmin.drawings.detail.rewardAmount')}{' '}
                <span className="text-brand-heading">{drawing.reward_token_amount || '0'}</span>
              </p>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('superadmin.drawings.detail.entryInfo')}</h2>
              <p className="mt-2 text-sm text-brand-muted">
                {t('superadmin.drawings.detail.entryToken')}{' '}
                <span className="text-brand-heading">
                  {drawing.entry_token?.symbol || drawing.entry_token?.name || '—'}
                </span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {t('superadmin.drawings.detail.entryCost')}{' '}
                <span className="text-brand-heading">{drawing.entry_cost || '0'}</span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {t('superadmin.drawings.detail.totalRecipients')}{' '}
                <span className="text-brand-heading">{Number(drawing.total_entries || 0).toLocaleString(locale === 'es' ? 'es' : 'en')}</span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {t('superadmin.drawings.detail.joinedRecipients')}{' '}
                <span className="text-brand-heading">{Number(drawing.joined_count || 0).toLocaleString(locale === 'es' ? 'es' : 'en')}</span>
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-xs text-brand-muted">
                <Ticket className="h-3.5 w-3.5 text-brand-subtle" strokeWidth={2} aria-hidden />
                {t('superadmin.drawings.detail.entryDeductionHint')}
              </div>
            </section>
          </div>

          {drawing.description ? (
            <section className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('superadmin.drawings.detail.drawingDescription')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{drawing.description}</p>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
