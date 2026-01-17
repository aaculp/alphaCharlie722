import { supabase } from '../../lib/supabase';

/**
 * Flash Offer Notification Preferences
 * Separate from social notification preferences
 */
export interface FlashOfferNotificationPreferences {
  user_id: string;
  flash_offers_enabled: boolean;
  quiet_hours_start: string | null;  // HH:MM:SS format
  quiet_hours_end: string | null;
  timezone: string;  // IANA timezone
  max_distance_miles: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * NotificationPreferencesService - Handles flash offer notification preferences
 * 
 * Implements:
 * - getPreferences(userId) - Requirement 12.1
 * - updatePreferences(userId, preferences) - Requirement 12.1
 * - createDefaultPreferences(userId) - Requirement 12.2
 */
export class NotificationPreferencesService {
  /**
   * Get flash offer notification preferences for a user
   * Creates default preferences if none exist
   * 
   * @param userId - ID of the user
   * @returns Flash offer notification preferences
   * 
   * Validates: Requirement 12.1
   */
  static async getPreferences(userId: string): Promise<FlashOfferNotificationPreferences> {
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
        return await this.createDefaultPreferences(userId);
      }

      return data;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      // Return default preferences on error
      return this.getDefaultPreferencesObject(userId);
    }
  }

  /**
   * Update flash offer notification preferences for a user
   * Creates preferences if they don't exist (upsert)
   * 
   * @param userId - ID of the user
   * @param preferences - Partial notification preferences to update
   * @returns Updated notification preferences
   * @throws Error if update fails
   * 
   * Validates: Requirement 12.1
   */
  static async updatePreferences(
    userId: string,
    preferences: Partial<Omit<FlashOfferNotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<FlashOfferNotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: userId,
            ...preferences,
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

      console.log('✅ Flash offer notification preferences updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Create default flash offer notification preferences for a new user
   * All notifications enabled by default
   * 
   * @param userId - ID of the user
   * @returns Created notification preferences
   * 
   * Validates: Requirement 12.2
   */
  static async createDefaultPreferences(
    userId: string
  ): Promise<FlashOfferNotificationPreferences> {
    try {
      const defaultPrefs = this.getDefaultPreferencesObject(userId);

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create default preferences: ${error.message}`);
      }

      console.log('✅ Default flash offer notification preferences created:', data);
      return data;
    } catch (error) {
      console.error('Error creating default notification preferences:', error);
      // Return default preferences object on error
      return this.getDefaultPreferencesObject(userId);
    }
  }

  /**
   * Get default notification preferences object
   * Private helper method
   * 
   * @param userId - ID of the user
   * @returns Default notification preferences
   */
  private static getDefaultPreferencesObject(userId: string): FlashOfferNotificationPreferences {
    return {
      user_id: userId,
      flash_offers_enabled: true,  // Enabled by default (Requirement 12.2)
      quiet_hours_start: null,
      quiet_hours_end: null,
      timezone: 'UTC',
      max_distance_miles: null,  // No limit by default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
