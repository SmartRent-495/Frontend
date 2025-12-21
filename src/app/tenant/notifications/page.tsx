'use client';

import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { Wrench as WrenchIcon } from '@phosphor-icons/react/dist/ssr/Wrench';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  async function markAllAsRead() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id);
    if (notification.type === 'maintenance_created' || notification.type === 'maintenance_updated') {
      router.push('/tenant/maintenance');
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4">Notifications</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </Typography>
            </Box>
            {unreadCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<CheckIcon />}
                onClick={markAllAsRead}
              >
                Mark All as Read
              </Button>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <BellIcon size={64} style={{ opacity: 0.3 }} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    No notifications yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You'll see notifications here when there's activity
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={2}>
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: notification.read ? 'background.paper' : 'action.hover',
                    '&:hover': { boxShadow: 2 }
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <WrenchIcon size={24} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={notification.read ? 400 : 600}>
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Chip label="New" color="primary" size="small" />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </Box>
                      {!notification.read && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <CheckIcon size={20} />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
