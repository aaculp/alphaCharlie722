// Flash Offer Claim Types
// Based on database schema from migration 012_create_flash_offers_tables.sql

import type { FlashOffer } from './flashOffer.types';

/**
 * Claim status enum
 * - active: Claim is valid and can be redeemed
 * - redeemed: Claim has been redeemed by venue staff
 * - expired: Claim has passed its expiration time
 */
export type ClaimStatus = 'active' | 'redeemed' | 'expired';

/**
 * Flash offer claim interface matching database schema
 * Represents a user's claim on a flash offer with a redemption token
 */
export interface FlashOfferClaim {
  id: string;
  offer_id: string;
  user_id: string;
  
  // Token for redemption
  token: string; // 6-digit numeric string (e.g., "004219")
  
  // Status tracking
  status: ClaimStatus;
  
  // Redemption details
  redeemed_at: string | null; // ISO 8601 timestamp
  redeemed_by_user_id: string | null; // Staff member who redeemed
  
  // Expiration
  expires_at: string; // ISO 8601 timestamp
  
  // Timestamps
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Flash offer claim with offer details
 * Used when displaying claims to users with full offer information
 */
export interface FlashOfferClaimWithOffer extends FlashOfferClaim {
  offer: FlashOffer;
}

/**
 * Flash offer claim with offer and venue details
 * Used in claim list views to show complete context
 */
export interface FlashOfferClaimWithDetails extends FlashOfferClaim {
  offer: {
    id: string;
    title: string;
    description: string;
    claim_value: number;
    venue_id: string;
    start_time: string;
    end_time: string;
    status: string;
  };
  venue: {
    id: string;
    name: string;
    location: string;
    image_url: string | null;
  };
}

/**
 * Result of claim eligibility validation
 * Used to determine if a user can claim an offer and provide error messages
 */
export interface ClaimValidationResult {
  eligible: boolean;
  reason?: ClaimIneligibilityReason;
  message?: string;
}

/**
 * Reasons why a user might not be eligible to claim an offer
 */
export type ClaimIneligibilityReason =
  | 'not_checked_in' // User is not checked into the venue
  | 'already_claimed' // User has already claimed this offer
  | 'offer_full' // Offer has reached max_claims limit
  | 'offer_expired' // Offer has passed its end_time
  | 'offer_not_active' // Offer is not in 'active' status
  | 'offer_not_started' // Offer start_time is in the future
  | 'outside_radius' // User is outside the offer's target radius
  | 'not_favorite' // Offer targets favorites only and user hasn't favorited venue
  | 'unknown_error'; // Unexpected error occurred

/**
 * Input for claiming an offer
 */
export interface ClaimOfferInput {
  offer_id: string;
  user_id: string;
}

/**
 * Input for redeeming a claim
 */
export interface RedeemClaimInput {
  claim_id: string;
  staff_user_id: string;
}

/**
 * Query options for fetching user claims
 */
export interface UserClaimsQueryOptions {
  user_id: string;
  status?: ClaimStatus | ClaimStatus[];
  limit?: number;
  offset?: number;
}

/**
 * Query options for finding a claim by token
 */
export interface ClaimByTokenQuery {
  venue_id: string;
  token: string;
}

/**
 * Response from claiming an offer
 * Includes the created claim and success status
 */
export interface ClaimOfferResponse {
  success: boolean;
  claim?: FlashOfferClaim;
  error?: string;
}

/**
 * Response from redeeming a claim
 * Includes updated claim and success status
 */
export interface RedeemClaimResponse {
  success: boolean;
  claim?: FlashOfferClaim;
  error?: string;
}
