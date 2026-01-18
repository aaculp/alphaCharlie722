/**
 * Database Query Functions
 * 
 * This module provides database query functions that use the service role key
 * to bypass RLS policies and access data needed for push notification targeting.
 * 
 * Requirements: 1.3, 1.4
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  FlashOffer,
  Venue,
  DeviceToken,
  NotificationPreferences,
} from './types.ts';

/**
 * User with device token and preferences
 * Used for targeting and filtering
 */
export interface TargetedUser {
  user_id: string;
  device_token: string;
  platform: 'ios' | 'android';
  preferences: NotificationPreferences | null;
  distance_miles: number;
}

/**
 * Get flash offer details by ID
 * 
 * @param supabase - Supabase client with service role key
 * @param offerId - UUID of the flash offer
 * @returns Flash offer details or null if not found
 */
export async function getOfferDetails(
  supabase: SupabaseClient,
  offerId: string
): Promise<FlashOffer | null> {
  const { data, error } = await supabase
    .from('flash_offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (error) {
    console.error('Error fetching offer details:', error);
    return null;
  }

  return data as FlashOffer;
}

/**
 * Get venue details by ID
 * 
 * @param supabase - Supabase client with service role key
 * @param venueId - UUID of the venue
 * @returns Venue details or null if not found
 */
export async function getVenueDetails(
  supabase: SupabaseClient,
  venueId: string
): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, latitude, longitude')
    .eq('id', venueId)
    .single();

  if (error) {
    console.error('Error fetching venue details:', error);
    return null;
  }

  // Note: subscription_tier is not in the venues table yet
  // For now, we'll return the venue without it
  // This will need to be added in a future migration
  return data as Venue;
}

/**
 * Calculate distance between two points using Haversine formula
 * 
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in miles
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get targeted users for a flash offer
 * 
 * This function implements the same targeting logic as the client:
 * - Location-based filtering (within radius)
 * - Favorites-only option
 * - Active device tokens only
 * 
 * Uses check-ins from the last 30 days to determine user locations.
 * 
 * @param supabase - Supabase client with service role key
 * @param venueId - UUID of the venue
 * @param lat - Venue latitude
 * @param lon - Venue longitude
 * @param radius - Radius in miles
 * @param favoritesOnly - Whether to only target users who favorited the venue
 * @returns Array of targeted users with device tokens and preferences
 */
