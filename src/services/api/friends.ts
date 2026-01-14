import { supabase } from '../../lib/supabase';
import type {
  FriendRequest,
  Friendship,
  FriendshipStatus,
  SocialProfile,
  PaginationOptions,
} from '../../types/social.types';
import { cacheManager, CACHE_TTL } from '../../utils/cache/CacheManager';
import { PrivacyService } from './privacy';

/**
 * FriendsService - Handles all friend-related operations
 * Implements friend requests, friendship management, close friends, and discovery
 */
export class FriendsService {
  // ============================================================================
  // Friend Request Methods
  // ============================================================================

  /**
   * Send a friend request to another user
   * @param fromUserId - ID of the user sending the request
   * @param toUserId - ID of the user receiving the request
   * @returns The created friend request
   * @throws Error if request fails or users are the same
   */
  static async sendFriendRequest(
    fromUserId: string,
    toUserId: string
  ): Promise<FriendRequest> {
    try {
      // Validate: prevent self-friend requests
      if (fromUserId === toUserId) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if either user has blocked the other
      const isBlocked = await PrivacyService.isBlocked(fromUserId, toUserId);
      if (isBlocked) {
        throw new Error('Cannot send friend request to blocked user');
      }

      // Check if users are already friends
      const existingFriendship = await this.checkFriendship(fromUserId, toUserId);
      if (existingFriendship.type === 'friends') {
        throw new Error('Users are already friends');
      }

      // Check if there's already a pending request
      const { data: existingRequest, error: checkError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing requests: ${checkError.message}`);
      }

      if (existingRequest) {
        // If the other user already sent a request, accept it instead
        if (existingRequest.from_user_id === toUserId) {
          await this.acceptFriendRequest(existingRequest.id);
          throw new Error('Friend request already exists from this user - automatically accepted');
        }
        throw new Error('Friend request already sent');
      }

      // Create the friend request
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to send friend request: ${error.message}`);
      }

      console.log('✅ Friend request sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Accept a friend request
   * @param requestId - ID of the friend request to accept
   * @returns The created friendship
   * @throws Error if request not found or acceptance fails
   */
  static async acceptFriendRequest(requestId: string): Promise<Friendship> {
    try {
      // Get the friend request
      const { data: request, error: fetchError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !request) {
        throw new Error('Friend request not found or already processed');
      }

      // Create the bidirectional friendship
      // Ensure user_id_1 < user_id_2 for consistent ordering
      const [userId1, userId2] =
        request.from_user_id < request.to_user_id
          ? [request.from_user_id, request.to_user_id]
          : [request.to_user_id, request.from_user_id];

      const { data: friendship, error: friendshipError } = await supabase
        .from('friendships')
        .insert({
          user_id_1: userId1,
          user_id_2: userId2,
          is_close_friend_1: false,
          is_close_friend_2: false,
        })
        .select()
        .single();

      if (friendshipError) {
        throw new Error(`Failed to create friendship: ${friendshipError.message}`);
      }

      // Delete the friend request
      const { error: deleteError } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (deleteError) {
        console.warn('Warning: Failed to delete friend request:', deleteError.message);
      }

      // Invalidate cache for both users
      this.invalidateFriendsCache(request.from_user_id);
      this.invalidateFriendsCache(request.to_user_id);

      console.log('✅ Friend request accepted successfully:', friendship);
      return friendship;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Decline a friend request
   * @param requestId - ID of the friend request to decline
   * @throws Error if request not found or decline fails
   */
  static async declineFriendRequest(requestId: string): Promise<void> {
    try {
      // Update the request status to declined
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (updateError) {
        throw new Error(`Failed to decline friend request: ${updateError.message}`);
      }

      // Delete the declined request
      const { error: deleteError } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (deleteError) {
        console.warn('Warning: Failed to delete declined request:', deleteError.message);
      }

      console.log('✅ Friend request declined successfully');
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }

  /**
   * Cancel a sent friend request
   * @param requestId - ID of the friend request to cancel
   * @throws Error if request not found or cancellation fails
   */
  static async cancelFriendRequest(requestId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to cancel friend request: ${error.message}`);
      }

      console.log('✅ Friend request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      throw error;
    }
  }

  // ============================================================================
  // Friendship Management Methods
  // ============================================================================

  /**
   * Remove a friend (delete the bidirectional friendship)
   * @param userId - ID of the user removing the friend
   * @param friendId - ID of the friend to remove
   * @throws Error if friendship not found or removal fails
   */
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      // Ensure consistent ordering for query
      const [userId1, userId2] =
        userId < friendId ? [userId, friendId] : [friendId, userId];

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id_1', userId1)
        .eq('user_id_2', userId2);

      if (error) {
        throw new Error(`Failed to remove friend: ${error.message}`);
      }

      // Invalidate cache for both users
      this.invalidateFriendsCache(userId);
      this.invalidateFriendsCache(friendId);

      console.log('✅ Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  /**
   * Get pending friend requests for a user (both sent and received)
   * @param userId - ID of the user whose friend requests to retrieve
   * @returns Array of friend requests with from_user profile data
   */
  static async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          from_user_id,
          to_user_id,
          status,
          created_at,
          updated_at,
          from_user:from_user_id (
            id,
            email,
            name,
            avatar_url
          )
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get friend requests: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting friend requests:', error);
      throw error;
    }
  }

  /**
   * Get a user's friends list
   * @param userId - ID of the user whose friends to retrieve
   * @param options - Pagination options
   * @returns Array of social profiles for friends
   */
  static async getFriends(
    userId: string,
    options?: PaginationOptions
  ): Promise<SocialProfile[]> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      // Check cache first
      const cacheKey = `friends:${userId}:${limit}:${offset}`;
      const cached = cacheManager.get<SocialProfile[]>(cacheKey);
      if (cached) {
        console.log('✅ Returning cached friends list');
        return cached;
      }

      // Query friendships where user is either user_id_1 or user_id_2
      // Select only needed columns for better performance
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, created_at')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get friends: ${error.message}`);
      }

      if (!friendships || friendships.length === 0) {
        return [];
      }

      // Extract friend IDs
      const friendIds = friendships.map((f) =>
        f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
      );

      // Fetch friend profiles - select only needed columns
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url, created_at')
        .in('id', friendIds);

      if (profileError) {
        throw new Error(`Failed to get friend profiles: ${profileError.message}`);
      }

      // Map to SocialProfile format
      const socialProfiles: SocialProfile[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: null, // Not implemented yet
        bio: null, // Not implemented yet
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
      }));

      // Cache the result
      cacheManager.set(cacheKey, socialProfiles, CACHE_TTL.FRIENDS_LIST);

      return socialProfiles;
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  }

  /**
   * Check friendship status between two users
   * @param userId - ID of the first user
   * @param otherUserId - ID of the second user
   * @returns Friendship status object
   */
  static async checkFriendship(
    userId: string,
    otherUserId: string
  ): Promise<FriendshipStatus> {
    try {
      // Check if they are friends
      const [userId1, userId2] =
        userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

      const { data: friendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id_1', userId1)
        .eq('user_id_2', userId2)
        .maybeSingle();

      if (friendshipError) {
        throw new Error(`Failed to check friendship: ${friendshipError.message}`);
      }

      if (friendship) {
        // Determine if the current user marked the other as close friend
        const isCloseFriend =
          friendship.user_id_1 === userId
            ? friendship.is_close_friend_1
            : friendship.is_close_friend_2;

        return { type: 'friends', isCloseFriend };
      }

      // Check for pending friend requests
      const { data: sentRequest, error: sentError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('from_user_id', userId)
        .eq('to_user_id', otherUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (sentError) {
        throw new Error(`Failed to check sent requests: ${sentError.message}`);
      }

      if (sentRequest) {
        return { type: 'pending_sent' };
      }

      const { data: receivedRequest, error: receivedError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('from_user_id', otherUserId)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (receivedError) {
        throw new Error(`Failed to check received requests: ${receivedError.message}`);
      }

      if (receivedRequest) {
        return { type: 'pending_received' };
      }

      return { type: 'none' };
    } catch (error) {
      console.error('Error checking friendship:', error);
      throw error;
    }
  }

  // ============================================================================
  // Close Friends Methods
  // ============================================================================

  /**
   * Designate a friend as a close friend
   * @param userId - ID of the user designating the close friend
   * @param friendId - ID of the friend to designate as close
   * @throws Error if not friends or update fails
   */
  static async addCloseFriend(userId: string, friendId: string): Promise<void> {
    try {
      // Ensure consistent ordering
      const [userId1, userId2] =
        userId < friendId ? [userId, friendId] : [friendId, userId];

      // Determine which flag to update
      const updateField = userId === userId1 ? 'is_close_friend_1' : 'is_close_friend_2';

      const { error } = await supabase
        .from('friendships')
        .update({ [updateField]: true })
        .eq('user_id_1', userId1)
        .eq('user_id_2', userId2);

      if (error) {
        throw new Error(`Failed to add close friend: ${error.message}`);
      }

      // Invalidate cache
      this.invalidateFriendsCache(userId);

      console.log('✅ Close friend added successfully');
    } catch (error) {
      console.error('Error adding close friend:', error);
      throw error;
    }
  }

  /**
   * Remove close friend designation
   * @param userId - ID of the user removing the close friend designation
   * @param friendId - ID of the friend to remove close friend designation from
   * @throws Error if not friends or update fails
   */
  static async removeCloseFriend(userId: string, friendId: string): Promise<void> {
    try {
      // Ensure consistent ordering
      const [userId1, userId2] =
        userId < friendId ? [userId, friendId] : [friendId, userId];

      // Determine which flag to update
      const updateField = userId === userId1 ? 'is_close_friend_1' : 'is_close_friend_2';

      const { error } = await supabase
        .from('friendships')
        .update({ [updateField]: false })
        .eq('user_id_1', userId1)
        .eq('user_id_2', userId2);

      if (error) {
        throw new Error(`Failed to remove close friend: ${error.message}`);
      }

      // Invalidate cache
      this.invalidateFriendsCache(userId);

      console.log('✅ Close friend removed successfully');
    } catch (error) {
      console.error('Error removing close friend:', error);
      throw error;
    }
  }

  /**
   * Get a user's close friends list
   * @param userId - ID of the user whose close friends to retrieve
   * @returns Array of social profiles for close friends
   */
  static async getCloseFriends(userId: string): Promise<SocialProfile[]> {
    try {
      // Check cache first
      const cacheKey = `close_friends:${userId}`;
      const cached = cacheManager.get<SocialProfile[]>(cacheKey);
      if (cached) {
        console.log('✅ Returning cached close friends list');
        return cached;
      }

      // Query friendships where user marked the other as close friend
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id_1.eq.${userId},is_close_friend_1.eq.true),and(user_id_2.eq.${userId},is_close_friend_2.eq.true)`);

      if (error) {
        throw new Error(`Failed to get close friends: ${error.message}`);
      }

      if (!friendships || friendships.length === 0) {
        return [];
      }

      // Extract close friend IDs
      const closeFriendIds = friendships.map((f) =>
        f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
      );

      // Fetch friend profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url, created_at')
        .in('id', closeFriendIds);

      if (profileError) {
        throw new Error(`Failed to get close friend profiles: ${profileError.message}`);
      }

      // Map to SocialProfile format
      const socialProfiles: SocialProfile[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: null,
        bio: null,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
      }));

      // Cache the result
      cacheManager.set(cacheKey, socialProfiles, CACHE_TTL.FRIENDS_LIST);

      return socialProfiles;
    } catch (error) {
      console.error('Error getting close friends:', error);
      throw error;
    }
  }

  /**
   * Check if a user has designated another user as a close friend
   * @param userId - ID of the user who may have designated the close friend
   * @param friendId - ID of the potential close friend
   * @returns True if designated as close friend, false otherwise
   */
  static async isCloseFriend(userId: string, friendId: string): Promise<boolean> {
    try {
      const [userId1, userId2] =
        userId < friendId ? [userId, friendId] : [friendId, userId];

      const { data: friendship, error } = await supabase
        .from('friendships')
        .select('is_close_friend_1, is_close_friend_2')
        .eq('user_id_1', userId1)
        .eq('user_id_2', userId2)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to check close friend status: ${error.message}`);
      }

      if (!friendship) {
        return false;
      }

      // Return the appropriate flag based on which user is asking
      return userId === userId1
        ? friendship.is_close_friend_1
        : friendship.is_close_friend_2;
    } catch (error) {
      console.error('Error checking close friend status:', error);
      return false;
    }
  }

  // ============================================================================
  // Friend Search and Discovery Methods
  // ============================================================================

  /**
   * Search for users by name or email
   * @param query - Search query string
   * @param currentUserId - ID of the user performing the search
   * @returns Array of matching social profiles (excluding blocked users)
   */
  static async searchUsers(
    query: string,
    currentUserId: string
  ): Promise<SocialProfile[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      // Get blocked users to filter them out
      const { data: blockedUsers, error: blockedError } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', currentUserId);

      if (blockedError) {
        console.warn('Warning: Failed to get blocked users:', blockedError.message);
      }

      const blockedIds = blockedUsers?.map((b) => b.blocked_id) || [];

      // Also get users who blocked the current user
      const { data: blockedByUsers, error: blockedByError } = await supabase
        .from('blocked_users')
        .select('blocker_id')
        .eq('blocked_id', currentUserId);

      if (blockedByError) {
        console.warn('Warning: Failed to get users who blocked you:', blockedByError.message);
      }

      const blockedByIds = blockedByUsers?.map((b) => b.blocker_id) || [];
      const allBlockedIds = [...new Set([...blockedIds, ...blockedByIds])];

      // Search for users by name or email (case-insensitive)
      let searchQuery = supabase
        .from('profiles')
        .select('id, email, name, avatar_url, created_at')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', currentUserId) // Exclude self
        .limit(20);

      // Filter out blocked users if any
      if (allBlockedIds.length > 0) {
        searchQuery = searchQuery.not('id', 'in', `(${allBlockedIds.join(',')})`);
      }

      const { data: profiles, error } = await searchQuery;

      if (error) {
        throw new Error(`Failed to search users: ${error.message}`);
      }

      // Map to SocialProfile format
      const socialProfiles: SocialProfile[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: null,
        bio: null,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
      }));

      return socialProfiles;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get mutual friends between two users
   * @param userId - ID of the first user
   * @param otherUserId - ID of the second user
   * @returns Array of social profiles for mutual friends
   */
  static async getMutualFriends(
    userId: string,
    otherUserId: string
  ): Promise<SocialProfile[]> {
    try {
      // Get friends of first user
      const { data: userFriendships, error: userError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      if (userError) {
        throw new Error(`Failed to get user friendships: ${userError.message}`);
      }

      const userFriendIds = (userFriendships || []).map((f) =>
        f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
      );

      if (userFriendIds.length === 0) {
        return [];
      }

      // Get friends of second user
      const { data: otherFriendships, error: otherError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${otherUserId},user_id_2.eq.${otherUserId}`);

      if (otherError) {
        throw new Error(`Failed to get other user friendships: ${otherError.message}`);
      }

      const otherFriendIds = (otherFriendships || []).map((f) =>
        f.user_id_1 === otherUserId ? f.user_id_2 : f.user_id_1
      );

      // Find intersection (mutual friends)
      const mutualFriendIds = userFriendIds.filter((id) => otherFriendIds.includes(id));

      if (mutualFriendIds.length === 0) {
        return [];
      }

      // Fetch mutual friend profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url, created_at')
        .in('id', mutualFriendIds);

      if (profileError) {
        throw new Error(`Failed to get mutual friend profiles: ${profileError.message}`);
      }

      // Map to SocialProfile format
      const socialProfiles: SocialProfile[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: null,
        bio: null,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
      }));

      return socialProfiles;
    } catch (error) {
      console.error('Error getting mutual friends:', error);
      throw error;
    }
  }

  // ============================================================================
  // Cache Management Methods
  // ============================================================================

  /**
   * Invalidate all cached data for a user
   * Called after mutations that affect friend relationships
   * @param userId - ID of the user whose cache to invalidate
   */
  private static invalidateFriendsCache(userId: string): void {
    cacheManager.invalidatePattern(`friends:${userId}:*`);
    cacheManager.invalidatePattern(`close_friends:${userId}`);
    console.log(`✅ Invalidated friends cache for user: ${userId}`);
  }
}
