# Implementation Plan: Social Friend System (MVP)

## Overview

This implementation plan breaks down the MVP social friend system into discrete, manageable tasks. The MVP focuses on friend connections, collections, venue sharing, and embedded social components rather than full dedicated screens. Each task builds incrementally toward a working social layer integrated into the existing OTW app.

## Tasks

- [x] 1. Set up database schema and core infrastructure
  - Create database tables for social features
  - Implement RLS policies for privacy enforcement
  - Set up database functions for complex queries
  - _Requirements: 1.2, 1.4, 5.1, 8.1, 13.1-13.10_

- [x] 1.1 Create friendships and friend_requests tables
  - Write SQL migration for friendships table with bidirectional structure
  - Write SQL migration for friend_requests table
  - Add indexes for performance (user_id_1, user_id_2, from_user_id, to_user_id)
  - Add constraints (no self-friendship, unique pairs, ordering check)
  - _Requirements: 1.2, 1.8, 1.9_

- [x] 1.2 Create collections and collection_venues tables
  - Write SQL migration for collections table with privacy_level field
  - Write SQL migration for collection_venues junction table with order field
  - Add indexes for queries (user_id, collection_id, venue_id)
  - Add unique constraint on collection_id + venue_id
  - _Requirements: 5.1, 5.2_

- [x] 1.3 Create venue_shares and activity_feed tables
  - Write SQL migration for venue_shares table
  - Write SQL migration for activity_feed table with privacy_level
  - Add indexes for queries (to_user_id, from_user_id, user_id, created_at)
  - _Requirements: 4.1, 3.1_

- [x] 1.4 Create privacy_settings and social_notifications tables
  - Write SQL migration for privacy_settings with 4-tier privacy levels
  - Write SQL migration for social_notifications table
  - Add default privacy settings trigger for new users
  - _Requirements: 8.1-8.5, 9.1_

- [x] 1.5 Implement RLS policies for friendships
  - Create SELECT policy: users can view their own friendships
  - Create INSERT policy: users can create friendships (via acceptance)
  - Create UPDATE policy: users can update close friend designation
  - Create DELETE policy: users can delete their own friendships
  - _Requirements: 13.10_

- [x] 1.6 Implement RLS policies for collections
  - Create SELECT policy with privacy level filtering (public, friends, close_friends, private)
  - Create INSERT/UPDATE/DELETE policies: users manage own collections
  - Test policy enforcement with different privacy levels
  - _Requirements: 5.8, 13.10_

- [x] 1.7 Implement RLS policies for activity_feed
  - Create SELECT policy with privacy and relationship filtering
  - Include friend check, close friend check, and follower check
  - Create INSERT policy: users create own activities
  - _Requirements: 3.6, 13.10_

- [x] 1.8 Create database helper functions
  - Implement are_friends(user1_id, user2_id) function
  - Implement is_close_friend(user1_id, user2_id) function
  - Implement get_mutual_friends(user1_id, user2_id) function
  - Test functions with various user relationships
  - _Requirements: 10.3_


- [x] 2. Implement core TypeScript types and interfaces
  - Define all social data types matching database schema
  - Create service interfaces
  - Add types to src/types/social.types.ts
  - _Requirements: All requirements (type foundation)_

- [x] 2.1 Define friendship and friend request types
  - Create Friendship, FriendRequest, FriendshipStatus interfaces
  - Create PrivacyLevel type with 4 tiers
  - Create SocialProfile interface with computed fields
  - Export from src/types/social.types.ts
  - _Requirements: 1.1-1.13_

- [x] 2.2 Define collection types
  - Create Collection, CollectionCreate, CollectionUpdate interfaces
  - Create CollectionVenue, VenueOrder interfaces
  - Include privacy_level and computed fields (venue_count, follower_count)
  - _Requirements: 5.1-5.11_

- [x] 2.3 Define activity feed and sharing types
  - Create ActivityFeedEntry, VenueShare interfaces
  - Create SocialNotification, NotificationType interfaces
  - Include metadata and computed fields
  - _Requirements: 3.1-3.15, 4.1-4.8, 9.1-9.10_

- [x] 2.4 Define privacy settings types
  - Create PrivacySettings interface with all privacy controls
  - Create NotificationPreferences interface
  - Add to src/types/social.types.ts
  - _Requirements: 8.1-8.22_

- [x] 2.5 Update Supabase database types
  - Add social tables to Database interface in src/lib/supabase.ts
  - Include Row, Insert, Update types for each table
  - Ensure type safety for all database operations
  - _Requirements: 13.1-13.10_

