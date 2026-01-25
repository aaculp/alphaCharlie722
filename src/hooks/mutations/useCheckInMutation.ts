/**
 * useCheckInMutation Hook
 * 
 * React Query mutation hook for check-in actions with optimistic updates.
 * 
 * Features:
 * - Optimistic UI updates before server confirmation
 * - Automatic rollback on error
 * - Query invalidation on success
 * - Type-safe mutation interface
 * 
 * Validates Requirements: 3.1, 3.2, 3.3, 3.4
 * 
 * @example
 * ```tsx
 * const { mutate: checkIn, isPending } = useCheckInMutation({
 *   onSuccess: (checkIn) => {
 *     console.log('Checked in!', checkIn);
 *   },
 *   onError: (error) => {
 *     Alert.alert('Error', error.message);
 *   }
 * });
 * 
 * // Check in to a venue
 * checkIn({ venueId: 'venue-123', userId: 'user-456' });
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckInService } from '../../services/api/checkins';
import { queryKeys } from '../../lib/queryKeys';
import type { CheckIn, VenueWithStats } from '../../types';

/**
 * Check-in mutation data
 */
export interface CheckInMutationData {
  venueId: string;
  userId: string;
}

/**
 * Options for useCheckInMutation hook
 */
export interface UseCheckInMutationOptions {
  onSuccess?: (data: CheckIn) => void;
  onError?: (error: Error) => void;
}

/**
 * Context returned from onMutate for rollback
 */
interface CheckInMutationContext {
  previousVenue?: VenueWithStats;
}

/**
 * Custom hook for check-in mutation with optimistic updates
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
export function useCheckInMutation(options?: UseCheckInMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<CheckIn, Error, CheckInMutationData, CheckInMutationContext>({
    mutationFn: async ({ venueId, userId }: CheckInMutationData) => {
      return await CheckInService.checkIn(venueId, userId);
    },

    // Optimistic update: Update UI before server confirmation
    onMutate: async ({ venueId }: CheckInMutationData) => {
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
                active_checkins: (old.stats?.active_checkins || 0) + 1,
                recent_checkins: (old.stats?.recent_checkins || 0) + 1,
                user_is_checked_in: true,
                user_checkin_id: undefined, // Will be set by server response
                user_checkin_time: new Date().toISOString(),
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
      options?.onSuccess?.(data);
    },

    // Always refetch after mutation (success or error) to ensure data consistency
    onSettled: (data, error, { venueId, userId }) => {
      // Invalidate venue detail query to refetch with server data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.venues.detail(venueId),
        exact: true, // Only invalidate this specific venue, not all venue details
      });

      // Invalidate venue list queries to update check-in counts
      // Note: We invalidate all list queries because check-in count affects sorting/filtering
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.venues.lists(),
      });

      // Invalidate user's check-in queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.checkIns.byUser(userId),
        exact: true, // Only invalidate this user's check-ins
      });

      // Invalidate venue's check-in queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.checkIns.byVenue(venueId),
        exact: true, // Only invalidate this venue's check-ins
      });
    },
  });
}
