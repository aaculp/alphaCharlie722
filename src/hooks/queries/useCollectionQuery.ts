/**
 * useCollectionQuery Hook
 * 
 * React Query hook for fetching a single collection with details.
 * Provides automatic caching, background refetching, and loading/error states.
 * 
 * Validates: Requirements 6.2
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { CollectionsService } from '../../services/api/collections';
import type { Collection } from '../../types/social.types';

/**
 * Options for useCollectionQuery hook
 */
export interface UseCollectionQueryOptions {
  collectionId: string;
  viewerId?: string;
  enabled?: boolean;
}

/**
 * Fetch a single collection with privacy check
 * 
 * @param collectionId - ID of the collection to fetch
 * @param viewerId - ID of the user viewing the collection (optional)
 * @returns Collection or null if not found/not accessible
 */
async function fetchCollection(
  collectionId: string,
  viewerId?: string
): Promise<Collection | null> {
  return await CollectionsService.getCollection(collectionId, viewerId);
}

/**
 * Hook for fetching a single collection
 * 
 * Features:
 * - Automatic caching with 30s stale time
 * - Background refetching on window focus
 * - Loading and error state management
 * - Type-safe query key generation
 * - Privacy-aware access control
 * 
 * @param options - Query options including collectionId, viewerId, and enabled flag
 * @returns Query result with collection data and states
 * 
 * @example
 * ```tsx
 * const { data: collection, isLoading, isError, error, refetch } = useCollectionQuery({
 *   collectionId: 'collection-123',
 *   viewerId: 'viewer-456',
 *   enabled: true,
 * });
 * 
 * if (isLoading) return <LoadingSkeleton />;
 * if (isError) return <ErrorMessage error={error} />;
 * if (!collection) return <NotFound />;
 * 
 * return <CollectionDetail collection={collection} />;
 * ```
 */
export function useCollectionQuery(
  options: UseCollectionQueryOptions
): UseQueryResult<Collection | null, Error> {
  const { collectionId, viewerId, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.collections.detail(collectionId),
    queryFn: () => fetchCollection(collectionId, viewerId),
    enabled: enabled && !!collectionId,
    staleTime: 30000, // 30 seconds
  });
}
