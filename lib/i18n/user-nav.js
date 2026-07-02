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
  Megaphone,
  Headphones,
} from 'lucide-react';

export const USER_NAV_ITEMS = [
  { href: '/dashboard/user', key: 'overview', icon: Home },
  { href: '/dashboard/user/wallet', key: 'wallet', icon: Wallet },
  { href: '/dashboard/user/deposit', key: 'deposit', icon: ArrowDown },
  { href: '/dashboard/user/buy', key: 'buy', icon: Coins },
  { href: '/dashboard/user/history', key: 'history', icon: History },
  { href: '/dashboard/user/transfer', key: 'transfer', icon: ArrowRightLeft },
  { href: '/dashboard/user/drawings', key: 'drawings', icon: Gift },
  { href: '/dashboard/user/membership', key: 'membership', icon: Users },
  { href: '/dashboard/user/community-announcements', key: 'announcements', icon: Megaphone },
  { href: '/dashboard/user/support', key: 'support', icon: Headphones },
  { href: '/dashboard/user/profile', key: 'profile', icon: User },
];

export function getUserNav(t) {
  return USER_NAV_ITEMS.map((item) => ({
    ...item,
    label: t(`dashboard.nav.${item.key}.label`),
    description: t(`dashboard.nav.${item.key}.description`),
  }));
}
