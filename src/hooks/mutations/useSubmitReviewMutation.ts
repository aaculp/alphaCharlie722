/**
 * useSubmitReviewMutation Hook
 * 
 * React Query mutation hook for submitting venue reviews with cache invalidation.
 * 
 * Features:
 * - Automatic cache invalidation for venue data and check-in history
 * - Type-safe mutation interface
 * - Error handling
 * 
 * @example
 * ```tsx
 * const { mutate: submitReview, isPending } = useSubmitReviewMutation({
 *   onSuccess: () => {
 *     console.log('Review submitted!');
 *   },
 *   onError: (error) => {
 *     Alert.alert('Error', error.message);
 *   }
 * });
 * 
 * // Submit a review
 * submitReview({
 *   venueId: 'venue-123',
 *   userId: 'user-456',
 *   rating: 5,
 *   comment: 'Great place!',
 * });
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReviewService } from '../../services/api/reviews';
import { queryKeys } from '../../lib/queryKeys';
import type { Review } from '../../types';

/**
 * Review submission data
 */
export interface SubmitReviewMutationData {
  venueId: string;
  userId: string;
  rating: number;
  comment?: string;
  reviewId?: string; // For updating existing reviews
}

/**
 * Options for useSubmitReviewMutation hook
 */
export interface UseSubmitReviewMutationOptions {
  onSuccess?: (review: Review) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for review submission with automatic cache invalidation
 * 
 * Invalidates:
 * - Venue detail queries (to update aggregate_rating and review_count)
 * - Venue list queries (to update ratings in lists)
 * - Check-in history queries (to update venue data in recently visited)
 * 
 * @param options - Success and error callbacks
 * @returns React Query mutation result
 */
export function useSubmitReviewMutation(options?: UseSubmitReviewMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, SubmitReviewMutationData>({
    mutationFn: async ({ venueId, userId, rating, comment, reviewId }: SubmitReviewMutationData) => {
      if (reviewId) {
        // Update existing review
        return await ReviewService.updateReview(reviewId, userId, { rating, comment });
      } else {
        // Submit new review
        return await ReviewService.submitReview({
          venueId,
          userId,
          rating,
          comment,
        });
      }
    },

    // Success handler
    onSuccess: (data, variables, context) => {
      // Call user-provided success handler
      options?.onSuccess?.(data);
    },

    // Error handler
    onError: (error, variables, context) => {
      // Call user-provided error handler
      options?.onError?.(error);
    },

    // Always invalidate queries after mutation to ensure data consistency
    onSettled: (data, error, { venueId, userId }) => {
      // Invalidate venue detail query to refetch with updated ratings
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.venues.detail(venueId),
      });

      // Invalidate venue list queries to update ratings in lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.venues.lists(),
      });

      // Invalidate check-in history queries to update venue data in recently visited
      // This ensures the recently visited section shows updated review counts and ratings
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.checkIns.byUser(userId),
      });
    },
  });
}
