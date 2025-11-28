import axios, { AxiosError } from 'axios';
import type {
  AuthResponse,
  RegisterData,
  LoginData,
  ProfileUpdateData,
  Property,
  PropertyFormData,
  PropertyFilters,
  Lease,
  LeaseFormData,
  LeaseFilters,
  MaintenanceRequest,
  MaintenanceFormData,
  MaintenanceUpdateData,
  MaintenanceFilters,
  Notification,
  NotificationFilters,
  Payment,
  PaymentFormData,
  PaymentFilters,
  ApiError,
} from '@/types';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Firebase ID token
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      try {
        // Dynamically import authClient to avoid circular dependency
        const { authClient } = await import('@/lib/auth/client');
        const token = await authClient.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting Firebase token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('custom-auth-token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user-role');
        localStorage.removeItem('user-data');
        localStorage.removeItem('user');
        window.location.href = '/auth/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Authentication API
// ============================================================================

export const authApi = {
  /**
   * Register a new user (landlord or tenant)
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: ProfileUpdateData) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ============================================================================
// Properties API
// ============================================================================

export const propertiesApi = {
  /**
   * Get all properties with optional filters
   */
  getAll: async (filters?: PropertyFilters): Promise<Property[]> => {
    const response = await api.get<Property[]>('/properties', { params: filters });
    // Parse amenities from JSON string to array
    return response.data.map((property) => ({
      ...property,
      amenities: typeof property.amenities === 'string' 
        ? JSON.parse(property.amenities) 
        : property.amenities,
      utilities_included: Boolean(property.utilities_included),
      pet_friendly: Boolean(property.pet_friendly),
      parking_available: Boolean(property.parking_available),
    }));
  },

  /**
   * Get property by ID
   */
  getById: async (id: number): Promise<Property> => {
    const response = await api.get<Property>(`/properties/${id}`);
    const property = response.data;
    return {
      ...property,
      amenities: typeof property.amenities === 'string' 
        ? JSON.parse(property.amenities) 
        : property.amenities,
      utilities_included: Boolean(property.utilities_included),
      pet_friendly: Boolean(property.pet_friendly),
      parking_available: Boolean(property.parking_available),
    };
  },

  /**
   * Create new property (landlord only)
   */
  create: async (data: PropertyFormData) => {
    if (data.images && data.images.length > 0) {
      // If images provided, use FormData
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          value.forEach((file) => formData.append('images', file));
        } else if (key === 'amenities' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      const response = await api.post('/properties', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } else {
      // No images, send JSON
      const response = await api.post('/properties', data);
      return response.data;
    }
  },

  /**
   * Update property (landlord only)
   */
  update: async (id: number, data: Partial<PropertyFormData>) => {
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          value.forEach((file) => formData.append('images', file));
        } else if (key === 'amenities' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
      const response = await api.put(`/properties/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } else {
      const response = await api.put(`/properties/${id}`, data);
      return response.data;
    }
  },

  /**
   * Delete property (landlord only)
   */
  delete: async (id: number) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },
};

// ============================================================================
// Leases API
// ============================================================================

export const leasesApi = {
  /**
   * Get all leases with optional filters
   */
  getAll: async (filters?: LeaseFilters): Promise<Lease[]> => {
    const response = await api.get<Lease[]>('/leases', { params: filters });
    return response.data;
  },

  /**
   * Get lease by ID
   */
  getById: async (id: number): Promise<Lease> => {
    const response = await api.get<Lease>(`/leases/${id}`);
    return response.data;
  },

  /**
   * Create new lease (landlord only)
   */
  create: async (data: LeaseFormData) => {
    const response = await api.post('/leases', data);
    return response.data;
  },

  /**
   * Update lease (landlord only)
   */
  update: async (id: number, data: Partial<LeaseFormData>) => {
    const response = await api.put(`/leases/${id}`, data);
    return response.data;
  },

  /**
   * Terminate lease (landlord only)
   */
  terminate: async (id: number) => {
    const response = await api.delete(`/leases/${id}`);
    return response.data;
  },
};

// ============================================================================
// Maintenance API
// ============================================================================

export const maintenanceApi = {
  /**
   * Get all maintenance requests with optional filters
   */
  getAll: async (filters?: MaintenanceFilters): Promise<MaintenanceRequest[]> => {
    const response = await api.get<MaintenanceRequest[]>('/maintenance', { params: filters });
    return response.data;
  },

  /**
   * Get maintenance request by ID
   */
  getById: async (id: number): Promise<MaintenanceRequest> => {
    const response = await api.get<MaintenanceRequest>(`/maintenance/${id}`);
    return response.data;
  },

  /**
   * Create new maintenance request (tenant only)
   */
  create: async (data: MaintenanceFormData) => {
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          value.forEach((file) => formData.append('images', file));
        } else {
          formData.append(key, String(value));
        }
      });
      const response = await api.post('/maintenance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } else {
      const response = await api.post('/maintenance', data);
      return response.data;
    }
  },

  /**
   * Update maintenance request (landlord only)
   */
  update: async (id: number, data: MaintenanceUpdateData) => {
    const response = await api.put(`/maintenance/${id}`, data);
    return response.data;
  },
};

// ============================================================================
// Notifications API
// ============================================================================

export const notificationsApi = {
  /**
   * Get all notifications with optional filters
   */
  getAll: async (filters?: NotificationFilters): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications', { params: filters });
    // Convert is_read from 0/1 to boolean
    return response.data.map((notif) => ({
      ...notif,
      is_read: Boolean(notif.is_read),
    }));
  },

  /**
   * Mark notification as read
   */
  markRead: async (id: number) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark notification as unread
   */
  markUnread: async (id: number) => {
    const response = await api.put(`/notifications/${id}/unread`);
    return response.data;
  },

  /**
   * Delete notification
   */
  delete: async (id: number) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/notifications/unread/count');
    return response.data.count;
  },
};

// ============================================================================
// Payments API
// ============================================================================

export const paymentsApi = {
  /**
   * Get all payments with optional filters
   */
  getAll: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const response = await api.get<Payment[]>('/payments', { params: filters });
    return response.data;
  },

  /**
   * Get payment by ID
   */
  getById: async (id: number): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  /**
   * Create new payment
   */
  create: async (data: PaymentFormData) => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  /**
   * Process payment with Stripe
   */
  processStripePayment: async (paymentId: number, paymentMethodId: string) => {
    const response = await api.post(`/payments/${paymentId}/process`, {
      payment_method_id: paymentMethodId,
    });
    return response.data;
  },
};

// Export default api instance for custom requests
export default api;
