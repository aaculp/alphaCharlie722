/**
 * Rate Limits Service
 * 
 * Service for checking venue rate limits for flash offers.
 * Provides information about how many offers a venue has sent and their limits.
 */

import { supabase } from '../../lib/supabase';

/**
 * Subscription tier rate limits (offers per 24 hours)
 */
const TIER_RATE_LIMITS: Record<string, number> = {
  free: 3,
  core: 5,
  pro: 10,
  revenue: -1, // -1 means unlimited
};

/**
 * Rate limit status for a venue
 */
export interface VenueRateLimitStatus {
  currentCount: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  resetsAt: string | null;
  tier: string;
}

export class RateLimitsService {
  /**
   * Get rate limit status for a venue
   * 
   * @param venueId - ID of the venue
   * @param tier - Subscription tier (free, core, pro, revenue)
   * @returns Rate limit status
   */
  static async getVenueRateLimitStatus(
    venueId: string,
    tier: string = 'free'
  ): Promise<VenueRateLimitStatus> {
    try {
      // Get the rate limit for this tier
      const limit = TIER_RATE_LIMITS[tier] || TIER_RATE_LIMITS.free;

      // If unlimited (revenue tier), return unlimited status
      if (limit === -1) {
        return {
          currentCount: 0,
          limit: -1,
          remaining: -1,
          isUnlimited: true,
          resetsAt: null,
          tier,
        };
      }

      // Query rate limit records for this venue in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('flash_offer_rate_limits')
        .select('*')
        .eq('venue_id', venueId)
        .eq('limit_type', 'venue_send')
        .gte('window_start', twentyFourHoursAgo)
        .order('window_start', { ascending: false });

      if (error) {
        console.error('Error checking venue rate limit:', error);
        // On error, return default status
        return {
          currentCount: 0,
          limit,
          remaining: limit,
          isUnlimited: false,
          resetsAt: null,
          tier,
        };
      }

      // Calculate total count from all records in the window
      const currentCount = data?.reduce((sum, record) => sum + record.count, 0) || 0;

      // Find the earliest record to determine when the limit resets
      let resetsAt: string | null = null;
      if (data && data.length > 0) {
        const earliestRecord = data[data.length - 1];
        // Rate limit resets 24 hours after the earliest record
        const resetTime = new Date(earliestRecord.window_start);
        resetTime.setHours(resetTime.getHours() + 24);
        resetsAt = resetTime.toISOString();
      }

      const remaining = Math.max(0, limit - currentCount);

      return {
        currentCount,
        limit,
        remaining,
        isUnlimited: false,
        resetsAt,
        tier,
      };

    } catch (error) {
      console.error('Error in getVenueRateLimitStatus:', error);
      const limit = TIER_RATE_LIMITS[tier] || TIER_RATE_LIMITS.free;
      return {
        currentCount: 0,
        limit: limit === -1 ? -1 : limit,
        remaining: limit === -1 ? -1 : limit,
        isUnlimited: limit === -1,
        resetsAt: null,
        tier,
      };
    }
  }

  /**
   * Get formatted rate limit display text
   * 
   * @param status - Rate limit status
   * @returns Formatted display text
   */
  static formatRateLimitStatus(status: VenueRateLimitStatus): string {
    if (status.isUnlimited) {
      return 'Unlimited offers';
    }
    return `${status.currentCount} of ${status.limit} offers sent today`;
  }

  /**
   * Get time until rate limit resets
   * 
   * @param resetsAt - ISO timestamp when limit resets
   * @returns Human-readable time remaining
   */
  static getTimeUntilReset(resetsAt: string | null): string {
    if (!resetsAt) {
      return 'Unknown';
    }

    const now = new Date();
    const reset = new Date(resetsAt);
    const diff = reset.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Now';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
