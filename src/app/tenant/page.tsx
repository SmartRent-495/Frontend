'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import { useRouter } from 'next/navigation';
import { paths } from '@/paths';
import { propertiesApi, leasesApi, maintenanceApi, paymentsApi } from '@/lib/api-client';
import type { Property, Lease, MaintenanceRequest, Payment } from '@/types';

import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { FileText as FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { Wrench as WrenchIcon } from '@phosphor-icons/react/dist/ssr/Wrench';
import { CreditCard as CreditCardIcon } from '@phosphor-icons/react/dist/ssr/CreditCard';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';

interface TenantStats {
  availableProperties: number;
  myApplications: number;
  openMaintenanceRequests: number;
  paymentsDueAmount: number;
  pendingPaymentsCount: number;
  hasActiveLease: boolean;
  currentLease?: Lease;
  latestOpenMaintenance?: MaintenanceRequest;
  nextPayment?: Payment; 

}

function safeText(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s.length ? s : fallback;
}

function getPaymentType(payment: any): string {
  if (!payment) return '—';

  const types: string[] = [];

  if (Number(payment.depositAmount) > 0) types.push('Deposit');
  if (Number(payment.rentAmount) > 0) types.push('Rent');
  if (Number(payment.utilitiesAmount) > 0) types.push('Utilities');

  return types.length ? types.join(' + ') : 'Other';
}

function getDueDate(createdAt?: string): string {
  if (!createdAt) return '—';
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 7);
  return date.toLocaleDateString();
}


