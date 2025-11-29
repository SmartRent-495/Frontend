'use client';

import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { HouseIcon } from '@phosphor-icons/react/dist/ssr/House';
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { WrenchIcon } from '@phosphor-icons/react/dist/ssr/Wrench';
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';

import { propertiesApi, leasesApi, maintenanceApi, paymentsApi } from '@/lib/api-client';
import type { Property, Lease, MaintenanceRequest, Payment } from '@/types';

interface DashboardStats {
  totalProperties: number;
  activeLeases: number;
  pendingMaintenance: number;
  monthlyRevenue: number;
}

export default function Page(): React.JSX.Element {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalProperties: 0,
    activeLeases: 0,
    pendingMaintenance: 0,
    monthlyRevenue: 0,
  });
  const [recentLeases, setRecentLeases] = React.useState<Lease[]>([]);
  const [recentMaintenance, setRecentMaintenance] = React.useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

React.useEffect(() => {
  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [propertiesResponse, leasesResponse, maintenanceResponse] = await Promise.all([
        propertiesApi.getAll().catch(() => ({ data: [] })),
        leasesApi.getAll().catch(() => ({ data: [] })),
        maintenanceApi.getAll().catch(() => ({ data: [] })),
      ]);
      
      const extractArray = <T,>(response: T[] | { data: T[] } | any): T[] => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      };

      // Extract arrays from responses
      const properties = extractArray<Property>(propertiesResponse);
      const leases = extractArray<Lease>(leasesResponse);
      const maintenanceRequests = extractArray<MaintenanceRequest>(maintenanceResponse);
        
      // Payments API not yet implemented for SmartRent - use empty array
      const payments: Payment[] = [];

      console.log('Dashboard data:', { 
        properties, 
        leases, 
        maintenanceRequests 
      });

      // Calculate stats
      const totalProperties = properties.length;
      const activeLeases = leases.filter((l: Lease) => l.status === 'active').length;
      const pendingMaintenance = maintenanceRequests.filter(
        (m: MaintenanceRequest) => m.status === 'pending' || m.status === 'in_progress'
      ).length;
      
      // Calculate monthly revenue from current month payments
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyRevenue = payments
        .filter((p: Payment) => {
          if (!p.payment_date) return false;
          const paymentDate = new Date(p.payment_date);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);

      setStats({
        totalProperties,
        activeLeases,
        pendingMaintenance,
        monthlyRevenue,
      });

      // Set recent leases (last 5)
      const sortedLeases = leases
        .sort((a: Lease, b: Lease) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .slice(0, 5);
      setRecentLeases(sortedLeases);

      // Set recent maintenance (last 5)
      const sortedMaintenance = maintenanceRequests
        .sort((a: MaintenanceRequest, b: MaintenanceRequest) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentMaintenance(sortedMaintenance);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  fetchDashboardData();
}, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
      case 'terminated':
        return 'error';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Landlord Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', height: 56, width: 56 }}>
                  <HouseIcon fontSize={32} />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Properties
                  </Typography>
                  <Typography variant="h4">{stats.totalProperties}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', height: 56, width: 56 }}>
                  <FileTextIcon fontSize={32} />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Active Leases
                  </Typography>
                  <Typography variant="h4">{stats.activeLeases}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', height: 56, width: 56 }}>
                  <WrenchIcon fontSize={32} />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Pending Maintenance
                  </Typography>
                  <Typography variant="h4">{stats.pendingMaintenance}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', height: 56, width: 56 }}>
                  <CurrencyDollarIcon fontSize={32} />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h4">${stats.monthlyRevenue.toFixed(2)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader title="Recent Leases" />
            <CardContent>
              {recentLeases.length === 0 ? (
                <Typography color="text.secondary">No leases yet</Typography>
              ) : (
                <Stack spacing={2}>
                  {recentLeases.map((lease) => (
                    <Box
                      key={lease.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2">
                            {lease.tenant_name || `Tenant ID: ${lease.tenant_id}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lease.property_address || `Property ID: ${lease.property_id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ${lease.monthly_rent}/month
                          </Typography>
                        </Box>
                        <Chip
                          label={lease.status}
                          color={getStatusColor(lease.status) as any}
                          size="small"
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader title="Recent Maintenance Requests" />
            <CardContent>
              {recentMaintenance.length === 0 ? (
                <Typography color="text.secondary">No maintenance requests</Typography>
              ) : (
                <Stack spacing={2}>
                  {recentMaintenance.map((request) => (
                    <Box
                      key={request.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2">{request.title}</Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {request.description}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={request.category}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={request.priority}
                              color={getPriorityColor(request.priority) as any}
                              size="small"
                            />
                          </Stack>
                        </Box>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
