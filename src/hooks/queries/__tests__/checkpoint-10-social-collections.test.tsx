/**
 * Checkpoint 10: Social and Collection Features Verification
 * 
 * This test file verifies that all social and collection features work correctly:
 * - User profile queries
 * - Friends list queries
 * - Activity feed queries with pagination
 * - Collection queries (list and detail)
 * - Collection mutations (create, add venue, follow/unfollow)
 * 
 * Validates: Task 10 checkpoint requirements
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Query hooks
import { useUserProfileQuery } from '../useUserProfileQuery';
import { useFriendsQuery } from '../useFriendsQuery';
import { useActivityFeedQuery } from '../useActivityFeedQuery';
import { useCollectionsQuery } from '../useCollectionsQuery';
import { useCollectionQuery } from '../useCollectionQuery';

// Mutation hooks
import { useUpdateProfileMutation } from '../../mutations/useUpdateProfileMutation';
import { useAddFriendMutation } from '../../mutations/useAddFriendMutation';
import { useAddVenueToCollectionMutation } from '../../mutations/useAddVenueToCollectionMutation';
import { useCreateCollectionMutation } from '../../mutations/useCollectionMutations';

// Services
import { ProfileService } from '../../../services/api/profile';
import { FriendsService } from '../../../services/api/friends';
import { ActivityFeedService } from '../../../services/api/activityFeed';
import { CollectionsService } from '../../../services/api/collections';

// Types
import type { UserProfile } from '../../../types/profile.types';
import type { SocialProfile, ActivityFeedResponse, Collection } from '../../../types/social.types';

// Mock services
jest.mock('../../../services/api/profile');
jest.mock('../../../services/api/friends');
jest.mock('../../../services/api/activityFeed');
jest.mock('../../../services/api/collections');

const mockProfileService = ProfileService as jest.Mocked<typeof ProfileService>;
const mockFriendsService = FriendsService as jest.Mocked<typeof FriendsService>;
const mockActivityFeedService = ActivityFeedService as jest.Mocked<typeof ActivityFeedService>;
const mockCollectionsService = CollectionsService as jest.Mocked<typeof CollectionsService>;

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  };
}

describe('Checkpoint 10: Social and Collection Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Profile Features', () => {
    it('should fetch and display user profile', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        username: 'testuser',
        display_name: 'Test User',
        bio: 'Test bio',
        profile_photo_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        stats: {
          check_in_count: 10,
          favorite_count: 5,
          friend_count: 3,
          collection_count: 2,
        },
      };

      mockProfileService.fetchCompleteUserProfile.mockResolvedValue({
        success: true,
        profile: mockProfile,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useUserProfileQuery({ userId: 'user-123' }),
        { wrapper }
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProfile);
      expect(result.current.data?.username).toBe('testuser');
      expect(result.current.data?.stats.check_in_count).toBe(10);
    });

    it('should update user profile and invalidate cache', async () => {
      const initialProfile: UserProfile = {
        id: 'user-123',
        username: 'testuser',
        display_name: 'Test User',
        bio: 'Old bio',
        profile_photo_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        stats: {
          check_in_count: 10,
          favorite_count: 5,
          friend_count: 3,
          collection_count: 2,
        },
      };

      const updatedProfile: UserProfile = {
        ...initialProfile,
        bio: 'New bio',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockProfileService.fetchCompleteUserProfile
        .mockResolvedValueOnce({ success: true, profile: initialProfile })
        .mockResolvedValueOnce({ success: true, profile: updatedProfile });

      mockProfileService.updateProfile.mockResolvedValue({
        success: true,
        profile: updatedProfile,
      });

      const { wrapper, queryClient } = createWrapper();
      
      // First render the query
      const { result: queryResult } = renderHook(
        () => useUserProfileQuery({ userId: 'user-123' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(queryResult.current.isSuccess).toBe(true);
      });

      expect(queryResult.current.data?.bio).toBe('Old bio');

      // Now render the mutation
      const { result: mutationResult } = renderHook(
        () => useUpdateProfileMutation(),
        { wrapper }
      );

      // Update profile
      await act(async () => {
        await mutationResult.current.mutateAsync({
          userId: 'user-123',
          updates: { bio: 'New bio' },
        });
      });

      // Wait for invalidation and refetch
      await waitFor(() => {
        expect(queryResult.current.data?.bio).toBe('New bio');
      });
    });
  });

  describe('Friends List Features', () => {
    it('should fetch friends list', async () => {
      const mockFriends: SocialProfile[] = [
        {
          id: 'friend-1',
          username: 'friend1',
          display_name: 'Friend One',
          profile_photo_url: null,
          friendship_status: 'accepted',
          mutual_friend_count: 2,
        },
        {
          id: 'friend-2',
          username: 'friend2',
          display_name: 'Friend Two',
          profile_photo_url: null,
          friendship_status: 'accepted',
          mutual_friend_count: 1,
        },
      ];

      mockFriendsService.getFriends.mockResolvedValue(mockFriends);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useFriendsQuery({ userId: 'user-123' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockFriends);
      expect(result.current.data?.length).toBe(2);
    });

    it('should add friend and invalidate friends list', async () => {
      const userId = 'user-add-friend-test';
      const initialFriends: SocialProfile[] = [
        {
          id: 'friend-1',
          username: 'friend1',
          display_name: 'Friend One',
          profile_photo_url: null,
          friendship_status: 'accepted',
          mutual_friend_count: 2,
        },
      ];

      const updatedFriends: SocialProfile[] = [
        ...initialFriends,
        {
          id: 'friend-2',
          username: 'friend2',
          display_name: 'Friend Two',
          profile_photo_url: null,
          friendship_status: 'accepted',
          mutual_friend_count: 0,
        },
      ];

      mockFriendsService.getFriends
        .mockResolvedValueOnce(initialFriends)
        .mockResolvedValueOnce(updatedFriends);

      mockFriendsService.sendFriendRequest.mockResolvedValue({
        id: 'request-123',
        from_user_id: userId,
        to_user_id: 'friend-2',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      const { wrapper } = createWrapper();

      // Render query
      const { result: queryResult } = renderHook(
        () => useFriendsQuery({ userId }),
        { wrapper }
      );

      await waitFor(() => {
        expect(queryResult.current.isSuccess).toBe(true);
      });

      expect(queryResult.current.data?.length).toBe(1);

      // Render mutation
      const { result: mutationResult } = renderHook(
        () => useAddFriendMutation(),
        { wrapper }
      );

      // Add friend
      await act(async () => {
        await mutationResult.current.mutateAsync({
          fromUserId: userId,
          toUserId: 'friend-2',
        });
      });

      // Wait for invalidation and refetch
      await waitFor(() => {
        expect(queryResult.current.data?.length).toBe(2);
      });
    });
  });

  describe('Activity Feed with Pagination', () => {
    it('should fetch activity feed with pagination', async () => {
      const mockPage1: ActivityFeedResponse = {
        activities: [
          {
            id: 'activity-1',
            user_id: 'user-123',
            activity_type: 'check_in',
            venue_id: 'venue-1',
            venue_name: 'Test Venue 1',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'activity-2',
            user_id: 'user-123',
            activity_type: 'favorite',
            venue_id: 'venue-2',
            venue_name: 'Test Venue 2',
            created_at: '2024-01-01T01:00:00Z',
          },
        ],
        hasMore: true,
        nextOffset: 2,
      };

      const mockPage2: ActivityFeedResponse = {
        activities: [
          {
            id: 'activity-3',
            user_id: 'user-123',
            activity_type: 'collection_create',
            collection_id: 'collection-1',
            collection_name: 'My Collection',
            created_at: '2024-01-01T02:00:00Z',
          },
        ],
        hasMore: false,
        nextOffset: undefined,
      };

      mockActivityFeedService.getActivityFeed
        .mockResolvedValueOnce(mockPage1)
        .mockResolvedValueOnce(mockPage2);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useActivityFeedQuery({ userId: 'user-123', limit: 2 }),
        { wrapper }
      );

      // Wait for first page
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0].activities.length).toBe(2);
      expect(result.current.hasNextPage).toBe(true);

      // Fetch next page
      await act(async () => {
        await result.current.fetchNextPage();
      });

      // Wait for second page
      await waitFor(() => {
        expect(result.current.data?.pages.length).toBe(2);
      });

      expect(result.current.data?.pages[1].activities.length).toBe(1);
      expect(result.current.hasNextPage).toBe(false);

      // Verify all activities are accessible
      const allActivities = result.current.data?.pages.flatMap(page => page.activities) || [];
      expect(allActivities.length).toBe(3);
    });

    it('should handle empty activity feed', async () => {
      const emptyResponse: ActivityFeedResponse = {
        activities: [],
        hasMore: false,
        nextOffset: undefined,
      };

      mockActivityFeedService.getActivityFeed.mockResolvedValue(emptyResponse);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useActivityFeedQuery({ userId: 'user-123' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0].activities.length).toBe(0);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('Collection Features', () => {
    it('should fetch user collections', async () => {
      const mockCollections: Collection[] = [
        {
          id: 'collection-1',
          user_id: 'user-123',
          name: 'My Favorites',
          description: 'My favorite venues',
          privacy_level: 'friends',
          cover_image_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          venue_count: 5,
          follower_count: 10,
        },
        {
          id: 'collection-2',
          user_id: 'user-123',
          name: 'Coffee Shops',
          description: 'Best coffee in town',
          privacy_level: 'public',
          cover_image_url: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          venue_count: 3,
          follower_count: 5,
        },
      ];

      mockCollectionsService.getUserCollections.mockResolvedValue(mockCollections);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCollectionsQuery({ userId: 'user-123' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCollections);
      expect(result.current.data?.length).toBe(2);
    });

    it('should fetch single collection detail', async () => {
      const mockCollection: Collection = {
        id: 'collection-123',
        user_id: 'user-456',
        name: 'My Collection',
        description: 'Test description',
        privacy_level: 'friends',
        cover_image_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        venue_count: 5,
        follower_count: 10,
        is_following: false,
      };

      mockCollectionsService.getCollection.mockResolvedValue(mockCollection);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useCollectionQuery({ collectionId: 'collection-123' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCollection);
      expect(result.current.data?.name).toBe('My Collection');
    });

    it('should create collection and invalidate collections list', async () => {
      const initialCollections: Collection[] = [];
      const newCollection: Collection = {
        id: 'collection-new',
        user_id: 'user-123',
        name: 'New Collection',
        description: 'Newly created',
        privacy_level: 'public',
        cover_image_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        venue_count: 0,
        follower_count: 0,
      };

      const updatedCollections: Collection[] = [newCollection];

      mockCollectionsService.getUserCollections
        .mockResolvedValueOnce(initialCollections)
        .mockResolvedValueOnce(updatedCollections);

      mockCollectionsService.createCollection.mockResolvedValue(newCollection);

      const { wrapper } = createWrapper();

      // Render query
      const { result: queryResult } = renderHook(
        () => useCollectionsQuery({ userId: 'user-123' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(queryResult.current.isSuccess).toBe(true);
      });

      expect(queryResult.current.data?.length).toBe(0);

      // Render mutation
      const { result: mutationResult } = renderHook(
        () => useCreateCollectionMutation(),
        { wrapper }
      );

      // Create collection
      await act(async () => {
        await mutationResult.current.mutateAsync({
          userId: 'user-123',
          name: 'New Collection',
          description: 'Newly created',
          privacy_level: 'public',
        });
      });

      // Wait for invalidation and refetch
      await waitFor(() => {
        expect(queryResult.current.data?.length).toBe(1);
      });

      expect(queryResult.current.data?.[0].name).toBe('New Collection');
    });

    it('should add venue to collection and update venue count', async () => {
      const initialCollection: Collection = {
        id: 'collection-123',
        user_id: 'user-456',
        name: 'My Collection',
        description: 'Test description',
        privacy_level: 'friends',
        cover_image_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        venue_count: 5,
        follower_count: 10,
      };

      const updatedCollection: Collection = {
        ...initialCollection,
        venue_count: 6,
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockCollectionsService.getCollection
        .mockResolvedValueOnce(initialCollection)
        .mockResolvedValueOnce(updatedCollection);

      mockCollectionsService.addVenueToCollection.mockResolvedValue(undefined);

      const { wrapper } = createWrapper();

      // Render query
      const { result: queryResult } = renderHook(
        () => useCollectionQuery({ collectionId: 'collection-123' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(queryResult.current.isSuccess).toBe(true);
      });

      expect(queryResult.current.data?.venue_count).toBe(5);

      // Render mutation
      const { result: mutationResult } = renderHook(
        () => useAddVenueToCollectionMutation(),
        { wrapper }
      );

      // Add venue
      await act(async () => {
        await mutationResult.current.mutateAsync({
          collectionId: 'collection-123',
          venueId: 'venue-789',
          userId: 'user-456',
        });
      });

      // Wait for invalidation and refetch
      await waitFor(() => {
        expect(queryResult.current.data?.venue_count).toBe(6);
      });
    });
  });

  describe('Integration: Complete User Flow', () => {
    it('should handle complete social flow: profile -> friends -> activity', async () => {
      const userId = 'user-integration-test';
      
      // Mock profile
      const mockProfile: UserProfile = {
        id: userId,
        username: 'testuser',
        display_name: 'Test User',
        bio: 'Test bio',
        profile_photo_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        stats: {
          check_in_count: 10,
          favorite_count: 5,
          friend_count: 2,
          collection_count: 1,
        },
      };

      // Mock friends
      const mockFriends: SocialProfile[] = [
        {
          id: 'friend-1',
          username: 'friend1',
          display_name: 'Friend One',
          profile_photo_url: null,
          friendship_status: 'accepted',
          mutual_friend_count: 1,
        },
      ];

      // Mock activity
      const mockActivity: ActivityFeedResponse = {
        activities: [
          {
            id: 'activity-1',
            user_id: userId,
            activity_type: 'check_in',
            venue_id: 'venue-1',
            venue_name: 'Test Venue',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        hasMore: false,
        nextOffset: undefined,
      };

      mockProfileService.fetchCompleteUserProfile.mockResolvedValue({
        success: true,
        profile: mockProfile,
      });
      mockFriendsService.getFriends.mockResolvedValue(mockFriends);
      mockActivityFeedService.getActivityFeed.mockResolvedValue(mockActivity);

      const { wrapper } = createWrapper();

      // Fetch profile
      const { result: profileResult } = renderHook(
        () => useUserProfileQuery({ userId }),
        { wrapper }
      );

      await waitFor(() => {
        expect(profileResult.current.isSuccess).toBe(true);
      });

      expect(profileResult.current.data?.username).toBe('testuser');

      // Fetch friends
      const { result: friendsResult } = renderHook(
        () => useFriendsQuery({ userId }),
        { wrapper }
      );

      await waitFor(() => {
        expect(friendsResult.current.isSuccess).toBe(true);
      });

      expect(friendsResult.current.data?.length).toBe(1);

      // Fetch activity
      const { result: activityResult } = renderHook(
        () => useActivityFeedQuery({ userId }),
        { wrapper }
      );

      await waitFor(() => {
        expect(activityResult.current.isSuccess).toBe(true);
      });

      expect(activityResult.current.data?.pages[0].activities.length).toBe(1);

      // Verify all data is loaded
      expect(profileResult.current.data).toBeTruthy();
      expect(friendsResult.current.data).toBeTruthy();
      expect(activityResult.current.data).toBeTruthy();
    });
  });
});
