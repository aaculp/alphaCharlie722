import { supabase } from '../../lib/supabase';
import type {
  SocialNotification,
  NotificationPreferences,
  PaginationOptions,
  VenueShare,
} from '../../types/social.types';

/**
 * NotificationService - Handles all social notification operations
 * Implements notification creation, management, and preferences
 */
export class NotificationService {
  // ============================================================================
  // Social Notification Creation Methods
  // ============================================================================

  /**
   * Send a friend request notification to the recipient
   * @param fromUserId - ID of the user sending the friend request
   * @param toUserId - ID of the user receiving the friend request
   * @returns The created notification
   * @throws Error if notification creation fails
   */
  static async sendFriendRequestNotification(
    fromUserId: string,
    toUserId: string
  ): Promise<SocialNotification> {
    try {
      // Check if user has friend request notifications enabled
      const preferences = await this.getNotificationPreferences(toUserId);
      if (!preferences.friend_requests) {
        console.log('Friend request notifications disabled for user:', toUserId);
        // Still create the notification but don't send push
        // This allows in-app notification viewing even if push is disabled
      }

      // Get sender's profile for notification content
      const { data: senderProfile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', fromUserId)
        .single();

      if (profileError) {
        throw new Error(`Failed to get sender profile: ${profileError.message}`);
      }

      const senderName = senderProfile.name || senderProfile.email;

      // Create the notification
      const { data, error } = await supabase
        .from('social_notifications')
        .insert({
          user_id: toUserId,
          type: 'friend_request',
          actor_id: fromUserId,
          reference_id: null, // Could store friend_request.id if needed
          title: 'New Friend Request',
          body: `${senderName} sent you a friend request`,
          data: {
            from_user_id: fromUserId,
            from_user_name: senderName,
          },
          read: false,
          read_at: null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create friend request notification: ${error.message}`);
      }

      console.log('✅ Friend request notification created:', data);
      return data;
    } catch (error) {
      console.error('Error sending friend request notification:', error);
      throw error;
    }
  }

  /**
   * Send a friend accepted notification to the original requester
   * @param fromUserId - ID of the user who accepted the request
   * @param toUserId - ID of the user who sent the original request
   * @returns The created notification
   * @throws Error if notification creation fails
   */
  static async sendFriendAcceptedNotification(
    fromUserId: string,
    toUserId: string
  ): Promise<SocialNotification> {
    try {
      // Check if user has friend accepted notifications enabled
      const preferences = await this.getNotificationPreferences(toUserId);
      if (!preferences.friend_accepted) {
        console.log('Friend accepted notifications disabled for user:', toUserId);
      }

      // Get accepter's profile for notification content
      const { data: accepterProfile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', fromUserId)
        .single();

      if (profileError) {
        throw new Error(`Failed to get accepter profile: ${profileError.message}`);
      }

      const accepterName = accepterProfile.name || accepterProfile.email;

      // Create the notification
      const { data, error } = await supabase
        .from('social_notifications')
        .insert({
          user_id: toUserId,
          type: 'friend_accepted',
          actor_id: fromUserId,
          reference_id: null,
          title: 'Friend Request Accepted',
          body: `${accepterName} accepted your friend request`,
          data: {
            from_user_id: fromUserId,
            from_user_name: accepterName,
          },
          read: false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create friend accepted notification: ${error.message}`);
      }

      console.log('✅ Friend accepted notification created:', data);
      return data;
    } catch (error) {
      console.error('Error sending friend accepted notification:', error);
      throw error;
    }
  }

  /**
   * Send a venue share notification to the recipient
   * @param share - The venue share object
   * @returns The created notification
   * @throws Error if notification creation fails
   */
  static async sendVenueShareNotification(share: VenueShare): Promise<SocialNotification> {
    try {
      // Check if user has venue share notifications enabled
      const preferences = await this.getNotificationPreferences(share.to_user_id);
      if (!preferences.venue_shares) {
        console.log('Venue share notifications disabled for user:', share.to_user_id);
      }

      // Get sender's profile for notification content
      const { data: senderProfile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', share.from_user_id)
        .single();

      if (profileError) {
        throw new Error(`Failed to get sender profile: ${profileError.message}`);
      }

      const senderName = senderProfile.name || senderProfile.email;

      // Get venue details for notification content
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('name, address')
        .eq('id', share.venue_id)
        .single();

      if (venueError) {
        throw new Error(`Failed to get venue details: ${venueError.message}`);
      }

      // Create the notification
      const { data, error } = await supabase
        .from('social_notifications')
        .insert({
          user_id: share.to_user_id,
          type: 'venue_share',
          actor_id: share.from_user_id,
          reference_id: share.id,
          title: 'Venue Shared',
          body: `${senderName} shared ${venue.name} with you`,
          data: {
            from_user_id: share.from_user_id,
            from_user_name: senderName,
            venue_id: share.venue_id,
            venue_name: venue.name,
            venue_address: venue.address,
            message: share.message,
            share_id: share.id,
          },
          read: false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create venue share notification: ${error.message}`);
      }

      console.log('✅ Venue share notification created:', data);
      return data;
    } catch (error) {
      console.error('Error sending venue share notification:', error);
      throw error;
    }
  }

  // ============================================================================
  // Notification Management Methods
  // ============================================================================

  /**
   * Get social notifications for a user with pagination
   * @param userId - ID of the user whose notifications to retrieve
   * @param options - Pagination options
   * @returns Array of social notifications
   */
  static async getSocialNotifications(
    userId: string,
    options?: PaginationOptions
  ): Promise<SocialNotification[]> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const { data, error } = await supabase
        .from('social_notifications')
        .select(`
          *,
          actor:actor_id (
            id,
            email,
            name,
            avatar_url,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get notifications: ${error.message}`);
      }

      // Map to SocialNotification format with actor profile
      const notifications: SocialNotification[] = (data || []).map((notif) => ({
        id: notif.id,
        user_id: notif.user_id,
        type: notif.type,
        actor_id: notif.actor_id,
        reference_id: notif.reference_id,
        title: notif.title,
        body: notif.body,
        data: notif.data,
        read: notif.read,
        read_at: notif.read_at,
        created_at: notif.created_at,
        actor: notif.actor
          ? {
              id: notif.actor.id,
              email: notif.actor.email,
              name: notif.actor.name,
              username: null,
              bio: null,
              avatar_url: notif.actor.avatar_url,
              created_at: notif.actor.created_at,
            }
          : undefined,
      }));

      return notifications;
    } catch (error) {
      console.error('Error getting social notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId - ID of the notification to mark as read
   * @throws Error if update fails
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('social_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }

      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId - ID of the user whose notifications to mark as read
   * @throws Error if update fails
   */
  static async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('social_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }

      console.log('✅ All notifications marked as read for user:', userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get the count of unread notifications for a user
   * @param userId - ID of the user
   * @returns Count of unread notifications
   */
  static async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('social_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        throw new Error(`Failed to get unread notification count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // ============================================================================
  // Notification Preferences Methods
  // ============================================================================

  /**
   * Get notification preferences for a user
   * Creates default preferences if none exist
   * @param userId - ID of the user
   * @returns Notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to get notification preferences: ${error.message}`);
      }

      // If no preferences exist, create default ones
      if (!data) {
        return await this.createDefaultNotificationPreferences(userId);
      }

      return data;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      // Return default preferences on error
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Update notification preferences for a user
   * @param userId - ID of the user
   * @param prefs - Partial notification preferences to update
   * @returns Updated notification preferences
   * @throws Error if update fails
   */
  static async updateNotificationPreferences(
    userId: string,
    prefs: Partial<Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: userId,
            ...prefs,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update notification preferences: ${error.message}`);
      }

      console.log('✅ Notification preferences updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Create default notification preferences for a new user
   * @param userId - ID of the user
   * @returns Created notification preferences
   */
  private static async createDefaultNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    try {
      const defaultPrefs = this.getDefaultPreferences(userId);

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create default preferences: ${error.message}`);
      }

      console.log('✅ Default notification preferences created:', data);
      return data;
    } catch (error) {
      console.error('Error creating default notification preferences:', error);
      // Return default preferences object on error
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Get default notification preferences object
   * @param userId - ID of the user
   * @returns Default notification preferences
   */
  private static getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      user_id: userId,
      friend_requests: true,
      friend_accepted: true,
      follow_requests: true,
      new_followers: true,
      venue_shares: true,
      group_outing_invites: true,
      group_outing_reminders: true,
      collection_follows: true,
      collection_updates: false,
      activity_likes: false,
      activity_comments: true,
      friend_checkins_nearby: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
