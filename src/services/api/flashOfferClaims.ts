/**
 * Flash Offer Claims Service
 * 
 * Service for managing flash offer claims - the process of users claiming offers
 * and venues redeeming claim tokens. Includes atomic claim logic to prevent race
 * conditions and ensure data consistency.
 * 
 * @module ClaimService
 * @category Services
 * @subcategory API
 */

import { supabase } from '../../lib/supabase';
import { generateFlashOfferToken } from '../../utils/tokenGenerator';
import { FlashOfferAnalyticsService } from './flashOfferAnalytics';
import { NetworkErrorHandler } from '../../utils/errors/NetworkErrorHandler';
import { FlashOfferCache } from '../../utils/cache/FlashOfferCache';

/**
 * Status of a flash offer claim
 * - `active`: Claim is valid and can be redeemed
 * - `redeemed`: Claim has been redeemed by venue staff
 * - `expired`: Claim has passed its expiration time
 */
export type ClaimStatus = 'active' | 'redeemed' | 'expired';

/**
 * Flash offer claim entity from database
 */
export interface FlashOfferClaim {
  /** Unique identifier */
  id: string;
  /** ID of the flash offer being claimed */
  offer_id: string;
  /** ID of the user who claimed the offer */
  user_id: string;
  /** 6-digit redemption token */
  token: string;
  /** Current status of the claim */
  status: ClaimStatus;
  /** ISO 8601 timestamp when claim was redeemed (null if not redeemed) */
  redeemed_at: string | null;
  /** ID of staff member who redeemed the claim (null if not redeemed) */
  redeemed_by_user_id: string | null;
  /** ISO 8601 timestamp when claim expires (typically 24 hours after creation) */
  expires_at: string;
  /** ISO 8601 timestamp when claim was created */
  created_at: string;
  /** ISO 8601 timestamp when claim was last updated */
  updated_at: string;
}

/**
 * Result of claim eligibility validation
 */
export interface ClaimValidationResult {
  /** Whether the user is eligible to claim the offer */
  eligible: boolean;
  /** Reason for ineligibility (undefined if eligible) */
  reason?: string;
}

/**
 * Service for managing flash offer claims
 * 
 * Provides methods for claiming offers, validating eligibility, retrieving claims,
 * and redeeming tokens. Includes atomic operations to prevent race conditions
 * when multiple users claim simultaneously.
 * 
 * @example
 * ```typescript
 * // Claim an offer
 * try {
 *   const claim = await ClaimService.claimOffer('offer-123', 'user-456');
 *   console.log(`Claimed! Your token is: ${claim.token}`);
 * } catch (error) {
 *   console.error('Failed to claim:', error.message);
 * }
 * 
 * // Get user's claims
 * const { claims, total } = await ClaimService.getUserClaims('user-456', 'active');
 * console.log(`You have ${total} active claims`);
 * 
 * // Redeem a token
 * const claim = await ClaimService.getClaimByToken('venue-123', '004219');
 * if (claim && claim.status === 'active') {
 *   await ClaimService.redeemClaim(claim.id, 'staff-789');
 *   console.log('Token redeemed successfully!');
 * }
 * ```
 */
export class ClaimService {
  /**
   * Claim an offer for a user with full validation
   * 
   * Creates a new claim for the specified offer and user. Performs eligibility checks
   * including check-in status, offer availability, and duplicate claim prevention.
   * Uses atomic database operations to prevent race conditions.
   * 
   * @param offerId - ID of the offer to claim
   * @param userId - ID of the user claiming the offer
   * @returns Promise resolving to the created claim with 6-digit token
   * @throws {Error} If user is not eligible or claim creation fails
   * 
   * @example
   * ```typescript
   * try {
   *   const claim = await ClaimService.claimOffer('offer-123', 'user-456');
   *   
   *   console.log(`Success! Your redemption code is: ${claim.token}`);
   *   console.log(`Valid until: ${new Date(claim.expires_at).toLocaleString()}`);
   *   
   *   // Show token to venue staff to redeem
   * } catch (error) {
   *   if (error.message.includes('already claimed')) {
   *     console.log('You already claimed this offer');
   *   } else if (error.message.includes('maximum claims')) {
   *     console.log('Sorry, this offer is now full');
   *   } else if (error.message.includes('checked in')) {
   *     console.log('You must check in to claim this offer');
   *   }
   * }
   * ```
   */
  static async claimOffer(offerId: string, userId: string): Promise<FlashOfferClaim> {
    try {
      // First, validate eligibility
      const validation = await this.validateClaimEligibility(offerId, userId);
      if (!validation.eligible) {
        throw new Error(validation.reason || 'User is not eligible to claim this offer');
      }

      // Generate a unique token
      const token = await generateFlashOfferToken(offerId);

      // Set expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Use a transaction to atomically create the claim and increment the count
      // This is handled in subtask 2.4, but we'll call it here
      const claim = await this.createClaimAtomic(offerId, userId, token, expiresAt.toISOString());

      console.log('✅ Offer claimed successfully:', claim);
      return claim;
    } catch (error) {
      console.error('Error claiming offer:', error);
      throw error;
    }
  }

