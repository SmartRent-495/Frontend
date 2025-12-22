'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { XCircle as XIcon } from '@phosphor-icons/react/dist/ssr/XCircle';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { FileText as FileIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Application {
  id: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyTitle: string;
  propertyAddress: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  leaseId?: string;
  rejectionReason?: string;
}

export default function LandlordApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState<Application | null>(null);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [monthlyRent, setMonthlyRent] = React.useState('');
  const [depositAmount, setDepositAmount] = React.useState('');
  const [terms, setTerms] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');

  React.useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch(`${API_URL}/applications/landlord`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      console.error('Fetch applications error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproveDialog = (app: Application) => {
    setSelectedApp(app);
    setApproveDialogOpen(true);
    // Set default dates (today + 1 year)
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextYear.toISOString().split('T')[0]);
    setMonthlyRent('');
    setDepositAmount('');
    setTerms('Standard lease agreement. Tenant agrees to maintain property in good condition.');
  };

  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setSelectedApp(null);
    setError('');
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    if (!startDate || !endDate || !monthlyRent) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch(`${API_URL}/applications/${selectedApp.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          monthlyRent: parseFloat(monthlyRent),
          depositAmount: parseFloat(depositAmount || '0'),
          terms,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve application');
      }

      handleCloseApproveDialog();
      fetchApplications(); // Refresh list
    } catch (err: any) {
      console.error('Approve application error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRejectDialog = (app: Application) => {
    setSelectedApp(app);
    setRejectDialogOpen(true);
    setRejectReason('');
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedApp(null);
    setError('');
  };

  const handleReject = async () => {
    if (!selectedApp) return;

    try {
      setSubmitting(true);
      setError('');

      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch(`${API_URL}/applications/${selectedApp.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: rejectReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject application');
      }

      handleCloseRejectDialog();
      fetchApplications(); // Refresh list
    } catch (err: any) {
      console.error('Reject application error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckIcon weight="fill" />;
      case 'rejected':
        return <XIcon weight="fill" />;
      case 'pending':
        return <ClockIcon weight="fill" />;
      default:
        return undefined;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading applications...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  const pendingApplications = applications.filter((a) => a.status === 'pending');
  const approvedApplications = applications.filter((a) => a.status === 'approved');
  const rejectedApplications = applications.filter((a) => a.status === 'rejected');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileIcon size={32} color="white" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Rental Applications
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Review and manage tenant applications
              </Typography>
            </Box>
          </Stack>
        </Box>

        {error && !approveDialogOpen && !rejectDialogOpen && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)' }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" color="warning.dark">
                {pendingApplications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)' }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" color="success.dark">
                {approvedApplications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)' }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" color="error.dark">
                {rejectedApplications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Declined
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Pending Applications */}
        {pendingApplications.length > 0 && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <ClockIcon size={24} color="#ed6c02" />
              <Typography variant="h5" fontWeight="bold">
                Pending Applications
              </Typography>
              <Chip
                label={pendingApplications.length}
                size="small"
                color="warning"
                sx={{ ml: 1, fontWeight: 'bold' }}
              />
            </Stack>

            <Stack spacing={2}>
              {pendingApplications.map((app) => (
                <Card
                  key={app.id}
                  sx={{
                    border: '2px solid',
                    borderColor: 'warning.light',
                    background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {app.tenantName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Applied for: <strong>{app.propertyTitle}</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {app.propertyAddress}
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(app.status)}
                          label="Pending"
                          color={getStatusColor(app.status) as any}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Stack>

                      <Divider />

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {app.tenantEmail}
                          </Typography>
                        </Box>
                        {app.tenantPhone && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {app.tenantPhone}
                            </Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Applied on
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDate(app.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      {app.message && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Message from tenant
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {app.message}
                          </Typography>
                        </Box>
                      )}

                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          onClick={() => handleOpenApproveDialog(app)}
                        >
                          Approve & Create Lease
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          onClick={() => handleOpenRejectDialog(app)}
                        >
                          Decline
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Approved Applications */}
        {approvedApplications.length > 0 && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <CheckIcon size={24} color="#2e7d32" weight="fill" />
              <Typography variant="h5" fontWeight="bold">
                Approved Applications
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {approvedApplications.map((app) => (
                <Card key={app.id} sx={{ borderLeft: '4px solid', borderColor: 'success.main' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {app.tenantName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {app.propertyTitle} • Approved {app.approvedAt && formatDate(app.approvedAt)}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        onClick={() => router.push('/landlord/leases')}
                      >
                        View Lease
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Rejected Applications */}
        {rejectedApplications.length > 0 && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <XIcon size={24} color="#d32f2f" weight="fill" />
              <Typography variant="h5" fontWeight="bold">
                Declined Applications
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {rejectedApplications.map((app) => (
                <Card key={app.id} sx={{ borderLeft: '4px solid', borderColor: 'error.main', opacity: 0.7 }}>
                  <CardContent>
                    <Typography variant="body1" fontWeight="medium">
                      {app.tenantName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {app.propertyTitle} • Declined {app.rejectedAt && formatDate(app.rejectedAt)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Empty State */}
        {applications.length === 0 && (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <FileIcon size={80} color="#9e9e9e" />
                <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="bold" sx={{ mt: 3 }}>
                  No applications yet
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Applications from tenants will appear here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleCloseApproveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Application & Create Lease</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Tenant:</strong> {selectedApp?.tenantName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Property:</strong> {selectedApp?.propertyTitle}
              </Typography>
            </Box>

            <TextField
              label="Lease Start Date *"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />

            <TextField
              label="Lease End Date *"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />

            <TextField
              label="Monthly Rent *"
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              placeholder="0.00"
              InputProps={{ startAdornment: '$' }}
              fullWidth
              required
            />

            <TextField
              label="Security Deposit"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              InputProps={{ startAdornment: '$' }}
              fullWidth
            />

            <TextField
              label="Lease Terms"
              multiline
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Enter any specific terms or conditions..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleApprove} variant="contained" color="success" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Approve & Create Lease'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Decline Application</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box>
              <Typography variant="body2" gutterBottom>
                Are you sure you want to decline this application?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Tenant:</strong> {selectedApp?.tenantName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Property:</strong> {selectedApp?.propertyTitle}
              </Typography>
            </Box>

            <TextField
              label="Reason (Optional)"
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Optional reason for declining..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleReject} variant="contained" color="error" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Decline Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
