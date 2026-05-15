'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-context';
import MembershipTierForm from '@/components/superadmin-dashboard/membership/MembershipTierForm';
import FeedbackMessage from '@/components/ui/FeedbackMessage';

function formatMinInput(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return String(n);
}

export default function SuperAdminMembershipEditPage() {
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
        setLoadError(data.error || 'Could not load this membership tier.');
        setTier(null);
        return;
      }
      setTier(data.tier);
    } catch {
      setLoadError('Could not load this membership tier.');
      setTier(null);
    } finally {
      setLoading(false);
    }
  }, [ready, token, id]);

  useEffect(() => {
    loadTier();
  }, [loadTier]);

  if (!id) {
    return (
      <div className="space-y-4">
        <FeedbackMessage tone="error" message="Invalid membership tier link." />
        <Link href="/dashboard/superadmin/membership" className="text-sm font-medium text-brand-accent hover:underline">
          Back to membership
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 py-12 text-center text-sm text-brand-muted">
        Loading tier…
      </div>
    );
  }

  if (loadError || !tier) {
    return (
      <div className="space-y-4">
        <FeedbackMessage tone="error" message={loadError || 'Tier not found.'} />
        <Link href="/dashboard/superadmin/membership" className="text-sm font-medium text-brand-accent hover:underline">
          Back to membership
        </Link>
      </div>
    );
  }

  return (
    <MembershipTierForm
      key={tier.id}
      title="Edit membership"
      description="Update the tier name, minimum USD threshold, or benefits. Changing the name updates the URL slug when needed."
      initialName={tier.name || ''}
      initialMinUsd={formatMinInput(tier.minValueUsd)}
      initialBenefits={Array.isArray(tier.benefits) ? tier.benefits : []}
      initialTransferFee={Boolean(tier.transfer_fee)}
      initialVipDrawings={Boolean(tier.vip_drawings)}
      initialExecutiveEvents={Boolean(tier.executive_events)}
      initialPrioritySupport={Boolean(tier.priority_support)}
      submitLabel="Save changes"
      saving={saving}
      ready={Boolean(ready && token)}
      error={error}
      setError={setError}
      onSave={async (payload) => {
        if (!token) {
          setError('Sign in again to continue.');
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
            setError(data.error || 'Could not update membership tier.');
            return;
          }
          router.push('/dashboard/superadmin/membership');
          router.refresh();
        } catch {
          setError('Could not update membership tier.');
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
