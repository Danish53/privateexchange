'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import UserDashboardSkeleton from '@/components/ui/UserDashboardSkeleton';
import UserDashboardShell from '@/components/user-dashboard/UserDashboardShell';

export default function UserDashboardLayout({ children }) {
  const { user, logout, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'user') {
      router.replace('/dashboard');
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <UserDashboardSkeleton />;
  }

  if (user.role !== 'user') {
    return null;
  }

  return <UserDashboardShell user={user} onLogout={logout}>{children}</UserDashboardShell>;
}
