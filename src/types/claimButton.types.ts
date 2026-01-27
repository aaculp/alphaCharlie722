// Claim Button Types
// Types for the venue detail claim button feature

import type { FlashOffer } from './flashOffer.types';
import type { FlashOfferClaim } from './flashOfferClaim.types';

/**
 * Claim button state enum
 * Represents the current state of the claim button based on eligibility and claim status
 * 
 * Priority order (highest to lowest):
 * 1. loading - Mutation in progress
 * 2. claimed - User has already claimed this offer
 * 3. not_checked_in - User is not checked in at the venue
 * 4. full - Offer has reached max_claims limit
 * 5. expired - Offer has expired or been cancelled
 * 6. claimable - User is eligible to claim the offer
 */
export type ClaimButtonState =
  | 'claimable'    // User can claim the offer
  | 'claimed'      // User has already claimed this offer
  | 'loading'      // Claim operation in progress
  | 'not_checked_in' // User must check in first
  | 'full'         // Offer is at capacity
  | 'expired';     // Offer has expired or been cancelled

/**
 * Button variant for styling
 */
export type ClaimButtonVariant = 
  | 'primary'    // Claimable state
  | 'secondary'  // Not checked in state
  | 'success'    // Claimed state
  | 'disabled';  // Full or expired state

/**
 * Configuration object for rendering the claim button
 * Contains all information needed to display and handle the button
 */
export interface ClaimButtonConfig {
  state: ClaimButtonState;
  label: string;
  disabled: boolean;
  variant: ClaimButtonVariant;
  icon?: string;
  onPress: () => void;
}

/**
 * Mutation state from React Query
 * Used to determine if a claim operation is in progress
 */
export interface MutationState {
  isLoading: boolean;
}

/**
 * Input for deriving claim button state
 * Contains all data needed to determine button eligibility and appearance
 */
export interface DeriveClaimButtonStateInput {
  offer: FlashOffer;
  userClaim: FlashOfferClaim | null;
  isCheckedIn: boolean;
  mutationState: MutationState;
}
