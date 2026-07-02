'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import MembershipTierForm from '@/components/superadmin-dashboard/membership/MembershipTierForm';
import FeedbackMessage from '@/components/ui/FeedbackMessage';

function formatMinInput(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return String(n);
}

export default function SuperAdminMembershipEditPage() {
  const { t } = useWebsiteT();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : params?.id?.[0] || '';
  const { token, ready } = useAuth();
  const router = useRouter();
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTier = useCallback(async () => {
    if (!ready || !token || !id) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/superadmin/membership-tiers/${encodeURIComponent(id)}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.tier) {
        setLoadError(data.error || t('superadmin.membership.edit.couldNotLoad'));
        setTier(null);
        return;
      }
      setTier(data.tier);
    } catch {
      setLoadError(t('superadmin.membership.edit.couldNotLoad'));
      setTier(null);
    } finally {
      setLoading(false);
    }
  }, [ready, token, id, t]);

  useEffect(() => {
    loadTier();
  }, [loadTier]);

  if (!id) {
    return (
      <div className="space-y-4">
        <FeedbackMessage tone="error" message={t('superadmin.membership.edit.invalidLink')} />
        <Link href="/dashboard/superadmin/membership" className="text-sm font-medium text-brand-accent hover:underline">
          {t('superadmin.membership.edit.backToMembership')}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 py-12 text-center text-sm text-brand-muted">
        {t('superadmin.membership.edit.loadingTier')}
      </div>
    );
  }

  if (loadError || !tier) {
    return (
      <div className="space-y-4">
        <FeedbackMessage tone="error" message={loadError || t('superadmin.membership.edit.tierNotFound')} />
        <Link href="/dashboard/superadmin/membership" className="text-sm font-medium text-brand-accent hover:underline">
          {t('superadmin.membership.edit.backToMembership')}
        </Link>
      </div>
    );
  }

  return (
    <MembershipTierForm
      key={tier.id}
      title={t('superadmin.membership.edit.title')}
      description={t('superadmin.membership.edit.description')}
      initialName={tier.name || ''}
      initialMinUsd={formatMinInput(tier.minValueUsd)}
      initialBenefits={Array.isArray(tier.benefits) ? tier.benefits : []}
      initialTransferFee={Boolean(tier.transfer_fee)}
      initialVipDrawings={Boolean(tier.vip_drawings)}
      initialExecutiveEvents={Boolean(tier.executive_events)}
      initialPrioritySupport={Boolean(tier.priority_support)}
      submitLabel={t('superadmin.membership.edit.submitLabel')}
      saving={saving}
      ready={Boolean(ready && token)}
      error={error}
      setError={setError}
      onSave={async (payload) => {
        if (!token) {
          setError(t('superadmin.membership.errors.signInAgain'));
          return;
        }
        setSaving(true);
        setError('');
        try {
          const res = await fetch(`/api/superadmin/membership-tiers/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) {
            setError(data.error || t('superadmin.membership.edit.couldNotUpdate'));
            return;
          }
          router.push('/dashboard/superadmin/membership');
          router.refresh();
        } catch {
          setError(t('superadmin.membership.edit.couldNotUpdate'));
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
