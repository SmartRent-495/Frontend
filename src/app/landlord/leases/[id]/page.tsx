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
} from '@mui/material';
import { CalendarToday as CalendarIcon, Person as PersonIcon, Home as HomeIcon } from '@mui/icons-material';
import { leasesApi } from '@/lib/api-client';
import { paths } from '@/paths';

export default function LeaseDetailPage() {
  const params = useParams();
  const leaseId = String((params as any).id || '');
  const router = useRouter();

  const [lease, setLease] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await leasesApi.getById(leaseId as any);
        setLease(data);
      } catch (err) {
        console.error('Failed to load lease', err);
        setError('Failed to load lease');
      } finally {
        setLoading(false);
      }
    }
    if (leaseId) load();
  }, [leaseId]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading lease...</Typography>
      </Box>
    );
  }

  if (!lease) {
    return (
      <Container sx={{ py: 4 }}>
        <Card sx={{ p: 4 }}>
          <CardContent>
            <Typography variant="h6">Lease not found</Typography>
            <Button onClick={() => router.push(paths.landlord.leases)} sx={{ mt: 2 }}>Back to Leases</Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Lease Details</Typography>
          <Button onClick={() => router.push(paths.landlord.leases)} variant="text">Back to Leases</Button>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{lease.propertyTitle || lease.propertyAddress || 'Property'}</Typography>
                <Chip label={(lease.status || '').toUpperCase()} />
              </Box>

              <Box display="flex" gap={2} alignItems="center">
                <HomeIcon />
                <Typography>{lease.propertyAddress}</Typography>
              </Box>

              <Box display="flex" gap={2} alignItems="center">
                <PersonIcon />
                <Typography>{lease.tenantName || lease.tenantEmail || 'Tenant'}</Typography>
              </Box>

              <Box display="flex" gap={2} alignItems="center">
                <CalendarIcon />
                <Typography>Start: {formatDate(lease.startDate)}</Typography>
                <Typography>End: {formatDate(lease.endDate)}</Typography>
              </Box>

              <Typography variant="h5" color="primary">{formatCurrency(lease.monthlyRent)} / month</Typography>

              {lease.leaseDocumentUrl && (
                <Button href={lease.leaseDocumentUrl} target="_blank" rel="noreferrer">Download Lease Document</Button>
              )}

              {lease.notes && (
                <Box>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography>{lease.notes}</Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
