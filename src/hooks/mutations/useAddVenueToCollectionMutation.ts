/**
 * useAddVenueToCollectionMutation Hook
 * 
 * React Query mutation hook for adding a venue to a collection.
 * Automatically invalidates collection detail and user collections queries on success.
 * 
 * Validates: Requirements 6.3
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { CollectionsService } from '../../services/api/collections';

/**
 * Data required for adding venue to collection mutation
 */
export interface AddVenueToCollectionData {
  collectionId: string;
  venueId: string;
  userId: string;
  order?: number;
}

/**
 * Options for useAddVenueToCollectionMutation hook
 */
export interface UseAddVenueToCollectionMutationOptions {
  onSuccess?: (data: void, variables: AddVenueToCollectionData) => void;
  onError?: (error: Error, variables: AddVenueToCollectionData) => void;
}

/**
 * Add a venue to a collection
 * 
 * @param data - Venue addition data including collectionId, venueId, userId, and optional order
 * @returns void on success
 */
async function addVenueToCollection(data: AddVenueToCollectionData): Promise<void> {
  const { collectionId, venueId, order } = data;
  await CollectionsService.addVenueToCollection(collectionId, venueId, order);
}

/**
 * Hook for adding a venue to a collection
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Error handling with callbacks
 * - Loading state management
 * - Type-safe mutation
 * 
 * Invalidation Strategy:
 * - Invalidates collection detail query for the updated collection
 * - Invalidates user collections list query to update venue counts
 * - Triggers background refetch to ensure UI shows latest data
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * ```tsx
 * const addVenue = useAddVenueToCollectionMutation({
 *   onSuccess: () => {
 *     console.log('Venue added to collection');
 *     showSuccessToast('Venue added successfully');
 *   },
 *   onError: (error) => {
 *     console.error('Add failed:', error);
 *     showErrorToast(error.message);
 *   },
 * });
 * 
 * // Add venue to collection
 * addVenue.mutate({
 *   collectionId: 'collection-123',
 *   venueId: 'venue-456',
 *   userId: 'user-789',
 * });
 * ```
 */
export function useAddVenueToCollectionMutation(
  options?: UseAddVenueToCollectionMutationOptions
): UseMutationResult<void, Error, AddVenueToCollectionData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addVenueToCollection,
    onSuccess: (data, variables) => {
      // Invalidate collection detail query to show updated venue list
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
      });

      // Invalidate user collections query to update venue counts
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.byUser(variables.userId),
      });

      // Call custom success callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error('Add venue to collection error:', error);
      
      // Call custom error callback if provided
      options?.onError?.(error, variables);
    },
  });
}
