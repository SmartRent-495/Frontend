'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { adminApi } from '@/lib/admin/api';

function safe(v: any) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function normalizeRows(rows: any[]) {
  return (rows || []).map((r, i) => ({
    id: r?.id || r?.uid || r?.userId || `${i}`,
    ...r,
  }));
}

//Build columns from union of keys across first N rows.
function buildColumns(rows: any[]) {
  const keySet = new Set<string>();
  const N = Math.min(rows?.length || 0, 50);

  for (let i = 0; i < N; i++) {
    const r = rows[i];
    if (r && typeof r === 'object') Object.keys(r).forEach((k) => keySet.add(k));
  }

  const cols = Array.from(keySet);
  cols.sort((a, b) => (a === 'id' ? -1 : b === 'id' ? 1 : 0));
  return cols;
}

// Fields that should NOT be editable in Add Row form.
function isSystemField(field: string) {
  return (
    field === 'id' ||
    field.startsWith('_') ||
    field === 'createdAt' ||
    field === 'updatedAt' ||
    field === 'updatedBy'
  );
}



function parseValue(raw: string) {
  const s = raw.trim();
  if (s === '') return undefined;

  if (s === 'true') return true;
  if (s === 'false') return false;

  if (!Number.isNaN(Number(s)) && s !== '') {
    return Number(s);
  }

  if (
    (s.startsWith('{') && s.endsWith('}')) ||
    (s.startsWith('[') && s.endsWith(']'))
  ) {
    try {
      return JSON.parse(s);
    } catch {
    }
  }

  return raw;
}



function flattenObject(obj: any, prefix = '', out: Record<string, any> = {}) {
  if (obj === null || obj === undefined) {
    out[prefix] = '';
    return out;
  }

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

function toCsv(rows: any[]) {
  const flatRows: Array<Record<string, any>> = rows.map((r) => flattenObject(r));

  const headerSet = flatRows.reduce<Set<string>>((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>());

  const headers = [...headerSet];

  const escape = (val: any) => {
    const s = val === null || val === undefined ? '' : String(val);
    const escaped = s.replace(/"/g, '""');
    if (/[",\n]/.test(escaped)) return `"${escaped}"`;
    return escaped;
  };

  const lines = [
    headers.join(','),
    ...flatRows.map((r) => headers.map((h) => escape(r[h])).join(',')),
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





export function AdminTable({
  collectionName,
  rows,
  onRefresh,
}: {
  collectionName:
    | 'users'
    | 'properties'
    | 'leases'
    | 'maintenance'
    | 'notifications'
    | 'payments';
  rows: any[];
  onRefresh: () => Promise<void>;
}) {
  const safeRows = React.useMemo(() => normalizeRows(rows), [rows]);
  const columns = React.useMemo(() => buildColumns(safeRows), [safeRows]);

  const formFields = React.useMemo(() => {
    return columns.filter((c) => !isSystemField(c));
  }, [columns]);

  const [openAdd, setOpenAdd] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<Record<string, string>>({});

  const [jsonFallback, setJsonFallback] = React.useState('{\n  \n}');
  const [useJsonFallback, setUseJsonFallback] = React.useState(false);

  React.useEffect(() => {
    const next: Record<string, string> = {};
    formFields.forEach((f) => (next[f] = ''));
    setForm(next);

    setUseJsonFallback(formFields.length === 0);
  }, [formFields]);

  const handleAdd = async () => {
    setError(null);
    setBusy(true);

    try {
      let payload: any = {};

      if (useJsonFallback) {
        payload = JSON.parse(jsonFallback);
        if (!payload || typeof payload !== 'object') {
          throw new Error('JSON must be an object');
        }
      } else {
        for (const key of formFields) {
          const parsed = parseValue(form[key] ?? '');
          if (parsed !== undefined) payload[key] = parsed;
        }
      }

      await adminApi.create(collectionName, payload);

      setOpenAdd(false);

      const cleared: Record<string, string> = {};
      formFields.forEach((f) => (cleared[f] = ''));
      setForm(cleared);
      setJsonFallback('{\n  \n}');

      await onRefresh();
    } catch (e: any) {
      setError(e.message || 'Failed to add row');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm(
      `Delete this row?\n\nCollection: ${collectionName}\nID: ${id}`
    );
    if (!ok) return;

    setError(null);
    setBusy(true);
    try {
      await adminApi.remove(collectionName, id);
      await onRefresh();
    } catch (e: any) {
      setError(e.message || 'Failed to delete row');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

   
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          Add Row
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            const csv = toCsv(safeRows);
            downloadFile(`${collectionName}.csv`, csv, 'text/csv;charset=utf-8');
          }}
          disabled={!safeRows.length}
        >
          Download CSV
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            const txt = safeRows.map((r) => JSON.stringify(r)).join('\n');
            downloadFile(`${collectionName}.txt`, txt, 'text/plain;charset=utf-8');
          }}
          disabled={!safeRows.length}
        >
          Download TXT
        </Button>

        <Typography color="text.secondary">Rows: {safeRows.length}</Typography>
      </Stack>


      {!safeRows.length ? (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">
            No rows found.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tip: If this collection is empty, the Add Row form can’t infer fields yet.
            Use “Add Row” and enter JSON once to create the first document; after that,
            the form will show real fields.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 680 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>Actions</TableCell>

                {columns.map((c) => (
                  <TableCell key={c} sx={{ fontWeight: 700 }}>
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {safeRows.slice(0, 200).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={busy}
                      onClick={() => handleDelete(row.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>

                  {columns.map((c) => (
                    <TableCell key={c}>{safe((row as any)[c])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Row dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add row to: {collectionName}</DialogTitle>

        <DialogContent>
          {useJsonFallback ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                This collection has no existing rows, so we can’t infer fields yet.
                Create the first document using JSON. After that, you’ll get a form with inputs.
              </Alert>

              <TextField
                value={jsonFallback}
                onChange={(e) => setJsonFallback(e.target.value)}
                multiline
                minRows={12}
                fullWidth
                placeholder='{"field":"value"}'
              />
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter values for the fields below. Leave empty to omit a field.
                Numbers, true/false, and JSON objects/arrays will be auto-parsed.
              </Typography>

              <Stack spacing={2}>
                {formFields.map((field) => (
                  <TextField
                    key={field}
                    label={field}
                    value={form[field] ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    fullWidth
                  />
                ))}
              </Stack>
            </>
          )}

          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleAdd} variant="contained" disabled={busy}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
