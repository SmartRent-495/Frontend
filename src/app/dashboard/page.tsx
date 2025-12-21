'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Stack, Typography } from '@mui/material';

import { useUser } from '@/hooks/use-user';
import { paths } from '@/paths';

export default function DashboardRedirectPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading } = useUser();

  React.useEffect(() => {
    if (isLoading) return;

    // Not logged in -> go to sign in
    if (!user) {
      router.replace(paths.auth.signIn);
      return;
    }

    // Logged in -> route based on role
    if (user.role === 'admin') {
      router.replace('/admin');
    } else if (user.role === 'landlord') {
      router.replace('/landlord');
    } else {
      router.replace('/tenant');
    }
  }, [user, isLoading, router]);

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 4 }}>
      <CircularProgress size={18} />
      <Typography>Loading…</Typography>
    </Stack>
  );
}
