/**
 * DeviceTokenManager
 * 
 * Manages FCM device tokens for push notification delivery.
 * Handles token storage, retrieval, deactivation, and cleanup.
 * 
 * Requirements: 1.5, 1.8, 1.9, 1.10, 10.6, 10.7, 10.8
 */

import { supabase } from '../lib/supabase';
import { PushNotificationError, PushErrorCategory, ErrorSeverity, ErrorLogger } from './errors/PushNotificationError';
import { DebugLogger } from './DebugLogger';
import { TokenCache } from '../utils/cache/TokenCache';

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  isActive: boolean;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DeviceTokenRow {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export class DeviceTokenManager {
  // Start periodic cache cleanup (every 10 minutes)
  private static cacheCleanupInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize the DeviceTokenManager
   * Starts periodic cache cleanup
   */
  static initialize(): void {
    if (!this.cacheCleanupInterval) {
      // Clean up expired cache entries every 10 minutes
      this.cacheCleanupInterval = setInterval(() => {
        const removed = TokenCache.cleanup();
        if (removed > 0) {
          console.log(`🧹 Cleaned up ${removed} expired cache entries`);
        }
      }, 10 * 60 * 1000); // 10 minutes
    }
  }

  /**
   * Shutdown the DeviceTokenManager
   * Stops periodic cache cleanup
   */
  static shutdown(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
    TokenCache.clear();
  }

  /**
   * Store a device token for a user
   * If token already exists, updates the user association and reactivates it
   * Invalidates cache on update
   * 
   * @param userId - User ID to associate with the token
   * @param token - FCM device token
   * @param platform - Device platform (ios or android)
   * @throws PushNotificationError if storage fails
   */
  static async storeToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android'
  ): Promise<void> {
    // Validate inputs
    if (!userId || !userId.trim()) {
      throw new PushNotificationError(
        'User ID is required and cannot be empty',
        PushErrorCategory.INVALID_CONFIGURATION,
        ErrorSeverity.HIGH,
        false,
        { operation: 'storeToken' }
      );
    }

    if (!token || !token.trim()) {
      throw new PushNotificationError(
        'Device token is required and cannot be empty',
        PushErrorCategory.INVALID_CONFIGURATION,
        ErrorSeverity.HIGH,
        false,
        { operation: 'storeToken' }
      );
    }

    try {
      DebugLogger.logTokenOperation('store_start', token, true, { userId, platform });
      
      // Use UPSERT to handle both insert and update cases
      // This avoids race conditions when multiple processes try to store the same token
      const { error: upsertError } = await supabase
        .from('device_tokens')
        .upsert({
          token,
          user_id: userId,
          platform,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'token',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('❌ Supabase upsert error:', {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
        });
        throw upsertError;
      }
      
      // Invalidate cache for this user
      TokenCache.invalidate(userId);
      
      DebugLogger.logTokenOperation('store_complete', token, true, { userId, platform });
    } catch (error) {
      const pushError = new PushNotificationError(
        'Failed to store device token',
        PushErrorCategory.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        true,
        { userId, platform, operation: 'storeToken' }
      );
      ErrorLogger.logError(pushError);
      DebugLogger.logTokenOperation('store', token, false, { error: pushError.message });
      throw pushError;
    }
  }

  /**
   * Remove a device token
   * Marks the token as inactive instead of deleting it
   * Invalidates cache on removal
   * 
   * @param token - FCM device token to remove
   * @throws PushNotificationError if removal fails
   */
  static async removeToken(token: string): Promise<void> {
    // Validate input
    if (!token || !token.trim()) {
      throw new PushNotificationError(
        'Device token is required and cannot be empty',
        PushErrorCategory.INVALID_CONFIGURATION,
        ErrorSeverity.MEDIUM,
        false,
        { operation: 'removeToken' }
      );
    }

    try {
      // Get the user_id before removing to invalidate cache
      const { data: tokenData } = await supabase
        .from('device_tokens')
        .select('user_id')
        .eq('token', token)
        .single();

      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('token', token);

      if (error) {
        throw error;
      }

      // Invalidate cache if we found the user
      if (tokenData?.user_id) {
        TokenCache.invalidate(tokenData.user_id);
      }
    } catch (error) {
      const pushError = new PushNotificationError(
        'Failed to remove device token',
        PushErrorCategory.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { operation: 'removeToken' }
      );
      ErrorLogger.logError(pushError);
      throw pushError;
    }
  }

  /**
   * Get all active device tokens for a user
   * Uses in-memory cache with 5-minute TTL
   * 
   * @param userId - User ID to get tokens for
   * @returns Array of active device tokens
   * @throws PushNotificationError if retrieval fails
   */
  static async getUserTokens(userId: string): Promise<DeviceToken[]> {
    // Validate input
    if (!userId || !userId.trim()) {
      throw new PushNotificationError(
        'User ID is required and cannot be empty',
        PushErrorCategory.INVALID_CONFIGURATION,
        ErrorSeverity.HIGH,
        false,
        { operation: 'getUserTokens' }
      );
    }

    try {
      // Check cache first
      const cachedTokens = TokenCache.get(userId);
      if (cachedTokens !== null) {
        console.log(`✅ Cache hit for user tokens: ${userId}`);
        return cachedTokens;
      }

      console.log(`⚠️ Cache miss for user tokens: ${userId}, fetching from database`);

      const { data, error } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (error) {
        throw error;
      }

      const tokens = (data || []).map(this.mapRowToDeviceToken);

      // Store in cache
      TokenCache.set(userId, tokens);

      return tokens;
    } catch (error) {
      const pushError = new PushNotificationError(
        'Failed to get user tokens',
        PushErrorCategory.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        true,
        { userId, operation: 'getUserTokens' }
      );
      ErrorLogger.logError(pushError);
      throw pushError;
    }
  }

  /**
   * Deactivate a specific device token
   * Invalidates cache on deactivation
   * 
   * @param token - FCM device token to deactivate
   * @throws PushNotificationError if deactivation fails
   */
  static async deactivateToken(token: string): Promise<void> {
    // Validate input
    if (!token || !token.trim()) {
      throw new PushNotificationError(
        'Device token is required and cannot be empty',
        PushErrorCategory.INVALID_CONFIGURATION,
        ErrorSeverity.MEDIUM,
        false,
        { operation: 'deactivateToken' }
      );
    }

    try {
      // Get the user_id before deactivating to invalidate cache
      const { data: tokenData } = await supabase
        .from('device_tokens')
        .select('user_id')
        .eq('token', token)
        .single();

      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('token', token);

      if (error) {
        throw error;
      }
      
      // Invalidate cache if we found the user
      if (tokenData?.user_id) {
        TokenCache.invalidate(tokenData.user_id);
      }
      
      console.log(`✅ Token deactivated: ${token.substring(0, 20)}...`);
    } catch (error) {
      const pushError = new PushNotificationError(
        'Failed to deactivate device token',
        PushErrorCategory.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { operation: 'deactivateToken' }
      );
      ErrorLogger.logError(pushError);
      throw pushError;
    }
  }

  /**
   * Clean up expired tokens (inactive for more than 30 days)
   * 
   * @returns Number of tokens cleaned up
   * @throws PushNotificationError if cleanup fails
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('is_active', false)
        .lt('updated_at', thirtyDaysAgo.toISOString())
        .select();

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      console.log(`✅ Cleaned up ${count} expired tokens`);
      return count;
    } catch (error) {
      const pushError = new PushNotificationError(
        'Failed to clean up expired tokens',
        PushErrorCategory.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { operation: 'cleanupExpiredTokens' }
      );
      ErrorLogger.logError(pushError);
      throw pushError;
    }
  }

  /**
   * Update the last_used_at timestamp for a token
   * Called when a notification is successfully sent to a device
   * 
   * @param token - FCM device token
   * @throws Error if update fails
   */
  static async updateLastUsed(token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('device_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('token', token);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating last used timestamp:', error);
      // Don't throw here - this is a non-critical operation
    }
  }

  /**
   * Map database row to DeviceToken interface
   * 
   * @param row - Database row
   * @returns DeviceToken object
   */
  private static mapRowToDeviceToken(row: DeviceTokenRow): DeviceToken {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      platform: row.platform,
      isActive: row.is_active,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
