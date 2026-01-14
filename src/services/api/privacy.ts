import { supabase } from '../../lib/supabase';
import type { PrivacySettings } from '../../types/social.types';
import { cacheManager, CACHE_TTL } from '../../utils/cache/CacheManager';

/**
 * PrivacyService - Handles privacy settings and user blocking
 * Implements privacy controls, blocking functionality, and safe defaults
 */
export class PrivacyService {
  // ============================================================================
  // Privacy Settings Methods
  // ============================================================================

  /**
   * Get privacy settings for a user
   * Creates default settings if none exist
   * @param userId - ID of the user whose privacy settings to retrieve
   * @returns Privacy settings object
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      // Check cache first
      const cacheKey = `privacy:${userId}`;
      const cached = cacheManager.get<PrivacySettings>(cacheKey);
      if (cached) {
        console.log('✅ Returning cached privacy settings');
        return cached;
      }

      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to get privacy settings: ${error.message}`);
      }

      // If no settings exist, create default settings
      if (!data) {
        console.log('No privacy settings found, creating defaults for user:', userId);
        return await this.createDefaultPrivacySettings(userId);
      }

      // Cache the result
      cacheManager.set(cacheKey, data, CACHE_TTL.PRIVACY_SETTINGS);

      return data;
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings for a user
   * @param userId - ID of the user whose privacy settings to update
   * @param settings - Partial privacy settings to update
   * @returns Updated privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    settings: Partial<Omit<PrivacySettings, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<PrivacySettings> {
    try {
      // First ensure settings exist
      await this.getPrivacySettings(userId);

      // Update the settings
      const { data, error } = await supabase
        .from('privacy_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update privacy settings: ${error.message}`);
      }

      // Invalidate cache
      cacheManager.invalidate(`privacy:${userId}`);

      console.log('✅ Privacy settings updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  /**
   * Create default privacy settings for a new user
   * Defaults to friends-only for safety
   * @param userId - ID of the user to create settings for
   * @returns Created privacy settings
   */
  private static async createDefaultPrivacySettings(
    userId: string
  ): Promise<PrivacySettings> {
    try {
      const defaultSettings = {
        user_id: userId,
        profile_visibility: 'friends' as const,
        checkin_visibility: 'friends' as const,
        favorite_visibility: 'friends' as const,
        default_collection_visibility: 'friends' as const,
        allow_follow_requests: true,
        show_activity_status: true,
      };

      const { data, error } = await supabase
        .from('privacy_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create default privacy settings: ${error.message}`);
      }

      // Cache the new settings
      cacheManager.set(`privacy:${userId}`, data, CACHE_TTL.PRIVACY_SETTINGS);

      console.log('✅ Default privacy settings created successfully');
      return data;
    } catch (error) {
      console.error('Error creating default privacy settings:', error);
      throw error;
    }
  }

  // ============================================================================
  // Blocking Methods
  // ============================================================================

  /**
   * Block a user
   * Removes any existing friendships and follows between the users
   * @param userId - ID of the user doing the blocking
   * @param blockedUserId - ID of the user to block
   * @throws Error if trying to block self or if block fails
   */
  static async blockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      // Validate: prevent self-blocking
      if (userId === blockedUserId) {
        throw new Error('Cannot block yourself');
      }

      // Check if already blocked
      const isAlreadyBlocked = await this.isBlocked(userId, blockedUserId);
      if (isAlreadyBlocked) {
        console.log('User is already blocked');
        return;
      }

      // Remove any existing friendship
      const [userId1, userId2] =
        userId < blockedUserId ? [userId, blockedUserId] : [blockedUserId, userId];

      const { error: friendshipError } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id_1', userId1)
        .eq('user_id_2', userId2);

      if (friendshipError) {
        console.warn('Warning: Failed to remove friendship:', friendshipError.message);
      }

      // Remove any follow relationships (both directions)
      const { error: followError1 } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', blockedUserId);

      if (followError1) {
        console.warn('Warning: Failed to remove follow (1):', followError1.message);
      }

      const { error: followError2 } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', blockedUserId)
        .eq('following_id', userId);

      if (followError2) {
        console.warn('Warning: Failed to remove follow (2):', followError2.message);
      }

      // Remove any pending friend requests (both directions)
      const { error: requestError1 } = await supabase
        .from('friend_requests')
        .delete()
        .eq('from_user_id', userId)
        .eq('to_user_id', blockedUserId);

      if (requestError1) {
        console.warn('Warning: Failed to remove friend request (1):', requestError1.message);
      }

      const { error: requestError2 } = await supabase
        .from('friend_requests')
        .delete()
        .eq('from_user_id', blockedUserId)
        .eq('to_user_id', userId);

      if (requestError2) {
        console.warn('Warning: Failed to remove friend request (2):', requestError2.message);
      }

      // Create the block
      const { error: blockError } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: userId,
          blocked_id: blockedUserId,
        });

      if (blockError) {
        throw new Error(`Failed to block user: ${blockError.message}`);
      }

      console.log('✅ User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   * @param userId - ID of the user doing the unblocking
   * @param blockedUserId - ID of the user to unblock
   * @throws Error if unblock fails
   */
  static async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', userId)
        .eq('blocked_id', blockedUserId);

      if (error) {
        throw new Error(`Failed to unblock user: ${error.message}`);
      }

      console.log('✅ User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  /**
   * Get list of blocked users
   * @param userId - ID of the user whose blocked list to retrieve
   * @returns Array of blocked user IDs
   */
  static async getBlockedUsers(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', userId);

      if (error) {
        throw new Error(`Failed to get blocked users: ${error.message}`);
      }

      return (data || []).map((block) => block.blocked_id);
    } catch (error) {
      console.error('Error getting blocked users:', error);
      throw error;
    }
  }

  /**
   * Check if a user is blocked
   * Checks both directions (if userId blocked otherUserId OR if otherUserId blocked userId)
   * @param userId - ID of the first user
   * @param otherUserId - ID of the second user
   * @returns True if either user has blocked the other
   */
  static async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .or(
          `and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`
        )
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to check block status: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  }
}
