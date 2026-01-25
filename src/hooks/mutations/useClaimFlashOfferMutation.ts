/**
 * useClaimFlashOfferMutation Hook
 * 
 * React Query mutation hook for claiming flash offers with optimistic updates.
 * 
 * Features:
 * - Optimistic UI updates before server confirmation
 * - Automatic rollback on error
 * - Query invalidation on success
 * - Type-safe mutation interface
 * 
 * Validates Requirements: 4.3, 9.3
 * 
 * @example
 * ```tsx
 * const { mutate: claimOffer, isPending } = useClaimFlashOfferMutation({
 *   onSuccess: (claim) => {
 *     console.log('Claimed! Token:', claim.token);
 *   },
 *   onError: (error) => {
 *     Alert.alert('Error', error.message);
 *   }
 * });
 * 
 * // Claim a flash offer
 * claimOffer({ offerId: 'offer-123', userId: 'user-456', venueId: 'venue-789' });
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClaimService } from '../../services/api/flashOfferClaims';
import { queryKeys } from '../../lib/queryKeys';
import type { FlashOfferClaim } from '../../services/api/flashOfferClaims';
import type { FlashOffer } from '../../types/flashOffer.types';

/**
 * Claim flash offer mutation data
 */
export interface ClaimFlashOfferMutationData {
  offerId: string;
  userId: string;
  venueId: string;
}

/**
 * Options for useClaimFlashOfferMutation hook
 */
export interface UseClaimFlashOfferMutationOptions {
  onSuccess?: (data: FlashOfferClaim) => void;
  onError?: (error: Error) => void;
}

/**
 * Context returned from onMutate for rollback
 */
interface ClaimFlashOfferMutationContext {
  previousOffer?: FlashOffer;
  previousOffers?: FlashOffer[];
}

/**
 * Custom hook for claim flash offer mutation with optimistic updates
 * 
 * Implements optimistic update pattern:
 * 1. onMutate: Capture previous state and optimistically update offer status
 * 2. mutationFn: Execute server mutation
 * 3. onError: Rollback to previous state if mutation fails
 * 4. onSettled: Invalidate queries to refetch fresh data
 * 
 * @param options - Success and error callbacks
 * @returns React Query mutation result
 */
export function useClaimFlashOfferMutation(
  options?: UseClaimFlashOfferMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation<
    FlashOfferClaim,
    Error,
    ClaimFlashOfferMutationData,
    ClaimFlashOfferMutationContext
  >({
    mutationFn: async ({ offerId, userId }: ClaimFlashOfferMutationData) => {
      return await ClaimService.claimOffer(offerId, userId);
    },

    // Optimistic update: Update UI before server confirmation
    onMutate: async ({ offerId, venueId }: ClaimFlashOfferMutationData) => {
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.flashOffers.byVenue(venueId, undefined),
      });

      // Snapshot the previous values for rollback
      const previousOffers = queryClient.getQueryData<FlashOffer[]>(
        queryKeys.flashOffers.byVenue(venueId, undefined)
      );

      // Optimistically update the flash offers list
      if (previousOffers) {
        queryClient.setQueryData<FlashOffer[]>(
          queryKeys.flashOffers.byVenue(venueId, undefined),
          (old) => {
            if (!old) return old;

            return old.map((offer) => {
              if (offer.id === offerId) {
                // Increment claimed_count and potentially mark as full
                const newClaimedCount = offer.claimed_count + 1;
                const isFull = newClaimedCount >= offer.max_claims;

                return {
                  ...offer,
                  claimed_count: newClaimedCount,
                  status: isFull ? ('full' as const) : offer.status,
                };
              }
              return offer;
            });
          }
        );
      }

      // Return context with previous values for potential rollback
      return { previousOffers };
    },

    // Rollback on error: Restore previous state
    onError: (error, { venueId }, context) => {
      // Restore the previous flash offers state if we have it
      if (context?.previousOffers) {
        queryClient.setQueryData(
          queryKeys.flashOffers.byVenue(venueId, undefined),
          context.previousOffers
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
    onSettled: (data, error, { offerId, venueId }) => {
      // Requirement 4.3: Invalidate flash offer queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.flashOffers.byVenue(venueId, undefined),
        exact: true, // Only invalidate this venue's flash offers
      });

      // Requirement 4.3: Invalidate venue queries (venue may show flash offer status)
      queryClient.invalidateQueries({
        queryKey: queryKeys.venues.detail(venueId),
        exact: true, // Only invalidate this specific venue
      });

      // Also invalidate venue list queries in case they show flash offer indicators
      // Note: We invalidate all list queries because flash offer status affects filtering
      queryClient.invalidateQueries({
        queryKey: queryKeys.venues.lists(),
      });
    },
  });
}
