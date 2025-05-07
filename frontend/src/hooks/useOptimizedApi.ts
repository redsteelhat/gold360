import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create an axios instance with base settings
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  // Get token from localStorage in client side
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Optimized API hook for GET requests with caching
export function useApiGet<T>(
  endpoint: string, 
  queryKey: string | any[],
  options?: UseQueryOptions<T>
) {
  return useQuery<T>(
    queryKey,
    async () => {
      const { data } = await apiClient.get<T>(endpoint);
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      ...options,
    }
  );
}

// Hook for POST requests
export function useApiPost<T, R>(endpoint: string) {
  const queryClient = useQueryClient();
  
  return useMutation<R, Error, T>(
    async (data: T) => {
      const response = await apiClient.post<R>(endpoint, data);
      return response.data;
    },
    {
      // Optimistic updates can be handled here
      onSuccess: (data, variables, context) => {
        // Invalidate and refetch related queries when data is updated
        queryClient.invalidateQueries(endpoint);
      },
    }
  );
}

// Hook for PUT requests
export function useApiPut<T, R>(endpoint: string) {
  const queryClient = useQueryClient();
  
  return useMutation<R, Error, T>(
    async (data: T) => {
      const response = await apiClient.put<R>(endpoint, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(endpoint);
      },
    }
  );
}

// Hook for DELETE requests
export function useApiDelete<R>(endpoint: string) {
  const queryClient = useQueryClient();
  
  return useMutation<R, Error, string>(
    async (id: string) => {
      const response = await apiClient.delete<R>(`${endpoint}/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(endpoint);
      },
    }
  );
} 