export default function Page(): React.JSX.Element {
  const router = useRouter();
  const [stats, setStats] = React.useState<TenantStats>({
    availableProperties: 0,
    myApplications: 0,
    openMaintenanceRequests: 0,
    paymentsDueAmount: 0,
    pendingPaymentsCount: 0,
    hasActiveLease: false,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTenantData() {
      try {
        setLoading(true);

        const [propertiesResponse, leasesResponse, maintenanceResponse, paymentsResponse] = await Promise.all([
          propertiesApi.getAll().catch(() => ({ data: [] })),
          leasesApi.getAll().catch(() => ({ data: [] })),
          maintenanceApi.getAll().catch(() => ({ data: [] })),
          paymentsApi.getTenantPayments().catch(() => ({ data: [] })),
        ]);

        const extractArray = <T,>(response: T[] | { data: T[] } | any): T[] => {
          if (Array.isArray(response)) return response;
          if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) return response.data;
          return [];
        };

        const properties = extractArray<Property>(propertiesResponse);
        const leases = extractArray<Lease>(leasesResponse);
        const maintenanceRequests = extractArray<MaintenanceRequest>(maintenanceResponse);
        const payments = extractArray<Payment>(paymentsResponse);

        const availableProperties = properties.filter((p) => (p as any).status === 'available').length;

        const myApplications = leases.filter((l) => (l as any).status === 'pending').length;

        const openMaintenance = maintenanceRequests.filter(
          (m) => (m as any).status === 'pending' || (m as any).status === 'in_progress'
        );

        const activeLease = leases.find((l) => (l as any).status === 'active');

        const pendingPayments = payments.filter((p) => (p as any).status === 'pending');
        const paymentsDueAmount = pendingPayments.reduce((sum, p) => sum + Number((p as any).amount ?? 0), 0);

        const nextPayment = pendingPayments[0];

        // pick something "latest" without assuming a specific field exists
        const latestOpenMaintenance = openMaintenance[0];

        setStats({
          availableProperties,
          myApplications,
          openMaintenanceRequests: openMaintenance.length,
          paymentsDueAmount,
          pendingPaymentsCount: pendingPayments.length,
          hasActiveLease: !!activeLease,
          currentLease: activeLease,
          latestOpenMaintenance,
          nextPayment, 
        });
      } catch (error) {
        console.error('Failed to fetch tenant dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTenantData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  const lease = stats.currentLease as any;

  const propertyLabel =
    safeText(lease?.propertyAddress, '') ||
    (lease?.propertyId ? `Property ID: ${safeText(lease.propertyId)}` : '—');

  const monthlyRent = lease?.monthlyRent ?? lease?.rent ?? null;

  const showPaymentAlert = stats.paymentsDueAmount > 0;
  const showMaintenanceAlert = stats.openMaintenanceRequests > 0;

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4">Welcome back</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {stats.hasActiveLease ? 'Here’s what needs your attention.' : 'Start by finding a place, then manage everything here.'}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {(showPaymentAlert || showMaintenanceAlert) && (
              <Chip
                icon={<BellIcon />}
                label={
                  showPaymentAlert && showMaintenanceAlert
                    ? '2 alerts'
                    : showPaymentAlert
                      ? 'Payment due'
                      : 'Maintenance open'
                }
                color={showPaymentAlert ? 'warning' : 'info'}
                variant="outlined"
              />
            )}
            <Chip label={stats.hasActiveLease ? 'Active Lease' : 'No Active Lease'} color={stats.hasActiveLease ? 'success' : 'default'} />
          </Stack>
        </Stack>

        {/* Top row: main cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
            gap: 3,
          }}
        >
          {/* Lease / Onboarding Card */}
          <Card>
            <CardContent>
              {stats.hasActiveLease ? (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        bgcolor: 'var(--mui-palette-primary-lightest)',
                        borderRadius: 2,
                        p: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--mui-palette-primary-main)',
                      }}
                    >
                      <BuildingsIcon fontSize="var(--Icon-fontSize)" />
                    </Box>
                    <Box>
                      <Typography variant="h6">Your Lease</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {propertyLabel}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Lease Period
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
                        fontWeight: 500,
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lease?.startDate && lease?.endDate
                        ? `${new Date(lease.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })} – ${new Date(lease.endDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}`
                        : 'Active Lease'}
                    </Typography>

                  </Box>

                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant="contained"
                      endIcon={<ArrowRightIcon />}
                      onClick={() => router.push(paths.tenant.lease)}
                    >
                      View Lease Details
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<WrenchIcon />}
                      onClick={() => router.push(paths.tenant.maintenance)}
                    >
                      Request Maintenance
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="h6">You’re not renting yet</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Browse available listings and submit an application. Once approved, your lease + payments + maintenance will show up here.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant="contained"
                      startIcon={<BuildingsIcon />}
                      onClick={() => router.push(paths.tenant.properties)}
                    >
                      Browse Properties
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileTextIcon />}
                      onClick={() => router.push(paths.tenant.applications)}
                    >
                      Track Applications
                    </Button>
                  </Stack>

                  <Divider />

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="overline" color="text.secondary">
                          Available Properties
                        </Typography>
                        <Typography variant="h4">{stats.availableProperties}</Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="overline" color="text.secondary">
                          My Applications
                        </Typography>
                        <Typography variant="h4">{stats.myApplications}</Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Payments Card */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: 'var(--mui-palette-success-lightest)',
                      borderRadius: 2,
                      p: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--mui-palette-success-main)',
                    }}
                  >
                    <CreditCardIcon fontSize="var(--Icon-fontSize)" />
                  </Box>
                  <Box>
                    <Typography variant="h6">Payments</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending balance + quick access
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Payment Request
                  </Typography>

                  <Typography variant="h6">
                    {stats.nextPayment
                      ? getPaymentType(stats.nextPayment)
                      : 'No pending payments'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Due by:{' '}
                    {stats.nextPayment
                      ? getDueDate((stats.nextPayment as any).createdAt)
                      : '—'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Status:{' '}
                    {stats.nextPayment
                      ? safeText((stats.nextPayment as any).status)
                      : '—'}
                  </Typography>
                </Box>


                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button variant="contained" onClick={() => router.push(paths.tenant.payments)}>
                    View / Pay
                  </Button>
                  <Button variant="text" onClick={() => router.push(paths.tenant.payments)}>
                    Payment history
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Bottom row: Maintenance + Activity */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* Maintenance */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: 'var(--mui-palette-error-lightest)',
                      borderRadius: 2,
                      p: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--mui-palette-error-main)',
                    }}
                  >
                    <WrenchIcon fontSize="var(--Icon-fontSize)" />
                  </Box>
                  <Box>
                    <Typography variant="h6">Maintenance</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track open requests
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Open Requests
                  </Typography>
                  <Typography variant="h4">{stats.openMaintenanceRequests}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.latestOpenMaintenance
                      ? `Latest: ${safeText((stats.latestOpenMaintenance as any).title, safeText((stats.latestOpenMaintenance as any).issue, 'Request'))}`
                      : 'No open requests'}
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={<WrenchIcon />}
                    disabled={!stats.hasActiveLease}
                    onClick={() => router.push(paths.tenant.maintenance)}
                  >
                    Request Maintenance
                  </Button>
                  <Button variant="outlined" onClick={() => router.push(paths.tenant.maintenance)}>
                    View Requests
                  </Button>
                </Stack>

                {!stats.hasActiveLease && (
                  <Typography variant="caption" color="text.secondary">
                    Maintenance requests become available after you have an active lease.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Recent / Helpful Links */}
          <Card>
            <CardContent>
              <Typography variant="h6">Quick Links</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                The only things a tenant actually uses weekly.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <List disablePadding>
                <ListItem
                  sx={{ px: 0, cursor: 'pointer' }}
                  onClick={() => router.push(paths.tenant.payments)}
                >
                  <ListItemText
                    primary="Payments"
                    secondary={showPaymentAlert ? 'You have a payment due' : 'View history and receipts'}
                  />
                  <ArrowRightIcon />
                </ListItem>
                <Divider />

                <ListItem
                  sx={{ px: 0, cursor: 'pointer' }}
                  onClick={() => router.push(paths.tenant.maintenance)}
                >
                  <ListItemText
                    primary="Maintenance"
                    secondary={showMaintenanceAlert ? 'There are open requests' : 'Submit and track requests'}
                  />
                  <ArrowRightIcon />
                </ListItem>
                <Divider />

                <ListItem
                  sx={{ px: 0, cursor: 'pointer' }}
                  onClick={() => router.push(paths.tenant.lease)}
                >
                  <ListItemText primary="My Lease" secondary="Review lease details anytime" />
                  <ArrowRightIcon />
                </ListItem>

                {!stats.hasActiveLease && (
                  <>
                    <Divider />
                    <ListItem
                      sx={{ px: 0, cursor: 'pointer' }}
                      onClick={() => router.push(paths.tenant.properties)}
                    >
                      <ListItemText primary="Browse Properties" secondary="Find a new place to rent" />
                      <ArrowRightIcon />
                    </ListItem>
                    <Divider />
                    <ListItem
                      sx={{ px: 0, cursor: 'pointer' }}
                      onClick={() => router.push(paths.tenant.applications)}
                    >
                      <ListItemText primary="My Applications" secondary="Track approvals and updates" />
                      <ArrowRightIcon />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
}
