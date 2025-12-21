'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Stack,
} from '@mui/material';

import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';
import { authClient } from '@/lib/auth/client';

const drawerWidth = 260;

const navItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Properties', href: '/admin/properties' },
  { label: 'Leases', href: '/admin/leases' },
  { label: 'Maintenance', href: '/admin/maintenance' },
  { label: 'Notifications', href: '/admin/notifications' },
  { label: 'Payments', href: '/admin/payments' },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, checkSession } = useUser();

  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) router.replace(paths.auth.signIn);
    if (!isLoading && user && user.role !== 'admin') router.replace(paths.home);
  }, [isLoading, user, router]);

  const onSignOut = async () => {
    try {
      setSigningOut(true);
      await authClient.signOut();
      await checkSession?.();
      router.replace(paths.auth.signIn);
    } finally {
      setSigningOut(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Box>
            <Typography variant="h6">Admin Panel</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Toolbar>

        <Divider />

        <List sx={{ flexGrow: 1 }}>
          {navItems.map((item) => {
            const selected = pathname === item.href;
            return (
              <ListItemButton
                key={item.href}
                selected={selected}
                onClick={() => router.push(item.href)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>

        <Divider />

        <Stack spacing={1} sx={{ p: 2 }}>
          <Button variant="outlined" color="inherit" onClick={onSignOut} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>

          <Typography variant="caption" color="text.secondary">
            Signed in as admin
          </Typography>
        </Stack>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
