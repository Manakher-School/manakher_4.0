"use client";

import { ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  DefaultError,
} from "@tanstack/react-query";

// Create a single QueryClient instance for the entire app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 1000 * 60 * 5,
      
      // Keep unused queries in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      
      // Retry failed requests once after 1 second
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch data when window regains focus
      refetchOnWindowFocus: true,
      
      // Refetch data when component remounts
      refetchOnMount: true,
      
      // Refetch in background on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

/**
 * React Query provider for the entire application
 * Provides query caching, background refetching, and optimistic updates
 */
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
