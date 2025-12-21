"use client";

import { useEffect, useState, useContext } from "react";
import { UserContext } from "@/contexts/user-context";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  AttachMoney,
  CheckCircle,
  Schedule,
  TrendingUp,
  Warning,
} from "@mui/icons-material";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ---------- Types ---------- */

interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  currency: string;
  type: string;
  period: string;
  status: "pending" | "paid" | "failed" | "refunded";
  createdAt: any;
  paidAt: any;
  tenantName?: string;
  tenantEmail?: string;
  propertyTitle?: string;
}

interface Stats {
  totalRevenue: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  thisMonthRevenue: number;
}

/* ---------- Page ---------- */

export default function LandlordPaymentsPage() {
  const { user, isLoading } = useContext(UserContext)!;
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    thisMonthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }
    fetchPayments();
  }, [user, isLoading]);

  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, periodFilter]);

  const fetchPayments = async () => {
    try {
      const { getAuth } = await import("firebase/auth");
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_URL}/payments/landlord`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch payments");

      const data = await res.json();
      const paymentsData = data.payments || [];

      setPayments(paymentsData);
      calculateStats(paymentsData);
    } catch (err) {
      console.error(err);
      setError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Payment[]) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const s: Stats = {
      totalRevenue: 0,
      pendingAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      thisMonthRevenue: 0,
    };

    data.forEach((p) => {
      if (p.status === "paid") {
        s.totalRevenue += p.amount;
        s.paidCount++;
        if (p.period === currentMonth) s.thisMonthRevenue += p.amount;
      } else if (p.status === "pending") {
        s.pendingAmount += p.amount;
        s.pendingCount++;
      }
    });

    setStats(s);
  };

  const applyFilters = () => {
    let list = [...payments];
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (periodFilter !== "all") list = list.filter(p => p.period === periodFilter);
    setFilteredPayments(list);
  };

  const uniquePeriods = Array.from(new Set(payments.map(p => p.period))).sort().reverse();

  if (isLoading || loading) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const pendingPayments = filteredPayments.filter(p => p.status === "pending");

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box maxWidth="xl" mx="auto">

        {/* Header */}
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Payment Dashboard
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Monitor rent payments and track revenue
        </Typography>

        {/* Stats */}
        <Grid container spacing={3} mb={4}>
          <Stat title="This Month" value={stats.thisMonthRevenue} icon={<AttachMoney />} />
          <Stat title="Total Revenue" value={stats.totalRevenue} icon={<CheckCircle />} />
          <Stat title="Pending" value={stats.pendingAmount} icon={<Schedule />} />
          <Stat
            title="Payment Rate"
            value={
              payments.length
                ? Math.round((stats.paidCount / payments.length) * 100)
                : 0
            }
            suffix="%"
            icon={<TrendingUp />}
          />
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Period</InputLabel>
              <Select value={periodFilter} label="Period" onChange={e => setPeriodFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {uniquePeriods.map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Pending */}
        {pendingPayments.length > 0 && (
          <>
            <Typography variant="h5" mb={2} display="flex" alignItems="center" gap={1}>
              <Warning color="warning" /> Pending Payments
            </Typography>
            <Grid container spacing={2} mb={4}>
              {pendingPayments.map(p => (
                <Grid size={{ xs: 12, md: 6 }} key={p.id}>
                  <Card sx={{ borderLeft: 4, borderColor: "warning.main" }}>
                    <CardContent>
                      <Chip label="Pending" color="warning" size="small" />
                      <Typography fontWeight="bold" mt={1}>
                        {p.tenantName || "Tenant"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {p.propertyTitle}
                      </Typography>
                      <Typography variant="h5">${p.amount.toFixed(2)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.tenantName}</TableCell>
                  <TableCell>{p.propertyTitle}</TableCell>
                  <TableCell>{p.period}</TableCell>
                  <TableCell>${p.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={p.status} color={p.status === "paid" ? "success" : "warning"} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      </Box>
    </Box>
  );
}

/* ---------- Small component ---------- */

function Stat({
  title,
  value,
  suffix = "",
  icon,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="text.secondary">{title}</Typography>
            <Avatar>{icon}</Avatar>
          </Box>
          <Typography variant="h4" fontWeight="bold">
            {value.toFixed ? value.toFixed(2) : value}{suffix}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}
