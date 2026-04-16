'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import UserDashboardSkeleton from '@/components/ui/UserDashboardSkeleton';
import SuperAdminDashboardShell from '@/components/superadmin-dashboard/SuperAdminDashboardShell';
import PlatformAccessGuard from '@/components/superadmin-dashboard/PlatformAccessGuard';

export default function SuperAdminLayout({ children }) {
  const { user, logout, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'user') {
      router.replace('/dashboard/user');
      return;
    }
    if (user.role === 'admin') {
      return;
    }
    if (user.role !== 'superadmin') {
      router.replace('/login');
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <UserDashboardSkeleton />;
  }

  if (user.role !== 'superadmin' && user.role !== 'admin') {
    return null;
  }

  return (
    <SuperAdminDashboardShell user={user} onLogout={logout}>
      <PlatformAccessGuard user={user}>{children}</PlatformAccessGuard>
    </SuperAdminDashboardShell>
  );
}
