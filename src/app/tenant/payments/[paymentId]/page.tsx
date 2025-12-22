"use client";

import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserContext } from "@/contexts/user-context";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
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
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Payment {
  id: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  leaseId?: string;
  amount: number;
  totalAmount: number;
  currency: string;
  type: string;
  period: string;
  status: string;
  stripePaymentIntentId: string;
  dueDate?: any;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
}

function CheckoutForm({ payment }: { payment: Payment }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is not initialized");
      return;
    }

    if (!elementReady) {
      setError("Payment form is not ready yet. Please wait.");
      return;
    }

    if (loading) {
      return; // Prevent double submission
    }

    setLoading(true);
    setError("");

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/tenant/payments?success=true`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        setLoading(false);
      } else if (paymentIntent?.status === 'succeeded') {
        const { getAuth } = await import("firebase/auth");
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        
        if (token) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const syncRes = await fetch(`${API_URL}/payments/sync/${payment.id}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (!syncRes.ok) {
              const syncData = await syncRes.json();
              console.warn("Sync warning:", syncData);
            }
          } catch (syncErr) {
            console.error("Sync error:", syncErr);
          }
        }
        
        setSuccess(true);
        setTimeout(() => {
          router.push("/tenant/payments");
        }, 2000);
      } else {
        setError(`Payment status: ${paymentIntent?.status || 'unknown'}. Please contact support if charged.`);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography color="text.secondary">Redirecting to your payments...</Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box sx={{ minHeight: 200 }}>
          <PaymentElement 
            onReady={() => {
              console.log("PaymentElement ready");
              setElementReady(true);
            }}
            onLoadError={(error) => {
              console.error("PaymentElement load error:", error);
              setError("Failed to load payment form. Please refresh and try again.");
            }}
          />
        </Box>

        {!elementReady && !error && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading payment form...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={!stripe || !elementReady || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CreditCardIcon />}
          sx={{ 
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? "Processing..." : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payment.totalAmount || payment.amount)}`}
        </Button>

        {!elementReady && (
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Please wait for the payment form to load before submitting
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export default function PaymentDetailPage() {
  const { user, isLoading: userLoading } = useContext(UserContext)!;
  const params = useParams();
  const router = useRouter();

  const paymentId = params.paymentId as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    if (fetched) return;
    setFetched(true);

    fetchPayment().catch(err => {
      console.error("Error in fetchPayment:", err);
      setError(err.message || "Failed to load payment");
      setLoading(false);
    });
  }, [user, userLoading, paymentId, fetched]);

  const fetchPayment = async () => {
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_URL}/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch payment");
      }

      const data = await res.json();
      setPayment(data);

      if (data.status === "paid") {
        setLoading(false);
        return;
      }

      // Check for failed or cancelled status
      if (data.status === "failed" || data.status === "cancelled") {
        setError("This payment has been cancelled or failed. Please contact your landlord.");
        setLoading(false);
        return;
      }

      // If we already have a clientSecret from a previous PaymentIntent, use it
      if (data.clientSecret && data.stripePaymentIntentId) {
        console.log("Using existing PaymentIntent:", data.stripePaymentIntentId);
        setClientSecret(data.clientSecret);
        setLoading(false);
        return;
      }

      // Only create new PaymentIntent if we don't have one
      const payRes = await fetch(`${API_URL}/payments/pay/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!payRes.ok) {
        const errorData = await payRes.json();
        
        if (errorData.error === "Payment already completed") {
          // Sync with Stripe to update local status
          try {
            const syncRes = await fetch(`${API_URL}/payments/sync/${data.id}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (syncRes.ok) {
              window.location.reload();
              return;
            }
          } catch (syncErr) {
            console.error("Failed to sync payment:", syncErr);
          }
          
          setPayment({ ...data, status: "paid" });
          setLoading(false);
          return;
        }
        
        throw new Error(errorData.error || "Failed to initiate payment");
      }

      const payData = await payRes.json();
      
      if (!payData.clientSecret) {
        throw new Error("No client secret returned from server");
      }

      if (!payData.clientSecret.startsWith('pi_') || !payData.clientSecret.includes('_secret_')) {
        throw new Error("Invalid payment secret format");
      }
      
      setClientSecret(payData.clientSecret);
    } catch (err: any) {
      console.error("Fetch payment error:", err);
      setError(err.message || "Failed to load payment details");
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

  const getPaymentType = (payment: any) => {
    const types = [];
    if (payment.rentAmount > 0) types.push('Rent');
    if (payment.utilitiesAmount > 0) types.push('Utilities');
    if (payment.depositAmount > 0) types.push('Deposit');
    return types.length > 0 ? types.join(' + ') : 'Payment';
  };
  

  const isOverdue = (dueDate: any) => {
    if (!dueDate) return false;
    const due = dueDate._seconds 
      ? new Date(dueDate._seconds * 1000)
      : new Date(dueDate);
    return due < new Date();
  };

  if (userLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading payment details...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Alert severity="error">{error}</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/tenant/payments")}
          >
            Back to payments
          </Button>
        </Stack>
      </Container>
    );
  }

  if (!payment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Payment not found</Alert>
      </Container>
    );
  }

  if (payment.status === "paid") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/tenant/payments")}
            sx={{ alignSelf: 'flex-start' }}
          >
            Back to payments
          </Button>

          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
                    Payment Completed
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Thank you for your payment!
                  </Typography>
                </Box>

                <Divider />

                {/* Property Info */}
                <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <HomeIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {payment.propertyTitle || 'Property'}
                      </Typography>
                      {payment.propertyAddress && (
                        <Typography variant="body2" color="text.secondary">
                          {payment.propertyAddress}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 6}} >

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Period
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body1" fontWeight="bold">
                        {payment.period}
                      </Typography>
                    </Stack>
                  </Grid>
                  
                  <Grid size={{ xs: 6}}>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Type
                    </Typography>
                    <Chip
                      label={getPaymentType(payment)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />

                  </Grid>

                  <Grid size={{ xs: 12 }} >

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Amount Paid
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {formatCurrency(payment.totalAmount || payment.amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    );
  }

  const overdue = isOverdue(payment.dueDate);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/tenant/payments")}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to payments
        </Button>

        {overdue && (
          <Alert severity="error" icon={<WarningIcon />}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Payment Overdue
            </Typography>
            <Typography variant="body2">
              This payment was due on {formatDate(payment.dueDate)}. Please complete it as soon as possible.
            </Typography>
          </Alert>
        )}

        <Card>
          <CardContent>
            <Stack spacing={4}>
              <Typography variant="h4" fontWeight="bold">
                Complete Payment
              </Typography>

              <Divider />

              {/* Property Information */}
              <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
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
                    <HomeIcon sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {payment.propertyTitle || 'Property'}
                    </Typography>
                    {payment.propertyAddress && (
                      <Typography variant="body2" color="text.secondary">
                        {payment.propertyAddress}
                        {payment.propertyCity && `, ${payment.propertyCity}`}
                        {payment.propertyState && `, ${payment.propertyState}`}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>

              {/* Payment Details */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 3}}>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Period
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body1" fontWeight="bold">
                      {payment.period}
                    </Typography>
                  </Stack>
                </Grid>
                
                <Grid size={{ xs: 6, sm: 3}}>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type
                  </Typography>
                  <Chip
                    label={getPaymentType(payment)}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />

                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Amount
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatCurrency(payment.totalAmount || payment.amount)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3}}>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip 
                    label={payment.status}
                    color={overdue ? "error" : "warning"}
                    size="small"
                    sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                  />
                </Grid>

                {payment.dueDate && (
                  <Grid size={{ xs: 12 }} >

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Due Date
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {overdue && <WarningIcon fontSize="small" color="error" />}
                      <Typography 
                        variant="body1" 
                        fontWeight="bold"
                        color={overdue ? 'error.main' : 'text.primary'}
                      >
                        {formatDate(payment.dueDate)}
                      </Typography>
                      {overdue && (
                        <Chip 
                          label="OVERDUE" 
                          size="small" 
                          color="error"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Stack>
                  </Grid>
                )}
              </Grid>

              <Divider />

              {/* Stripe Payment Form */}
              {clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: { 
                      theme: "stripe",
                      variables: {
                        colorPrimary: '#1976d2',
                      },
                    },
                    loader: "auto",
                  }}
                >
                  <CheckoutForm payment={payment} />
                </Elements>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Initializing payment form...
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Test Card Info (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info">
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Test Mode - Use these test cards:
            </Typography>
            <Typography variant="body2">
              <strong>Success:</strong> 4242 4242 4242 4242<br />
              <strong>Expiry:</strong> Any future date (e.g., 12/34)<br />
              <strong>CVC:</strong> Any 3 digits (e.g., 123)<br />
              <strong>ZIP:</strong> Any 5 digits (e.g., 12345)
            </Typography>
          </Alert>
        )}

        {/* Security Notice */}
        <Alert severity="info">
          <Typography variant="body2">
            Your payment is secured by Stripe. We never store your payment information.
          </Typography>
        </Alert>
      </Stack>
    </Container>
  );
}