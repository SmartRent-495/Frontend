export const paths = {
  home: '/',
  auth: { 
    signIn: '/auth/sign-in', 
    signUp: '/auth/sign-up', 
    resetPassword: '/auth/reset-password' 
  },
  // Landlord Dashboard
  landlord: {
    overview: '/landlord',
    properties: '/landlord/properties',
    applications: '/landlord/applications',
    leases: '/landlord/leases',
    tenants: '/landlord/tenants',
    maintenance: '/landlord/maintenance',
    payments: '/landlord/payments',
    notifications: '/landlord/notifications',
    settings: '/landlord/settings',
  },
  // Tenant Dashboard
  tenant: {
    dashboard: '/tenant',
    overview: '/tenant',
    properties: '/tenant/properties',
    applications: '/tenant/applications',
    lease: '/tenant/lease',
    maintenance: '/tenant/maintenance',
    payments: '/tenant/payments',
    notifications: '/tenant/notifications',
    account: '/tenant/account',
    settings: '/tenant/settings',
    myLease: '/tenant/my-lease',
  },
  // Generic dashboard 
  dashboard: {
    overview: '/dashboard',
    properties: '/dashboard/properties',
    leases: '/dashboard/leases',
    maintenance: '/dashboard/maintenance',
    payments: '/dashboard/payments',
    tenants: '/dashboard/tenants',
    account: '/dashboard/account',
    settings: '/dashboard/settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
