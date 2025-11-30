'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Enriched fields
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
}

type FilterStatus = 'all' | 'pending' | 'active' | 'expired' | 'terminated';

export default function TenantLeasesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      setLoading(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('User not authenticated');
        setLeases([]);
        return;
      }

      const token = await currentUser.getIdToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.warn('Leases API returned status:', response.status);
        setLeases([]);
        return;
      }

      const data = await response.json();
      const leasesList = Array.isArray(data?.data) ? data.data : [];
      setLeases(leasesList);
      
    } catch (err: any) {
      console.error('Error fetching leases:', err);
      setLeases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirm = (lease: Lease, action: 'accept' | 'reject') => {
    setSelectedLease(lease);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirm = () => {
    setConfirmDialogOpen(false);
    setSelectedLease(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedLease || !actionType) return;

    try {
      setSubmitting(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      
      const newStatus = actionType === 'accept' ? 'active' : 'terminated';
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leases/${selectedLease.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update lease');
      }

      await fetchLeases();
      handleCloseConfirm();
      
      // Show success message
      setError(null);
    } catch (err: any) {
      console.error('Error updating lease:', err);
      alert(err.message || 'Failed to update lease');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'active': return 'success';
      case 'expired': return 'default';
      case 'terminated': return 'error';
      default: return 'default';
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

  const filteredLeases = leases.filter(lease => {
    if (filter === 'all') return true;
    return lease.status === filter;
  });

  const stats = {
    total: leases.length,
    pending: leases.filter(l => l.status === 'pending').length,
    active: leases.filter(l => l.status === 'active').length,
    expired: leases.filter(l => l.status === 'expired').length
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading leases...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Leases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your rental lease agreements
          </Typography>
        </Box>

        {/* Pending Leases Alert */}
        {stats.pending > 0 && (
          <Alert severity="info">
            You have {stats.pending} pending lease{stats.pending > 1 ? 's' : ''} waiting for your acceptance. Please review and accept to activate your rental.
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'all' ? 2 : 0,
                borderColor: 'primary.main',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setFilter('all')}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Leases
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'pending' ? 2 : 0,
                borderColor: 'warning.main',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setFilter('pending')}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'active' ? 2 : 0,
                borderColor: 'success.main',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setFilter('active')}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'expired' ? 2 : 0,
                borderColor: 'grey.400',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setFilter('expired')}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="text.secondary">
                  {stats.expired}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expired
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Filter */}
        {filter !== 'all' && (
          <Box>
            <Chip
              label={`Showing: ${filter}`}
              onDelete={() => setFilter('all')}
              color={getStatusColor(filter)}
            />
          </Box>
        )}

        {/* Leases List */}
        {filteredLeases.length === 0 ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No leases found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filter !== 'all' 
                    ? 'No leases match the selected filter'
                    : 'Your lease agreements will appear here once your landlord creates them'
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={3}>
            {filteredLeases.map((lease) => (
              <Card 
                key={lease.id} 
                sx={{ 
                  transition: 'all 0.2s', 
                  '&:hover': { boxShadow: 4 },
                  border: lease.status === 'pending' ? 2 : 0,
                  borderColor: 'warning.main'
                }}
              >
                <CardContent>
                  <Stack spacing={3}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Chip
                            label={lease.status.toUpperCase()}
                            color={getStatusColor(lease.status)}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="h6" fontWeight="bold">
                          {lease.propertyTitle || 'Property Lease'}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <HomeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {lease.propertyAddress}
                            {lease.propertyCity && `, ${lease.propertyCity}`}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>

                    {/* Lease Details */}
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Monthly Rent
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="baseline">
                            <Typography variant="h5" fontWeight="bold" color="primary">
                              {formatCurrency(lease.monthlyRent)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              /month
                            </Typography>
                          </Stack>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Security Deposit
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(lease.securityDeposit)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Lease Start
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(lease.startDate)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Lease End
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(lease.endDate)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Additional Info */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Payment Due Day
                        </Typography>
                        <Typography variant="body2">
                          Day {lease.paymentDueDay} of each month
                        </Typography>
                      </Grid>
                      
                      {lease.utilitiesCost > 0 && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Utilities Cost
                          </Typography>
                          <Typography variant="body2">
                            {formatCurrency(lease.utilitiesCost)}/month
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    {lease.notes && (
                      <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                          Notes
                        </Typography>
                        <Typography variant="body2">
                          {lease.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* Actions for Pending Leases */}
                    {lease.status === 'pending' && (
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleOpenConfirm(lease, 'accept')}
                          fullWidth
                        >
                          Accept Lease
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenConfirm(lease, 'reject')}
                          fullWidth
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'accept' ? 'Accept Lease' : 'Reject Lease'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {actionType === 'accept' 
              ? 'Are you sure you want to accept this lease? By accepting, you agree to the terms and conditions outlined in the lease agreement.'
              : 'Are you sure you want to reject this lease? This action cannot be undone.'
            }
          </Typography>
          
          {selectedLease && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {selectedLease.propertyTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedLease.propertyAddress}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Monthly Rent: <strong>{formatCurrency(selectedLease.monthlyRent)}</strong>
              </Typography>
              <Typography variant="body2">
                Duration: {formatDate(selectedLease.startDate)} - {formatDate(selectedLease.endDate)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained"
            color={actionType === 'accept' ? 'success' : 'error'}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : (actionType === 'accept' ? 'Accept' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}