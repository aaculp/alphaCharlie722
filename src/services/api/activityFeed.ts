import { supabase } from '../../lib/supabase';
import type {
  ActivityFeedEntry,
  ActivityFeedOptions,
  ActivityFeedResponse,
  PrivacyLevel,
} from '../../types/social.types';
import type { CheckIn } from '../../types/checkin.types';

/**
 * ActivityFeedService - Handles activity feed operations
 * Implements activity creation, retrieval, and privacy filtering
 */
export class ActivityFeedService {
  // ============================================================================
  // Activity Feed Retrieval Methods
  // ============================================================================

  /**
   * Get activity feed for a user with privacy filtering
   * @param userId - ID of the user viewing the feed
   * @param options - Query options (pagination, filtering)
   * @returns Activity feed response with activities and pagination info
   * @throws Error if query fails
   */
  static async getActivityFeed(
    userId: string,
    options?: ActivityFeedOptions
  ): Promise<ActivityFeedResponse> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const filter = options?.filter || 'all';

      // Build and execute query based on filter type
      let result;
      
      if (filter === 'all') {
        // No filter - get all activities
        result = await supabase
          .from('activity_feed')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
      } else {
        // Apply activity type filter
        const typeMap: Record<string, string[]> = {
          checkins: ['checkin'],
          favorites: ['favorite'],
          collections: ['collection_created', 'collection_updated'],
        };

        const activityTypes = typeMap[filter];
        if (activityTypes) {
          result = await supabase
            .from('activity_feed')
            .select('*', { count: 'exact' })
            .in('activity_type', activityTypes)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        } else {
          // Invalid filter - return all
          result = await supabase
            .from('activity_feed')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        }
      }

      const { data: activities, error, count } = result;

      if (error) {
        throw new Error(`Failed to get activity feed: ${error.message}`);
      }

      // Filter activities based on privacy and viewer relationship
      const filteredActivities = await this.filterActivitiesByPrivacy(
        activities || [],
        userId
      );

      // Calculate hasMore based on total count
      const total = count || 0;
      const hasMore = offset + limit < total;

