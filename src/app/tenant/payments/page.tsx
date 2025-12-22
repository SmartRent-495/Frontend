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
  Paper,
  Divider,
} from '@mui/material';
import {
  Wallet as WalletIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Payment {
  id: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  leaseId?: string;
  amount: number;
  totalAmount: number;
  rentAmount: number;
  utilitiesAmount: number;
  depositAmount: number;

  currency: string;
  type: string;
  period: string;
  status: "pending" | "paid" | "failed" | "refunded";
  createdAt: any;
  paidAt: any;
  dueDate?: any;
  propertyTitle?: string;
  propertyAddress?: string;
  tenantName?: string;
}

export default function TenantPaymentsPage() {
  const { user, isLoading } = useContext(UserContext)!;
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    fetchPayments();
  }, [user, isLoading, router]);

  const fetchPayments = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Not authenticated");
      }

      const token = await currentUser.getIdToken();

      const res = await fetch(`${API_URL}/payments/tenant`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to load payments");
    } finally {
      setLoading(false);
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
    const date = timestamp._seconds 
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDueDate = (period: string) => {
    // Period format: YYYY-MM
    // Due date: 7th day of that month (YYYY-MM-07)
    if (!period || !/^\d{4}-\d{2}$/.test(period)) return null;
    
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 7); // Month is 0-indexed
  };

  const isOverdue = (payment: any) => {
    const dueDate = payment.dueDate 
      ? (payment.dueDate._seconds 
          ? new Date(payment.dueDate._seconds * 1000)
          : new Date(payment.dueDate))
      : calculateDueDate(payment.period);
    
    if (!dueDate) return false;
    return dueDate < new Date();
  };

  const getDueDate = (payment: any) => {
    if (payment.dueDate) {
      return payment.dueDate._seconds 
        ? new Date(payment.dueDate._seconds * 1000)
        : new Date(payment.dueDate);
    }
    return calculateDueDate(payment.period);
  };

  const getPaymentType = (payment: any) => {
    const types = [];
    if (payment.rentAmount > 0) types.push('Rent');
    if (payment.utilitiesAmount > 0) types.push('Utilities');
    if (payment.depositAmount > 0) types.push('Deposit');
    return types.length > 0 ? types.join(' + ') : 'Payment';
  };

  if (isLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading payments...</Typography>
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
  const failedPayments = payments.filter((p) => p.status === "failed");

  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.totalAmount || p.amount), 0);

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
                My Payments
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View and pay your rent and property charges
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)' }}>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ScheduleIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Pending
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight="bold" color="warning.dark">
                  {formatCurrency(totalPending)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''} due
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* <Card sx={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)' }}>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Total Paid
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight="bold" color="success.dark">
                  {formatCurrency(totalPaid)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {completedPayments.length} completed payment{completedPayments.length !== 1 ? 's' : ''}
                </Typography>
              </Stack>
            </CardContent>
          </Card> */}

          <Card sx={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' }}>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ReceiptIcon sx={{ color: 'info.main' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    All Time
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight="bold" color="info.dark">
                  {payments.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total transactions
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <ScheduleIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    bgcolor: 'error.main',
                    borderRadius: '50%',
                    border: '2px solid white',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 }
                    }
                  }}
                />
              </Box>
              <Typography variant="h5" fontWeight="bold">
                Payment Requests
              </Typography>
              <Chip
                label={`${pendingPayments.length} pending`}
                size="small"
                color="warning"
                sx={{ ml: 1, fontWeight: 'bold' }}
              />
            </Stack>

            <Stack spacing={2}>
              {pendingPayments.map((payment) => {
                const overdue = isOverdue(payment);
                const dueDate = getDueDate(payment);
                const paymentType = getPaymentType(payment);
                
                return (
                  <Card
                    key={payment.id}
                    sx={{
                      background: overdue 
                        ? 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)'
                        : 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
                      border: '2px solid',
                      borderColor: overdue ? 'error.light' : 'warning.light',
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: 6,
                        borderColor: overdue ? 'error.main' : 'warning.main',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Property Info */}
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: 'white',
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <HomeIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {payment.propertyTitle || 'Property Payment'}
                            </Typography>
                            {payment.propertyAddress && (
                              <Typography variant="body2" color="text.secondary">
                                {payment.propertyAddress}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        <Divider />

                        {/* Payment Details */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Period
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <CalendarIcon fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight="bold">
                                {payment.period}
                              </Typography>
                            </Stack>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Type
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ mt: 0.5 }}>
                              {paymentType}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Amount
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                              {formatCurrency(payment.totalAmount || payment.amount)}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Due Date
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {overdue && <WarningIcon fontSize="small" color="error" />}
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                color={overdue ? 'error.main' : 'text.primary'}
                              >
                                {dueDate ? formatDate(dueDate) : '-'}
                              </Typography>
                            </Stack>
                            {overdue && (
                              <Typography variant="caption" color="error.main" fontWeight="medium">
                                Overdue
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Payment Breakdown */}
                        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            Payment Breakdown
                          </Typography>
                          <Stack spacing={0.5}>
                            {payment.rentAmount > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Rent</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatCurrency(payment.rentAmount)}
                                </Typography>
                              </Box>
                            )}
                            {payment.utilitiesAmount > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Utilities</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatCurrency(payment.utilitiesAmount)}
                                </Typography>
                              </Box>
                            )}
                            {payment.depositAmount > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Security Deposit</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatCurrency(payment.depositAmount)}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Box>

                        <Button
                          variant="contained"
                          color={overdue ? "error" : "warning"}
                          size="large"
                          fullWidth
                          onClick={() => router.push(`/tenant/payments/${payment.id}`)}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            boxShadow: 3
                          }}
                        >
                          {overdue ? 'Pay Now (Overdue)' : 'Pay Now'}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Failed Payments */}
        {failedPayments.length > 0 && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <WarningIcon sx={{ color: 'error.main' }} />
              <Typography variant="h5" fontWeight="bold">
                Failed Payments
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {failedPayments.map((payment) => (
                <Card key={payment.id} sx={{ border: '2px solid', borderColor: 'error.light' }}>
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                          <Chip
                            icon={<WarningIcon />}
                            label="Failed"
                            size="small"
                            color="error"
                            sx={{ fontWeight: 'bold' }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {payment.period} • {payment.type}
                          </Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight="bold">
                          {formatCurrency(payment.totalAmount || payment.amount)}
                        </Typography>
                        {payment.propertyTitle && (
                          <Typography variant="body2" color="text.secondary">
                            {payment.propertyTitle}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => router.push(`/tenant/payments/${payment.id}`)}
                        sx={{ minWidth: 150 }}
                      >
                        Retry Payment
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
            <ReceiptIcon color="action" sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold">
              Payment History
            </Typography>
          </Stack>

          {completedPayments.length > 0 ? (
            <Stack spacing={2}>
              {completedPayments.map((payment: any) => (
                <Card key={payment.id}>
                  <CardContent>
                    <Stack spacing={2}>
                      {/* Header Row */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <HomeIcon fontSize="small" color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                              {payment.propertyTitle || 'Property'}
                            </Typography>
                          </Stack>
                          {payment.propertyAddress && (
                            <Typography variant="body2" color="text.secondary">
                              {payment.propertyAddress}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Paid"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>

                      <Divider />

                      {/* Payment Details Grid */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Period
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight="bold">
                              {payment.period}
                            </Typography>
                          </Stack>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Date Paid
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider />

                      {/* Breakdown */}
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Payment Breakdown
                        </Typography>
                        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                          <Stack spacing={1.5}>
                            {payment.rentAmount > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Rent
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(payment.rentAmount)}
                                </Typography>
                              </Box>
                            )}
                            
                            {payment.utilitiesAmount > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Utilities
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(payment.utilitiesAmount)}
                                </Typography>
                              </Box>
                            )}
                            
                            {payment.depositAmount > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Security Deposit
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(payment.depositAmount)}
                                </Typography>
                              </Box>
                            )}

                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body1" fontWeight="bold">
                                Total Paid
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="success.main">
                                {formatCurrency(payment.totalAmount || payment.amount)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Box>

                      {/* Additional Info */}
                      {payment.description && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Description
                          </Typography>
                          <Typography variant="body2">
                            {payment.description}
                          </Typography>
                        </Box>
                      )}

                      {payment.stripeChargeId && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Transaction ID
                          </Typography>
                          <Typography variant="caption" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                            {payment.stripeChargeId}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No payment history yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your completed payments will appear here
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Empty State */}
        {payments.length === 0 && (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <WalletIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3, opacity: 0.5 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="bold">
                  No payments yet
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Payment requests from your landlord will appear here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}