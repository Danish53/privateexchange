'use client';

import SuperAdminPageFrame from '@/components/superadmin-dashboard/SuperAdminPageFrame';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

export default function SuperAdminKpiPage() {
  const { t } = useWebsiteT();
  return (
    <SuperAdminPageFrame
      title={t('superadmin.kpi.title')}
      description={t('superadmin.kpi.description')}
    />
  );
}
