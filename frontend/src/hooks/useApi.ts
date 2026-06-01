// Custom React hook for API requests
import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  baseURL?: string;
}

export function useApi<T>(options?: UseApiOptions) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const api = axios.create({
    baseURL: options?.baseURL || process.env.NEXT_PUBLIC_API_URL,
    headers: {
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
    },
  });

  const request = useCallback(
    async (method: 'get' | 'post' | 'put' | 'delete', url: string, data?: any) => {
      try {
        setState({ data: null, loading: true, error: null });
        const response = await api[method]<{ data: T }>(url, data);
        setState({ data: response.data.data, loading: false, error: null });
        return response.data.data;
      } catch (err) {
        const error = err as AxiosError<{ error: { message: string } }>;
        const errorMessage = error.response?.data?.error?.message || 'An error occurred';
        setState({ data: null, loading: false, error: errorMessage });
        throw err;
      }
    },
    [api]
  );

  return {
    ...state,
    get: (url: string) => request('get', url),
    post: (url: string, data: any) => request('post', url, data),
    put: (url: string, data: any) => request('put', url, data),
    delete: (url: string) => request('delete', url),
  };
}