      return {
        activities: filteredActivities,
        hasMore,
        total,
      };
    } catch (error) {
      console.error('Error getting activity feed:', error);
      throw error;
    }
  }

  /**
   * Filter activities based on privacy level and viewer relationship
   * @param activities - Activities to filter
   * @param viewerId - ID of the viewer
   * @returns Filtered activities that the viewer can see
   */
  private static async filterActivitiesByPrivacy(
    activities: ActivityFeedEntry[],
    viewerId: string
  ): Promise<ActivityFeedEntry[]> {
    const filtered: ActivityFeedEntry[] = [];

    for (const activity of activities) {
      const hasAccess = await this.checkPrivacyAccess(
        activity.user_id,
        viewerId,
        activity.privacy_level
      );

      if (hasAccess) {
        filtered.push(activity);
      }
    }

    return filtered;
  }

  /**
   * Check if a viewer has access to content based on privacy level and relationship
   * @param ownerId - ID of the content owner
   * @param viewerId - ID of the viewer
   * @param privacyLevel - Privacy level of the content
   * @returns True if viewer has access, false otherwise
   */
  private static async checkPrivacyAccess(
    ownerId: string,
    viewerId: string,
    privacyLevel: PrivacyLevel
  ): Promise<boolean> {
    // Owner can always see their own content
    if (ownerId === viewerId) {
      return true;
    }

    // Private content is never visible to others
    if (privacyLevel === 'private') {
      return false;
    }

    // Public content is visible to everyone
    if (privacyLevel === 'public') {
      return true;
    }

    // For friends and close_friends, check friendship status
    const [orderedId1, orderedId2] =
      ownerId < viewerId ? [ownerId, viewerId] : [viewerId, ownerId];

    const { data: friendship, error } = await supabase
      .from('friendships')
      .select('is_close_friend_1, is_close_friend_2')
      .eq('user_id_1', orderedId1)
      .eq('user_id_2', orderedId2)
      .maybeSingle();

    if (error) {
      console.warn('Warning: Failed to check friendship:', error.message);
      return false;
    }

    // Not friends
    if (!friendship) {
      return false;
    }

    // For friends privacy, any friendship is enough
    if (privacyLevel === 'friends') {
      return true;
    }

    // For close_friends privacy, check if owner has marked viewer as close friend
    if (privacyLevel === 'close_friends') {
      // Determine which field to check based on who is the owner
      const isCloseFriend =
        ownerId === orderedId1
          ? friendship.is_close_friend_1 // owner is user_id_1, check if they marked user_id_2 as close
          : friendship.is_close_friend_2; // owner is user_id_2, check if they marked user_id_1 as close
      return isCloseFriend;
    }

    return false;
  }

  // ============================================================================
  // Activity Creation Methods
  // ============================================================================

  /**
   * Create an activity entry for a check-in
   * @param checkIn - Check-in data
   * @param privacyLevel - Privacy level for the activity
   * @throws Error if creation fails
   */
  static async createCheckInActivity(
    checkIn: CheckIn,
    privacyLevel: PrivacyLevel = 'friends'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_feed')
        .insert({
          user_id: checkIn.user_id,
          activity_type: 'checkin',
          venue_id: checkIn.venue_id,
          collection_id: null,
          group_outing_id: null,
          privacy_level: privacyLevel,
          metadata: {
            check_in_id: checkIn.id,
            checked_in_at: checkIn.checked_in_at,
          },
        });

      if (error) {
        throw new Error(`Failed to create check-in activity: ${error.message}`);
      }

      console.log('✅ Check-in activity created successfully');
    } catch (error) {
      console.error('Error creating check-in activity:', error);
      throw error;
    }
  }

  /**
   * Create an activity entry for a favorite
   * @param userId - ID of the user who favorited
   * @param venueId - ID of the venue that was favorited
   * @param privacyLevel - Privacy level for the activity
   * @throws Error if creation fails
   */
  static async createFavoriteActivity(
    userId: string,
    venueId: string,
    privacyLevel: PrivacyLevel = 'friends'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_feed')
        .insert({
          user_id: userId,
          activity_type: 'favorite',
          venue_id: venueId,
          collection_id: null,
          group_outing_id: null,
          privacy_level: privacyLevel,
          metadata: {
            favorited_at: new Date().toISOString(),
          },
        });

      if (error) {
        throw new Error(`Failed to create favorite activity: ${error.message}`);
      }

      console.log('✅ Favorite activity created successfully');
    } catch (error) {
      console.error('Error creating favorite activity:', error);
      throw error;
    }
  }

  /**
   * Create an activity entry for a collection action
   * @param collectionId - ID of the collection
   * @param userId - ID of the user who performed the action
   * @param action - Action performed ('created' or 'updated')
   * @param privacyLevel - Privacy level for the activity
   * @throws Error if creation fails
   */
  static async createCollectionActivity(
    collectionId: string,
    userId: string,
    action: 'created' | 'updated',
    privacyLevel: PrivacyLevel = 'friends'
  ): Promise<void> {
    try {
      const activityType = action === 'created' ? 'collection_created' : 'collection_updated';

      const { error } = await supabase
        .from('activity_feed')
        .insert({
          user_id: userId,
          activity_type: activityType,
          venue_id: null,
          collection_id: collectionId,
          group_outing_id: null,
          privacy_level: privacyLevel,
          metadata: {
            action,
            action_at: new Date().toISOString(),
          },
        });

      if (error) {
        throw new Error(`Failed to create collection activity: ${error.message}`);
      }

      console.log(`✅ Collection ${action} activity created successfully`);
    } catch (error) {
      console.error('Error creating collection activity:', error);
      throw error;
    }
  }
}
