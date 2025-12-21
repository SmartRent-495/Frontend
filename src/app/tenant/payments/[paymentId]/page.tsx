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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error("⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set!");
  } else if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    console.error("❌ Invalid Stripe key format");
  } else {
    console.log("✅ Stripe key loaded");
  }
}

interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  currency: string;
  type: string;
  period: string;
  status: string;
  stripePaymentIntentId: string;
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

    setLoading(true);
    setError("");

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/tenant/payments?success=true`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/tenant/payments");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
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
        <Typography color="text.secondary">Redirecting...</Typography>
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
          {loading ? "Processing..." : `Pay $${payment.amount.toFixed(2)}`}
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

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    fetchPayment().catch(err => {
      console.error("Error in fetchPayment:", err);
      setError(err.message || "Failed to load payment");
      setLoading(false);
    });
  }, [user, userLoading, paymentId, router]);

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

      if (data.stripePaymentIntentId) {
        const intentRes = await fetch(`${API_URL}/payments/get-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentId: data.id,
          }),
        });

        if (!intentRes.ok) {
          const errorData = await intentRes.json();
          
          if (errorData.error === "Payment already completed") {
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
          
          throw new Error(errorData.error || "Failed to get payment intent");
        }

        const intentData = await intentRes.json();
        
        if (!intentData.clientSecret) {
          throw new Error("No client secret returned from server");
        }

        if (!intentData.clientSecret.startsWith('pi_') || !intentData.clientSecret.includes('_secret_')) {
          throw new Error("Invalid payment secret format");
        }
        
        setClientSecret(intentData.clientSecret);
      } else {
        throw new Error("No Stripe payment intent ID found");
      }
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
                </Box>

                <Divider />

                <Box>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Period
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {payment.period}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                        {payment.type}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    );
  }

  if (!clientSecret) {
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
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={24} />
                  <Typography variant="h6" fontWeight="bold">
                    Preparing Payment...
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Setting up your payment. This should only take a moment.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    );
  }

  if (!clientSecret.startsWith('pi_') || !clientSecret.includes('_secret_')) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Alert severity="error" icon={<WarningIcon />}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Invalid Payment Configuration
            </Typography>
            <Typography variant="body2">
              The payment secret is invalid. Please try creating a new payment.
            </Typography>
          </Alert>
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
            <Stack spacing={4}>
              <Typography variant="h4" fontWeight="bold">
                Complete Payment
              </Typography>

              <Divider />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Period
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {payment.period}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type
                  </Typography>
                  <Chip 
                    label={payment.type}
                    size="small"
                    sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Amount
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatCurrency(payment.amount)}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip 
                    label={payment.status}
                    color="warning"
                    size="small"
                    sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                  />
                </Box>
              </Box>

              <Divider />

              {clientSecret && payment ? (
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
      </Stack>
    </Container>
  );
}