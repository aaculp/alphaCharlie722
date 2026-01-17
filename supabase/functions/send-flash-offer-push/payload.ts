/**
 * FCM Notification Payload Builder
 * 
 * Builds FCM notification payloads for flash offer notifications
 * Requirements: 2.6, 2.7
 */

import type { FlashOffer, FCMPayload } from './types.ts';

/**
 * Build FCM notification payload for a flash offer
 * 
 * Requirements:
 * - 2.6: Include proper notification payload with title, body, data, and platform-specific options
 * - 2.7: Set high priority for flash offer notifications
 * 
 * @param offer - The flash offer to create a notification for
 * @param venueName - The name of the venue offering the deal
 * @returns FCM payload ready to send via Firebase Admin SDK
 */
export function buildNotificationPayload(
  offer: FlashOffer,
  venueName: string
): FCMPayload {
  // Build notification title and body
  const title = `🔥 ${offer.discount_percentage}% Off at ${venueName}!`;
  const body = offer.description || `Limited time offer - ${offer.discount_percentage}% off!`;

  // Build FCM payload with all required fields
  const payload: FCMPayload = {
    // Notification content (displayed to user)
    notification: {
      title,
      body,
    },
    
    // Data payload (for app navigation and processing)
    data: {
      offer_id: offer.id,
      venue_id: offer.venue_id,
      type: 'flash_offer',
    },
    
    // Android-specific options
    android: {
      priority: 'high', // Requirement 2.7: High priority
      channelId: 'flash_offers', // Must match NotificationChannels.FLASH_OFFERS
    },
    
    // iOS-specific options (APNs)
    apns: {
      payload: {
        aps: {
          'content-available': 1, // Wake app in background
          sound: 'default', // Play notification sound
        },
      },
    },
  };

  return payload;
}