- [x] 3. Implement FriendsService API layer
  - Create src/services/api/friends.ts
  - Implement all friend management methods
  - Add error handling and validation
  - _Requirements: 1.1-1.13_

- [x] 3.1 Implement friend request methods
  - Create sendFriendRequest(fromUserId, toUserId) method
  - Create acceptFriendRequest(requestId) method
  - Create declineFriendRequest(requestId) method
  - Create cancelFriendRequest(requestId) method
  - Handle duplicate request prevention
  - _Requirements: 1.2, 1.4, 1.5, 1.8_

- [x] 3.2 Write property test for friend request creation
  - **Property 1: Friend request creation**
  - **Validates: Requirements 1.2**
  - Generate random user pairs
  - Verify friend_request record created with pending status
  - Test with fast-check, 100 iterations

- [x] 3.3 Write property test for no duplicate friend requests
  - **Property 2: No duplicate friend requests**
  - **Validates: Requirements 1.8**
  - Generate random user pairs
  - Send multiple requests between same users
  - Verify only one pending request exists
  - Test with fast-check, 100 iterations

- [x] 3.4 Write property test for no self-friend requests
  - **Property 3: No self-friend requests**
  - **Validates: Requirements 1.9**
  - Generate random user IDs
  - Attempt self-friend requests
  - Verify all attempts are rejected
  - Test with fast-check, 100 iterations

- [x] 3.5 Implement friendship management methods
  - Create removeFriend(userId, friendId) method
  - Create getFriends(userId, options) method with pagination
  - Create checkFriendship(userId, otherUserId) method
  - Return FriendshipStatus with relationship details
  - _Requirements: 1.6, 1.7_

- [x] 3.6 Write property test for friendship removal
  - **Property 6: Friendship removal is bidirectional**
  - **Validates: Requirements 1.7**
  - Generate random friendships
  - Remove friendship from one side
  - Verify no friendship exists for either user
  - Test with fast-check, 100 iterations

- [x] 3.7 Implement close friends methods
  - Create addCloseFriend(userId, friendId) method
  - Create removeCloseFriend(userId, friendId) method
  - Create getCloseFriends(userId) method
  - Create isCloseFriend(userId, friendId) method
  - _Requirements: 1.10, 1.12, 1.13_

- [x] 3.8 Write property test for close friend designation
  - **Property 7: Close friend designation**
  - **Validates: Requirements 1.10, 1.13**
  - Generate random friendships
  - Designate as close friend
  - Verify flag set correctly without affecting other user's designation
  - Test with fast-check, 100 iterations

- [x] 3.9 Implement friend search and discovery
  - Create searchUsers(query, currentUserId) method
  - Create getMutualFriends(userId, otherUserId) method
  - Filter out blocked users from results
  - _Requirements: 1.1, 10.3_


- [x] 4. Implement CollectionsService API layer
  - Create src/services/api/collections.ts
  - Implement collection CRUD and venue management
  - Add privacy filtering
  - _Requirements: 5.1-5.11_

- [x] 4.1 Implement collection CRUD methods
  - Create createCollection(data) method
  - Create updateCollection(collectionId, data) method
  - Create deleteCollection(collectionId) method
  - Create getCollection(collectionId, viewerId) with privacy check
  - Create getUserCollections(userId, viewerId) with privacy filtering
  - _Requirements: 5.1, 5.4, 5.5_

- [x] 4.2 Write property test for collection creation
  - **Property 28: Collection creation**
  - **Validates: Requirements 5.1**
  - Generate random collection data
  - Create collections
  - Verify records created with correct fields
  - Test with fast-check, 100 iterations

- [x] 4.3 Implement venue management in collections
  - Create addVenueToCollection(collectionId, venueId, order) method
  - Create removeVenueFromCollection(collectionId, venueId) method
  - Create reorderVenues(collectionId, venueOrders) method
  - Create getCollectionVenues(collectionId) method
  - _Requirements: 5.2, 5.3, 5.6, 5.7_

- [x] 4.4 Write property test for venue addition to collection
  - **Property 29: Venue addition to collection**
  - **Validates: Requirements 5.2**
  - Generate random collections and venues
  - Add venues to collections
  - Verify collection_venue associations created
  - Test with fast-check, 100 iterations

- [x] 4.5 Write property test for collection venue uniqueness
  - **Property 52: Collection venue uniqueness**
  - **Validates: Requirements 5.2**
  - Generate random collections
  - Attempt to add same venue multiple times
  - Verify each venue appears at most once
  - Test with fast-check, 100 iterations

