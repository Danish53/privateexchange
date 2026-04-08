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
  {
    href: '/dashboard/superadmin/tokens',
    label: 'Tokens',
    description: 'Supported assets & rules',
    icon: Coins,
  },
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
