'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { auth } from '@/lib/firebase/config'; // Import auth to get the current user
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid, 
  Chip,
  CircularProgress,
  Alert,
  Container,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  utilitiesCost: number;
  paymentDueDay: number;
  status: 'pending' | 'active' | 'expired' | 'terminated';
  leaseDocumentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  propertyTitle?: string;
  propertyAddress?: string;
  tenantName?: string;
  tenantEmail?: string;
}

export default function LeasesPage() {
  const { user } = useUser();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      setLoading(true);
      
      // Get the current Firebase user directly from auth
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = await currentUser.getIdToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leases`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leases');
      }

      const data = await response.json();
      setLeases(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leases');
      console.error('Error fetching leases:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'default' | 'error' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'default';
      case 'terminated':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        flexDirection="column"
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Loading leases...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            Leases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your property leases
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/landlord/leases/new"
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
        >
          Create Lease
        </Button>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Leases Grid */}
      {leases.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              No leases yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create your first lease to get started
            </Typography>
            <Button
              component={Link}
              href="/landlord/leases/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create Lease
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {leases.map((lease) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={lease.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header with Title and Status */}
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" component="h2" fontWeight="bold" sx={{ flexGrow: 1 }}>
                      {lease.propertyTitle || 'Property'}
                    </Typography>
                    <Chip
                      label={lease.status.toUpperCase()}
                      color={getStatusColor(lease.status)}
                      size="small"
                    />
                  </Box>

                  {/* Property Address */}
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <HomeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {lease.propertyAddress}
                    </Typography>
                  </Stack>

                  {/* Tenant Info */}
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {lease.tenantName || 'No tenant'}
                    </Typography>
                  </Stack>

                  {/* Monthly Rent */}
                  <Stack direction="row" spacing={1} alignItems="center" mb={3}>
                    <MoneyIcon fontSize="small" color="action" />
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {formatCurrency(lease.monthlyRent)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /month
                    </Typography>
                  </Stack>

                  {/* Lease Period */}
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Start:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(lease.startDate)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        End:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(lease.endDate)}
                      </Typography>
                    </Stack>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    component={Link}
                    href={`/landlord/leases/${lease.id}`}
                    variant="outlined"
                    fullWidth
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}