- [x] 4.6 Write property test for collection privacy enforcement
  - **Property 24: Collection privacy enforcement**
  - **Validates: Requirements 5.8**
  - Generate collections with various privacy levels
  - Query as different viewers (friend, close friend, stranger)
  - Verify only authorized viewers can access
  - Test with fast-check, 100 iterations

- [x] 5. Implement VenueShareService API layer
  - Create src/services/api/venueShare.ts
  - Implement venue sharing functionality
  - Add notification creation
  - _Requirements: 4.1-4.8_

- [x] 5.1 Implement venue sharing methods
  - Create shareVenue(fromUserId, venueId, toUserIds, message) method
  - Create getReceivedShares(userId) method
  - Create getSentShares(userId) method
  - Create markShareAsViewed(shareId) method
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [x] 5.2 Write property test for venue share creation
  - **Property 37: Venue share creation**
  - **Validates: Requirements 4.3**
  - Generate random venue shares to multiple friends
  - Verify venue_share record created for each recipient
  - Verify correct venue_id and message
  - Test with fast-check, 100 iterations

- [x] 5.3 Write property test for share view tracking
  - **Property 39: Share view tracking**
  - **Validates: Requirements 4.5**
  - Generate random venue shares
  - Mark as viewed
  - Verify viewed flag and viewed_at timestamp set
  - Test with fast-check, 100 iterations

- [x] 6. Implement ActivityFeedService API layer
  - Create src/services/api/activityFeed.ts
  - Implement activity creation and retrieval
  - Add privacy filtering logic
  - _Requirements: 3.1-3.15_

- [x] 6.1 Implement activity feed retrieval
  - Create getActivityFeed(userId, options) method
  - Implement privacy filtering based on relationships
  - Support pagination (limit, offset)
  - Support filtering by activity type
  - _Requirements: 3.1, 3.6, 3.12, 3.13_

- [x] 6.2 Write property test for activity feed privacy filtering
  - **Property 19: Activity feed privacy filtering**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**
  - Generate activities with various privacy levels
  - Query as different viewers with different relationships
  - Verify only authorized activities returned
  - Test with fast-check, 100 iterations

- [x] 6.3 Write property test for activity feed chronological ordering
  - **Property 50: Activity feed chronological ordering**
  - **Validates: Requirements 3.1**
  - Generate random activities with timestamps
  - Query activity feed
  - Verify activities sorted by created_at descending
  - Test with fast-check, 100 iterations

- [x] 6.2 Implement activity creation methods
  - Create createCheckInActivity(checkIn) method
  - Create createFavoriteActivity(favorite) method
  - Create createCollectionActivity(collection, action) method
  - Hook into existing check-in and favorite services
  - _Requirements: 3.2, 3.3, 3.4_


- [x] 7. Implement NotificationService extensions
  - Extend existing src/services/api/notifications.ts (if exists) or create new
  - Add social notification methods
  - Implement notification preferences
  - _Requirements: 9.1-9.10_

- [x] 7.1 Implement social notification creation methods
  - Create sendFriendRequestNotification(fromUserId, toUserId) method
  - Create sendFriendAcceptedNotification(fromUserId, toUserId) method
  - Create sendVenueShareNotification(share) method
  - Call from respective service methods
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 7.2 Write property test for friend request notification
  - **Property 40: Friend request notification**
  - **Validates: Requirements 9.1**
  - Generate random friend requests
  - Verify notification created for recipient
  - Verify notification type is 'friend_request'
  - Test with fast-check, 100 iterations

- [x] 7.3 Implement notification management methods
  - Create getSocialNotifications(userId, options) method with pagination
  - Create markNotificationAsRead(notificationId) method
  - Create markAllNotificationsAsRead(userId) method
  - Create getUnreadNotificationCount(userId) method
  - _Requirements: 9.9, 9.10_

- [x] 8. Implement PrivacyService API layer
  - Create src/services/api/privacy.ts
  - Implement privacy settings management
  - Add blocking functionality
  - _Requirements: 8.1-8.22_

- [x] 8.1 Implement privacy settings methods
  - Create updatePrivacySettings(userId, settings) method
  - Create getPrivacySettings(userId) method
  - Set safe defaults for new users (friends-only)
  - _Requirements: 8.1-8.5, 8.21_

- [x] 8.2 Implement blocking methods
  - Create blockUser(userId, blockedUserId) method
  - Create unblockUser(userId, blockedUserId) method
  - Create getBlockedUsers(userId) method
  - Create isBlocked(userId, otherUserId) method
  - Remove friendships and follows when blocking
  - _Requirements: 8.15, 8.16, 8.17, 8.20_

