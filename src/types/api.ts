import { User } from './user';

// Auth API responses
export interface AuthResponse {
  status: 'success' | 'error';
  data?: {
    token: string;
    user: User;
  };
  message?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'landlord' | 'tenant';
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ProfileUpdateData {
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

// Generic API respond
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Error 
export interface ApiError {
  status: 'error';
  message: string;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
