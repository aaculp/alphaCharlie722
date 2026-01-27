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
 * Optimistic Update Behavior:
 * 1. Immediately increments offer.claimed_count in cache
 * 2. Updates offer status to 'full' if max_claims reached
 * 3. Creates temporary claim object and adds to user's claims cache
 * 4. Button state changes to "claimed" immediately (via userClaim prop)
 * 5. On success: Replaces optimistic claim with real claim from server
 * 6. On error: Reverts all optimistic updates and shows error message
 * 
 * This provides instant feedback to users while maintaining data consistency.
 * 
 * Validates Requirements: 4.4, 6.2, 6.3
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
  previousClaims?: FlashOfferClaim[];
  optimisticClaim?: FlashOfferClaim;
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
    onMutate: async ({ offerId, userId, venueId }: ClaimFlashOfferMutationData) => {
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.flashOffers.byVenue(venueId, undefined),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.flashOfferClaims.byUser(userId),
      });

      // Snapshot the previous values for rollback
      const previousOffers = queryClient.getQueryData<FlashOffer[]>(
        queryKeys.flashOffers.byVenue(venueId, undefined)
      );
      const previousClaims = queryClient.getQueryData<FlashOfferClaim[]>(
        queryKeys.flashOfferClaims.byUser(userId)
      );

      // Create optimistic claim object
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
      const optimisticClaim: FlashOfferClaim = {
        id: `optimistic-${offerId}-${Date.now()}`, // Temporary ID
        offer_id: offerId,
        user_id: userId,
        token: '------', // Placeholder token (will be replaced by server response)
        status: 'active',
        claimed_at: now,
        expires_at: expiresAt,
        redeemed_at: null,
        created_at: now,
        updated_at: now,
      };

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

      // Optimistically add the claim to user's claims
      queryClient.setQueryData<FlashOfferClaim[]>(
        queryKeys.flashOfferClaims.byUser(userId),
        (old) => {
          if (!old) {
            // If no claims exist yet, create array with optimistic claim
            return [optimisticClaim];
          }
          // Add optimistic claim to the beginning of the array
          return [optimisticClaim, ...old];
        }
      );

      // Return context with previous values for potential rollback
      return { previousOffers, previousClaims, optimisticClaim };
    },

    // Rollback on error: Restore previous state
    onError: (error, { venueId, userId }, context) => {
      // Restore the previous flash offers state if we have it
      if (context?.previousOffers) {
        queryClient.setQueryData(
          queryKeys.flashOffers.byVenue(venueId, undefined),
          context.previousOffers
        );
      }

      // Restore the previous claims state if we have it
      if (context?.previousClaims !== undefined) {
        queryClient.setQueryData(
          queryKeys.flashOfferClaims.byUser(userId),
          context.previousClaims
        );
      } else if (context?.optimisticClaim) {
        // If we didn't have previous claims but added an optimistic one, remove it
        queryClient.setQueryData<FlashOfferClaim[]>(
          queryKeys.flashOfferClaims.byUser(userId),
          (old) => {
            if (!old) return old;
            return old.filter((claim) => claim.id !== context.optimisticClaim?.id);
          }
        );
      }

      // Call user-provided error handler
      options?.onError?.(error);
    },

    // Success handler
    onSuccess: (data, { userId }, context) => {
      // Replace optimistic claim with real claim from server
      if (context?.optimisticClaim) {
        queryClient.setQueryData<FlashOfferClaim[]>(
          queryKeys.flashOfferClaims.byUser(userId),
          (old) => {
            if (!old) return [data];
            
            // Replace optimistic claim with real claim
            return old.map((claim) =>
              claim.id === context.optimisticClaim?.id ? data : claim
            );
          }
        );
      }

      // Call user-provided success handler
      options?.onSuccess?.(data);
    },

    // Always refetch after mutation (success or error) to ensure data consistency
    onSettled: (data, error, { offerId, venueId, userId }) => {
      // Requirement 4.3: Invalidate flash offer queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.flashOffers.byVenue(venueId, undefined),
        exact: true, // Only invalidate this venue's flash offers
      });

      // Invalidate user claims queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.flashOfferClaims.byUser(userId),
        exact: true,
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
