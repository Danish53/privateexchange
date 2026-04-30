'use client';

import SuperAdminPageFrame from '@/components/superadmin-dashboard/SuperAdminPageFrame';
import SuperAdminDepositManagement from '@/components/superadmin-dashboard/pages/SuperAdminDepositManagement';

export default function SuperAdminPaymentsPage() {
  return (
    <SuperAdminPageFrame
      title="Payments"
      description="Funding rails, settlements, and payment operations (as phased in for the product)."
    >
      <SuperAdminDepositManagement />
    </SuperAdminPageFrame>
  );
}
