/**
 * Venue Data Transformation Utilities
 * 
 * Provides functions to transform venue data into a unified VenueWithStats structure
 * ensuring consistency across all venue display components.
 */

import type { Venue, VenueWithStats } from '../../types/venue.types';
import type { VenueCheckInStats } from '../../types/checkin.types';
import { calculateDaysSinceSignup } from '../formatting/venue';
import { LocationService } from '../../services/locationService';

/**
 * Transform a venue with check-in stats into VenueWithStats structure
 * 
 * @param venue - Base venue data
 * @param stats - Check-in statistics (optional)
 * @returns VenueWithStats with consistent structure
 */
export function transformVenueWithStats(
  venue: Venue,
  stats?: VenueCheckInStats
): VenueWithStats {
  return {
    ...venue,
    stats: stats ? {
      active_checkins: stats.active_checkins,
      recent_checkins: stats.recent_checkins,
      user_is_checked_in: stats.user_is_checked_in,
      user_checkin_id: stats.user_checkin_id,
      user_checkin_time: stats.user_checkin_time,
    } : undefined,
  };
}

/**
 * Transform multiple venues with their stats
 * 
 * @param venues - Array of venues
 * @param statsMap - Map of venue_id to stats
 * @returns Array of VenueWithStats
 */
export function transformVenuesWithStats(
  venues: Venue[],
  statsMap: Map<string, VenueCheckInStats>
): VenueWithStats[] {
  return venues.map(venue => 
    transformVenueWithStats(venue, statsMap.get(venue.id))
  );
}

/**
 * Add "New Venues" metadata to venues
 * 
 * @param venues - Array of venues with stats
 * @returns Array with new venue metadata
 */
export function addNewVenueMetadata(venues: VenueWithStats[]): VenueWithStats[] {
  return venues.map(venue => {
    const signupDate = (venue as any).signup_date;
    const daysSinceSignup = signupDate ? calculateDaysSinceSignup(signupDate) : null;
    
    return {
      ...venue,
      metadata: {
        ...venue.metadata,
        signup_date: signupDate,
        days_since_signup: daysSinceSignup ?? undefined,
      },
    };
  });
}

/**
 * Add "Recently Visited" metadata to venues
 * 
 * @param venues - Array of venues with stats
 * @param lastVisitTimes - Map of venue_id to last visit time
 * @param visitCounts - Map of venue_id to visit count (optional)
 * @returns Array with recently visited metadata
 */
export function addRecentlyVisitedMetadata(
  venues: VenueWithStats[],
  lastVisitTimes: Map<string, string>,
  visitCounts?: Map<string, number>
): VenueWithStats[] {
  return venues.map(venue => ({
    ...venue,
    metadata: {
      ...venue.metadata,
      last_visit_time: lastVisitTimes.get(venue.id),
      visit_count: visitCounts?.get(venue.id),
    },
  }));
}

/**
 * Add distance metadata to venues
 * 
 * @param venues - Array of venues with stats
 * @param userLocation - User's current location
 * @returns Array with distance metadata
 */
export function addDistanceMetadata(
  venues: VenueWithStats[],
  userLocation: { latitude: number; longitude: number }
): VenueWithStats[] {
  return venues.map(venue => {
    if (!venue.latitude || !venue.longitude) {
      return venue;
    }

    const distanceKm = LocationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      venue.latitude,
      venue.longitude
    );

    const distanceFormatted = LocationService.formatDistance(distanceKm);

    return {
      ...venue,
      metadata: {
        ...venue.metadata,
        distance_km: distanceKm,
        distance_formatted: distanceFormatted,
      },
    };
  });
}

/**
 * Sort venues by distance (requires distance metadata)
 * 
 * @param venues - Array of venues with distance metadata
 * @returns Sorted array (closest first)
 */
export function sortVenuesByDistance(venues: VenueWithStats[]): VenueWithStats[] {
  return [...venues].sort((a, b) => {
    const distanceA = a.metadata?.distance_km ?? Infinity;
    const distanceB = b.metadata?.distance_km ?? Infinity;
    return distanceA - distanceB;
  });
}
