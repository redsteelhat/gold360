'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthResponse, LoginRequest, RegisterRequest } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Define the user type
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: string;
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  error: string | null;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the auth provider
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if the user is authenticated
  const isAuthenticated = !!user && !!token;

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Verify token validity whenever token changes
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;

      try {
        await authService.verifyToken();
      } catch (error) {
        console.error('Token validation failed:', error);
        handleLogout();
      }
    };

    verifyToken();
  }, [token]);

  // Login function
  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(data);
      const { user, token } = response.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update state
      setUser(user);
      setToken(token);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to login. Please try again.';
      setError(errorMessage);
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);
      const { user, token } = response.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update state
      setUser(user);
      setToken(token);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Reset state
    setUser(null);
    setToken(null);

    // Redirect to login
    router.push('/login');
  };

  // Context value
  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout: handleLogout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 