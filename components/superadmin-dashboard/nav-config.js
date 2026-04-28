import {
  Home,
  Users,
  Wallet,
  Activity,
  Coins,
  Gift,
  Shield,
  CreditCard,
  TrendingUp,
  Settings,
  UserCircle,
} from 'lucide-react';
import { hasAnyUsersModulePermission, hasAnyWalletsPermission, hasAnySettingsPermission } from '@/lib/adminPermissions';

/** Main operations — aligned with platform admin scope (proposal). */
export const SUPERADMIN_NAV_MAIN = [
  {
    href: '/dashboard/superadmin',
    label: 'Overview',
    description: 'Summary & platform health',
    icon: Home,
  },
  {
    href: '/dashboard/superadmin/users',
    label: 'Users',
    description: 'Accounts, roles & access',
    icon: Users,
  },
  {
    href: '/dashboard/superadmin/wallets',
    label: 'Wallets',
    description: 'Balances & token wallets',
    icon: Wallet,
  },
  {
    href: '/dashboard/superadmin/transactions',
    label: 'Transactions',
    description: 'Ledger & movements',
    icon: Activity,
  },
  // {
  //   href: '/dashboard/superadmin/tokens',
  //   label: 'Tokens',
  //   description: 'Supported assets & rules',
  //   icon: Coins,
  // },
  {
    href: '/dashboard/superadmin/drawings',
    label: 'Drawings',
    description: 'Campaigns & outcomes',
    icon: Gift,
  },
  {
    href: '/dashboard/superadmin/membership',
    label: 'Membership',
    description: 'Tiers & fee rules',
    icon: Shield,
  },
  {
    href: '/dashboard/superadmin/payments',
    label: 'Payments',
    description: 'Rails & settlements',
    icon: CreditCard,
  },
  {
    href: '/dashboard/superadmin/kpi',
    label: 'KPI tracker',
    description: 'Targets & performance',
    icon: TrendingUp,
  },
  {
    href: '/dashboard/superadmin/settings',
    label: 'Settings',
    description: 'Platform configuration',
    icon: Settings,
  },
];

export const SUPERADMIN_NAV_ACCOUNT = [
  {
    href: '/dashboard/superadmin/profile',
    label: 'Profile',
    description: 'Account, security & verification',
    icon: UserCircle,
  },
];

/**
 * @typedef {typeof SUPERADMIN_NAV_MAIN[number] & { disabled?: boolean }} SuperadminNavItem
 */

function withDisabled(items, disabled) {
  return items.map((item) => ({ ...item, disabled }));
}

/**
 * Superadmin: full nav, all enabled. Admin: same items; disabled where no permission (Users uses adminPermissions; other modules until flags exist).
 * @param {{ role?: string; adminPermissions?: Record<string, boolean> } | null | undefined} user
 * @returns {{ main: SuperadminNavItem[]; account: SuperadminNavItem[] }}
 */
export function getSuperadminNavSections(user) {
  if (!user || user.role === 'superadmin') {
    return {
      main: withDisabled(SUPERADMIN_NAV_MAIN, false),
      account: withDisabled(SUPERADMIN_NAV_ACCOUNT, false),
    };
  }
  if (user.role !== 'admin') {
    return { main: [], account: withDisabled(SUPERADMIN_NAV_ACCOUNT, false) };
  }
  const usersNavEnabled = hasAnyUsersModulePermission(user);
  const walletsNavEnabled = hasAnyWalletsPermission(user);
  const settingsNavEnabled = hasAnySettingsPermission(user);

  const main = SUPERADMIN_NAV_MAIN.map((item) => {
    if (item.href === '/dashboard/superadmin') {
      return { ...item, disabled: false };
    }
    if (item.href === '/dashboard/superadmin/users') {
      return { ...item, disabled: !usersNavEnabled };
    }
    if (item.href === '/dashboard/superadmin/wallets') {
      return { ...item, disabled: !walletsNavEnabled };
    }
    if (item.href === '/dashboard/superadmin/settings') {
      return { ...item, disabled: !settingsNavEnabled };
    }
    return { ...item, disabled: true };
  });

  return {
    main,
    account: withDisabled(SUPERADMIN_NAV_ACCOUNT, false),
  };
}
