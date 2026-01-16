import { supabase } from '../../lib/supabase';
import type { VenueShare } from '../../types/social.types';
import { NotificationService } from './notifications';

/**
 * VenueShareService - Handles venue sharing between users
 * Implements venue sharing, share tracking, and share notifications
 */
export class VenueShareService {
  // ============================================================================
  // Venue Sharing Methods
  // ============================================================================

  /**
   * Share a venue with one or more friends
   * @param fromUserId - ID of the user sharing the venue
   * @param venueId - ID of the venue being shared
   * @param toUserIds - Array of user IDs to share with
   * @param message - Optional message to include with the share
   * @returns Array of created venue share records
   * @throws Error if sharing fails
   */
  static async shareVenue(
    fromUserId: string,
    venueId: string,
    toUserIds: string[],
    message?: string
  ): Promise<VenueShare[]> {
    try {
      if (!toUserIds || toUserIds.length === 0) {
        throw new Error('Must specify at least one recipient');
      }

      // Validate that fromUserId is not in toUserIds
      if (toUserIds.includes(fromUserId)) {
        throw new Error('Cannot share venue with yourself');
      }

      // Create a venue share record for each recipient
      const shareRecords = toUserIds.map((toUserId) => ({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        venue_id: venueId,
        message: message || null,
        viewed: false,
        viewed_at: null,
      }));

      const { data, error } = await supabase
        .from('venue_shares')
        .insert(shareRecords)
        .select();

      if (error) {
        throw new Error(`Failed to share venue: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create venue shares: No data returned');
      }

      console.log(`✅ Venue shared successfully with ${toUserIds.length} user(s)`);

      // Send notification for each share (in-app and push)
      // Do this after venue shares are created successfully
      for (const share of data) {
        try {
          await NotificationService.sendVenueShareNotification(share);
        } catch (notificationError) {
          // Log notification failure but don't throw - venue share was created successfully
          console.error('⚠️ Failed to send notification for venue share:', notificationError);
        }
      }

      return data;
    } catch (error) {
      console.error('Error sharing venue:', error);
      throw error;
    }
  }

  /**
   * Get venue shares received by a user
   * @param userId - ID of the user whose received shares to retrieve
   * @returns Array of venue shares received by the user
   */
  static async getReceivedShares(userId: string): Promise<VenueShare[]> {
    try {
      const { data, error } = await supabase
        .from('venue_shares')
        .select(`
          *,
          from_user:profiles!venue_shares_from_user_id_fkey(
            id,
            email,
            name,
            avatar_url,
            created_at
          ),
          venue:venues(
            id,
            name,
            address,
            city,
            state,
            latitude,
            longitude
          )
        `)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get received shares: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting received shares:', error);
      throw error;
    }
  }

  /**
   * Get venue shares sent by a user
   * @param userId - ID of the user whose sent shares to retrieve
   * @returns Array of venue shares sent by the user
   */
  static async getSentShares(userId: string): Promise<VenueShare[]> {
    try {
      const { data, error } = await supabase
        .from('venue_shares')
        .select(`
          *,
          to_user:profiles!venue_shares_to_user_id_fkey(
            id,
            email,
            name,
            avatar_url,
            created_at
          ),
          venue:venues(
            id,
            name,
            address,
            city,
            state,
            latitude,
            longitude
          )
        `)
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get sent shares: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting sent shares:', error);
      throw error;
    }
  }

  /**
   * Mark a venue share as viewed
   * @param shareId - ID of the venue share to mark as viewed
   * @throws Error if update fails
   */
  static async markShareAsViewed(shareId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('venue_shares')
        .update({
          viewed: true,
          viewed_at: new Date().toISOString(),
        })
        .eq('id', shareId)
        .eq('viewed', false); // Only update if not already viewed

      if (error) {
        throw new Error(`Failed to mark share as viewed: ${error.message}`);
      }

      console.log('✅ Share marked as viewed successfully');
    } catch (error) {
      console.error('Error marking share as viewed:', error);
      throw error;
    }
  }

  // ============================================================================
  // Analytics Methods
  // ============================================================================

  /**
   * Get the total number of times a venue has been shared
   * @param venueId - ID of the venue
   * @returns Total share count for the venue
   */
  static async getVenueShareCount(venueId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('venue_shares')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId);

      if (error) {
        throw new Error(`Failed to get venue share count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting venue share count:', error);
      return 0;
    }
  }

  /**
   * Get the number of times a specific share has been viewed
   * @param shareId - ID of the share
   * @returns 1 if viewed, 0 if not viewed
   */
  static async getShareViewCount(shareId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('venue_shares')
        .select('viewed')
        .eq('id', shareId)
        .single();

      if (error) {
        throw new Error(`Failed to get share view count: ${error.message}`);
      }

      return data?.viewed ? 1 : 0;
    } catch (error) {
      console.error('Error getting share view count:', error);
      return 0;
    }
  }
}
