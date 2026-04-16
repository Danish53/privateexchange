'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import UserDashboardSkeleton from '@/components/ui/UserDashboardSkeleton';
import AdminDashboard from '@/components/AdminDashboard';

export default function DashboardPage() {
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
    if (user.role === 'superadmin' || user.role === 'admin') {
      router.replace('/dashboard/superadmin');
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <UserDashboardSkeleton />;
  }

  if (user.role === 'user' || user.role === 'superadmin' || user.role === 'admin') {
    return <div className="min-h-screen bg-brand-page" />; // redirect
  }

  return <AdminDashboard user={user} onLogout={logout} />;
}
