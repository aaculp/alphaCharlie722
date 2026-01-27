/**
 * Flash Offer Service
 * 
 * Service for managing flash offers - time-limited, claim-limited promotional offers
 * that venues can create and send to nearby users via push notifications.
 * 
 * @module FlashOfferService
 * @category Services
 * @subcategory API
 */

import { supabase } from '../../lib/supabase';
import { NetworkErrorHandler } from '../../utils/errors/NetworkErrorHandler';
import { FlashOfferCache } from '../../utils/cache/FlashOfferCache';

/**
 * Status of a flash offer
 * - `scheduled`: Offer is created but not yet active
 * - `active`: Offer is currently active and can be claimed
 * - `expired`: Offer has passed its end_time
 * - `cancelled`: Offer was manually cancelled by venue
 * - `full`: Offer has reached its maximum number of claims
 */
export type FlashOfferStatus = 'scheduled' | 'active' | 'expired' | 'cancelled' | 'full';

/**
 * Input data for creating a new flash offer
 */
export interface CreateFlashOfferInput {
  /** Title of the offer (3-100 characters) */
  title: string;
  /** Description of the offer (10-500 characters) */
  description: string;
  /** Optional value cap (e.g., "$10 off", "Free drink") */
  value_cap?: string;
  /** Maximum number of claims allowed (1-1000) */
  max_claims: number;
  /** ISO 8601 timestamp when offer becomes active */
  start_time: string;
  /** ISO 8601 timestamp when offer expires */
  end_time: string;
  /** Radius in miles for targeting users (default: 1.0) */
  radius_miles?: number;
  /** Whether to only target users who favorited the venue (default: false) */
  target_favorites_only?: boolean;
}

/**
 * Input data for updating an existing flash offer
 */
export interface UpdateFlashOfferInput {
  /** New status for the offer */
  status?: FlashOfferStatus;
  /** Updated title */
  title?: string;
  /** Updated description */
  description?: string;
  /** Updated value cap */
  value_cap?: string;
  /** Updated maximum claims */
  max_claims?: number;
  /** Updated start time */
  start_time?: string;
  /** Updated end time */
  end_time?: string;
  /** Updated radius */
  radius_miles?: number;
  /** Updated targeting preference */
  target_favorites_only?: boolean;
}

/**
 * Flash offer entity from database
 */
export interface FlashOffer {
  /** Unique identifier */
  id: string;
  /** ID of the venue that created the offer */
  venue_id: string;
  /** Title of the offer */
  title: string;
  /** Description of the offer */
  description: string;
  /** Optional value cap */
  value_cap: string | null;
  /** Maximum number of claims allowed */
  max_claims: number;
  /** Current number of claims */
  claimed_count: number;
  /** ISO 8601 timestamp when offer becomes active */
  start_time: string;
  /** ISO 8601 timestamp when offer expires */
  end_time: string;
  /** Radius in miles for targeting users */
  radius_miles: number;
  /** Whether to only target users who favorited the venue */
  target_favorites_only: boolean;
  /** Current status of the offer */
  status: FlashOfferStatus;
  /** Whether push notification has been sent */
  push_sent: boolean;
  /** ISO 8601 timestamp when push was sent */
  push_sent_at: string | null;
  /** ISO 8601 timestamp when offer was created */
  created_at: string;
  /** ISO 8601 timestamp when offer was last updated */
  updated_at: string;
}

/**
 * Flash offer with analytics statistics
 */
export interface FlashOfferWithStats extends FlashOffer {
  /** Number of times offer detail was viewed */
  views_count: number;
  /** Number of times offer was claimed */
  claims_count: number;
  /** Number of times claims were redeemed */
  redemptions_count: number;
}

