// Claim Button State Derivation
// Logic for determining claim button state based on offer, claim, and user status

import type { FlashOffer } from '../types/flashOffer.types';
import type { FlashOfferClaim } from '../types/flashOfferClaim.types';
import type { ClaimButtonState, MutationState } from '../types/claimButton.types';

/**
 * Derives the claim button state based on offer, claim, check-in status, and mutation state
 * 
 * Priority rules (highest to lowest):
 * 1. loading - Mutation in progress takes precedence over all other states
 * 2. claimed - User has already claimed this offer (permanent state)
 * 3. expired - Offer has expired or been cancelled (terminal state - takes precedence over check-in)
 * 4. full - Offer has reached capacity (terminal state - takes precedence over check-in)
 * 5. not_checked_in - User must check in before claiming (actionable, only if offer is still active)
 * 6. claimable - User is eligible to claim (default eligible state)
 * 
 * @param offer - The flash offer to evaluate
 * @param userClaim - The user's claim for this offer (null if not claimed)
 * @param isCheckedIn - Whether the user is checked in at the venue
 * @param mutationState - The current state of the claim mutation
 * @returns The appropriate claim button state
 * 
 * @example
 * // User is eligible to claim
 * const state = deriveClaimButtonState(offer, null, true, { isLoading: false });
 * // Returns: 'claimable'
 * 
 * @example
 * // User has already claimed
 * const state = deriveClaimButtonState(offer, claim, true, { isLoading: false });
 * // Returns: 'claimed'
 * 
 * @example
 * // Offer is expired (regardless of check-in status)
 * const state = deriveClaimButtonState(expiredOffer, null, false, { isLoading: false });
 * // Returns: 'expired'
 */
export function deriveClaimButtonState(
  offer: FlashOffer,
  userClaim: FlashOfferClaim | null,
  isCheckedIn: boolean,
  mutationState: MutationState
): ClaimButtonState {
  // Priority 1: Loading state (mutation in progress)
  if (mutationState.isLoading) {
    return 'loading';
  }

  // Priority 2: Claimed state (user has already claimed)
  if (userClaim !== null) {
    return 'claimed';
  }

  // Priority 3: Expired state (offer expired or cancelled)
  // This takes precedence over check-in status because expired offers can't be claimed regardless
  if (offer.status === 'expired' || offer.status === 'cancelled') {
    return 'expired';
  }

  // Priority 4: Full state (offer at capacity)
  // This also takes precedence over check-in status
  if (offer.status === 'full' || offer.claimed_count >= offer.max_claims) {
    return 'full';
  }

  // Priority 5: Not checked in (user must check in first)
  // Only relevant if offer is still active and available
  if (!isCheckedIn) {
    return 'not_checked_in';
  }

  // Priority 6: Claimable (default eligible state)
  // User is checked in, hasn't claimed, and offer is available
  return 'claimable';
}
