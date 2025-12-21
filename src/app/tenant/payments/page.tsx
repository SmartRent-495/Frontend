'use client';

import { useState, useEffect, useContext } from 'react';
import { UserContext } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  Wallet as WalletIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  currency: string;
  type: string;
  period: string;
  status: "pending" | "paid" | "failed" | "refunded";
  createdAt: any;
  paidAt: any;
}

interface Lease {
  id: string;
  propertyTitle?: string;
  monthlyRent: number;
  status: string;
}

export default function PaymentsPage() {
  const { user, isLoading } = useContext(UserContext)!;
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    fetchData();
  }, [user, isLoading, router]);

  const fetchData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Not authenticated");
      }

      const token = await currentUser.getIdToken();

      const paymentsRes = await fetch(`${API_URL}/payments/tenant`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const paymentsData = await paymentsRes.json();

      const leasesRes = await fetch(`${API_URL}/leases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const leasesData = await leasesRes.json();

      setPayments(paymentsData.payments || []);
      setLeases(leasesData.leases || leasesData.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handlePayRent = async (leaseId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Not authenticated");
      }

      const token = await currentUser.getIdToken();

      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const res = await fetch(`${API_URL}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaseId,
          period,
          type: "rent",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        
        if (res.status === 409) {
          const paymentsRes = await fetch(`${API_URL}/payments/tenant`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const paymentsData = await paymentsRes.json();
          
          const existingPayment = paymentsData.payments?.find(
            (p: any) => p.leaseId === leaseId && p.period === period
          );
          
          if (existingPayment) {
            if (existingPayment.status === "paid") {
              alert(`You already paid for ${period}!`);
              return;
            }
            
            router.push(`/tenant/payments/${existingPayment.id}`);
            return;
          }
        }
        
        alert(error.error || "Failed to create payment");
        return;
      }

      const data = await res.json();
      router.push(`/tenant/payments/${data.paymentId}`);
    } catch (err) {
      console.error("Payment creation error:", err);
      alert("Failed to create payment");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const completedPayments = payments.filter((p) => p.status === "paid");
  const activeLeases = leases.filter((l) => l.status === "active");

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
                justifyContent: 'center'
              }}
            >
              <WalletIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Payments
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your rent payments and view transaction history
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Active Leases */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <HomeIcon color="action" />
            <Typography variant="h5" fontWeight="bold">
              Active Leases
            </Typography>
          </Stack>

          {activeLeases.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {activeLeases.map((lease) => (
                <Card
                  key={lease.id}
                  sx={{
                    flex: '1 1 300px',
                    maxWidth: 400,
                    position: 'relative',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
                      borderRadius: '4px 4px 0 0'
                    }
                  }}
                >
                  <CardContent>
                    <Stack spacing={3}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                          <Box sx={{ p: 1, bgcolor: 'primary.lighter', borderRadius: 1.5 }}>
                            <HomeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          </Box>
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Stack>
                        
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {lease.propertyTitle || 'Property'}
                        </Typography>
                        
                        <Stack direction="row" spacing={0.5} alignItems="baseline">
                          <Typography variant="h4" fontWeight="bold" color="primary">
                            {formatCurrency(lease.monthlyRent)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            /month
                          </Typography>
                        </Stack>
                      </Box>

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CreditCardIcon />}
                        onClick={() => handlePayRent(lease.id)}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 'bold',
                          boxShadow: 2
                        }}
                      >
                        Pay This Month's Rent
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <HomeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No active leases found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your active properties will appear here
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <ScheduleIcon sx={{ color: 'warning.main' }} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    bgcolor: 'warning.main',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}
                />
              </Box>
              <Typography variant="h5" fontWeight="bold">
                Pending Payments
              </Typography>
              <Chip
                label={`${pendingPayments.length} pending`}
                size="small"
                color="warning"
                sx={{ ml: 'auto' }}
              />
            </Stack>

            <Stack spacing={2}>
              {pendingPayments.map((payment) => (
                <Card
                  key={payment.id}
                  sx={{
                    background: 'linear-gradient(135deg, #fff5f0 0%, #ffe9e0 100%)',
                    border: '2px solid',
                    borderColor: 'warning.light',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 4,
                      borderColor: 'warning.main'
                    }
                  }}
                >
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                          <Chip
                            icon={<ScheduleIcon />}
                            label="Pending"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 'bold' }}
                          />
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {payment.period}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="baseline">
                          <Typography variant="h5" fontWeight="bold">
                            {formatCurrency(payment.amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                            • {payment.type}
                          </Typography>
                        </Stack>
                      </Box>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() => router.push(`/tenant/payments/${payment.id}`)}
                        sx={{
                          minWidth: 180,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 'bold',
                          boxShadow: 2
                        }}
                      >
                        Complete Payment
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Payment History */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <ReceiptIcon color="action" />
            <Typography variant="h5" fontWeight="bold">
              Payment History
            </Typography>
          </Stack>

          <Card>
            {completedPayments.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarIcon fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            Period
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          Type
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CreditCardIcon fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            Amount
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          Status
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          Date Paid
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {completedPayments.map((payment) => (
                      <TableRow
                        key={payment.id}
                        sx={{
                          '&:hover': { bgcolor: 'grey.50' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {payment.period}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.type}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Paid"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No payment history yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your completed payments will appear here
                  </Typography>
                </Box>
              </CardContent>
            )}
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}