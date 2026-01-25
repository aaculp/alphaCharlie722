/**
 * useCheckOutMutation Hook
 * 
 * React Query mutation hook for check-out actions with optimistic updates.
 * 
 * Features:
 * - Optimistic UI updates before server confirmation
 * - Automatic rollback on error
 * - Query invalidation on success
 * - Type-safe mutation interface
 * 
 * @example
 * ```tsx
 * const { mutate: checkOut, isPending } = useCheckOutMutation({
 *   onSuccess: () => {
 *     console.log('Checked out!');
 *   },
 *   onError: (error) => {
 *     Alert.alert('Error', error.message);
 *   }
 * });
 * 
 * // Check out from a venue
 * checkOut({ checkInId: 'checkin-123', userId: 'user-456', venueId: 'venue-789' });
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckInService } from '../../services/api/checkins';
import { queryKeys } from '../../lib/queryKeys';
import type { VenueWithStats } from '../../types';

/**
 * Check-out mutation data
 */
export interface CheckOutMutationData {
  checkInId: string;
  userId: string;
  venueId: string;
}

/**
 * Options for useCheckOutMutation hook
 */
export interface UseCheckOutMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Context returned from onMutate for rollback
 */
interface CheckOutMutationContext {
  previousVenue?: VenueWithStats;
}

/**
 * Custom hook for check-out mutation with optimistic updates
 * 
 * Implements optimistic update pattern:
 * 1. onMutate: Capture previous state and optimistically update UI
 * 2. mutationFn: Execute server mutation
 * 3. onError: Rollback to previous state if mutation fails
 * 4. onSettled: Invalidate queries to refetch fresh data
 * 
 * @param options - Success and error callbacks
 * @returns React Query mutation result
 */
export function useCheckOutMutation(options?: UseCheckOutMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CheckOutMutationData, CheckOutMutationContext>({
    mutationFn: async ({ checkInId, userId }: CheckOutMutationData) => {
      await CheckInService.checkOut(checkInId, userId);
    },

    // Optimistic update: Update UI before server confirmation
    onMutate: async ({ venueId }: CheckOutMutationData) => {
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.venues.detail(venueId) 
      });

      // Snapshot the previous value for rollback
      const previousVenue = queryClient.getQueryData<VenueWithStats>(
        queryKeys.venues.detail(venueId)
      );

      // Optimistically update the venue data
      if (previousVenue) {
        queryClient.setQueryData<VenueWithStats>(
          queryKeys.venues.detail(venueId),
          (old) => {
            if (!old) return old;

            return {
              ...old,
              stats: {
                active_checkins: Math.max(0, (old.stats?.active_checkins || 0) - 1),
                recent_checkins: old.stats?.recent_checkins || 0,
                user_is_checked_in: false,
                user_checkin_id: undefined,
                user_checkin_time: undefined,
              },
            };
          }
        );
      }

      // Return context with previous value for potential rollback
      return { previousVenue };
    },

    // Rollback on error: Restore previous state
    onError: (error, { venueId }, context) => {
      // Restore the previous venue state if we have it
      if (context?.previousVenue) {
        queryClient.setQueryData(
          queryKeys.venues.detail(venueId),
          context.previousVenue
        );
      }

      // Call user-provided error handler
      options?.onError?.(error);
    },

    // Success handler
    onSuccess: (data, variables, context) => {
      // Call user-provided success handler
      options?.onSuccess?.();
    },

    // Always refetch after mutation (success or error) to ensure data consistency
    onSettled: (data, error, { venueId, userId }) => {
      // Invalidate venue detail query to refetch with server data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.venues.detail(venueId),
        exact: true,
      });

      // Invalidate venue list queries to update check-in counts
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.venues.lists(),
      });

      // Invalidate user's check-in queries (this will trigger useCheckInHistory to refetch)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.checkIns.byUser(userId),
      });

      // Invalidate venue's check-in queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.checkIns.byVenue(venueId),
      });
    },
  });
}
