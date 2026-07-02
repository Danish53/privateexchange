'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import MembershipTierForm from '@/components/superadmin-dashboard/membership/MembershipTierForm';

export default function SuperAdminMembershipCreatePage() {
  const { t } = useWebsiteT();
  const { token, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <MembershipTierForm
      title={t('superadmin.membership.create.title')}
      description={t('superadmin.membership.create.description')}
      submitLabel={t('superadmin.membership.create.submitLabel')}
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
          const res = await fetch('/api/superadmin/membership-tiers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) {
            setError(data.error || t('superadmin.membership.create.couldNotCreate'));
            return;
          }
          router.push('/dashboard/superadmin/membership');
          router.refresh();
        } catch {
          setError(t('superadmin.membership.create.couldNotCreate'));
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
