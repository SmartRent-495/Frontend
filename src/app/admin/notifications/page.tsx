'use client';

import * as React from 'react';
import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { adminApi } from '@/lib/admin/api';
import { AdminTable } from '@/components/admin/admin-table';

export default function AdminUsersPage(): React.JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    const res = await adminApi.collection('notifications');
    setRows(res.data || []);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (e: any) {
        setError(e.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  if (loading) {
    return (
      <Stack direction="row" spacing={2} alignItems="center">
        <CircularProgress size={18} />
        <Typography>Loading notifications…</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Notifications</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <AdminTable collectionName="notifications" rows={rows} onRefresh={load} />
    </Stack>
  );
}
