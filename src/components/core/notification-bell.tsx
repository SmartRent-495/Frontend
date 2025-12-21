'use client';

import { useState, useEffect } from 'react';
import { Badge, IconButton, Popover, List, ListItem, ListItemText, Typography, Box, Button, Divider, CircularProgress } from '@mui/material';
import { BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { auth } from '@/lib/firebase/config';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const { user } = useUser();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    // refresh every minute
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }

  async function loadNotifications() {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    loadNotifications();
    // Mark all as read when opening
    markAllAsRead();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  async function markAllAsRead() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  async function markAsRead(id: string) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }

  function getNotificationLink(notification: Notification): string {
    const userRole = window.location.pathname.startsWith('/landlord') ? 'landlord' : 'tenant';
    
    switch (notification.type) {
      case 'maintenance_request':
      case 'maintenance_update':
        return `/${userRole}/maintenance`;
      case 'lease':
        return `/${userRole}/lease`;
      case 'payment':
        return `/${userRole}/payments`;
      case 'property':
        return `/${userRole}/properties`;
      default:
        return `/${userRole}`;
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) markAsRead(notification.id);
    handleClose();
    router.push(getNotificationLink(notification));
  }

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick} color="inherit">
        <Badge badgeContent={unreadCount} color="error">
          <BellIcon fontSize="var(--icon-fontSize-md)" />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 360, maxHeight: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Notifications</Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            <List sx={{ overflow: 'auto', flex: 1 }}>
              {notifications.slice(0, 5).map((notification) => (
                <Box key={notification.id}>
                  <ListItem
                    component="div"
                    onClick={() => handleNotificationClick(notification)}
                    sx={{ 
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                      cursor: 'pointer'
                    }}
                  >
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <span>
                          <span style={{ display: 'block', fontSize: '0.875rem', color: 'text.secondary' }}>
                            {notification.message}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'text.disabled' }}>
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </span>
                      }
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          )}

          {notifications.length > 0 && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button
                fullWidth
                component={RouterLink}
                href={user?.role === 'landlord' ? '/landlord/notifications' : '/tenant/notifications'}
                onClick={handleClose}
              >
                View All
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}
