'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  mergeAdminPermissions,
  hasAnyUsersModulePermission,
  hasAnyWalletsPermission,
} from '@/lib/adminPermissions';
import UserDashboardSkeleton from '@/components/ui/UserDashboardSkeleton';

function normalizePath(pathname) {
  const p = pathname.replace(/\/+$/, '');
  return p || '/dashboard/superadmin';
}

/**
 * Blocks delegated admins from deep-linking into modules they were not granted.
 * Superadmin passes through.
 */
export default function PlatformAccessGuard({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();

  const allowed = useMemo(() => {
    if (!user || user.role === 'superadmin') return null;
    if (user.role !== 'admin') return new Set();
    const p = mergeAdminPermissions(user.adminPermissions);
    const set = new Set(['/dashboard/superadmin', '/dashboard/superadmin/profile']);
    if (hasAnyUsersModulePermission(user)) {
      set.add('/dashboard/superadmin/users');
    }
    if (p.usersCreate) {
      set.add('/dashboard/superadmin/create-user');
    }
    if (hasAnyWalletsPermission(user)) {
      set.add('/dashboard/superadmin/wallets');
    }
    return set;
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'superadmin' || allowed === null) return;
    const path = normalizePath(pathname);
    const ok = [...allowed].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    if (!ok) {
      router.replace('/dashboard/superadmin');
    }
  }, [user, allowed, pathname, router]);

  if (!user) return children;

  if (user.role === 'superadmin' || allowed === null) {
    return children;
  }

  const path = normalizePath(pathname);
  const ok = [...allowed].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  if (!ok) {
    return <UserDashboardSkeleton />;
  }

  return children;
}
