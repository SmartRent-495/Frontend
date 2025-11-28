export interface Notification {
  id: number;
  user_id: number;
  type: 'payment_reminder' | 'payment_received' | 'maintenance_update' | 'lease_expiring' | 'general';
  title: string;
  message: string;
  related_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface NotificationFilters {
  unread?: boolean;
  type?: Notification['type'];
}
