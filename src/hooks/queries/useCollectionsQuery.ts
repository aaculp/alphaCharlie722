/**
 * useCollectionsQuery Hook
 * 
 * React Query hook for fetching user collections.
 * Provides automatic caching, background refetching, and loading/error states.
 * 
 * Validates: Requirements 6.1
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { CollectionsService } from '../../services/api/collections';
import type { Collection } from '../../types/social.types';

/**
 * Options for useCollectionsQuery hook
 */
export interface UseCollectionsQueryOptions {
  userId: string;
  viewerId?: string;
  enabled?: boolean;
}

/**
 * Fetch user collections with privacy filtering
 * 
 * @param userId - ID of the user whose collections to fetch
 * @param viewerId - ID of the user viewing the collections (optional)
 * @returns Array of collections accessible to the viewer
 */
async function fetchUserCollections(
  userId: string,
  viewerId?: string
): Promise<Collection[]> {
  return await CollectionsService.getUserCollections(userId, viewerId);
}

/**
 * Hook for fetching user collections
 * 
 * Features:
 * - Automatic caching with 30s stale time
 * - Background refetching on window focus
 * - Loading and error state management
 * - Type-safe query key generation
 * - Privacy-aware filtering
 * 
 * @param options - Query options including userId, viewerId, and enabled flag
 * @returns Query result with collections array and states
 * 
 * @example
 * ```tsx
 * const { data: collections, isLoading, isError, error, refetch } = useCollectionsQuery({
 *   userId: 'user-123',
 *   viewerId: 'viewer-456',
 *   enabled: true,
 * });
 * 
 * if (isLoading) return <LoadingSkeleton />;
 * if (isError) return <ErrorMessage error={error} />;
 * if (!collections || collections.length === 0) return <EmptyState />;
 * 
 * return <CollectionsList collections={collections} />;
 * ```
 */
export function useCollectionsQuery(
  options: UseCollectionsQueryOptions
): UseQueryResult<Collection[], Error> {
  const { userId, viewerId, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.collections.byUser(userId),
    queryFn: () => fetchUserCollections(userId, viewerId),
    enabled: enabled && !!userId,
    staleTime: 30000, // 30 seconds
  });
}
