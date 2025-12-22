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
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { XCircle as XIcon } from '@phosphor-icons/react/dist/ssr/XCircle';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { House as HouseIcon } from '@phosphor-icons/react/dist/ssr/House';
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

export default function TenantApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

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

      const res = await fetch(`${API_URL}/applications/tenant`, {
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
              <HouseIcon size={32} color="white" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                My Applications
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your rental applications
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => router.push('/tenant/properties')}
          >
            Browse Properties to Apply
          </Button>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

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
                        <Box>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {app.propertyTitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {app.propertyAddress}
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(app.status)}
                          label="Pending Review"
                          color={getStatusColor(app.status) as any}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Stack>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Applied on
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(app.createdAt)}
                        </Typography>
                      </Box>

                      {app.message && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Your message
                          </Typography>
                          <Typography variant="body2">{app.message}</Typography>
                        </Box>
                      )}
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
                <Card
                  key={app.id}
                  sx={{
                    border: '2px solid',
                    borderColor: 'success.light',
                    background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {app.propertyTitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {app.propertyAddress}
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(app.status)}
                          label="Approved"
                          color={getStatusColor(app.status) as any}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Stack>

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Applied on
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDate(app.createdAt)}
                          </Typography>
                        </Box>
                        {app.approvedAt && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Approved on
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatDate(app.approvedAt)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {app.leaseId && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => router.push('/tenant/lease')}
                        >
                          View My Lease
                        </Button>
                      )}
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
                <Card
                  key={app.id}
                  sx={{
                    border: '2px solid',
                    borderColor: 'error.light',
                    background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {app.propertyTitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {app.propertyAddress}
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(app.status)}
                          label="Declined"
                          color={getStatusColor(app.status) as any}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Stack>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Applied on
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(app.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
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
                <HouseIcon size={80} color="#9e9e9e" />
                <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="bold" sx={{ mt: 3 }}>
                  No applications yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Browse available properties and apply to start your rental journey
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push('/tenant/properties')}
                >
                  Browse Properties
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
