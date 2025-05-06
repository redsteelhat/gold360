import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Define API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    verifyToken: '/auth/verify',
  },
  users: {
    list: '/users',
    getById: (id: number) => `/users/${id}`,
    update: (id: number) => `/users/${id}`,
    delete: (id: number) => `/users/${id}`,
  },
  products: {
    list: '/products',
    getById: (id: number) => `/products/${id}`,
    create: '/products',
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`,
    updateStock: (id: number) => `/products/${id}/stock`,
  },
  orders: {
    list: '/orders',
    getById: (id: number) => `/orders/${id}`,
    create: '/orders',
    update: (id: number) => `/orders/${id}`,
    delete: (id: number) => `/orders/${id}`,
    updateStatus: (id: number) => `/orders/${id}/status`,
  },
  inventory: {
    list: '/inventory',
    lowStock: '/inventory/low-stock',
  },
  customers: {
    list: '/customers',
    getById: (id: number) => `/customers/${id}`,
    create: '/customers',
    update: (id: number) => `/customers/${id}`,
    delete: (id: number) => `/customers/${id}`,
    getLoyalty: (id: number) => `/customers/${id}/loyalty`,
  },
  reports: {
    sales: '/reports/sales',
    inventory: '/reports/inventory',
    customers: '/reports/customers',
  },
};

// Types for API requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    profileImage?: string;
    isActive: boolean;
    lastLogin?: string;
  };
  token: string;
}

// Utility function for making API requests
export const makeRequest = async <T = any, R = AxiosResponse<T>>(
  method: string,
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<R> => {
  try {
    const response = await api({
      method,
      url,
      data,
      ...config,
    });
    return response as R;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API service for auth
export const authService = {
  login: (data: LoginRequest) => makeRequest<AuthResponse>('post', endpoints.auth.login, data),
  register: (data: RegisterRequest) => makeRequest<AuthResponse>('post', endpoints.auth.register, data),
  getProfile: () => makeRequest('get', endpoints.auth.profile),
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    makeRequest('post', endpoints.auth.changePassword, data),
  verifyToken: () => makeRequest('get', endpoints.auth.verifyToken),
};

export default api; 