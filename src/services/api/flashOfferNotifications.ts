/**
 * FlashOfferNotificationService
 * 
 * Service for sending push notifications for flash offers.
 * Delegates to Supabase Edge Function for actual notification delivery.
 * 
 * Requirements: Flash Offers MVP - Push Notifications
 */

import { FCMService } from '../FCMService';
import { FlashOfferAnalyticsService } from './flashOfferAnalytics';

/**
 * Result of sending flash offer push notifications
 */
export interface FlashOfferPushResult {
  success: boolean;
  targetedUserCount: number;
  sentCount: number;
  failedCount: number;
  errors: Array<{ token: string; error: string }>;
  errorCode?: string;
  errorDetails?: {
    currentCount?: number;
    limit?: number;
    resetsAt?: string;
  };
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

      // Call Edge Function to send push notifications
      // The Edge Function handles all the logic: targeting, filtering, FCM sending, etc.
      const result = await FCMService.sendViaEdgeFunction(offerId);

      // Track push_sent event with actual recipient count
      if (result.success && result.sentCount > 0) {
        await FlashOfferAnalyticsService.trackPushSent(offerId, result.sentCount);
      }

      console.log(`✅ Flash offer push sent: ${result.sentCount} success, ${result.failedCount} failed`);

      return {
        success: result.success,
        targetedUserCount: result.targetedUserCount,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        errors: result.errors,
        errorCode: result.errorCode,
        errorDetails: result.errorDetails,
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
}
