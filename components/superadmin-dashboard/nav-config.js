import {
  Home,
  Users,
  Wallet,
  Activity,
  Gift,
  Megaphone,
  Shield,
  CreditCard,
  Settings,
  UserCircle,
  Headphones,
} from 'lucide-react';
import {
  hasAnyUsersModulePermission,
  hasAnyWalletsPermission,
  hasAnySettingsPermission,
  hasAnyTransactionsPermission,
  hasAnyDrawingsPermission,
  hasAnyMembershipPermission,
  hasAnyAnnouncementsPermission,
  hasAnySupportTicketsPermission,
} from '@/lib/adminPermissions';

/** Main operations — aligned with platform admin scope (proposal). */
export const SUPERADMIN_NAV_MAIN = [
  {
    href: '/dashboard/superadmin',
    key: 'overview',
    icon: Home,
  },
  {
    href: '/dashboard/superadmin/users',
    key: 'users',
    icon: Users,
  },
  {
    href: '/dashboard/superadmin/wallets',
    key: 'wallets',
    icon: Wallet,
  },
  {
    href: '/dashboard/superadmin/payments',
    key: 'payments',
    icon: CreditCard,
  },
  {
    href: '/dashboard/superadmin/transactions',
    key: 'transactions',
    icon: Activity,
  },
  {
    href: '/dashboard/superadmin/drawings',
    key: 'drawings',
    icon: Gift,
  },
  {
    href: '/dashboard/superadmin/membership',
    key: 'membership',
    icon: Shield,
  },
  {
    href: '/dashboard/superadmin/community-announcements',
    key: 'announcements',
    icon: Megaphone,
  },
  {
    href: '/dashboard/superadmin/support-tickets',
    key: 'support',
    icon: Headphones,
  },
  {
    href: '/dashboard/superadmin/settings',
    key: 'settings',
    icon: Settings,
  },
];

export const SUPERADMIN_NAV_ACCOUNT = [
  {
    href: '/dashboard/superadmin/profile',
    key: 'profile',
    icon: UserCircle,
  },
];

/**
 * @typedef {typeof SUPERADMIN_NAV_MAIN[number] & { disabled?: boolean; label: string; description: string }} SuperadminNavItem
 */

function withLabels(item, t) {
  return {
    ...item,
    label: t(`superadmin.nav.${item.key}.label`),
    description: t(`superadmin.nav.${item.key}.description`),
  };
}

function withDisabled(items, disabled, t) {
  return items.map((item) => ({ ...withLabels(item, t), disabled }));
}

/**
 * Superadmin: full nav, all enabled. Admin: same items; disabled where no permission.
 * @param {{ role?: string; adminPermissions?: Record<string, boolean> } | null | undefined} user
 * @param {(key: string, vars?: Record<string, unknown>) => string} t
 * @returns {{ main: SuperadminNavItem[]; account: SuperadminNavItem[] }}
 */
export function getSuperadminNavSections(user, t) {
  if (!user || user.role === 'superadmin') {
    return {
      main: withDisabled(SUPERADMIN_NAV_MAIN, false, t),
      account: withDisabled(SUPERADMIN_NAV_ACCOUNT, false, t),
    };
  }
  if (user.role !== 'admin') {
    return { main: [], account: withDisabled(SUPERADMIN_NAV_ACCOUNT, false, t) };
  }
  const usersNavEnabled = hasAnyUsersModulePermission(user);
  const walletsNavEnabled = hasAnyWalletsPermission(user);
  const transactionsNavEnabled = hasAnyTransactionsPermission(user);
  const drawingsNavEnabled = hasAnyDrawingsPermission(user);
  const membershipNavEnabled = hasAnyMembershipPermission(user);
  const announcementsNavEnabled = hasAnyAnnouncementsPermission(user);
  const supportNavEnabled = hasAnySupportTicketsPermission(user);
  const settingsNavEnabled = hasAnySettingsPermission(user);

  const main = SUPERADMIN_NAV_MAIN.map((item) => {
    let disabled = true;
    if (item.href === '/dashboard/superadmin') disabled = false;
    else if (item.href === '/dashboard/superadmin/users') disabled = !usersNavEnabled;
    else if (item.href === '/dashboard/superadmin/wallets') disabled = !walletsNavEnabled;
    else if (item.href === '/dashboard/superadmin/transactions') disabled = !transactionsNavEnabled;
    else if (item.href === '/dashboard/superadmin/drawings') disabled = !drawingsNavEnabled;
    else if (item.href === '/dashboard/superadmin/membership') disabled = !membershipNavEnabled;
    else if (item.href === '/dashboard/superadmin/community-announcements') disabled = !announcementsNavEnabled;
    else if (item.href === '/dashboard/superadmin/support-tickets') disabled = !supportNavEnabled;
    else if (item.href === '/dashboard/superadmin/settings') disabled = !settingsNavEnabled;
    return { ...withLabels(item, t), disabled };
  });

  return {
    main,
    account: withDisabled(SUPERADMIN_NAV_ACCOUNT, false, t),
  };
}
