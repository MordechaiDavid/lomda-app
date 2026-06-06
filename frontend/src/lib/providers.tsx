'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { LangProvider } from './i18n';
import { LangToggle } from '../components/LangToggle';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1
          }
        }
      })
  );

  return (
    <LangProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <LangToggle />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </LangProvider>
  );
}