export async function getTargetedUsers(
  supabase: SupabaseClient,
  venueId: string,
  lat: number,
  lon: number,
  radius: number,
  favoritesOnly: boolean
): Promise<TargetedUser[]> {
  try {
    console.log(`Getting targeted users for venue ${venueId} within ${radius} miles`);

    let userIds: string[] = [];

    if (favoritesOnly) {
      // Step 1: Get users who favorited this venue
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('user_id')
        .eq('venue_id', venueId);

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
        return [];
      }

      userIds = favorites?.map(f => f.user_id) || [];
      console.log(`Found ${userIds.length} users who favorited this venue`);
    } else {
      // For very large radius (>= 500 miles), target all users with active tokens
      // This is useful for testing and for venues that want to reach everyone
      if (radius >= 500) {
        console.log(`Large radius (${radius} miles) - targeting all users with active tokens`);
        
        // Get all users with active device tokens
        const { data: tokens, error: tokensError } = await supabase
          .from('device_tokens')
          .select('user_id')
          .eq('is_active', true);

        if (tokensError) {
          console.error('Error fetching device tokens:', tokensError);
          return [];
        }

        userIds = tokens?.map(t => t.user_id) || [];
        console.log(`Found ${userIds.length} users with active device tokens`);
        
        // Set distance to 0 for all users (not location-based)
        const distanceMap = new Map<string, number>();
        userIds.forEach(userId => distanceMap.set(userId, 0));
        (getTargetedUsers as any)._distanceMap = distanceMap;
      } else {
        // Step 1: Get users with recent check-ins (last 30 days)
        // Use check-ins to determine user locations
        const { data: checkIns, error: checkInError } = await supabase
          .from('check_ins')
          .select('user_id, venues!inner(latitude, longitude)')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1000);

        if (checkInError) {
          console.error('Error fetching check-ins:', checkInError);
          return [];
        }

        // Filter by distance (calculate distance from each check-in venue to target venue)
        // Store the closest distance for each user
        const nearbyUsersMap = new Map<string, number>();
        checkIns?.forEach((checkIn: any) => {
          const venue = checkIn.venues;
          if (venue?.latitude && venue?.longitude) {
            const distance = calculateDistance(
              lat,
              lon,
              venue.latitude,
              venue.longitude
            );

            if (distance <= radius) {
              // Keep track of the closest check-in for each user
              const currentDistance = nearbyUsersMap.get(checkIn.user_id);
              if (currentDistance === undefined || distance < currentDistance) {
                nearbyUsersMap.set(checkIn.user_id, distance);
              }
            }
          }
        });

        userIds = Array.from(nearbyUsersMap.keys());
        console.log(`Found ${userIds.length} users within ${radius} miles`);
        
        // Store the distance map for later use
        (getTargetedUsers as any)._distanceMap = nearbyUsersMap;
      }
    }

    if (userIds.length === 0) {
      console.log('No users found matching targeting criteria');
      return [];
    }

    // Step 2: Get device tokens for these users
    let tokenQuery = supabase
      .from('device_tokens')
      .select('user_id, token, platform')
      .eq('is_active', true);

    // Handle single user vs multiple users (workaround for UUID issues)
    if (userIds.length === 1) {
      tokenQuery = tokenQuery.eq('user_id', userIds[0]);
    } else {
      tokenQuery = tokenQuery.in('user_id', userIds);
    }

    const { data: tokens, error: tokensError } = await tokenQuery;

    if (tokensError) {
      console.error('Error fetching device tokens:', tokensError);
      return [];
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active device tokens found for targeted users');
      return [];
    }

    console.log(`Found ${tokens.length} device tokens`);

    // Step 3: Get notification preferences for these users
    const tokenUserIds = tokens.map(t => t.user_id);
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('*')
      .in('user_id', tokenUserIds);

    if (preferencesError) {
      console.error('Error fetching notification preferences:', preferencesError);
      // Continue without preferences - we'll filter later
    }

    // Create a map of user preferences for quick lookup
    const preferencesMap = new Map<string, NotificationPreferences>();
    if (preferences) {
      preferences.forEach(pref => {
        preferencesMap.set(pref.user_id, pref as NotificationPreferences);
      });
    }

    // Step 4: Build targeted user list
    const distanceMap = (getTargetedUsers as any)._distanceMap as Map<string, number> | undefined;
    
    const targetedUsers: TargetedUser[] = tokens.map(token => ({
      user_id: token.user_id,
      device_token: token.token,
      platform: token.platform as 'ios' | 'android',
      preferences: preferencesMap.get(token.user_id) || null,
      distance_miles: distanceMap?.get(token.user_id) || 0,
    }));

    console.log(`Returning ${targetedUsers.length} targeted users`);
    return targetedUsers;

  } catch (error) {
    console.error('Error in getTargetedUsers:', error);
    return [];
  }
}

/**
 * Get notification preferences for multiple users
 * 
 * @param supabase - Supabase client with service role key
 * @param userIds - Array of user IDs
 * @returns Map of user ID to notification preferences
 */
export async function getUserPreferences(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, NotificationPreferences>> {
  const preferencesMap = new Map<string, NotificationPreferences>();

  if (userIds.length === 0) {
    return preferencesMap;
  }

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('Error fetching user preferences:', error);
      return preferencesMap;
    }

    if (data) {
      data.forEach(pref => {
        preferencesMap.set(pref.user_id, pref as NotificationPreferences);
      });
    }

    return preferencesMap;

  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return preferencesMap;
  }
}

/**
 * Check if current time is within user's quiet hours
 * 
 * @param quietHoursStart - Start time in HH:MM:SS format (e.g., "22:00:00")
 * @param quietHoursEnd - End time in HH:MM:SS format (e.g., "08:00:00")
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 * @returns true if current time is within quiet hours, false otherwise
 */