- [x] 8.3 Write property test for block prevents interactions
  - **Property 25: Block prevents all interactions**
  - **Validates: Requirements 8.16, 8.17**
  - Generate random user pairs
  - Block one user
  - Attempt various interactions (friend request, follow, share)
  - Verify all interactions prevented
  - Test with fast-check, 100 iterations

- [x] 9. Implement custom hooks for social features
  - Create hooks in src/hooks/
  - Follow existing hook patterns (useFavorites, useVenues)
  - Add loading, error, and refetch states
  - _Requirements: All requirements (UI integration)_

- [x] 9.1 Implement useFriends hook
  - Create src/hooks/useFriends.ts
  - Fetch friends list with pagination
  - Provide sendFriendRequest, acceptRequest, declineRequest functions
  - Provide removeFriend, addCloseFriend functions
  - Return loading, error, refetch states
  - _Requirements: 1.1-1.13_

- [x] 9.2 Implement useCollections hook
  - Create src/hooks/useCollections.ts
  - Fetch user collections
  - Provide createCollection, updateCollection, deleteCollection functions
  - Provide addVenue, removeVenue, reorderVenues functions
  - Return loading, error, refetch states
  - _Requirements: 5.1-5.11_

- [x] 9.3 Implement useSharedVenues hook
  - Create src/hooks/useSharedVenues.ts
  - Fetch shared venues between user and friends
  - Fetch mutual favorites
  - Provide shareVenue function
  - Return loading, error, refetch states
  - _Requirements: 4.1-4.8_

- [x] 9.4 Implement useFriendActivity hook
  - Create src/hooks/useFriendActivity.ts
  - Fetch activity feed with privacy filtering
  - Support pagination and filtering
  - Return loading, error, refetch, loadMore states
  - _Requirements: 3.1-3.15_

- [x] 9.5 Implement useSocialNotifications hook
  - Create src/hooks/useSocialNotifications.ts
  - Fetch social notifications
  - Provide markAsRead, markAllAsRead functions
  - Return unread count
  - Return loading, error, refetch states
  - _Requirements: 9.1-9.10_

- [x] 10. Create social UI components
  - Create components in src/components/social/
  - Follow existing component patterns
  - Use TypeScript for props
  - _Requirements: All requirements (UI)_

- [x] 10.1 Create FriendVenueCarousel component
  - Create src/components/social/FriendVenueCarousel.tsx
  - Horizontal FlatList of venue cards
  - Show friend's profile picture in header
  - Display "Places [Friend Name] Loves"
  - Show mutual favorites badge
  - Navigate to VenueDetailScreen on tap
  - _Requirements: 3.1, 4.1_

- [x] 10.2 Create SharedCollectionCarousel component
  - Create src/components/social/SharedCollectionCarousel.tsx
  - Horizontal FlatList of venues from collection
  - Show "[Friend Name]'s [Collection Name]" header
  - Display collection follower count
  - Navigate to VenueDetailScreen on tap
  - _Requirements: 5.4, 5.5, 5.11_

- [x] 10.3 Create FriendActivityFeed component
  - Create src/components/social/FriendActivityFeed.tsx
  - Compact vertical list of recent activities
  - Show 3-5 most recent items
  - Display friend avatar, venue name, action type
  - "See More" button to expand
  - Navigate to VenueDetailScreen on tap
  - _Requirements: 3.1, 3.11_


- [x] 10.4 Create QuickShareButton component
  - Create src/components/social/QuickShareButton.tsx
  - Share icon button for VenueDetailScreen
  - Opens bottom sheet with friend list
  - Multi-select friends with checkboxes
  - Optional message input field
  - Call shareVenue on confirm
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 10.5 Create CollectionManager component
  - Create src/components/social/CollectionManager.tsx
  - "Add to Collection" button for VenueDetailScreen
  - Bottom sheet showing user's collections
  - Create new collection inline
  - Multi-select collections
  - Set privacy level per collection
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 10.6 Create FriendSelector component
  - Create src/components/social/FriendSelector.tsx
  - Reusable friend selection component
  - Searchable list with avatars and names
  - Multi-select with checkboxes
  - Filter by close friends option
  - Used in QuickShareButton and CollectionManager
  - _Requirements: 1.6, 4.3_

- [x] 10.7 Create PrivacyBadge component
  - Create src/components/social/PrivacyBadge.tsx
  - Small icon showing privacy level
  - Icons for public/friends/close_friends/private
  - Tooltip on tap explaining privacy level
  - Used on collections and shared content
  - _Requirements: 8.1-8.5_

- [x] 10.8 Create MutualFavoritesIndicator component
  - Create src/components/social/MutualFavoritesIndicator.tsx
  - Badge showing "You & X friends love this"
  - Stacked friend avatars
  - Tap to show list of friends who favorited
  - Used on venue cards
  - _Requirements: 10.3_