  /**
   * Create claim atomically with database-level locking
   * 
   * Uses a database stored procedure to perform the entire claim operation
   * within a single transaction with row-level locking. This prevents race
   * conditions when multiple users claim simultaneously.
   * 
   * The database function performs:
   * 1. Lock the offer row (SELECT ... FOR UPDATE)
   * 2. Validate offer is active and has available claims
   * 3. Create the claim record
   * 4. Increment claimed_count
   * 5. Update status to 'full' if max_claims reached
   * 
   * @param offerId - ID of the offer
   * @param userId - ID of the user
   * @param token - Generated 6-digit token
   * @param expiresAt - ISO 8601 expiration timestamp
   * @returns Promise resolving to the created claim
   * @throws {Error} If claim creation fails or offer is full/inactive
   * @private
   */
  private static async createClaimAtomic(
    offerId: string,
    userId: string,
    token: string,
    expiresAt: string
  ): Promise<FlashOfferClaim> {
    try {
      // Call the database function that handles atomic claim creation
      // This function will:
      // 1. Lock the offer row (SELECT ... FOR UPDATE)
      // 2. Check if offer is active and has available claims
      // 3. Create the claim
      // 4. Increment claimed_count
      // 5. Update status to 'full' if max_claims reached
      // All within a single transaction
      
      const { data, error } = await supabase.rpc('claim_flash_offer_atomic', {
        p_offer_id: offerId,
        p_user_id: userId,
        p_token: token,
        p_expires_at: expiresAt,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('already claimed')) {
          throw new Error('You have already claimed this offer');
        }
        if (error.message.includes('maximum claims')) {
          throw new Error('This offer has reached its maximum claims');
        }
        if (error.message.includes('not active')) {
          throw new Error('This offer is not currently active');
        }
        throw new Error(`Failed to claim offer: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to create claim');
      }

      const claim = data[0] as FlashOfferClaim;

      // Track the claim event
      await FlashOfferAnalyticsService.trackClaim(offerId, userId, claim.id);

      return claim;
    } catch (error) {
      // If the RPC function doesn't exist yet, fall back to the non-atomic version
      // This allows the code to work even if the database function hasn't been created
      if (error instanceof Error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.warn('⚠️ Atomic claim function not found, using fallback implementation');
        return this.createClaimFallback(offerId, userId, token, expiresAt);
      }
      throw error;
    }
  }

  /**
   * Fallback claim creation without atomic guarantees
   * 
   * Used when the database stored procedure is not available. This implementation
   * has a small race condition window but provides basic functionality.
   * 
   * @param offerId - ID of the offer
   * @param userId - ID of the user
   * @param token - Generated 6-digit token
   * @param expiresAt - ISO 8601 expiration timestamp
   * @returns Promise resolving to the created claim
   * @throws {Error} If claim creation fails
   * @private
   */
  private static async createClaimFallback(
    offerId: string,
    userId: string,
    token: string,
    expiresAt: string
  ): Promise<FlashOfferClaim> {
    // Get the offer first to check availability
    const { data: offer, error: offerError } = await supabase
      .from('flash_offers')
      .select('claimed_count, max_claims, status')
      .eq('id', offerId)
      .single();

    if (offerError) {
      throw new Error(`Failed to fetch offer: ${offerError.message}`);
    }

    // Check if offer is full
    if (offer.claimed_count >= offer.max_claims) {
      throw new Error('This offer has reached its maximum claims');
    }

    // Check if offer is active
    if (offer.status !== 'active') {
      throw new Error('This offer is not currently active');
    }

    // Create the claim
    const { data: claim, error: claimError } = await supabase
      .from('flash_offer_claims')
      .insert({
        offer_id: offerId,
        user_id: userId,
        token,
        expires_at: expiresAt,
        status: 'active',
      })
      .select()
      .single();

    if (claimError) {
      // Check if it's a duplicate claim error
      if (claimError.code === '23505') {
        throw new Error('You have already claimed this offer');
      }
      throw new Error(`Failed to create claim: ${claimError.message}`);
    }

    // Increment the claimed count
    const newCount = offer.claimed_count + 1;
    const updates: any = { claimed_count: newCount };
    
    // Mark as full if we've reached max claims
    if (newCount >= offer.max_claims) {
      updates.status = 'full';
    }

    const { error: updateError } = await supabase
      .from('flash_offers')
      .update(updates)
      .eq('id', offerId);

    if (updateError) {
      console.warn('Warning: Failed to update offer:', updateError.message);
    }

    return claim;
  }

  /**
   * Get all claims for a user with optional status filtering and pagination
   * 
   * Retrieves claims for a specific user, optionally filtered by status.
   * Includes offline caching and automatic retry logic. Falls back to cached
   * data if network is unavailable.
   * 
   * @param userId - ID of the user
   * @param status - Optional status filter (active, redeemed, expired)
   * @param options - Pagination options
   * @param options.page - Page number (1-indexed, default: 1)
   * @param options.pageSize - Number of items per page (default: 20)
   * @returns Promise resolving to paginated claims with metadata
   * @throws {Error} If query fails and no cached data is available
   * 
   * @example
   * ```typescript
   * // Get all active claims
   * const { claims, total, hasMore } = await ClaimService.getUserClaims(
   *   'user-123',
   *   'active'
   * );
   * 
   * claims.forEach(claim => {
   *   console.log(`Token: ${claim.token}, Expires: ${claim.expires_at}`);
   * });
   * 
   * // Get all claims with pagination
   * const page1 = await ClaimService.getUserClaims('user-123', undefined, {
   *   page: 1,
   *   pageSize: 10
   * });
   * ```
   */
  static async getUserClaims(
    userId: string,
    status?: ClaimStatus,
    options?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ claims: FlashOfferClaim[]; hasMore: boolean; total: number }> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const result = await NetworkErrorHandler.withRetry(
        async () => {
          let query = supabase
            .from('flash_offer_claims')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

          if (status) {
            query = query.eq('status', status);
          }

          const { data, error, count } = await query;

          if (error) {
            throw new Error(`Failed to fetch user claims: ${error.message}`);
          }

          const total = count || 0;
          const hasMore = to < total - 1;

          return {
            claims: data || [],
            hasMore,
            total,
          };
        },
        {
          maxRetries: 2,
          retryDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retrying fetch user claims (attempt ${attempt})...`);
          },
        }
      );

