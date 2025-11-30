import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const tenantNavItems = [
  { key: 'dashboard', title: 'Dashboard', href: paths.tenant.dashboard, icon: 'house' },
  { key: 'properties', title: 'Browse Properties', href: paths.tenant.properties, icon: 'buildings' },
  { key: 'applications', title: 'My Applications', href: paths.tenant.applications, icon: 'file-text' },
  { key: 'lease', title: 'My Lease', href: paths.tenant.lease, icon: 'file-text' },
  { key: 'payments', title: 'Payments', href: paths.tenant.payments, icon: 'credit-card' },
  { key: 'maintenance', title: 'Maintenance', href: paths.tenant.maintenance, icon: 'wrench' },
  { key: 'documents', title: 'Documents', href: paths.tenant.documents, icon: 'folder' },
] satisfies NavItemConfig[];