/**
 * Service for managing flash offers
 * 
 * Provides methods for creating, retrieving, and updating flash offers.
 * Includes support for location-based queries, caching, and offline functionality.
 * 
 * @example
 * ```typescript
 * // Create a new flash offer
 * const offer = await FlashOfferService.createFlashOffer('venue-123', {
 *   title: 'Happy Hour Special',
 *   description: 'Get 50% off all drinks for the next 2 hours!',
 *   value_cap: '$20 maximum discount',
 *   max_claims: 50,
 *   start_time: new Date().toISOString(),
 *   end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
 *   radius_miles: 2.0,
 *   target_favorites_only: false
 * });
 * 
 * // Get active offers near user's location
 * const nearbyOffers = await FlashOfferService.getActiveOffers(
 *   40.7128, // latitude
 *   -74.0060, // longitude
 *   5 // radius in miles
 * );
 * 
 * // Get offer details with stats
 * const details = await FlashOfferService.getOfferDetails('offer-123');
 * console.log(`Views: ${details.views_count}, Claims: ${details.claims_count}`);
 * ```
 */
export class FlashOfferService {
  /**
   * Create a new flash offer for a venue
   * 
   * Creates a flash offer with the specified parameters. The offer status is automatically
   * set to 'active' if start_time is in the past, otherwise 'scheduled'.
   * 
   * @param venueId - ID of the venue creating the offer
   * @param offerData - Offer configuration data
   * @returns Promise resolving to the created flash offer
   * @throws {Error} If offer creation fails or validation errors occur
   * 
   * @example
   * ```typescript
   * const offer = await FlashOfferService.createFlashOffer('venue-123', {
   *   title: 'Flash Sale!',
   *   description: 'Limited time offer - 30% off all appetizers',
   *   max_claims: 25,
   *   start_time: new Date().toISOString(),
   *   end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString()
   * });
   * ```
   */
  static async createFlashOffer(
    venueId: string,
    offerData: CreateFlashOfferInput
  ): Promise<FlashOffer> {
    try {
      const { data, error } = await supabase
        .from('flash_offers')
        .insert({
          venue_id: venueId,
          title: offerData.title,
          description: offerData.description,
          value_cap: offerData.value_cap || null,
          max_claims: offerData.max_claims,
          start_time: offerData.start_time,
          end_time: offerData.end_time,
          radius_miles: offerData.radius_miles || 1.0,
          target_favorites_only: offerData.target_favorites_only || false,
          status: new Date(offerData.start_time) <= new Date() ? 'active' : 'scheduled',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create flash offer: ${error.message}`);
      }

      console.log('✅ Flash offer created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating flash offer:', error);
      throw error;
    }
  }

  /**
   * Get all offers for a specific venue, optionally filtered by status
   * 
   * Retrieves flash offers for a venue with optional status filtering and pagination support.
   * Results are ordered by creation date (newest first).
   * 
   * @param venueId - ID of the venue
   * @param status - Optional status filter (scheduled, active, expired, cancelled, full)
   * @param options - Pagination options
   * @param options.page - Page number (1-indexed, default: 1)
   * @param options.pageSize - Number of items per page (default: 20)
   * @returns Promise resolving to paginated offers with metadata
   * @throws {Error} If query fails
   * 
   * @example
   * ```typescript
   * // Get all active offers for a venue
   * const result = await FlashOfferService.getVenueOffers('venue-123', 'active');
   * console.log(`Found ${result.total} active offers`);
   * 
   * // Get second page of all offers
   * const page2 = await FlashOfferService.getVenueOffers('venue-123', undefined, {
   *   page: 2,
   *   pageSize: 10
   * });
   * ```
   */
  static async getVenueOffers(
    venueId: string,
    status?: FlashOfferStatus,
    options?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ offers: FlashOffer[]; hasMore: boolean; total: number }> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('flash_offers')
        .select('*', { count: 'exact' })
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch venue offers: ${error.message}`);
      }

      const total = count || 0;
      const hasMore = to < total - 1;

      return {
        offers: data || [],
        hasMore,
        total,
      };
    } catch (error) {
      console.error('Error fetching venue offers:', error);
      throw error;
    }
  }