      // Cache the successful result (only cache first page for simplicity)
      if ((options?.page || 1) === 1) {
        await FlashOfferCache.cacheUserClaims(result.claims);
      }

      return result;
    } catch (error) {
      console.error('Error fetching user claims:', error);
      
      // If network error and first page, try to return cached data
      if (NetworkErrorHandler.isNetworkError(error) && (options?.page || 1) === 1) {
        console.log('Network error detected, attempting to use cached data...');
        const cached = await FlashOfferCache.getCachedUserClaims();
        if (cached) {
          console.log('Returning cached user claims');
          return {
            claims: cached,
            hasMore: false,
            total: cached.length,
          };
        }
      }
      
      throw error;
    }
  }

  /**
   * Get user claims with full offer and venue details
   * 
   * Retrieves claims with nested offer and venue information for display purposes.
   * Useful for showing claim history with context about what was claimed and where.
   * 
   * @param userId - ID of the user
   * @param status - Optional status filter
   * @param options - Pagination options
   * @returns Promise resolving to claims with nested offer and venue data
   * @throws {Error} If query fails
   * 
   * @example
   * ```typescript
   * const { claims } = await ClaimService.getUserClaimsWithDetails('user-123');
   * 
   * claims.forEach(claim => {
   *   console.log(`Offer: ${claim.offer.title}`);
   *   console.log(`Venue: ${claim.venue.name}`);
   *   console.log(`Token: ${claim.token}`);
   *   console.log(`Status: ${claim.status}`);
   * });
   * ```
   */
  static async getUserClaimsWithDetails(
    userId: string,
    status?: ClaimStatus,
    options?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ claims: any[]; hasMore: boolean; total: number }> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('flash_offer_claims')
        .select(`
          *,
          flash_offers!inner(
            id,
            title,
            description,
            value_cap,
            venue_id,
            start_time,
            end_time,
            status,
            venues(
              id,
              name,
              location,
              image_url
            )
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch user claims with details: ${error.message}`);
      }

      const total = count || 0;
      const hasMore = to < total - 1;

      // Transform the data to match FlashOfferClaimWithDetails interface
      const claimsWithDetails = (data || []).map((claim: any) => {
        const offer = claim.flash_offers;
        const venue = offer?.venues;
        
        return {
          ...claim,
          offer: {
            id: offer.id,
            title: offer.title,
            description: offer.description,
            value_cap: offer.value_cap,
            venue_id: offer.venue_id,
            start_time: offer.start_time,
            end_time: offer.end_time,
            status: offer.status,
          },
          venue: venue ? {
            id: venue.id,
            name: venue.name,
            location: venue.location,
            image_url: venue.image_url,
          } : null,
          flash_offers: undefined, // Remove the nested object
        };
      });

      return {
        claims: claimsWithDetails,
        hasMore,
        total,
      };
    } catch (error) {
      console.error('Error fetching user claims with details:', error);
      throw error;
    }
  }

  /**
   * Get a single claim by ID with full details
   * 
   * Retrieves complete claim information including nested offer and venue data.
   * 
   * @param claimId - ID of the claim
   * @returns Promise resolving to claim with details, or null if not found
   * @throws {Error} If query fails
   * 
   * @example
   * ```typescript
   * const claim = await ClaimService.getClaimWithDetails('claim-123');
   * 
   * if (claim) {
   *   console.log(`${claim.offer.title} at ${claim.venue.name}`);
   *   console.log(`Token: ${claim.token}`);
   * }
   * ```
   */
  static async getClaimWithDetails(claimId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('flash_offer_claims')
        .select(`
          *,
          flash_offers!inner(
            id,
            title,
            description,
            value_cap,
            venue_id,
            start_time,
            end_time,
            status,
            venues!inner(
              id,
              name,
              location,
              image_url
            )
          )
        `)
        .eq('id', claimId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch claim details: ${error.message}`);
      }

      if (!data) return null;

      // Transform the data
      const offer = data.flash_offers;
      const venue = offer?.venues;
      
      return {
        ...data,
        offer: {
          id: offer.id,
          title: offer.title,
          description: offer.description,
          value_cap: offer.value_cap,
          venue_id: offer.venue_id,
          start_time: offer.start_time,
          end_time: offer.end_time,
          status: offer.status,
        },
        venue: {
          id: venue.id,
          name: venue.name,
          location: venue.location,
          image_url: venue.image_url,
        },
        flash_offers: undefined,
      };
    } catch (error) {
      console.error('Error fetching claim details:', error);
      throw error;
    }
  }

  /**
   * Find a claim by redemption token for a specific venue
   * 
   * Looks up a claim using its 6-digit token. Used by venue staff to validate
   * and redeem tokens presented by customers.
   * 
   * @param venueId - ID of the venue
   * @param token - 6-digit redemption token (e.g., "004219")
   * @returns Promise resolving to the claim, or null if not found
   * @throws {Error} If query fails
   * 
   * @example
   * ```typescript
   * // Venue staff enters token
   * const token = '004219';
   * const claim = await ClaimService.getClaimByToken('venue-123', token);
   * 
   * if (!claim) {
   *   console.log('Invalid token');
   * } else if (claim.status === 'redeemed') {
   *   console.log('Token already redeemed');
   * } else if (claim.status === 'expired') {
   *   console.log('Token expired');
   * } else {
   *   console.log('Valid token! Ready to redeem.');
   * }
   * ```
   */
  static async getClaimByToken(
    venueId: string,
    token: string
  ): Promise<FlashOfferClaim | null> {
    try {
      const { data, error } = await supabase
        .from('flash_offer_claims')
        .select(`
          *,
          flash_offers!inner(venue_id)
        `)
        .eq('token', token)
        .eq('flash_offers.venue_id', venueId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No claim found
          return null;
        }
        throw new Error(`Failed to fetch claim by token: ${error.message}`);
      }

      // Remove the nested flash_offers object
      const { flash_offers, ...claim } = data as any;
      return claim as FlashOfferClaim;
    } catch (error) {
      console.error('Error fetching claim by token:', error);
      throw error;
    }
  }

  /**
   * Redeem a claim by marking it as redeemed
   * 
   * Marks a claim as redeemed by venue staff. Validates that the claim is active
   * and not expired before redeeming. Tracks redemption event for analytics.
   * 
   * @param claimId - ID of the claim to redeem
   * @param staffUserId - ID of the staff member redeeming the claim
   * @returns Promise resolving to the updated claim
   * @throws {Error} If claim is already redeemed, expired, or redemption fails
   * 
   * @example
   * ```typescript
   * try {
   *   const redeemed = await ClaimService.redeemClaim(
   *     'claim-123',
   *     'staff-456'
   *   );
   *   
   *   console.log('Redemption successful!');
   *   console.log(`Redeemed at: ${redeemed.redeemed_at}`);
   *   console.log(`Redeemed by: ${redeemed.redeemed_by_user_id}`);
   * } catch (error) {
   *   if (error.message.includes('already been redeemed')) {
   *     console.log('This token was already used');
   *   } else if (error.message.includes('expired')) {
   *     console.log('This token has expired');
   *   }
   * }
   * ```
   */
  static async redeemClaim(
    claimId: string,
    staffUserId: string
  ): Promise<FlashOfferClaim> {
    try {
      // Get the claim first to validate
      const { data: claim, error: fetchError } = await supabase
        .from('flash_offer_claims')
        .select('*')
        .eq('id', claimId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch claim: ${fetchError.message}`);
      }

      // Validate claim status
      if (claim.status === 'redeemed') {
        throw new Error('This claim has already been redeemed');
      }

      if (claim.status === 'expired') {
        throw new Error('This claim has expired');
      }

      // Check if claim is expired
      if (new Date(claim.expires_at) < new Date()) {
        throw new Error('This claim has expired');
      }

      // Update the claim
      const { data: updatedClaim, error: updateError } = await supabase
        .from('flash_offer_claims')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redeemed_by_user_id: staffUserId,
        })
        .eq('id', claimId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to redeem claim: ${updateError.message}`);
      }

      // Track the redemption event
      await FlashOfferAnalyticsService.trackRedeem(
        claim.offer_id,
        claim.user_id,
        claimId,
        staffUserId
      );

      console.log('✅ Claim redeemed successfully:', updatedClaim);
      return updatedClaim;
    } catch (error) {
      console.error('Error redeeming claim:', error);
      throw error;
    }
  }

  /**
   * Validate if a user is eligible to claim an offer
   * 
   * Performs comprehensive eligibility checks including:
   * - Offer exists and is active
   * - Offer has not expired
   * - Offer has available claims (not full)
   * - User has not already claimed this offer
   * - User is currently checked in to the venue
   * 
   * @param offerId - ID of the offer
   * @param userId - ID of the user
   * @returns Promise resolving to validation result with eligibility status and reason
   * 
   * @example
   * ```typescript
   * const validation = await ClaimService.validateClaimEligibility(
   *   'offer-123',
   *   'user-456'
   * );
   * 
   * if (validation.eligible) {
   *   // Show "Claim Now" button
   *   console.log('You can claim this offer!');
   * } else {
   *   // Show reason why user cannot claim
   *   console.log(`Cannot claim: ${validation.reason}`);
   * }
   * 
   * // Example reasons:
   * // - "This offer is not currently active"
   * // - "This offer has expired"
   * // - "This offer has reached its maximum claims"
   * // - "You have already claimed this offer"
   * // - "You must be checked in to this venue to claim this offer"
   * ```
   */
  static async validateClaimEligibility(
    offerId: string,
    userId: string
  ): Promise<ClaimValidationResult> {
    try {
      // Get the offer
      const { data: offer, error: offerError } = await supabase
        .from('flash_offers')
        .select('*, venues!inner(id)')
        .eq('id', offerId)
        .single();

      if (offerError) {
        return {
          eligible: false,
          reason: 'Offer not found',
        };
      }

      // Check if offer is active
      if (offer.status !== 'active') {
        return {
          eligible: false,
          reason: 'This offer is not currently active',
        };
      }

      // Check if offer has expired
      if (new Date(offer.end_time) < new Date()) {
        return {
          eligible: false,
          reason: 'This offer has expired',
        };
      }

      // Check if offer is full
      if (offer.claimed_count >= offer.max_claims) {
        return {
          eligible: false,
          reason: 'This offer has reached its maximum claims',
        };
      }

      // Check if user has already claimed
      const { data: existingClaim, error: claimError } = await supabase
        .from('flash_offer_claims')
        .select('id')
        .eq('offer_id', offerId)
        .eq('user_id', userId)
        .single();

      if (existingClaim) {
        return {
          eligible: false,
          reason: 'You have already claimed this offer',
        };
      }

      // Check if user is checked in to the venue
      const venueId = (offer.venues as any).id;
      const { data: checkIn, error: checkInError } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .single();

      if (checkInError || !checkIn) {
        return {
          eligible: false,
          reason: 'You must be checked in to this venue to claim this offer',
        };
      }

      // All checks passed
      return {
        eligible: true,
      };
    } catch (error) {
      console.error('Error validating claim eligibility:', error);
      return {
        eligible: false,
        reason: 'An error occurred while validating eligibility',
      };
    }
  }
}
