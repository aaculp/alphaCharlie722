/**
 * useUserProfileQuery Hook
 * 
 * React Query hook for fetching user profile data.
 * Provides automatic caching, background refetching, and loading/error states.
 * 
 * Validates: Requirements 5.1
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { ProfileService } from '../../services/api/profile';
import type { UserProfile } from '../../types/profile.types';

/**
 * Options for useUserProfileQuery hook
 */
export interface UseUserProfileQueryOptions {
  userId: string;
  enabled?: boolean;
}

/**
 * Fetch user profile with complete statistics
 * 
 * @param userId - ID of the user to fetch
 * @returns User profile with statistics or null
 */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const response = await ProfileService.fetchCompleteUserProfile(userId);
  
  if (!response.success || !response.profile) {
    throw new Error(response.error || 'Failed to fetch user profile');
  }
  
  return response.profile;
}

/**
 * Hook for fetching user profile data
 * 
 * Features:
 * - Automatic caching with 30s stale time
 * - Background refetching on window focus
 * - Loading and error state management
 * - Type-safe query key generation
 * 
 * @param options - Query options including userId and enabled flag
 * @returns Query result with profile data and states
 * 
 * @example
 * ```tsx
 * const { data: profile, isLoading, isError, error, refetch } = useUserProfileQuery({
 *   userId: 'user-123',
 *   enabled: true,
 * });
 * 
 * if (isLoading) return <LoadingSkeleton />;
 * if (isError) return <ErrorMessage error={error} />;
 * if (!profile) return <NotFound />;
 * 
 * return <ProfileView profile={profile} />;
 * ```
 */
export function useUserProfileQuery(
  options: UseUserProfileQueryOptions
): UseQueryResult<UserProfile | null, Error> {
  const { userId, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.users.profile(userId),
    queryFn: () => fetchUserProfile(userId),
    enabled: enabled && !!userId,
    staleTime: 30000, // 30 seconds
  });
}
