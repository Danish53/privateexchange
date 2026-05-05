'use client';

import SuperAdminSettingsPage from '@/components/superadmin-dashboard/pages/SuperAdminSettingsPage';
import SuperAdminTokensPage from '@/components/superadmin-dashboard/pages/SuperAdminTokensPage';

export default function SuperAdminSettingsRoute() {
  return (
    <div className="space-y-10">
      <SuperAdminSettingsPage />
      <SuperAdminTokensPage />
    </div>
  );
}
