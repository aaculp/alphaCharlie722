/**
 * Analytics Tracking Module
 * 
 * This module provides functions for tracking push notification analytics.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Analytics event data for push notifications
 */
export interface PushAnalyticsData {
  offerId: string;
  venueId: string;
  targetedCount: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ token: string; error: string }>;
}

/**
 * Track push notification sent event
 * 
 * This function stores analytics data for a push notification send operation.
 * It records:
 * - Success count (number of notifications successfully sent)
 * - Failure count (number of failed sends)
 * - Recipient count (successful sends)
 * - Metadata including venue ID and targeted count
 * 
 * Requirements:
 * - 6.1: Track the count of successful sends
 * - 6.2: Record push_sent event in analytics service
 * - 6.3: Store the recipient count for each flash offer
 * - 6.5: Log failure reasons for debugging
 * 
 * @param supabase - Supabase client with service role key
 * @param data - Analytics data including offer ID, counts, and errors
 * @returns Promise that resolves when analytics are tracked
 */
export async function trackPushSent(
  supabase: SupabaseClient,
  data: PushAnalyticsData
): Promise<void> {
  try {
    // Requirement 6.1: Track the count of successful sends
    // Requirement 6.3: Store the recipient count for each flash offer
    const recipientCount = data.successCount;

    console.log(`Tracking analytics for offer ${data.offerId}: ${recipientCount} recipients`);

    // Requirement 6.2: Call the analytics service to record push_sent event
    // Store analytics in flash_offer_analytics table
    const { error: analyticsError } = await supabase
      .from('flash_offer_analytics')
      .insert({
        offer_id: data.offerId,
        event_type: 'push_sent',
        recipient_count: recipientCount,
        metadata: {
          targeted_count: data.targetedCount,
          failed_count: data.failureCount,
          venue_id: data.venueId,
        },
        created_at: new Date().toISOString(),
      });

    if (analyticsError) {
      console.error('Error tracking analytics:', analyticsError);
      // Don't throw - analytics failures shouldn't break the main flow
      return;
    }

    console.log(`Successfully tracked analytics for offer ${data.offerId}`);

    // Requirement 6.5: Log failure reasons for debugging
    if (data.errors.length > 0) {
      console.log(`Failed notifications for offer ${data.offerId}:`, JSON.stringify(data.errors));
      
      // Optionally store detailed failure logs in a separate table
      // This could be useful for debugging and monitoring
      // For now, we just log to console, but this could be extended
      // to store in a dedicated error_logs table
    }

  } catch (error) {
    console.error('Exception in trackPushSent:', error);
    // Don't throw - analytics failures shouldn't break the main flow
  }
}

/**
 * Track push notification failure
 * 
 * This is a convenience function for tracking when a push notification
 * send operation fails completely (e.g., rate limit exceeded, offer not found).
 * 
 * @param supabase - Supabase client with service role key
 * @param offerId - UUID of the flash offer
 * @param venueId - UUID of the venue
 * @param errorCode - Error code describing the failure
 * @param errorMessage - Human-readable error message
 */
export async function trackPushFailed(
  supabase: SupabaseClient,
  offerId: string,
  venueId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  try {
    console.log(`Tracking push failure for offer ${offerId}: ${errorCode}`);

    const { error: analyticsError } = await supabase
      .from('flash_offer_analytics')
      .insert({
        offer_id: offerId,
        event_type: 'push_failed',
        recipient_count: 0,
        metadata: {
          error_code: errorCode,
          error_message: errorMessage,
          venue_id: venueId,
        },
        created_at: new Date().toISOString(),
      });

    if (analyticsError) {
      console.error('Error tracking push failure:', analyticsError);
      return;
    }

    console.log(`Successfully tracked push failure for offer ${offerId}`);

  } catch (error) {
    console.error('Exception in trackPushFailed:', error);
  }
}
