'use client';

import { getIdToken } from '@/lib/firebase/auth';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type AdminCollection =
  | 'users'
  | 'properties'
  | 'leases'
  | 'maintenance'
  | 'notifications'
  | 'payments';

async function authedFetch<T = any>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: any
): Promise<T> {
  const token = await getIdToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: method !== 'GET' && body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data as T;
}

export const adminApi = {
  overview: () => authedFetch('GET', '/admin/overview'),

  collection: (name: AdminCollection) =>
    authedFetch('GET', `/admin/collection/${name}`),

  // Add a new document (auto-generated doc id)
  create: (name: AdminCollection, payload: Record<string, any>) =>
    authedFetch('POST', `/admin/collection/${name}`, payload),

  // Delete a document by doc id
  remove: (name: AdminCollection, id: string) =>
    authedFetch('DELETE', `/admin/collection/${name}/${encodeURIComponent(id)}`),
};
