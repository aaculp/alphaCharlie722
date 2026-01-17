/**
 * Android Notification Channel IDs
 * 
 * These channel IDs must match the channels created in MainApplication.kt
 * Channels are only used on Android 8.0+ (API level 26+)
 */

export const NotificationChannels = {
  /**
   * General social notifications channel
   * Importance: HIGH
   * Used for: General social interactions
   */
  SOCIAL: 'social_notifications',

  /**
   * Friend requests channel
   * Importance: HIGH
   * Used for: New friend requests
   */
  FRIEND_REQUESTS: 'friend_requests',

  /**
   * Venue shares channel
   * Importance: DEFAULT
   * Used for: When friends share venues
   */
  VENUE_SHARES: 'venue_shares',

  /**
   * Activity updates channel
   * Importance: DEFAULT
   * Used for: Likes, comments, and other activity
   */
  ACTIVITY: 'activity_updates',

  /**
   * Flash offers channel
   * Importance: HIGH
   * Used for: Time-sensitive flash offer notifications
   */
  FLASH_OFFERS: 'flash_offers',
} as const;

export type NotificationChannelId = typeof NotificationChannels[keyof typeof NotificationChannels];
