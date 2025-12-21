'use client';

import * as React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

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

function buildColumns(rows: any[]) {
  const keySet = new Set<string>();
  const N = Math.min(rows?.length || 0, 50);

  for (let i = 0; i < N; i++) {
    const r = rows[i];
    if (r && typeof r === 'object') {
      Object.keys(r).forEach((k) => keySet.add(k));
    }
  }

  const cols = Array.from(keySet);

  // put id first if present
  cols.sort((a, b) => (a === 'id' ? -1 : b === 'id' ? 1 : 0));

  return cols;
}

export function AdminTable({ rows }: { rows: any[] }) {
  const safeRows = React.useMemo(() => normalizeRows(rows), [rows]);
  const columns = React.useMemo(() => buildColumns(safeRows), [safeRows]);

  if (!safeRows.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">No rows found.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 680 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
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
              {columns.map((c) => (
                <TableCell key={c}>{safe((row as any)[c])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
