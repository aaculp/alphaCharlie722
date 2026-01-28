/**
 * useUserClaimsQuery Hook
 * 
 * React Query hook for fetching user's flash offer claims.
 * Provides automatic caching, refetching, and loading states.
 * 
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Automatic refetch on window focus
 * - Loading and error state management
 * - Manual refetch capability
 * - Type-safe query key generation
 * - Supports optimistic updates from claim mutations
 * 
 * Usage:
 * ```tsx
 * const { claims, isLoading, isError, error, refetch } = useUserClaimsQuery({
 *   userId: 'user-123'
 * });
 * ```
 * 
 * Validates Requirements: 5.1, 5.3
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { ClaimService } from '../../services/api/flashOfferClaims';
import type { FlashOfferClaim } from '../../types/flashOfferClaim.types';

/**
 * Options for useUserClaimsQuery hook
 */
export interface UseUserClaimsQueryOptions {
  userId?: string;
  enabled?: boolean;
}

/**
 * Return type for useUserClaimsQuery hook
 * Provides user claims data and query state information
 */
export interface UseUserClaimsQueryResult {
  claims: FlashOfferClaim[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React Query hook for fetching user's flash offer claims
 * 
 * Configured with moderate caching for user-specific data:
 * - staleTime: 5 minutes (data considered fresh for 5 minutes)
 * - refetchOnWindowFocus: true (refetch when app returns to foreground)
 * 
 * @param options - Query options including userId and enabled state
 * @returns User claims data and query state
 * 
 * @example
 * // Fetch claims for a specific user
 * const { claims, isLoading } = useUserClaimsQuery({
 *   userId: 'user-123'
 * });
 * 
 * @example
 * // Conditionally fetch claims
 * const { claims, isLoading } = useUserClaimsQuery({
 *   userId: userId,
 *   enabled: !!userId
 * });
 * 
 * @example
 * // Manual refetch
 * const { claims, refetch } = useUserClaimsQuery({
 *   userId: 'user-123'
 * });
 * 
 * // Later...
 * await refetch();
 */
export function useUserClaimsQuery(
  options?: UseUserClaimsQueryOptions
): UseUserClaimsQueryResult {
  const { userId, enabled = true } = options || {};

  const query = useQuery({
    // Use queryKeys.flashOfferClaims.byUser(userId) for cache key
    queryKey: queryKeys.flashOfferClaims.byUser(userId || ''),
    
    // Query function that fetches user claims
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      
      // Get all claims for the user (both active and redeemed)
      // Don't filter by status so we can show proper button states
      const result = await ClaimService.getUserClaims(userId);
      return result.claims;
    },
    
    // User-specific data caching configuration
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Enable refetchOnWindowFocus
    refetchOnWindowFocus: true,
    
    // Allow disabling the query
    enabled: enabled && !!userId,
  });

  return {
    claims: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
}
