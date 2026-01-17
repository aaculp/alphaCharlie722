/**
 * Rate Limiting Logic
 * 
 * This module provides rate limiting functions to prevent venues from spamming
 * users with excessive notifications and to prevent users from being overwhelmed.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { RateLimit } from './types.ts';

/**
 * Subscription tier rate limits (offers per 24 hours)
 */
const TIER_RATE_LIMITS: Record<string, number> = {
  free: 100, // Increased for testing
  core: 5,
  pro: 10,
  revenue: -1, // -1 means unlimited
};

/**
 * Maximum flash offer notifications a user can receive per 24 hours
 */
const USER_NOTIFICATION_LIMIT = 10;

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetsAt: string | null;
}

/**
 * Check if a venue has exceeded their rate limit
 * 
 * Requirement 11.1: Check how many offers the venue has sent in the last 24 hours
 * Requirement 11.8: Apply tier-based rate limits
 * 
 * @param supabase - Supabase client with service role key
 * @param venueId - UUID of the venue
 * @param tier - Subscription tier of the venue (free, core, pro, revenue)
 * @returns Rate limit check result
 */
export async function checkVenueRateLimit(
  supabase: SupabaseClient,
  venueId: string,
  tier: string = 'free'
): Promise<RateLimitCheckResult> {
  try {
    // Get the rate limit for this tier
    const limit = TIER_RATE_LIMITS[tier] || TIER_RATE_LIMITS.free;

    // If unlimited (revenue tier), always allow
    if (limit === -1) {
      return {
        allowed: true,
        currentCount: 0,
        limit: -1,
        resetsAt: null,
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
      // On error, allow the request but log it
      // This prevents rate limit checks from blocking legitimate requests
      return {
        allowed: true,
        currentCount: 0,
        limit,
        resetsAt: null,
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

    // Check if limit is exceeded
    const allowed = currentCount < limit;

    console.log(`Venue ${venueId} rate limit check: ${currentCount}/${limit} (tier: ${tier})`);

    return {
      allowed,
      currentCount,
      limit,
      resetsAt,
    };

  } catch (error) {
    console.error('Error in checkVenueRateLimit:', error);
    // On error, allow the request but log it
    return {
      allowed: true,
      currentCount: 0,
      limit: TIER_RATE_LIMITS[tier] || TIER_RATE_LIMITS.free,
      resetsAt: null,
    };
  }
}

/**
 * Check if a user has exceeded their notification rate limit
 * 
 * Requirement 11.3: Check how many flash offer notifications the user has received in the last 24 hours
 * 
 * @param supabase - Supabase client with service role key
 * @param userId - UUID of the user
 * @returns Rate limit check result
 */
export async function checkUserRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitCheckResult> {
  try {
    // Query rate limit records for this user in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('flash_offer_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('limit_type', 'user_receive')
      .gte('window_start', twentyFourHoursAgo)
      .order('window_start', { ascending: false });

    if (error) {
      console.error('Error checking user rate limit:', error);
      // On error, allow the request but log it
      return {
        allowed: true,
        currentCount: 0,
        limit: USER_NOTIFICATION_LIMIT,
        resetsAt: null,
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

    // Check if limit is exceeded
    const allowed = currentCount < USER_NOTIFICATION_LIMIT;

    console.log(`User ${userId} rate limit check: ${currentCount}/${USER_NOTIFICATION_LIMIT}`);

    return {
      allowed,
      currentCount,
      limit: USER_NOTIFICATION_LIMIT,
      resetsAt,
    };

  } catch (error) {
    console.error('Error in checkUserRateLimit:', error);
    // On error, allow the request but log it
    return {
      allowed: true,
      currentCount: 0,
      limit: USER_NOTIFICATION_LIMIT,
      resetsAt: null,
    };
  }
}

/**
 * Increment the venue's rate limit counter
 * 
 * Requirement 11.2: Track venue send count for rate limiting
 * Requirement 11.5: Log rate limit violations
 * 
 * @param supabase - Supabase client with service role key
 * @param venueId - UUID of the venue
 * @returns true if successful, false otherwise
 */
export async function incrementVenueRateLimit(
  supabase: SupabaseClient,
  venueId: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Insert a new rate limit record
    const { error } = await supabase
      .from('flash_offer_rate_limits')
      .insert({
        venue_id: venueId,
        user_id: null,
        limit_type: 'venue_send',
        count: 1,
        window_start: now,
        expires_at: expiresAt,
      });

    if (error) {
      console.error('Error incrementing venue rate limit:', error);
      return false;
    }

    console.log(`Incremented venue ${venueId} rate limit counter`);
    return true;

  } catch (error) {
    console.error('Error in incrementVenueRateLimit:', error);
    return false;
  }
}

/**
 * Increment rate limit counters for multiple users
 * 
 * Requirement 11.4: Track user receive count for rate limiting
 * Requirement 11.5: Log rate limit violations
 * 
 * @param supabase - Supabase client with service role key
 * @param userIds - Array of user UUIDs
 * @returns Number of successfully incremented counters
 */
export async function incrementUserRateLimits(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<number> {
  try {
    if (userIds.length === 0) {
      return 0;
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create rate limit records for all users
    const records = userIds.map(userId => ({
      venue_id: null,
      user_id: userId,
      limit_type: 'user_receive' as const,
      count: 1,
      window_start: now,
      expires_at: expiresAt,
    }));

    // Insert all records in a single batch
    const { error, count } = await supabase
      .from('flash_offer_rate_limits')
      .insert(records);

    if (error) {
      console.error('Error incrementing user rate limits:', error);
      return 0;
    }

    console.log(`Incremented rate limit counters for ${count || userIds.length} users`);
    return count || userIds.length;

  } catch (error) {
    console.error('Error in incrementUserRateLimits:', error);
    return 0;
  }
}

/**
 * Filter users who have exceeded their notification rate limit
 * 
 * Requirement 11.4: Exclude users who have received 10+ notifications in 24 hours
 * 
 * @param supabase - Supabase client with service role key
 * @param userIds - Array of user UUIDs to check
 * @returns Array of user IDs who are allowed to receive notifications
 */
export async function filterUsersByRateLimit(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<string[]> {
  try {
    if (userIds.length === 0) {
      return [];
    }

    // Check rate limits for all users in parallel
    const rateLimitChecks = await Promise.all(
      userIds.map(async (userId) => {
        const result = await checkUserRateLimit(supabase, userId);
        return {
          userId,
          allowed: result.allowed,
        };
      })
    );

    // Filter to only users who are allowed
    const allowedUserIds = rateLimitChecks
      .filter(check => check.allowed)
      .map(check => check.userId);

    const excludedCount = userIds.length - allowedUserIds.length;
    if (excludedCount > 0) {
      console.log(`Excluded ${excludedCount} users due to rate limits`);
    }

    return allowedUserIds;

  } catch (error) {
    console.error('Error in filterUsersByRateLimit:', error);
    // On error, return all users to avoid blocking legitimate notifications
    return userIds;
  }
}
