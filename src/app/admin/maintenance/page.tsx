'use client';

import * as React from 'react';
import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { adminApi } from '@/lib/admin/api';
import { AdminTable } from '@/components/admin/admin-table';

export default function AdminMaintenancePage(): React.JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminApi.collection('maintenance');
        setRows(res.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load maintenance');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Stack direction="row" spacing={2} alignItems="center">
        <CircularProgress size={18} />
        <Typography>Loading maintenance…</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Maintenance</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <AdminTable rows={rows} />
    </Stack>
  );
}
