'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/utils/api';

// Kullanıcı tipi
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
}

// Auth context tipi
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Kayıt için kullanıcı verisi tipi
interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'customer';
}

// Context'i oluştur
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Kullanıcı oturumunu kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
          // Kullanıcı ve token varsa, kullanıcı bilgilerini ayarla
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Hata durumunda oturumu temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Auth olmayan kullanıcıları login sayfasına yönlendir
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/', '/login', '/register', '/forgot-password'];
      const isPublicPath = publicPaths.includes(pathname);

      if (!user && !isPublicPath) {
        router.push('/login');
      }
    }
  }, [isLoading, user, pathname, router]);

  // Giriş işlemi
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Kayıt işlemi
  const register = async (userData: RegisterUserData) => {
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Çıkış işlemi
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Auth Context Hook
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 