function isInQuietHours(
  quietHoursStart: string | null,
  quietHoursEnd: string | null,
  timezone: string
): boolean {
  // If no quiet hours configured, user is not in quiet hours
  if (!quietHoursStart || !quietHoursEnd) {
    return false;
  }

  try {
    // Get current time in user's timezone
    const now = new Date();
    const userTimeString = now.toLocaleString('en-US', { 
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Parse time strings to compare (HH:MM:SS format)
    const [currentHour, currentMinute, currentSecond] = userTimeString.split(':').map(Number);
    const [startHour, startMinute, startSecond] = quietHoursStart.split(':').map(Number);
    const [endHour, endMinute, endSecond] = quietHoursEnd.split(':').map(Number);

    // Convert to seconds since midnight for easier comparison
    const currentSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;
    const startSeconds = startHour * 3600 + startMinute * 60 + startSecond;
    const endSeconds = endHour * 3600 + endMinute * 60 + endSecond;

    // Handle quiet hours that span midnight (e.g., 22:00 to 08:00)
    if (startSeconds > endSeconds) {
      // Quiet hours span midnight
      return currentSeconds >= startSeconds || currentSeconds < endSeconds;
    } else {
      // Quiet hours within same day
      return currentSeconds >= startSeconds && currentSeconds < endSeconds;
    }
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    // If there's an error parsing times or timezone, don't filter out the user
    return false;
  }
}

/**
 * Filter targeted users based on notification preferences
 * 
 * This function applies the following filters:
 * - Exclude users with flash_offers_enabled = false
 * - Exclude users currently in their quiet hours (timezone-aware)
 * - Exclude users beyond their max_distance preference
 * - OS permissions are already filtered (only active device tokens are included)
 * 
 * Requirements: 12.4, 12.5, 12.6, 12.8, 12.9
 * 
 * @param users - Array of targeted users with preferences
 * @param venueLatitude - Venue latitude for distance calculation
 * @param venueLongitude - Venue longitude for distance calculation
 * @returns Filtered array of users who should receive notifications
 */
export function filterUsersByPreferences(
  users: TargetedUser[],
  venueLatitude: number,
  venueLongitude: number
): TargetedUser[] {
  const filteredUsers = users.filter(user => {
    const prefs = user.preferences;

    // If no preferences found, use defaults (all enabled)
    // This handles users who haven't set preferences yet
    if (!prefs) {
      console.log(`User ${user.user_id}: No preferences found, using defaults (enabled)`);
      return true;
    }

    // Filter 1: Check if flash offers are enabled
    // Requirement 12.4: Exclude users who have disabled flash offer notifications
    if (prefs.flash_offers_enabled === false) {
      console.log(`User ${user.user_id}: Flash offers disabled`);
      return false;
    }

    // Filter 2: Check quiet hours (timezone-aware)
    // Requirements 12.8, 12.9: Exclude users currently in their quiet hours
    if (isInQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end, prefs.timezone)) {
      console.log(`User ${user.user_id}: Currently in quiet hours`);
      return false;
    }

    // Filter 3: Check max distance preference
    // Requirement 12.10: Exclude users beyond their max distance preference
    if (prefs.max_distance_miles !== null && prefs.max_distance_miles > 0) {
      // We need to calculate the actual distance from user's location to venue
      // For now, we'll use the distance_miles field from TargetedUser
      // In a real implementation, we'd need to get user's current location
      // or use their last check-in location
      
      // Note: The distance calculation is already done in getTargetedUsers
      // based on check-in locations. Here we just verify against user's preference.
      if (user.distance_miles > prefs.max_distance_miles) {
        console.log(`User ${user.user_id}: Beyond max distance (${user.distance_miles} > ${prefs.max_distance_miles} miles)`);
        return false;
      }
    }

    // Filter 4: OS permissions
    // Requirement 12.5: Respect device-level notification permissions
    // This is already handled by only querying active device tokens (is_active = true)
    // in getTargetedUsers, so no additional filtering needed here

    // User passes all filters
    return true;
  });

  console.log(`Filtered ${users.length} users down to ${filteredUsers.length} after applying preferences`);
  return filteredUsers;
}
