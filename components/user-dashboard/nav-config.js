import {
  Wallet,
  ArrowRightLeft,
  Gift,
  Users,
  User,
  Home,
} from 'lucide-react';

export const USER_NAV = [
  {
    href: '/dashboard/user',
    label: 'Overview',
    description: 'Home & balances',
    icon: Home,
  },
  {
    href: '/dashboard/user/wallet',
    label: 'Wallet',
    description: 'Tokens & history',
    icon: Wallet,
  },
  {
    href: '/dashboard/user/transfer',
    label: 'Transfer',
    description: 'P2P send',
    icon: ArrowRightLeft,
  },
  {
    href: '/dashboard/user/drawings',
    label: 'Drawings',
    description: 'Rewards',
    icon: Gift,
  },
  {
    href: '/dashboard/user/membership',
    label: 'Membership',
    description: 'Tier & benefits',
    icon: Users,
  },
  {
    href: '/dashboard/user/profile',
    label: 'Profile',
    description: 'Account & verification',
    icon: User,
  },
];
