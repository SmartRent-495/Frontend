'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { leasesApi } from '@/lib/api-client';
import { paths } from '@/paths';
import type { Lease } from '@/types/lease';

export default function LeaseDetailPage() {
  const params = useParams();
  const leaseId = String((params as any).id || '');
  const router = useRouter();

  const [lease, setLease] = React.useState<Lease | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await leasesApi.getById(leaseId);
        setLease(data);
      } catch (error_) {
        console.error('Failed to load lease', error_);
      } finally {
        setLoading(false);
      }
    }
    if (leaseId) {
      load();
    }
  }, [leaseId]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getStatusColor = (status: string | undefined): 'success' | 'warning' | 'default' | 'error' => {
    switch (status) {
      case 'active': {
        return 'success';
      }
      case 'pending': {
        return 'warning';
      }
      case 'expired': {
        return 'default';
      }
      case 'terminated': {
        return 'error';
      }
      default: {
        return 'default';
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            Loading lease details...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!lease) {
    return (
      <Container sx={{ py: 4 }}>
        <Card sx={{ p: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lease not found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The requested lease could not be found or you don't have permission to view it.
            </Typography>
            <Button onClick={() => router.push(paths.landlord.leases)} variant="contained">
              Back to Leases
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold">
            Lease Details
          </Typography>
          <Button onClick={() => router.push(paths.landlord.leases)} variant="text">
            Back to Leases
          </Button>
        </Box>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column - Lease Information */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight="bold">
                    Lease Information
                  </Typography>
                  <Chip label={lease.status?.toUpperCase() || 'UNKNOWN'} color={getStatusColor(lease.status)} />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Property Details */}
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom color="primary" display="flex" alignItems="center" gap={1}>
                    <HomeIcon /> Property
                  </Typography>
                  <Stack spacing={1} sx={{ pl: 4 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {lease.property_title || 'Property'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lease.property_address || 'No address'}
                    </Typography>
                    {lease.property_city && (
                      <Typography variant="body2" color="text.secondary">
                        {lease.property_city}
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Tenant Details */}
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom color="primary" display="flex" alignItems="center" gap={1}>
                    <PersonIcon /> Tenant
                  </Typography>
                  <Stack spacing={1} sx={{ pl: 4 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {lease.tenant_name || lease.tenant_first_name + ' ' + lease.tenant_last_name || 'Tenant'}
                    </Typography>
                    {lease.tenant_email && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <EmailIcon fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {lease.tenant_email}
                        </Typography>
                      </Box>
                    )}
                    {lease.tenant_phone && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {lease.tenant_phone}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Landlord Details */}
                {lease.landlord_name && (
                  <>
                    <Box mb={3}>
                      <Typography variant="h6" gutterBottom color="primary">
                        Landlord
                      </Typography>
                      <Stack spacing={1} sx={{ pl: 4 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {lease.landlord_name}
                        </Typography>
                        {lease.landlord_email && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <EmailIcon fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              {lease.landlord_email}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                  </>
                )}

                {/* Lease Terms */}
                <Box>
                  <Typography variant="h6" gutterBottom color="primary" display="flex" alignItems="center" gap={1}>
                    <CalendarIcon /> Lease Terms
                  </Typography>
                  <Stack spacing={2} sx={{ pl: 4 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(lease.start_date)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(lease.end_date)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Payment Due Day
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {lease.payment_due_day || 1} of each month
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Notes */}
                {lease.notes && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Box>
                      <Typography variant="h6" gutterBottom color="primary">
                        Notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                        {lease.notes}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Financial Summary */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" display="flex" alignItems="center" gap={1}>
                  <MoneyIcon /> Financial Summary
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Monthly Rent
                    </Typography>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {formatCurrency(lease.monthly_rent)}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Security Deposit
                    </Typography>
                    <Typography variant="h5" fontWeight="medium">
                      {formatCurrency(lease.security_deposit)}
                    </Typography>
                  </Box>

                  {lease.utilities_cost > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Utilities Cost
                        </Typography>
                        <Typography variant="h5" fontWeight="medium">
                          {formatCurrency(lease.utilities_cost)}
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Divider />

                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Monthly Payment
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency((lease.monthly_rent || 0) + (lease.utilities_cost || 0))}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