  /**
   * Get active offers near a specific location
   * 
   * Retrieves all active flash offers within a specified radius of a location.
   * Includes venue information and supports offline caching with automatic retry logic.
   * Falls back to cached data if network is unavailable.
   * 
   * @param latitude - Latitude of the search location
   * @param longitude - Longitude of the search location
   * @param radiusMiles - Search radius in miles (default: 10)
   * @returns Promise resolving to array of offers with venue names
   * @throws {Error} If query fails and no cached data is available
   * 
   * @example
   * ```typescript
   * // Get offers within 5 miles of user's location
   * const offers = await FlashOfferService.getActiveOffers(
   *   40.7128, // New York City latitude
   *   -74.0060, // New York City longitude
   *   5 // 5 mile radius
   * );
   * 
   * offers.forEach(offer => {
   *   console.log(`${offer.title} at ${offer.venue_name}`);
   * });
   * ```
   */
  static async getActiveOffers(
    latitude: number,
    longitude: number,
    radiusMiles: number = 10
  ): Promise<Array<FlashOffer & { venue_name: string }>> {
    try {
      // Try to fetch with retry logic
      const offers = await NetworkErrorHandler.withRetry(
        async () => {
          // First, get all active offers with venue information
          const { data: offers, error: offersError } = await supabase
            .from('flash_offers')
            .select(`
              *,
              venues!inner(
                id,
                name,
                latitude,
                longitude
              )
            `)
            .eq('status', 'active')
            .lte('start_time', new Date().toISOString())
            .gte('end_time', new Date().toISOString());

          if (offersError) {
            throw new Error(`Failed to fetch active offers: ${offersError.message}`);
          }

          if (!offers || offers.length === 0) {
            return [];
          }

          // Filter offers by distance (client-side filtering)
          // In production, this should use PostGIS for better performance
          const nearbyOffers = offers.filter((offer: any) => {
            const venue = offer.venues;
            if (!venue.latitude || !venue.longitude) {
              return false;
            }

            const distance = this.calculateDistance(
              latitude,
              longitude,
              venue.latitude,
              venue.longitude
            );

            return distance <= radiusMiles;
          });

          // Transform to include venue_name and remove nested venues object
          return nearbyOffers.map((offer: any) => {
            const { venues, ...cleanOffer } = offer;
            return {
              ...cleanOffer,
              venue_name: venues.name,
            } as FlashOffer & { venue_name: string };
          });
        },
        {
          maxRetries: 2,
          retryDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retrying fetch active offers (attempt ${attempt})...`);
          },
        }
      );

      // Cache the successful result
      await FlashOfferCache.cacheActiveOffers(offers as any);
      await FlashOfferCache.updateLastSync();

      return offers;
    } catch (error) {
      console.error('Error fetching active offers:', error);
      
      // If network error, try to return cached data
      if (NetworkErrorHandler.isNetworkError(error)) {
        console.log('Network error detected, attempting to use cached data...');
        const cached = await FlashOfferCache.getCachedActiveOffers();
        if (cached) {
          console.log('Returning cached active offers');
          return cached as any;
        }
      }
      
      throw error;
    }
  }

  /**
   * Update the status of a flash offer
   * 
   * Changes the status of an existing flash offer. Common use cases include
   * cancelling an offer or manually marking it as expired.
   * 
   * @param offerId - ID of the offer to update
   * @param status - New status to set
   * @returns Promise resolving to the updated flash offer
   * @throws {Error} If update fails or offer not found
   * 
   * @example
   * ```typescript
   * // Cancel an active offer
   * const cancelled = await FlashOfferService.updateOfferStatus(
   *   'offer-123',
   *   'cancelled'
   * );
   * 
   * // Manually expire an offer
   * const expired = await FlashOfferService.updateOfferStatus(
   *   'offer-456',
   *   'expired'
   * );
   * ```
   */
  static async updateOfferStatus(
    offerId: string,
    status: FlashOfferStatus
  ): Promise<FlashOffer> {
    try {
      const { data, error } = await supabase
        .from('flash_offers')
        .update({ status })
        .eq('id', offerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update offer status: ${error.message}`);
      }

      console.log('✅ Offer status updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating offer status:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific offer including analytics stats
   * 
   * Retrieves complete offer details along with event counts (views, claims, redemptions).
   * Results are cached to improve performance for frequently accessed offers.
   * 
   * @param offerId - ID of the offer
   * @returns Promise resolving to offer with statistics
   * @throws {Error} If offer not found or query fails
   * 
   * @example
   * ```typescript
   * const details = await FlashOfferService.getOfferDetails('offer-123');
   * 
   * console.log(`Offer: ${details.title}`);
   * console.log(`Status: ${details.status}`);
   * console.log(`Claims: ${details.claimed_count}/${details.max_claims}`);
   * console.log(`Views: ${details.views_count}`);
   * console.log(`Redemptions: ${details.redemptions_count}`);
   * 
   * // Calculate conversion rate
   * const conversionRate = (details.claims_count / details.views_count) * 100;
   * console.log(`Conversion rate: ${conversionRate.toFixed(1)}%`);
   * ```
   */
  static async getOfferDetails(offerId: string): Promise<FlashOfferWithStats> {
    try {
      // Try to get from cache first
      const cached = await FlashOfferCache.getCachedOfferDetails(offerId);
      if (cached) {
        console.log('✅ Returning cached offer details');
        return cached;
      }

      // Get the offer
      const { data: offer, error: offerError } = await supabase
        .from('flash_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) {
        throw new Error(`Failed to fetch offer details: ${offerError.message}`);
      }

      // Get event counts
      const { data: events, error: eventsError } = await supabase
        .from('flash_offer_events')
        .select('event_type')
        .eq('offer_id', offerId);

      if (eventsError) {
        console.warn('Warning: Could not fetch offer events:', eventsError.message);
      }

      // Count events by type
      const viewsCount = events?.filter(e => e.event_type === 'view').length || 0;
      const claimsCount = events?.filter(e => e.event_type === 'claim').length || 0;
      const redemptionsCount = events?.filter(e => e.event_type === 'redeem').length || 0;

      const result = {
        ...offer,
        views_count: viewsCount,
        claims_count: claimsCount,
        redemptions_count: redemptionsCount,
      };

      // Cache the result
      await FlashOfferCache.cacheOfferDetails(offerId, result);

      return result;
    } catch (error) {
      console.error('Error fetching offer details:', error);
      throw error;
    }
  }

  /**
   * Get all flash offers for the current calendar day
   * 
   * Retrieves flash offers where start_time is on the current calendar day (local timezone)
   * and end_time has not yet passed. Optionally filters and sorts by distance when location
   * is provided. Includes venue information and supports caching with date-based keys.
   * 
   * @param options - Optional configuration
   * @param options.latitude - User's latitude for distance calculation
   * @param options.longitude - User's longitude for distance calculation
   * @param options.radiusMiles - Radius in miles for prioritizing nearby offers (default: 10)
   * @param options.prioritizeNearby - If true, show within-radius offers first (default: true)
   * @returns Promise resolving to array of same-day offers with venue names and optional distance
   * @throws {Error} If query fails and no cached data is available
   * 
   * @example
   * ```typescript
   * // Get all same-day offers without location
   * const offers = await FlashOfferService.getSameDayOffers();
   * 
   * // Get same-day offers with location-based sorting
   * const nearbyOffers = await FlashOfferService.getSameDayOffers({
   *   latitude: 40.7128,
   *   longitude: -74.0060,
   *   radiusMiles: 10,
   *   prioritizeNearby: true
   * });
   * ```
   */
  static async getSameDayOffers(
    options?: {
      latitude?: number;
      longitude?: number;
      radiusMiles?: number;
      prioritizeNearby?: boolean;
    }
  ): Promise<Array<FlashOffer & { venue_name: string; distance_miles?: number }>> {
    try {
      // Try to get from cache first
      const cached = await FlashOfferCache.getCachedSameDayOffers<FlashOffer & { venue_name: string; distance_miles?: number }>(options);
      if (cached) {
        console.log('✅ Returning cached same-day offers');
        return cached;
      }

      // Fetch with retry logic
      const offers = await NetworkErrorHandler.withRetry(
        async () => {
          // Get current date boundaries in local timezone
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

          // Fetch all offers with start_time on current day
          const { data: offers, error: offersError } = await supabase
            .from('flash_offers')
            .select(`
              *,
              venues!inner(
                id,
                name,
                latitude,
                longitude
              )
            `)
            .eq('status', 'active')
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .gte('end_time', now.toISOString());

          if (offersError) {
            throw new Error(`Failed to fetch same-day offers: ${offersError.message}`);
          }

          return offers;
        },
        {
          maxRetries: 2,
          retryDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retrying fetch same-day offers (attempt ${attempt})...`);
          },
        }
      );

      if (!offers || offers.length === 0) {
        // Cache empty result
        await FlashOfferCache.cacheSameDayOffers([], options);
        await FlashOfferCache.updateLastSync();
        return [];
      }

      // Transform offers and calculate distances if location provided
      const hasLocation = options?.latitude !== undefined && options?.longitude !== undefined;
      const radiusMiles = options?.radiusMiles || 10;
      const prioritizeNearby = options?.prioritizeNearby !== false; // Default true

      let transformedOffers = offers.map((offer: any) => {
        const { venues, ...cleanOffer } = offer;
        const result: FlashOffer & { venue_name: string; distance_miles?: number } = {
          ...cleanOffer,
          venue_name: venues.name,
        };

        // Calculate distance if location is available
        if (hasLocation && venues.latitude && venues.longitude) {
          result.distance_miles = this.calculateDistance(
            options!.latitude!,
            options!.longitude!,
            venues.latitude,
            venues.longitude
          );
        }

        return result;
      });

      // Sort offers based on location availability
      if (hasLocation) {
        if (prioritizeNearby) {
          // Separate into within-radius and outside-radius
          const withinRadius = transformedOffers.filter(
            offer => offer.distance_miles !== undefined && offer.distance_miles <= radiusMiles
          );
          const outsideRadius = transformedOffers.filter(
            offer => offer.distance_miles === undefined || offer.distance_miles > radiusMiles
          );

          // Sort each group by distance
          withinRadius.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
          outsideRadius.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

          // Combine: within-radius first, then outside-radius
          transformedOffers = [...withinRadius, ...outsideRadius];
        } else {
          // Just sort all by distance
          transformedOffers.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
        }
      } else {
        // No location: sort by start_time (soonest first)
        transformedOffers.sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
      }

      // Cache the result using enhanced FlashOfferCache
      await FlashOfferCache.cacheSameDayOffers(transformedOffers, options);
      await FlashOfferCache.updateLastSync();

      return transformedOffers;
    } catch (error) {
      console.error('Error fetching same-day offers:', error);
      
      // If network error, try to return cached data even if expired
      if (NetworkErrorHandler.isNetworkError(error)) {
        console.log('Network error detected, attempting to use cached data...');
        const cached = await FlashOfferCache.getCachedSameDayOffers<FlashOffer & { venue_name: string; distance_miles?: number }>(options);
        if (cached) {
          console.log('Returning cached same-day offers (offline mode)');
          return cached;
        }
        
        // If no cached data, throw a user-friendly network error
        throw NetworkErrorHandler.createNetworkError(
          'Unable to load flash offers. Please check your internet connection.',
          undefined,
          true
        );
      }
      
      throw error;
    }
  }

  /**
   * Calculate distance between two geographic coordinates using Haversine formula
   * 
   * Computes the great-circle distance between two points on Earth's surface.
   * Used for filtering offers by proximity to user's location.
   * 
   * @param lat1 - Latitude of first point in degrees
   * @param lon1 - Longitude of first point in degrees
   * @param lat2 - Latitude of second point in degrees
   * @param lon2 - Longitude of second point in degrees
   * @returns Distance in miles
   * @private
   * 
   * @example
   * ```typescript
   * // Calculate distance between New York and Los Angeles
   * const distance = FlashOfferService.calculateDistance(
   *   40.7128, -74.0060, // NYC
   *   34.0522, -118.2437  // LA
   * );
   * console.log(`Distance: ${distance.toFixed(0)} miles`); // ~2451 miles
   * ```
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * 
   * Helper function for geographic calculations.
   * 
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   * @private
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