- [x] 10.9 Create FriendRequestCard component
  - Create src/components/social/FriendRequestCard.tsx
  - Display pending friend request
  - Show requester's profile picture and name
  - Show mutual friends count
  - Accept and Decline buttons
  - Used in notifications or settings
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 10.10 Create index.ts for social components
  - Create src/components/social/index.ts
  - Export all social components
  - Follow existing component export pattern
  - _Requirements: All requirements (organization)_

- [x] 11. Integrate social components into existing screens
  - Enhance HomeScreen, VenueDetailScreen, FavoritesScreen, SettingsScreen
  - Add social sections without disrupting existing functionality
  - Maintain existing navigation patterns
  - _Requirements: All requirements (integration)_

- [x] 11.1 Add social sections to HomeScreen
  - Import FriendVenueCarousel, SharedCollectionCarousel, FriendActivityFeed
  - Add "Friends' Favorites" section with horizontal carousel
  - Add "Shared Collections" section for friend collections
  - Add compact activity feed section
  - Maintain existing featured venues section
  - _Requirements: 3.1, 4.1, 5.4_

- [x] 11.2 Add social features to VenueDetailScreen
  - Import QuickShareButton, CollectionManager, MutualFavoritesIndicator
  - Add share button to header or action bar
  - Add "Add to Collection" button near favorites
  - Show mutual favorites indicator if applicable
  - Maintain existing venue detail functionality
  - _Requirements: 4.1, 5.2_

- [x] 11.3 Add shared favorites section to FavoritesScreen
  - Import FriendVenueCarousel
  - Add "Shared with Friends" section showing mutual favorites
  - Group by friend with horizontal carousels
  - Maintain existing favorites list
  - _Requirements: 4.1_

- [x] 11.4 Add friend management to SettingsScreen
  - Add "Friends" section with friend count
  - Navigate to friends list (can be simple modal or new screen)
  - Add "Privacy Settings" section
  - Add privacy controls for check-ins, favorites, collections
  - Add "Blocked Users" management
  - _Requirements: 1.6, 8.1-8.22_

- [x] 12. Implement notification handling
  - Add notification listeners
  - Handle notification taps
  - Navigate to appropriate screens
  - _Requirements: 9.1-9.10_

- [x] 12.1 Set up notification listeners
  - Listen for friend request notifications
  - Listen for venue share notifications
  - Listen for friend accepted notifications
  - Update notification badge count
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 12.2 Implement notification tap handlers
  - Friend request tap → Show friend request card/modal
  - Venue share tap → Navigate to VenueDetailScreen
  - Friend accepted tap → Navigate to friend's profile or friends list
  - _Requirements: 9.10_

- [x] 12.3 Add notification badge to tab bar
  - Show unread count on appropriate tab
  - Update in real-time when notifications received
  - Clear when notifications viewed
  - _Requirements: 9.9_

- [x] 13. Checkpoint - Test core functionality
  - Ensure all tests pass
  - Manually test key user flows
  - Ask user if questions arise
  - _Requirements: All requirements_

- [x] 14. Performance optimization and polish
  - Optimize queries and caching
  - Add loading skeletons
  - Polish animations and transitions
  - _Requirements: 14.1-14.8_

- [x] 14.1 Implement caching for social data
  - Cache friends list (5 minute TTL)
  - Cache collections (5 minute TTL)
  - Cache privacy settings (10 minute TTL)
  - Invalidate cache on mutations
  - _Requirements: 14.4_

- [x] 14.2 Add loading states and skeletons
  - Add skeleton loaders for carousels
  - Add loading indicators for buttons
  - Add pull-to-refresh for activity feed
  - Improve perceived performance
  - _Requirements: 14.1_

- [x] 14.3 Optimize database queries
  - Review and optimize slow queries
  - Add missing indexes if needed
  - Use SELECT only needed columns
  - Batch queries where possible
  - _Requirements: 14.5, 14.6_

- [x] 14.4 Polish UI and animations
  - Add smooth transitions for carousels
  - Add haptic feedback for actions
  - Polish bottom sheets and modals
  - Ensure consistent styling with existing app
  - _Requirements: All requirements (UX)_

- [x] 15. Final testing and bug fixes
  - Run full test suite
  - Test on both iOS and Android
  - Fix any discovered bugs
  - Prepare for release
  - _Requirements: All requirements_

## Notes

- All tasks are required for comprehensive testing from the start
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100 iterations each
- Unit tests validate specific examples and edge cases
- The implementation follows OTW's existing patterns and integrates seamlessly
