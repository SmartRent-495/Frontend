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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from "@mui/material";
import {
  AttachMoney,
  CheckCircle,
  Schedule,
  TrendingUp,
  Warning,
  Add,
  Close,
  Info,
} from "@mui/icons-material";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  totalAmount: number;
  rentAmount: number;
  utilitiesAmount: number;
  depositAmount: number;
  currency: string;
  period: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  description?: string;
  createdAt: any;
  paidAt: any;
  tenantName?: string;
  tenantEmail?: string;
  propertyTitle?: string;
  isFirstPayment?: boolean;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
}

interface Stats {
  totalRevenue: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  thisMonthRevenue: number;
}

export default function LandlordPaymentsPage() {
  const { user, isLoading } = useContext(UserContext)!;
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    thisMonthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  // Create Payment Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [rentAmount, setRentAmount] = useState("");
  const [utilitiesAmount, setUtilitiesAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showDepositField, setShowDepositField] = useState(true);
  const [checkingExisting, setCheckingExisting] = useState(false);

  function getCurrentPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }
    fetchData();
  }, [user, isLoading]);

  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, periodFilter]);

  // Check for existing payments when tenant and property are both selected
  useEffect(() => {
    if (selectedTenantId && selectedPropertyId) {
      checkExistingPayments();
    } else {
      setShowDepositField(true);
      setDepositAmount("");
    }
  }, [selectedTenantId, selectedPropertyId]);

  const checkExistingPayments = async () => {
    setCheckingExisting(true);
    try {
      const { getAuth } = await import("firebase/auth");
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(
        `${API_URL}/payments/check-existing/${selectedTenantId}/${selectedPropertyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setShowDepositField(!data.hasExistingPayments);
        
        // Clear deposit amount if they have existing payments
        if (data.hasExistingPayments) {
          setDepositAmount("");
        }
      }
    } catch (err) {
      console.error("Error checking existing payments:", err);
    } finally {
      setCheckingExisting(false);
    }
  };

  const fetchData = async () => {
    try {
      const { getAuth } = await import("firebase/auth");
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      // Fetch payments
      const paymentsRes = await fetch(`${API_URL}/payments/landlord`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!paymentsRes.ok) throw new Error("Failed to fetch payments");
      const paymentsData = await paymentsRes.json();
      const paymentsArray = paymentsData.payments || [];
      setPayments(paymentsArray);
      calculateStats(paymentsArray);

      // Fetch properties
      const propertiesRes = await fetch(`${API_URL}/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        const propertiesArray = Array.isArray(propertiesData) ? propertiesData : [];
        setProperties(propertiesArray);
      }

      // Fetch leases to get tenants
      const leasesRes = await fetch(`${API_URL}/leases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (leasesRes.ok) {
        const leasesData = await leasesRes.json();
        const allLeases = leasesData.data || leasesData.leases || [];
        const activeLeases = allLeases.filter((l: any) => l.status === 'active');
        
        // Extract unique tenants
        const uniqueTenants = new Map();
        for (const lease of activeLeases) {
          if (lease.tenantId) {
            const tenantName = lease.tenantName || 'Unknown Tenant';
            const tenantEmail = lease.tenantEmail || '';
            
            uniqueTenants.set(lease.tenantId, {
              id: lease.tenantId,
              name: tenantName,
              email: tenantEmail
            });
          }
        }
        
        const tenantsArray = Array.from(uniqueTenants.values());
        setTenants(tenantsArray);
      }

    } catch (err) {
      console.error('Fetch data error:', err);
      setError("Failed to load data");
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
        s.totalRevenue += p.totalAmount;
        s.paidCount++;
        if (p.period === currentMonth) s.thisMonthRevenue += p.totalAmount;
      } else if (p.status === "pending") {
        s.pendingAmount += p.totalAmount;
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

  const handleCreatePayment = async () => {
    if (!selectedTenantId || !selectedPropertyId || !period) {
      setError("Please select a tenant, property, and period");
      return;
    }

    const rent = parseFloat(rentAmount) || 0;
    const utilities = parseFloat(utilitiesAmount) || 0;
    const deposit = parseFloat(depositAmount) || 0;

    if (rent + utilities + deposit <= 0) {
      setError("Total amount must be greater than 0");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const { getAuth } = await import("firebase/auth");
      const token = await getAuth().currentUser?.getIdToken();

      const res = await fetch(`${API_URL}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          propertyId: selectedPropertyId,
          period,
          rentAmount: rent,
          utilitiesAmount: utilities,
          depositAmount: deposit,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create payment request");
      }

      setSuccess("Payment request created successfully!");
      setCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedTenantId("");
    setSelectedPropertyId("");
    setPeriod(getCurrentPeriod());
    setRentAmount("");
    setUtilitiesAmount("");
    setDepositAmount("");
    setDescription("");
    setShowDepositField(true);
  };

  const getTotalAmount = () => {
    return (
      (parseFloat(rentAmount) || 0) +
      (parseFloat(utilitiesAmount) || 0) +
      (parseFloat(depositAmount) || 0)
    );
  };
  function generatePeriods(monthsAhead = 18) {
    const periods: string[] = [];
    const now = new Date();
  
    for (let i = 0; i < monthsAhead; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      periods.push(`${y}-${m}`);
    }
  
    return periods;
  }
  

  const uniquePeriods = Array.from(new Set(payments.map(p => p.period))).sort().reverse();
  const pendingPayments = filteredPayments.filter(p => p.status === "pending");
  const usedPeriods = payments
  .filter(p => p.tenantId === selectedTenantId && p.propertyId === selectedPropertyId)
  .map(p => p.period);

  if (isLoading || loading) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box maxWidth="xl" mx="auto">

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Payment Dashboard
            </Typography>
            <Typography color="text.secondary">
              Create payment requests and track revenue
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Payment Request
          </Button>
        </Box>

        {/* Alerts */}
        {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}

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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
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

        {/* Pending Payments Alert */}
        {pendingPayments.length > 0 && (
          <>
            <Typography variant="h5" mb={2} display="flex" alignItems="center" gap={1}>
              <Warning color="warning" /> Pending Payments ({pendingPayments.length})
            </Typography>
            <Grid container spacing={2} mb={4}>
              {pendingPayments.slice(0, 6).map(p => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>

                  <Card sx={{ borderLeft: 4, borderColor: "warning.main" }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Chip label="Pending" color="warning" size="small" />
                        <Typography variant="caption" color="text.secondary">{p.period || '-'}</Typography>
                      </Box>
                      <Typography fontWeight="bold" mt={1}>
                        {p.tenantName || "Tenant"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {p.propertyTitle || "Property"}
                      </Typography>
                      <Typography variant="h5" mt={1}>${(p.totalAmount || 0).toFixed(2)}</Typography>
                      {(p.rentAmount || 0) > 0 && (
                        <Typography variant="caption" display="block">Rent: ${(p.rentAmount || 0).toFixed(2)}</Typography>
                      )}
                      {(p.utilitiesAmount || 0) > 0 && (
                        <Typography variant="caption" display="block">Utilities: ${(p.utilitiesAmount || 0).toFixed(2)}</Typography>
                      )}
                      {(p.depositAmount || 0) > 0 && (
                        <Typography variant="caption" display="block">Deposit: ${(p.depositAmount || 0).toFixed(2)}</Typography>
                      )}
                      {p.isFirstPayment && (
                        <Chip label="First Payment" size="small" color="info" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Payments Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Rent</TableCell>
                <TableCell>Utilities</TableCell>
                <TableCell>Deposit</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" py={4}>
                      No payments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.tenantName}</TableCell>
                    <TableCell>{p.propertyTitle}</TableCell>
                    <TableCell>{p.period}</TableCell>
                    <TableCell>${p.rentAmount.toFixed(2)}</TableCell>
                    <TableCell>${p.utilitiesAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      ${p.depositAmount.toFixed(2)}
                      {p.depositAmount > 0 && p.isFirstPayment && (
                        <Chip label="1st" size="small" color="info" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell><strong>${p.totalAmount.toFixed(2)}</strong></TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status} 
                        color={
                          p.status === "paid" ? "success" : 
                          p.status === "pending" ? "warning" : 
                          "error"
                        } 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

      </Box>

      {/* Create Payment Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Create Payment Request
            <IconButton onClick={() => setCreateDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth>
              <InputLabel>Select Tenant</InputLabel>
              <Select
                value={selectedTenantId}
                label="Select Tenant"
                onChange={(e) => setSelectedTenantId(e.target.value)}
              >
                {tenants.length === 0 ? (
                  <MenuItem disabled>No tenants found - Create a lease first</MenuItem>
                ) : (
                  tenants.map(tenant => (
                    <MenuItem key={tenant.id} value={tenant.id}>
                      {tenant.name} {tenant.email && `(${tenant.email})`}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select Property</InputLabel>
              <Select
                value={selectedPropertyId}
                label="Select Property"
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {properties.length === 0 ? (
                  <MenuItem disabled>No properties found - Add a property first</MenuItem>
                ) : (
                  properties.map(property => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.title} - {property.address}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>


            {/* Info alert about deposit */}
            {selectedTenantId && selectedPropertyId && (
              checkingExisting ? (
                <Alert severity="info" icon={<CircularProgress size={20} />}>
                  Checking payment history...
                </Alert>
              ) : showDepositField && (
                <Alert severity="success" icon={<Info />}>
                  This is the tenant's first payment for this property. You can include a deposit.
                </Alert>
              )
            )}

            <FormControl fullWidth>
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e) => setPeriod(e.target.value)}
              >
                {generatePeriods(24).map((p) => (
                  <MenuItem key={p} value={p} disabled={usedPeriods.includes(p)}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>


            <TextField
              label="Rent Amount"
              type="number"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              placeholder="0.00"
              fullWidth
              InputProps={{ startAdornment: "$" }}
            />

            <TextField
              label="Utilities Amount"
              type="number"
              value={utilitiesAmount}
              onChange={(e) => setUtilitiesAmount(e.target.value)}
              placeholder="0.00"
              fullWidth
              InputProps={{ startAdornment: "$" }}
            />

            <TextField
              label="Deposit Amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              fullWidth
              disabled={!showDepositField}
              InputProps={{ startAdornment: "$" }}
              helperText={
                !showDepositField 
                  ? "Deposit can only be charged for first payment"
                  : "One-time security deposit (only for first payment)"
              }
            />

            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Payment for December 2024"
              fullWidth
              multiline
              rows={2}
            />

            <Box bgcolor="grey.100" p={2} borderRadius={1}>
              <Typography variant="subtitle2" gutterBottom>Total Amount:</Typography>
              <Typography variant="h4">
                ${getTotalAmount().toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreatePayment}
            disabled={creating || !selectedTenantId || !selectedPropertyId || !period || getTotalAmount() <= 0}
          >
            {creating ? <CircularProgress size={24} /> : "Create Payment Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

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
            <Avatar sx={{ bgcolor: "primary.light" }}>{icon}</Avatar>
          </Box>
          <Typography variant="h4" fontWeight="bold">
            {suffix === "%" ? value : `$${value.toFixed(2)}`}{suffix === "%" && suffix}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}