/**
 * React Query Client Configuration
 * 
 * Configures the QueryClient with appropriate defaults for:
 * - Stale time: 30 seconds (data considered fresh for 30s)
 * - Cache time: 5 minutes (inactive data kept for 5min)
 * - Retry: 3 attempts with exponential backoff
 * - Refetch on window focus and reconnect
 * - Cache persistence to AsyncStorage
 * 
 * Note: React Query DevTools are not included in React Native as they are
 * designed for web and cause compatibility issues. For debugging in React Native:
 * - Use React Native Debugger
 * - Use Flipper with React Query plugin
 * - Access queryClient.getQueryCache() programmatically
 */

import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createCachePersister } from './cachePersistence';

/**
 * Custom retry function that checks error status
 * 
 * Retry strategy:
 * - Don't retry on 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)
 * - Retry up to 3 times for 5xx server errors and network errors
 * - Use exponential backoff for retries
 * 
 * @param failureCount - Number of times the query has failed
 * @param error - The error that occurred
 * @returns Whether to retry the query
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  // Don't retry more than 3 times
  if (failureCount >= 3) {
    return false;
  }

  // Check if error has a status property (HTTP errors)
  const httpError = error as { status?: number };
  
  // Don't retry on client errors (4xx)
  if (httpError.status === 401 || httpError.status === 403 || httpError.status === 404) {
    return false;
  }

  // Retry on server errors (5xx) and network errors
  return true;
}

/**
 * Custom retry delay function with exponential backoff
 * 
 * Delay strategy:
 * - 1st retry: 1 second
 * - 2nd retry: 2 seconds
 * - 3rd retry: 4 seconds
 * - Maximum delay: 30 seconds
 * 
 * @param attemptIndex - Zero-based index of the retry attempt
 * @returns Delay in milliseconds before the next retry
 */
function getRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/**
 * Creates and configures the QueryClient instance
 * 
 * Configuration:
 * - staleTime: 30000ms (30 seconds) - data is considered fresh for 30s
 * - cacheTime: 300000ms (5 minutes) - inactive data is kept in cache for 5min
 * - retry: Custom function that checks error status (up to 3 times for 5xx/network errors)
 * - retryDelay: Exponential backoff (1s, 2s, 4s)
 * - refetchOnWindowFocus: true - refetch when app returns to foreground
 * - refetchOnReconnect: true - refetch when network reconnects
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds
        staleTime: 30000, // 30 seconds
        
        // Inactive data is kept in cache for 5 minutes
        gcTime: 300000, // 5 minutes (formerly cacheTime in v4)
        
        // Custom retry logic based on error status
        retry: shouldRetryQuery,
        
        // Exponential backoff for retries
        retryDelay: getRetryDelay,
        
        // Refetch when app returns to foreground
        refetchOnWindowFocus: true,
        
        // Refetch when network reconnects
        refetchOnReconnect: true,
      },
      mutations: {
        // Don't retry mutations by default (can be overridden per mutation)
        retry: 0,
      },
    },
  });
}

/**
 * Global QueryClient instance
 * Used throughout the application for all queries and mutations
 */
export const queryClient = createQueryClient();

/**
 * Sets up cache persistence for the query client
 * 
 * Configuration:
 * - Persists cache to AsyncStorage
 * - Excludes queries with metadata.sensitive = true
 * - Marks all restored data as stale on app launch
 * - Expires persisted data after 24 hours
 * 
 * This function should be called once during app initialization.
 * It returns a promise that resolves when the cache is restored.
 */
export async function setupQueryPersistence(): Promise<void> {
  const persister = createCachePersister();
  
  await persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    
    // Exclude sensitive queries from persistence
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Don't persist queries marked as sensitive
        const meta = query.meta as { sensitive?: boolean } | undefined;
        if (meta?.sensitive === true) {
          return false;
        }
        
        // Persist all other queries
        return true;
      },
    },
    
    // Mark all restored data as stale to trigger background refetch
    hydrateOptions: {
      defaultOptions: {
        queries: {
          // Mark restored queries as stale immediately
          staleTime: 0,
        },
      },
    },
  });
}
