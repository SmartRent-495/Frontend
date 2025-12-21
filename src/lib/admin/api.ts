'use client';

import { getIdToken } from '@/lib/firebase/auth';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function authedGet(path: string) {
  const token = await getIdToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data;
}

export const adminApi = {
  overview: () => authedGet('/admin/overview'),
  collection: (name: 'users' | 'properties' | 'leases' | 'maintenance' | 'notifications' | 'payments') => authedGet(`/admin/collection/${name}`),
};
