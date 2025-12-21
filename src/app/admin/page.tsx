'use client';

import * as React from 'react';
import { Alert, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { adminApi } from '@/lib/admin/api';

export default function AdminDashboardPage(): React.JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [counts, setCounts] = React.useState<any>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminApi.overview();
        const d = res.data;

        setCounts({
          admins: d.admins?.length || 0,
          landlords: d.landlords?.length || 0,
          tenants: d.tenants?.length || 0,
          properties: d.properties?.length || 0,
          leases: d.leases?.length || 0,
          maintenance: d.maintenance?.length || 0,
          notifications: d.notifications?.length || 0,
          payments: d.payments?.length || 0,

        });
      } catch (e: any) {
        setError(e.message || 'Failed to load admin overview');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Stack direction="row" spacing={2} alignItems="center">
        <CircularProgress size={18} />
        <Typography>Loading dashboard…</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Dashboard</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Typography variant="h6">Counts</Typography>
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Typography>Admins: {counts?.admins}</Typography>
            <Typography>Landlords: {counts?.landlords}</Typography>
            <Typography>Tenants: {counts?.tenants}</Typography>
            <Typography>Properties: {counts?.properties}</Typography>
            <Typography>Leases: {counts?.leases}</Typography>
            <Typography>Maintenance: {counts?.maintenance}</Typography>
            <Typography>Notifications: {counts?.notifications}</Typography>
            <Typography>Payments: {counts?.payments}</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Alert severity="info">
        Next: we’ll add buttons here for Initialize / Reset / Backup.
      </Alert>
    </Stack>
  );
}
