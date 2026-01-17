/**
 * FlashOfferNotificationService
 * 
 * Service for sending push notifications for flash offers.
 * Handles user targeting, notification payload building, and event tracking.
 * 
 * Requirements: Flash Offers MVP - Push Notifications
 */

import { supabase } from '../../lib/supabase';
import { FCMService, NotificationPayload } from '../FCMService';
import { FlashOfferService } from './flashOffers';
import { FlashOfferAnalyticsService } from './flashOfferAnalytics';
import type { FlashOffer } from './flashOffers';

/**
 * Targeted user with device token
 */
interface TargetedUser {
  userId: string;
  token: string;
}

/**
 * Result of sending flash offer push notifications
 */
export interface FlashOfferPushResult {
  success: boolean;
  targetedUserCount: number;
  sentCount: number;
  failedCount: number;
  errors: Array<{ token: string; error: string }>;
}

export class FlashOfferNotificationService {
  /**
   * Send push notification for a flash offer to targeted users
   * 
   * @param offerId - ID of the flash offer
   * @returns Push result with success/failure counts
   */
  static async sendFlashOfferPush(offerId: string): Promise<FlashOfferPushResult> {
    try {
      console.log(`📤 Sending flash offer push notification for offer: ${offerId}`);

      // Get the offer details
      const offer = await FlashOfferService.getOfferDetails(offerId);

      if (!offer) {
        throw new Error('Flash offer not found');
      }

      // Check if push has already been sent
      if (offer.push_sent) {
        console.warn('⚠️ Push notification already sent for this offer');
        return {
          success: false,
          targetedUserCount: 0,
          sentCount: 0,
          failedCount: 0,
          errors: [{ token: 'validation', error: 'Push notification already sent' }],
        };
      }

      // Get venue details to get location
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('id, name, latitude, longitude')
        .eq('id', offer.venue_id)
        .single();

      if (venueError || !venue) {
        throw new Error(`Failed to fetch venue details: ${venueError?.message}`);
      }

      if (!venue.latitude || !venue.longitude) {
        throw new Error('Venue location not available');
      }

      // Get targeted users
      const targetedUsers = await this.getTargetedUsers(
        offer.venue_id,
        venue.latitude,
        venue.longitude,
        offer.radius_miles,
        offer.target_favorites_only
      );

      console.log(`🎯 Found ${targetedUsers.length} targeted users`);

      if (targetedUsers.length === 0) {
        console.log('⚠️ No targeted users found');
        
        // Mark push as sent even if no users targeted
        await this.markPushAsSent(offerId);
        
        return {
          success: true,
          targetedUserCount: 0,
          sentCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      // Exclude users who already claimed this offer
      const userIds = targetedUsers.map(u => u.userId);
      const { data: existingClaims, error: claimsError } = await supabase
        .from('flash_offer_claims')
        .select('user_id')
        .eq('offer_id', offerId)
        .in('user_id', userIds);

      if (claimsError) {
        console.warn('Warning: Could not fetch existing claims:', claimsError);
      }

      const claimedUserIds = new Set(existingClaims?.map(c => c.user_id) || []);
      const eligibleUsers = targetedUsers.filter(u => !claimedUserIds.has(u.userId));

      console.log(`✅ ${eligibleUsers.length} eligible users (${claimedUserIds.size} already claimed)`);

      if (eligibleUsers.length === 0) {
        console.log('⚠️ No eligible users found (all have already claimed)');
        
        // Mark push as sent
        await this.markPushAsSent(offerId);
        
        return {
          success: true,
          targetedUserCount: targetedUsers.length,
          sentCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      // Build notification payload
      const payload = this.buildNotificationPayload(offer, venue.name);

      // Send to all eligible users
      const tokens = eligibleUsers.map(u => u.token);
      const result = await FCMService.sendToMultipleDevices(tokens, payload);

      // Mark push as sent
      await this.markPushAsSent(offerId);

      // Track push_sent event with actual recipient count
      await FlashOfferAnalyticsService.trackPushSent(offerId, eligibleUsers.length);

      console.log(`✅ Flash offer push sent: ${result.successCount} success, ${result.failureCount} failed`);

      return {
        success: result.successCount > 0 || result.failureCount === 0,
        targetedUserCount: eligibleUsers.length,
        sentCount: result.successCount,
        failedCount: result.failureCount,
        errors: result.results
          .filter(r => !r.success)
          .map(r => ({
            token: r.token,
            error: r.error || 'Unknown error',
          })),
      };
    } catch (error) {
      console.error('❌ Error sending flash offer push:', error);
      
      return {
        success: false,
        targetedUserCount: 0,
        sentCount: 0,
        failedCount: 0,
        errors: [{
          token: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Get list of users to target for push notification
   * Filters by location, favorites, and excludes users who already claimed
   * 
   * @param venueId - ID of the venue
   * @param venueLat - Venue latitude
   * @param venueLon - Venue longitude
   * @param radiusMiles - Radius in miles to target users
   * @param favoritesOnly - Whether to only target users who favorited the venue
   * @returns Array of targeted users with device tokens
   */
  static async getTargetedUsers(
    venueId: string,
    venueLat: number,
    venueLon: number,
    radiusMiles: number,
    favoritesOnly: boolean
  ): Promise<TargetedUser[]> {
    try {
      console.log(`🎯 Getting targeted users for venue ${venueId} within ${radiusMiles} miles`);

      // Build query based on targeting criteria
      let userIds: string[] = [];

      if (favoritesOnly) {
        // Get users who favorited this venue
        const { data: favorites, error: favError } = await supabase
          .from('favorites')
          .select('user_id')
          .eq('venue_id', venueId);

        if (favError) {
          console.error('Error fetching favorites:', favError);
          return [];
        }

        userIds = favorites?.map(f => f.user_id) || [];
        console.log(`📍 Found ${userIds.length} users who favorited this venue`);
      } else {
        // Get all users with recent check-ins within radius
        // For MVP, we'll get users who have checked in anywhere recently
        // In production, this should use PostGIS for distance calculation
        const { data: checkIns, error: checkInError } = await supabase
          .from('check_ins')
          .select('user_id, venues!inner(latitude, longitude)')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
          .limit(1000);

        if (checkInError) {
          console.error('Error fetching check-ins:', checkInError);
          return [];
        }

        // Filter by distance (client-side for MVP)
        const nearbyUsers = new Set<string>();
        checkIns?.forEach((checkIn: any) => {
          const venue = checkIn.venues;
          if (venue?.latitude && venue?.longitude) {
            const distance = this.calculateDistance(
              venueLat,
              venueLon,
              venue.latitude,
              venue.longitude
            );
            
            if (distance <= radiusMiles) {
              nearbyUsers.add(checkIn.user_id);
            }
          }
        });

        userIds = Array.from(nearbyUsers);
        console.log(`📍 Found ${userIds.length} users within ${radiusMiles} miles`);
      }

      if (userIds.length === 0) {
        return [];
      }

      // Exclude users who already claimed this offer
      // We need to get the offer_id from the context where this is called
      // For now, we'll return all users and filter in sendFlashOfferPush
      
      // Get device tokens for these users
      const { data: tokens, error: tokenError } = await supabase
        .from('device_tokens')
        .select('user_id, token')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (tokenError) {
        console.error('Error fetching device tokens:', tokenError);
        return [];
      }

      const targetedUsers: TargetedUser[] = tokens?.map(t => ({
        userId: t.user_id,
        token: t.token,
      })) || [];

      console.log(`📱 Found ${targetedUsers.length} device tokens`);

      return targetedUsers;
    } catch (error) {
      console.error('Error getting targeted users:', error);
      return [];
    }
  }

  /**
   * Build FCM notification payload for flash offer
   * Includes deep link to offer detail screen
   * 
   * @param offer - Flash offer details
   * @param venueName - Name of the venue
   * @returns FCM notification payload
   */
  private static buildNotificationPayload(
    offer: FlashOffer,
    venueName: string
  ): NotificationPayload {
    // Build deep link
    const deepLink = `otw://flash-offer/${offer.id}`;

    // Build notification payload
    return {
      notification: {
        title: `🔥 ${offer.title}`,
        body: `${venueName}: ${offer.description}`,
      },
      data: {
        type: 'flash_offer',
        offer_id: offer.id,
        venue_id: offer.venue_id,
        venue_name: venueName,
        deep_link: deepLink,
        navigationTarget: 'FlashOfferDetail',
        navigationParams: JSON.stringify({
          offerId: offer.id,
          venueName,
        }),
      },
      android: {
        channelId: 'flash_offers',
        priority: 'high',
        sound: 'default',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };
  }

  /**
   * Mark push notification as sent for an offer
   * 
   * @param offerId - ID of the flash offer
   */
  private static async markPushAsSent(offerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('flash_offers')
        .update({
          push_sent: true,
          push_sent_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      if (error) {
        console.error('Error marking push as sent:', error);
      }
    } catch (error) {
      console.error('Error marking push as sent:', error);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in miles
   * 
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in miles
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
   * @param degrees - Degrees to convert
   * @returns Radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
