'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';



import { adminApi } from '@/lib/admin/api';

function flattenObject(obj: any, prefix = '', out: Record<string, any> = {}) {
  if (obj === null || obj === undefined) return out;

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    out[prefix] = Array.isArray(obj) ? JSON.stringify(obj) : obj;
    return out;
  }

  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, key, out);
    } else {
      out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
    }
  }
  return out;
}

function toCsvAllCollections(db: Record<string, any[]>) {
  const rows: Array<Record<string, any>> = [];

  for (const [collectionName, docs] of Object.entries(db)) {
    if (!Array.isArray(docs)) continue;
    for (const doc of docs) {
      const flat = flattenObject(doc);
      rows.push({ __collection: collectionName, ...flat });
    }
  }

  const headerSet = rows.reduce<Set<string>>((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>());

  const headers = [...headerSet].sort((a, b) => {
    if (a === '__collection') return -1;
    if (b === '__collection') return 1;
    if (a === 'id') return -1;
    if (b === 'id') return 1;
    return a.localeCompare(b);
  });

  const escape = (val: any) => {
    const s = val === null || val === undefined ? '' : String(val);
    const escaped = s.replace(/"/g, '""');
    if (/[",\n]/.test(escaped)) return `"${escaped}"`;
    return escaped;
  };

  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape((r as any)[h])).join(',')),
  ];

  return lines.join('\n');
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export default function AdminDashboardPage(): React.JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [busyDownload, setBusyDownload] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [overview, setOverview] = React.useState<any>(null);

  const load = React.useCallback(async () => {
    const res = await adminApi.overview();
    setOverview(res.data || null);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (e: any) {
        setError(e.message || 'Failed to load overview');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const counts = React.useMemo(() => {
    const d = overview || {};
    return [
      { label: 'Users', value: d.users?.length || 0, href: '/admin/users' },
      { label: 'Properties', value: d.properties?.length || 0, href: '/admin/properties' },
      { label: 'Leases', value: d.leases?.length || 0, href: '/admin/leases' },
      { label: 'Maintenance', value: d.maintenance?.length || 0, href: '/admin/maintenance' },
      { label: 'Notifications', value: d.notifications?.length || 0, href: '/admin/notifications' },
      { label: 'Payments', value: d.payments?.length || 0, href: '/admin/payments' },
    ];
  }, [overview]);

  const handleDownloadTxt = async () => {
    try {
      setBusyDownload(true);
      setError(null);

      const res = await adminApi.overview();
      const d = res.data || {};

      const filename = `smartrent-db-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
      const txt = JSON.stringify(d, null, 2);

      downloadFile(filename, txt, 'text/plain;charset=utf-8');
    } catch (e: any) {
      setError(e.message || 'Failed to download TXT');
    } finally {
      setBusyDownload(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setBusyDownload(true);
      setError(null);

      const res = await adminApi.overview();
      const d = res.data || {};

      const db = {
        users: d.users || [],
        properties: d.properties || [],
        leases: d.leases || [],
        maintenance: d.maintenance || [],
        notifications: d.notifications || [],
        payments: d.payments || [],
      };

      const csv = toCsvAllCollections(db);

      const filename = `smartrent-db-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
      downloadFile(filename, csv, 'text/csv;charset=utf-8');
    } catch (e: any) {
      setError(e.message || 'Failed to download CSV');
    } finally {
      setBusyDownload(false);
    }
  };

  if (loading) {
    return (
      <Stack direction="row" spacing={2} alignItems="center">
        <CircularProgress size={18} />
        <Typography>Loading admin dashboard…</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4">Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage SmartRent data, exports, and collections.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            onClick={handleDownloadCsv}
            disabled={busyDownload}
          >
            {busyDownload ? 'Preparing…' : 'Download DB (CSV)'}
          </Button>
          <Button
            variant="contained"
            onClick={handleDownloadTxt}
            disabled={busyDownload}
          >
            {busyDownload ? 'Preparing…' : 'Download DB (TXT)'}
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        {counts.map((c) => (
          <Grid key={c.label} item xs={12} sm={6} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="overline" color="text.secondary">
                    {c.label}
                  </Typography>

                  <Typography variant="h4">{c.value}</Typography>

                  <Button
                    component={Link}
                    href={c.href}
                    variant="text"
                    sx={{ alignSelf: 'flex-start', px: 0 }}
                  >
                    View {c.label} →
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Quick actions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use downloads to back up the database. Use collection pages to add/delete rows.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={Link} href="/admin/users" variant="outlined">
              Manage Users
            </Button>
            <Button component={Link} href="/admin/properties" variant="outlined">
              Manage Properties
            </Button>
            <Button component={Link} href="/admin/maintenance" variant="outlined">
              Manage Maintenance
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
