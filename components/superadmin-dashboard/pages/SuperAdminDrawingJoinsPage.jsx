'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

export default function SuperAdminDrawingJoinsPage() {
  const { t, locale } = useWebsiteT();
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : params?.slug?.[0] || '';
  const { token, ready } = useAuth();

  const [drawing, setDrawing] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectingWinnerId, setSelectingWinnerId] = useState('');

  const loadRows = async () => {
    if (!ready || !token || !slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/superadmin/drawings/by-slug/${encodeURIComponent(slug)}/joins`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || t('superadmin.drawings.joins.couldNotLoad'));
        return;
      }
      setDrawing(json.drawing || null);
      setRows(Array.isArray(json.users) ? json.users : []);
    } catch {
      setError(t('superadmin.drawings.joins.networkLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, [ready, token, slug, t]);

  const onMarkWinner = async (winnerUserId) => {
    if (!token || !slug || !winnerUserId) return;
    setSelectingWinnerId(winnerUserId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/superadmin/drawings/by-slug/${encodeURIComponent(slug)}/winner`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winnerUserId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setActionError(json.error || t('superadmin.drawings.joins.failedSelectWinner'));
        return;
      }
      setActionSuccess(json.message || t('superadmin.drawings.joins.winnerSelected'));
      await loadRows();
    } catch {
      setActionError(t('superadmin.drawings.joins.networkSelectWinner'));
    } finally {
      setSelectingWinnerId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/dashboard/superadmin/drawings/${encodeURIComponent(slug)}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {t('superadmin.drawings.joins.backToDetail')}
        </Link>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-black/[0.24] p-5">
        <h1 className="text-xl font-semibold text-brand-heading">
          {drawing?.title
            ? t('superadmin.drawings.joins.titleWithDrawing', { title: drawing.title })
            : t('superadmin.drawings.joins.title')}
        </h1>
        <p className="mt-1 text-sm text-brand-muted">{t('superadmin.drawings.joins.subtitle')}</p>
      </div>

      {actionError ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">
          {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200">
          {actionSuccess}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-10 rounded-lg border border-white/[0.08] bg-black/[0.25]" />
          <div className="h-10 rounded-lg border border-white/[0.08] bg-black/[0.25]" />
          <div className="h-10 rounded-lg border border-white/[0.08] bg-black/[0.25]" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.08] p-6 text-sm text-rose-300">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-black/[0.25] p-6 text-sm text-brand-muted">
          {t('superadmin.drawings.joins.noUsersJoined')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.08]">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/30 text-xs uppercase tracking-[0.08em] text-brand-subtle">
              <tr>
                <th className="px-3 py-2">{t('superadmin.drawings.joins.colUser')}</th>
                <th className="px-3 py-2">{t('superadmin.drawings.joins.colToken')}</th>
                <th className="px-3 py-2">{t('superadmin.drawings.joins.colCost')}</th>
                <th className="px-3 py-2">{t('superadmin.drawings.joins.colJoined')}</th>
                <th className="px-3 py-2 text-right">{t('superadmin.drawings.joins.colAction')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, idx) => (
                <tr key={`${u.userId}-${idx}`} className="border-t border-white/[0.06]">
                  <td className="px-3 py-2">
                    <p className="text-brand-heading">{u.name || '—'}</p>
                    <p className="text-xs text-brand-subtle">{u.email || ''}</p>
                  </td>
                  <td className="px-3 py-2 text-brand-heading">{u.entryTokenSymbol || '—'}</td>
                  <td className="px-3 py-2 text-brand-heading">{u.entryCost ?? '—'}</td>
                  <td className="px-3 py-2 text-brand-subtle">
                    {u.joinedAt ? new Date(u.joinedAt).toLocaleString(locale === 'es' ? 'es' : 'en') : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {u.isWinner ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.12] px-2.5 py-1 text-xs font-semibold text-emerald-200">
                        <Trophy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        {t('superadmin.drawings.joins.winner')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarkWinner(u.userId)}
                        disabled={Boolean(selectingWinnerId)}
                        className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs font-semibold text-brand-subtle transition hover:border-brand-accent/40 hover:text-brand-heading disabled:opacity-60"
                      >
                        {selectingWinnerId === u.userId
                          ? t('superadmin.drawings.joins.selecting')
                          : t('superadmin.drawings.joins.markWinner')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
