/**
 * ReviewNotificationService
 * 
 * Handles notification logic for review-related events
 * Implements batching for venue owner notifications
 * 
 * Requirements:
 * - 12.1: Notify reviewer when venue owner responds
 * - 12.2: Notify reviewer at helpful vote milestones
 * - 12.5: Notify venue owner when new review received
 * - 12.6: Batch notifications (max 1 per hour per venue)
 * - 12.7: Navigate to review on tap
 */

import { supabase } from '../../lib/supabase';
import { PushNotificationService } from '../PushNotificationService';

/**
 * Track last notification time per venue (in-memory cache)
 * Key: venueId, Value: timestamp of last notification
 */
const lastNotificationCache = new Map<string, number>();

/**
 * Minimum time between notifications for the same venue (1 hour in milliseconds)
 */
const NOTIFICATION_BATCH_INTERVAL = 60 * 60 * 1000; // 1 hour

export class ReviewNotificationService {
  /**
   * Send notification to venue owner about new review
   * Implements batching to prevent spam (max 1 per hour per venue)
   * 
   * Requirements: 12.5, 12.6
   * 
   * @param venueId - Venue ID
   * @param reviewId - Review ID
   * @param rating - Review rating (1-5)
   * @param reviewText - Optional review text
   */
  static async notifyVenueOwnerOfNewReview(
    venueId: string,
    reviewId: string,
    rating: number,
    reviewText?: string
  ): Promise<void> {
    try {
      // Check if we should batch this notification
      const shouldSend = this.shouldSendNotification(venueId);
      
      if (!shouldSend) {
        console.log(`⏱️ Batching notification for venue ${venueId} (sent within last hour)`);
        return;
      }

      // Get venue details
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('name')
        .eq('id', venueId)
        .single();

      if (venueError) {
        console.warn('⚠️ Failed to fetch venue details:', venueError.message);
        return;
      }

      // Get venue owner user ID
      const { data: venueAccount, error: accountError } = await supabase
        .from('venue_business_accounts')
        .select('user_id')
        .eq('venue_id', venueId)
        .single();

      if (accountError) {
        console.warn('⚠️ Failed to fetch venue owner:', accountError.message);
        return;
      }

      // Build notification body
      const stars = '⭐'.repeat(rating);
      let body = `New ${rating}-star review: ${stars}`;
      if (reviewText && reviewText.length > 0) {
        const preview = reviewText.length > 50 
          ? `${reviewText.substring(0, 47)}...` 
          : reviewText;
        body = `${body}\n"${preview}"`;
      }

      // Send notification
      await PushNotificationService.sendSocialNotification(
        venueAccount.user_id,
        'activity_comment', // Reuse activity_comment type for review notifications
        {
          title: `New review for ${venue.name}`,
          body,
          data: {
            type: 'activity_comment',
            referenceId: reviewId,
            navigationTarget: 'VenueDashboard',
            navigationParams: {
              venueId,
              scrollToReviews: true,
            },
          },
        }
      );

      // Update last notification time
      this.recordNotificationSent(venueId);
      
      console.log(`✅ Venue owner notified of new review for venue ${venueId}`);
    } catch (error) {
      // Log but don't throw - notification failure shouldn't block review submission
      console.warn('⚠️ Failed to notify venue owner of new review:', error);
    }
  }

  /**
   * Send notification to reviewer when venue owner responds
   * 
   * Requirements: 12.1, 12.7
   * 
   * @param reviewerId - Reviewer user ID
   * @param reviewId - Review ID
   * @param venueId - Venue ID
   * @param venueName - Venue name
   * @param responseText - Response text
   */
  static async notifyReviewerOfResponse(
    reviewerId: string,
    reviewId: string,
    venueId: string,
    venueName: string,
    responseText: string
  ): Promise<void> {
    try {
      const preview = responseText.length > 100 
        ? `${responseText.substring(0, 97)}...` 
        : responseText;

      await PushNotificationService.sendSocialNotification(
        reviewerId,
        'venue_response',
        {
          title: `${venueName} responded to your review`,
          body: preview,
          data: {
            type: 'venue_response',
            referenceId: reviewId,
            navigationTarget: 'VenueDetail',
            navigationParams: {
              venueId,
              scrollToReviews: true,
            },
          },
        }
      );

      console.log('✅ Reviewer notified of venue response');
    } catch (error) {
      // Log but don't throw
      console.warn('⚠️ Failed to notify reviewer of response:', error);
    }
  }

  /**
   * Send notification to reviewer when helpful vote milestone reached
   * 
   * Requirements: 12.2
   * 
   * @param reviewerId - Reviewer user ID
   * @param reviewId - Review ID
   * @param venueId - Venue ID
   * @param venueName - Venue name
   * @param helpfulCount - New helpful vote count
   */
  static async notifyReviewerOfMilestone(
    reviewerId: string,
    reviewId: string,
    venueId: string,
    venueName: string,
    helpfulCount: number
  ): Promise<void> {
    try {
      await PushNotificationService.sendSocialNotification(
        reviewerId,
        'activity_like', // Reuse activity_like type for helpful votes
        {
          title: 'Your review is helpful!',
          body: `Your review of ${venueName} has reached ${helpfulCount} helpful votes`,
          data: {
            type: 'activity_like',
            referenceId: reviewId,
            navigationTarget: 'VenueDetail',
            navigationParams: {
              venueId,
              scrollToReviews: true,
            },
          },
        }
      );

      console.log(`✅ Milestone notification sent for ${helpfulCount} helpful votes`);
    } catch (error) {
      // Log but don't throw
      console.warn('⚠️ Failed to send milestone notification:', error);
    }
  }

  /**
   * Check if notification should be sent based on batching rules
   * 
   * Requirements: 12.6
   * 
   * @param venueId - Venue ID
   * @returns True if notification should be sent
   */
  private static shouldSendNotification(venueId: string): boolean {
    const lastNotificationTime = lastNotificationCache.get(venueId);
    
    if (!lastNotificationTime) {
      return true; // No previous notification
    }

    const timeSinceLastNotification = Date.now() - lastNotificationTime;
    return timeSinceLastNotification >= NOTIFICATION_BATCH_INTERVAL;
  }

  /**
   * Record that a notification was sent for a venue
   * 
   * @param venueId - Venue ID
   */
  private static recordNotificationSent(venueId: string): void {
    lastNotificationCache.set(venueId, Date.now());
    
    // Clean up old entries (older than 2 hours)
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    const keysToDelete: string[] = [];
    
    lastNotificationCache.forEach((timestamp, key) => {
      if (timestamp < twoHoursAgo) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => lastNotificationCache.delete(key));
  }

  /**
   * Clear notification cache for a venue (for testing)
   * 
   * @param venueId - Venue ID
   */
  static clearNotificationCache(venueId?: string): void {
    if (venueId) {
      lastNotificationCache.delete(venueId);
    } else {
      lastNotificationCache.clear();
    }
  }
}
