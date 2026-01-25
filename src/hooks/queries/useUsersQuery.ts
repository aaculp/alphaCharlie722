/**
 * useUsersQuery Hook
 * 
 * React Query hook for searching users by username or display name.
 * Provides automatic caching, loading states, and refetch capabilities.
 * 
 * Features:
 * - Case-insensitive search on username and display_name fields
 * - Automatic caching with 30s stale time
 * - Filters out users without usernames
 * - Limits results to 20 users maximum
 * - Loading and error state management
 * - Manual refetch capability
 * 
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useUsersQuery({
 *   searchQuery: 'john',
 *   enabled: true
 * });
 * ```
 * 
 * Requirements:
 * - 2.1: Search profiles table when query starts with @
 * - 2.2: Match against both username and display_name fields
 * - 2.3: Perform case-insensitive matching
 * - 2.4: Return results ordered by relevance
 * - 2.5: Limit results to maximum of 20 users
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { supabase } from '../../lib/supabase';
import type { UserSearchResult } from '../../types/search.types';

/**
 * Options for useUsersQuery hook
 */
export interface UseUsersQueryOptions {
  searchQuery: string;
  enabled?: boolean;
}

/**
 * React Query hook for searching users
 * 
 * @param options - Query options including search query and enabled state
 * @returns User search results and query state
 * 
 * @example
 * // Search for users with query
 * const { data, isLoading } = useUsersQuery({
 *   searchQuery: 'john'
 * });
 * 
 * @example
 * // Conditionally enable search
 * const { data, isLoading } = useUsersQuery({
 *   searchQuery: query,
 *   enabled: query.length >= 2
 * });
 */
export function useUsersQuery({ searchQuery, enabled = true }: UseUsersQueryOptions) {
  return useQuery({
    // Use queryKeys.users.search for cache key
    queryKey: queryKeys.users.search(searchQuery),
    
    // Query function that searches users by username or display_name
    queryFn: async (): Promise<UserSearchResult[]> => {
      try {
        // Return empty array for queries less than 2 characters
        if (!searchQuery || searchQuery.length < 2) {
          return [];
        }

        // Query profiles table with case-insensitive search on username and display_name
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .not('username', 'is', null) // Filter out users without usernames
          .limit(20); // Limit results to 20 users

        if (error) {
          console.error('User search error:', error);
          throw new Error(`Failed to search users: ${error.message}`);
        }
        
        // Return results with proper typing
        return (data || []) as UserSearchResult[];
      } catch (error) {
        console.error('Unexpected error in user search:', error);
        // Re-throw to let React Query handle the error state
        throw error;
      }
    },
    
    // Only enable query when searchQuery is at least 2 characters and enabled is true
    enabled: enabled && searchQuery.length >= 2,
    
    // Cache results for 30 seconds
    staleTime: 30000,
    
    // Retry configuration for network failures
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
