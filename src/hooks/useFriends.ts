import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FriendsService } from '../services/api/friends';
import type {
  SocialProfile,
  FriendRequest,
  FriendshipStatus,
  PaginationOptions,
} from '../types/social.types';

export interface UseFriendsOptions {
  autoLoad?: boolean;
  pagination?: PaginationOptions;
}

export interface UseFriendsReturn {
  friends: SocialProfile[];
  closeFriends: SocialProfile[];
  friendRequests: FriendRequest[];
  loading: boolean;
  error: Error | null;
  sendFriendRequest: (toUserId: string) => Promise<boolean>;
  acceptRequest: (requestId: string) => Promise<boolean>;
  declineRequest: (requestId: string) => Promise<boolean>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;
  addCloseFriend: (friendId: string) => Promise<boolean>;
  removeCloseFriend: (friendId: string) => Promise<boolean>;
  checkFriendship: (otherUserId: string) => Promise<FriendshipStatus | null>;
  searchUsers: (query: string) => Promise<SocialProfile[]>;
  getMutualFriends: (otherUserId: string) => Promise<SocialProfile[]>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing friends and friend requests
 * 
 * @param options - Configuration options
 * @returns Friends data, loading state, error state, and friend management functions
 * 
 * @example
 * ```tsx
 * const {
 *   friends,
 *   closeFriends,
 *   friendRequests,
 *   loading,
 *   sendFriendRequest,
 *   acceptRequest,
 *   removeFriend,
 *   addCloseFriend,
 * } = useFriends();
 * 
 * // Send a friend request
 * await sendFriendRequest('user-123');
 * 
 * // Accept a friend request
 * await acceptRequest('request-456');
 * 
 * // Add a friend as close friend
 * await addCloseFriend('friend-789');
 * ```
 */
export function useFriends(options: UseFriendsOptions = {}): UseFriendsReturn {
  const { autoLoad = true, pagination } = options;
  const { user } = useAuth();

  const [friends, setFriends] = useState<SocialProfile[]>([]);
  const [closeFriends, setCloseFriends] = useState<SocialProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  // Load friends, close friends, and friend requests
  const loadFriendsData = useCallback(async () => {
    if (!user?.id) {
      setFriends([]);
      setCloseFriends([]);
      setFriendRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [friendsData, closeFriendsData, requestsData] = await Promise.all([
        FriendsService.getFriends(user.id, pagination),
        FriendsService.getCloseFriends(user.id),
        FriendsService.getFriendRequests(user.id),
      ]);

      setFriends(friendsData);
      setCloseFriends(closeFriendsData);
      setFriendRequests(requestsData);
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error('Failed to load friends data');
      setError(loadError);
      console.error('Error loading friends data:', loadError);
    } finally {
      setLoading(false);
    }
  }, [user, pagination]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadFriendsData();
    }
  }, [autoLoad, loadFriendsData]);

  // Send a friend request
  const sendFriendRequest = useCallback(
    async (toUserId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to send friend requests');
        return false;
      }

      try {
        await FriendsService.sendFriendRequest(user.id, toUserId);
        // Optionally refetch to update state
        await loadFriendsData();
        return true;
      } catch (err) {
        const requestError = err instanceof Error ? err : new Error('Failed to send friend request');
        setError(requestError);
        console.error('Error sending friend request:', requestError);
        return false;
      }
    },
    [user, loadFriendsData]
  );

  // Accept a friend request
  const acceptRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to accept friend requests');
        return false;
      }

      try {
        await FriendsService.acceptFriendRequest(requestId);
        // Refetch to update friends list and remove from requests
        await loadFriendsData();
        return true;
      } catch (err) {
        const acceptError = err instanceof Error ? err : new Error('Failed to accept friend request');
        setError(acceptError);
        console.error('Error accepting friend request:', acceptError);
        return false;
      }
    },
    [user, loadFriendsData]
  );

  // Decline a friend request
  const declineRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to decline friend requests');
        return false;
      }

      try {
        await FriendsService.declineFriendRequest(requestId);
        // Remove from friend requests list
        setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
        return true;
      } catch (err) {
        const declineError = err instanceof Error ? err : new Error('Failed to decline friend request');
        setError(declineError);
        console.error('Error declining friend request:', declineError);
        return false;
      }
    },
    [user]
  );

  // Cancel a sent friend request
  const cancelRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to cancel friend requests');
        return false;
      }

      try {
        await FriendsService.cancelFriendRequest(requestId);
        // Remove from friend requests list
        setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
        return true;
      } catch (err) {
        const cancelError = err instanceof Error ? err : new Error('Failed to cancel friend request');
        setError(cancelError);
        console.error('Error cancelling friend request:', cancelError);
        return false;
      }
    },
    [user]
  );

  // Remove a friend
  const removeFriend = useCallback(
    async (friendId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to remove friends');
        return false;
      }

      try {
        await FriendsService.removeFriend(user.id, friendId);
        // Remove from friends and close friends lists
        setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
        setCloseFriends((prev) => prev.filter((friend) => friend.id !== friendId));
        return true;
      } catch (err) {
        const removeError = err instanceof Error ? err : new Error('Failed to remove friend');
        setError(removeError);
        console.error('Error removing friend:', removeError);
        return false;
      }
    },
    [user]
  );

  // Add a friend as close friend
  const addCloseFriend = useCallback(
    async (friendId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to add close friends');
        return false;
      }

      try {
        await FriendsService.addCloseFriend(user.id, friendId);
        // Refetch to update close friends list
        const closeFriendsData = await FriendsService.getCloseFriends(user.id);
        setCloseFriends(closeFriendsData);
        return true;
      } catch (err) {
        const addError = err instanceof Error ? err : new Error('Failed to add close friend');
        setError(addError);
        console.error('Error adding close friend:', addError);
        return false;
      }
    },
    [user]
  );

  // Remove close friend designation
  const removeCloseFriend = useCallback(
    async (friendId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to remove close friends');
        return false;
      }

      try {
        await FriendsService.removeCloseFriend(user.id, friendId);
        // Remove from close friends list
        setCloseFriends((prev) => prev.filter((friend) => friend.id !== friendId));
        return true;
      } catch (err) {
        const removeError = err instanceof Error ? err : new Error('Failed to remove close friend');
        setError(removeError);
        console.error('Error removing close friend:', removeError);
        return false;
      }
    },
    [user]
  );

  // Check friendship status with another user
  const checkFriendship = useCallback(
    async (otherUserId: string): Promise<FriendshipStatus | null> => {
      if (!user?.id) {
        console.warn('User must be logged in to check friendship status');
        return null;
      }

      try {
        const status = await FriendsService.checkFriendship(user.id, otherUserId);
        return status;
      } catch (err) {
        const checkError = err instanceof Error ? err : new Error('Failed to check friendship status');
        setError(checkError);
        console.error('Error checking friendship status:', checkError);
        return null;
      }
    },
    [user]
  );

  // Search for users
  const searchUsers = useCallback(
    async (query: string): Promise<SocialProfile[]> => {
      if (!user?.id) {
        console.warn('User must be logged in to search users');
        return [];
      }

      try {
        const results = await FriendsService.searchUsers(query, user.id);
        return results;
      } catch (err) {
        const searchError = err instanceof Error ? err : new Error('Failed to search users');
        setError(searchError);
        console.error('Error searching users:', searchError);
        return [];
      }
    },
    [user]
  );

  // Get mutual friends with another user
  const getMutualFriends = useCallback(
    async (otherUserId: string): Promise<SocialProfile[]> => {
      if (!user?.id) {
        console.warn('User must be logged in to get mutual friends');
        return [];
      }

      try {
        const mutualFriends = await FriendsService.getMutualFriends(user.id, otherUserId);
        return mutualFriends;
      } catch (err) {
        const mutualError = err instanceof Error ? err : new Error('Failed to get mutual friends');
        setError(mutualError);
        console.error('Error getting mutual friends:', mutualError);
        return [];
      }
    },
    [user]
  );

  // Refetch all friends data
  const refetch = useCallback(async () => {
    await loadFriendsData();
  }, [loadFriendsData]);

  return {
    friends,
    closeFriends,
    friendRequests,
    loading,
    error,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
    addCloseFriend,
    removeCloseFriend,
    checkFriendship,
    searchUsers,
    getMutualFriends,
    refetch,
  };
}
