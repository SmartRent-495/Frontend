import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const landlordNavItems = [
  { key: 'overview', title: 'Dashboard', href: paths.landlord.overview, icon: 'chart-pie' },
  { key: 'properties', title: 'Properties', href: paths.landlord.properties, icon: 'house' },
  { key: 'leases', title: 'Leases', href: paths.landlord.leases, icon: 'file-text' },
  { key: 'tenants', title: 'Tenants', href: paths.landlord.tenants, icon: 'users' },
  { key: 'maintenance', title: 'Maintenance', href: paths.landlord.maintenance, icon: 'wrench' },
  { key: 'payments', title: 'Payments', href: paths.landlord.payments, icon: 'currency-dollar' },
  { key: 'account', title: 'Account', href: paths.landlord.account, icon: 'user' },
  { key: 'settings', title: 'Settings', href: paths.landlord.settings, icon: 'gear-six' },
] satisfies NavItemConfig[];
