'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { FileText as FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { Wrench as WrenchIcon } from '@phosphor-icons/react/dist/ssr/Wrench';
import { CreditCard as CreditCardIcon } from '@phosphor-icons/react/dist/ssr/CreditCard';
import { useRouter } from 'next/navigation';
import { paths } from '@/paths';

export default function Page(): React.JSX.Element {
  const router = useRouter();

  const stats = [
    {
      title: 'Available Properties',
      value: '12',
      icon: <BuildingsIcon fontSize="var(--Icon-fontSize)" />,
      color: 'primary' as const,
      href: paths.tenant.properties,
    },
    {
      title: 'My Applications',
      value: '0',
      icon: <FileTextIcon fontSize="var(--Icon-fontSize)" />,
      color: 'warning' as const,
      href: paths.tenant.applications,
    },
    {
      title: 'Maintenance Requests',
      value: '0',
      icon: <WrenchIcon fontSize="var(--Icon-fontSize)" />,
      color: 'error' as const,
      href: paths.tenant.maintenance,
    },
    {
      title: 'Payments Due',
      value: '$0',
      icon: <CreditCardIcon fontSize="var(--Icon-fontSize)" />,
      color: 'success' as const,
      href: paths.tenant.payments,
    },
  ];

  return (
    <Box>
      <Stack spacing={4}>
        {/* Header */}
        <div>
          <Typography variant="h4">Welcome to Your Dashboard</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Find your perfect rental home
          </Typography>
        </div>

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {stats.map((stat) => (
            <Card
              key={stat.title}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                },
              }}
              onClick={() => router.push(stat.href)}
            >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box
                        sx={{
                          bgcolor: `var(--mui-palette-${stat.color}-lightest)`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 1.5,
                          color: `var(--mui-palette-${stat.color}-main)`,
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Stack>
                    <div>
                      <Typography variant="h3">{stat.value}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {stat.title}
                      </Typography>
                    </div>
                  </Stack>
                </CardContent>
              </Card>
          ))}
        </Box>

        {/* Quick Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" gap={2}>
              <Button
                variant="contained"
                startIcon={<BuildingsIcon />}
                onClick={() => router.push(paths.tenant.properties)}
              >
                Browse Properties
              </Button>
              <Button
                variant="outlined"
                startIcon={<WrenchIcon />}
                onClick={() => router.push(paths.tenant.maintenance)}
              >
                Request Maintenance
              </Button>
              <Button
                variant="outlined"
                startIcon={<CreditCardIcon />}
                onClick={() => router.push(paths.tenant.payments)}
              >
                View Payments
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <div>
                <Typography variant="h6" gutterBottom>
                  Current Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You are not currently renting a property
                </Typography>
              </div>
              <Chip label="No Active Lease" color="default" />
            </Stack>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => router.push(paths.tenant.properties)}
            >
              Start Searching for Properties
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
