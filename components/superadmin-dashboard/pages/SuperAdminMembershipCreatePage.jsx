'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import MembershipTierForm from '@/components/superadmin-dashboard/membership/MembershipTierForm';

export default function SuperAdminMembershipCreatePage() {
  const { token, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <MembershipTierForm
      title="Create membership"
      description="Name the tier, set the minimum account value in USD, and list the benefits members receive. You can add as many benefit lines as you need."
      submitLabel="Save membership"
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
            setError(data.error || 'Could not create membership tier.');
            return;
          }
          router.push('/dashboard/superadmin/membership');
          router.refresh();
        } catch {
          setError('Could not create membership tier.');
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
