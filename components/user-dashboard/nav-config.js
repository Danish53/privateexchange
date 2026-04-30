import {
  Wallet,
  ArrowRightLeft,
  Gift,
  Users,
  User,
  Home,
  History,
  ArrowDown,
  Coins,
} from 'lucide-react';

export const USER_NAV = [
  {
    href: '/dashboard/user',
    label: 'Overview',
    description: 'Balances',
    icon: Home,
  },
  {
    href: '/dashboard/user/wallet',
    label: 'Wallet',
    description: 'Tokens',
    icon: Wallet,
  },
  {
    href: '/dashboard/user/deposit',
    label: 'Deposit',
    description: 'Add Funds',
    icon: ArrowDown,
  },
  {
    href: '/dashboard/user/buy',
    label: 'Buy Crypto',
    description: 'Tokens',
    icon: Coins,
  },
  {
    href: '/dashboard/user/history',
    label: 'History',
    description: 'Ledger',
    icon: History,
  },
  {
    href: '/dashboard/user/transfer',
    label: 'Transfer',
    description: 'Send',
    icon: ArrowRightLeft,
  },
  {
    href: '/dashboard/user/drawings',
    label: 'Drawings',
    description: 'Pools',
    icon: Gift,
  },
  {
    href: '/dashboard/user/membership',
    label: 'Membership',
    description: 'Tier',
    icon: Users,
  },
  {
    href: '/dashboard/user/profile',
    label: 'Profile',
    description: 'Account',
    icon: User,
  },
];
