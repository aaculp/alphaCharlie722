# Implementation Plan: React Query Integration

## Overview

This implementation plan breaks down the React Query integration into incremental, testable steps. The approach prioritizes high-impact areas (venue data and check-ins) first, then expands to social features, real-time integration, and optimization. Each task builds on previous work, ensuring the system remains functional throughout the migration.

## Tasks

- [x] 1. Set up React Query infrastructure
  - Install dependencies: @tanstack/react-query, @tanstack/query-async-storage-persister, @tanstack/react-query-devtools
  - Create query client configuration in src/lib/queryClient.ts with staleTime: 30s, cacheTime: 5min, retry: 3
  - Set up QueryClientProvider wrapper in App.tsx root component
  - Configure React Query DevTools for development mode
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Write unit tests for query client setup
  - Test QueryClient initialization with correct default options
  - Test QueryClientProvider wrapping
  - Test DevTools inclusion when __DEV__ is true
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create query key factory
  - Create src/lib/queryKeys.ts with hierarchical key structure
  - Implement query key factories for: venues, check-ins, flash-offers, users, collections, activity-feed
  - Ensure type-safe key generation with TypeScript const assertions
  - Export centralized queryKeys object
  - _Requirements: 2.1, 2.2, 3.5, 4.1, 5.1, 5.2, 5.3, 6.1, 6.2_

- [x] 2.1 Write property test for query key structure
  - **Property 1: Query key structure consistency**
  - **Validates: Requirements 2.1, 2.2, 3.5, 4.1, 5.1, 5.2, 5.3, 6.1, 6.2**
  - Use fast-check to generate various entity types and verify key structure
  - Test that first element is entity type, subsequent elements are IDs/filters
  - _Requirements: 2.1, 2.2, 3.5, 4.1, 5.1, 5.2, 5.3, 6.1, 6.2_

- [x] 3. Implement venue query hooks
  - [x] 3.1 Create src/hooks/queries/useVenuesQuery.ts
    - Implement useVenuesQuery with filters support (location, category, hasFlashOffers)
    - Use queryKeys.venues.list(filters) for cache key
    - Return venues array, isLoading, isFetching, isError, error, refetch
    - _Requirements: 2.1_

  - [x] 3.2 Create src/hooks/queries/useVenueQuery.ts
    - Implement useVenueQuery for single venue details
    - Use queryKeys.venues.detail(venueId) for cache key
    - Return venue object, loading/error states, refetch
    - _Requirements: 2.2_

  - [x] 3.3 Write unit tests for venue query hooks
    - Test useVenuesQuery returns correct data structure
    - Test useVenueQuery handles loading states
    - Test error handling and refetch capability
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Write property test for request deduplication
    - **Property 2: Request deduplication**
    - **Validates: Requirements 13.1**
    - Test that simultaneous requests for same query key result in single network call
    - _Requirements: 13.1_

- [x] 4. Checkpoint - Verify venue queries work
  - Test venue list and detail screens render with React Query
  - Ensure loading states display correctly
  - Verify data caching works (navigate away and back)
  - Ask user if questions arise

- [x] 5. Implement check-in mutation with optimistic updates
  - [x] 5.1 Create src/hooks/mutations/useCheckInMutation.ts
    - Implement mutation with optimistic update in onMutate
    - Capture previous venue state before optimistic update
    - Optimistically increment checkInCount and set userHasCheckedIn
    - Implement rollback in onError using captured state
    - Invalidate venue and check-in queries in onSettled
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.2 Write property test for optimistic updates
    - **Property 12: Optimistic UI updates**
    - **Validates: Requirements 3.3, 9.1, 9.2, 9.3**
    - Test that UI updates immediately before server confirmation
    - _Requirements: 3.3, 9.1, 9.2, 9.3_

  - [x] 5.3 Write property test for optimistic rollback
    - **Property 13: Optimistic update rollback**
    - **Validates: Requirements 3.4, 9.4**
    - Test that previous state is restored on mutation failure
    - _Requirements: 3.4, 9.4_

  - [x] 5.4 Write property test for mutation invalidation
    - **Property 6: Check-in mutation invalidation**
    - **Validates: Requirements 3.2**
    - Test that correct queries are invalidated after successful check-in
    - _Requirements: 3.2_

- [x] 6. Implement flash offers queries and mutations
  - [x] 6.1 Create src/hooks/queries/useFlashOffersQuery.ts
    - Implement useFlashOffersQuery with venueId parameter
    - Set staleTime to 10 seconds for time-sensitive data
    - Enable refetchOnWindowFocus and set refetchInterval to 30s
    - Use queryKeys.flashOffers.byVenue(venueId) for cache key
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 6.2 Create src/hooks/mutations/useClaimFlashOfferMutation.ts
    - Implement mutation with optimistic offer status update
    - Invalidate flash offer and venue queries on success
    - _Requirements: 4.3, 9.3_

  - [x] 6.3 Write unit test for flash offer configuration
    - Test staleTime is 10 seconds
    - Test refetchOnWindowFocus is enabled
    - _Requirements: 4.2, 4.5_

  - [x] 6.4 Write property test for flash offer invalidation
    - **Property 7: Flash offer mutation invalidation**
    - **Validates: Requirements 4.3**
    - Test that flash offer claim invalidates correct queries
    - _Requirements: 4.3_

- [x] 7. Checkpoint - Verify check-ins and flash offers work
  - Test check-in flow with optimistic updates
  - Verify rollback on simulated error
  - Test flash offer claiming and refetching
  - Ask user if questions arise

- [x] 8. Implement user and social query hooks
  - [x] 8.1 Create src/hooks/queries/useUserProfileQuery.ts
    - Implement useUserProfileQuery with userId parameter
    - Use queryKeys.users.profile(userId) for cache key
    - _Requirements: 5.1_

  - [x] 8.2 Create src/hooks/queries/useFriendsQuery.ts
    - Implement useFriendsQuery with userId parameter
    - Use queryKeys.users.friends(userId) for cache key
    - _Requirements: 5.2_

  - [x] 8.3 Create src/hooks/queries/useActivityFeedQuery.ts
    - Implement useActivityFeedQuery using useInfiniteQuery for pagination
    - Use queryKeys.activityFeed.byUser(userId) for cache key
    - Implement getNextPageParam for pagination
    - _Requirements: 5.3, 13.2_

  - [x] 8.4 Create src/hooks/mutations/useUpdateProfileMutation.ts
    - Implement profile update mutation
    - Invalidate user profile query on success
    - _Requirements: 5.4_

  - [x] 8.5 Create src/hooks/mutations/useAddFriendMutation.ts
    - Implement add/remove friend mutation
    - Invalidate friends and activity feed queries on success
    - _Requirements: 5.5_

  - [x] 8.6 Write property tests for user mutation invalidation
    - **Property 8: User profile mutation invalidation**
    - **Property 9: Friendship mutation invalidation**
    - **Validates: Requirements 5.4, 5.5**
    - _Requirements: 5.4, 5.5_

- [x] 9. Implement collection query and mutation hooks
  - [x] 9.1 Create src/hooks/queries/useCollectionsQuery.ts
    - Implement useCollectionsQuery with userId parameter
    - Use queryKeys.collections.byUser(userId) for cache key
    - _Requirements: 6.1_

  - [x] 9.2 Create src/hooks/queries/useCollectionQuery.ts
    - Implement useCollectionQuery with collectionId parameter
    - Use queryKeys.collections.detail(collectionId) for cache key
    - _Requirements: 6.2_

  - [x] 9.3 Create src/hooks/mutations/useAddVenueToCollectionMutation.ts
    - Implement add venue to collection mutation
    - Invalidate collection detail and user collections queries on success
    - _Requirements: 6.3_

  - [x] 9.4 Create src/hooks/mutations/useCollectionMutations.ts
    - Implement create, delete, follow, unfollow collection mutations
    - Invalidate appropriate queries for each mutation type
    - _Requirements: 6.4, 6.5_

  - [x] 9.5 Write property test for collection mutation invalidation
    - **Property 10: Collection mutation invalidation**
    - **Validates: Requirements 6.3, 6.4, 6.5**
    - Test that collection mutations invalidate correct queries
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 10. Checkpoint - Verify social and collection features work
  - Test user profile, friends list, and activity feed
  - Test collection creation and venue addition
  - Verify pagination works for activity feed
  - Ask user if questions arise

- [x] 11. Implement Supabase real-time integration
  - [x] 11.1 Create src/lib/realtimeSync.ts
    - Implement setupRealtimeSync function that accepts queryClient
    - Subscribe to venue changes and invalidate affected queries
    - Subscribe to check-in changes and invalidate affected queries
    - Subscribe to flash offer changes and invalidate affected queries
    - Return cleanup function that unsubscribes all channels
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.2 Integrate real-time sync in App.tsx
    - Call setupRealtimeSync on app mount
    - Call cleanup function on app unmount
    - _Requirements: 7.4, 7.5_

  - [x] 11.3 Write property test for real-time invalidation
    - **Property 15: Real-time event invalidation**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Test that real-time events trigger correct query invalidation
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 11.4 Write unit tests for subscription lifecycle
    - Test channels are subscribed when queries mount
    - Test channels are unsubscribed when queries unmount
    - _Requirements: 7.4, 7.5_

- [x] 12. Implement navigation-based cache management
  - [x] 12.1 Create src/lib/navigationSync.ts
    - Implement setupNavigationSync function
    - Add navigation state listener to detect route changes
    - Invalidate venue list queries when returning from VenueDetailScreen to HomeScreen
    - Prefetch venue details when navigating to VenueDetailScreen
    - Track navigation events for invalidation strategies
    - Return cleanup function
    - _Requirements: 2.3, 2.4, 8.1, 8.2, 8.5_

  - [x] 12.2 Integrate navigation sync in App.tsx
    - Call setupNavigationSync with queryClient and navigationRef
    - Call cleanup function on unmount
    - _Requirements: 2.3, 2.4, 8.5_

  - [x] 12.3 Write unit tests for navigation integration
    - Test prefetching on navigation to detail screen
    - Test invalidation on navigation back to home
    - Test navigation listener registration
    - _Requirements: 2.3, 2.4, 8.5_

- [x] 13. Implement cache persistence
  - [x] 13.1 Create src/lib/cachePersistence.ts
    - Implement createAsyncStoragePersister using @tanstack/query-async-storage-persister
    - Set maxAge to 24 hours (86400000ms)
    - Configure serialize/deserialize functions
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 13.2 Integrate persister with query client
    - Use persistQueryClient to connect persister with queryClient
    - Configure to exclude queries with metadata.sensitive = true
    - Mark all restored data as stale on app launch
    - _Requirements: 14.1, 14.2, 14.4, 14.5_

  - [x] 13.3 Write unit tests for cache persistence
    - Test cache saves to AsyncStorage on app background
    - Test cache restores from AsyncStorage on app launch
    - Test data older than 24 hours is not restored
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 13.4 Write property tests for cache persistence
    - **Property 16: Restored cache staleness**
    - **Property 17: Sensitive data exclusion**
    - **Validates: Requirements 14.4, 14.5**
    - _Requirements: 14.4, 14.5_

- [x] 14. Checkpoint - Verify real-time, navigation, and persistence work
  - Test real-time updates appear automatically
  - Test navigation triggers appropriate refetching
  - Test cache persists and restores correctly
  - Ask user if questions arise

- [x] 15. Implement error handling and retry logic
  - [x] 15.1 Configure retry logic in query client
    - Implement custom retry function that checks error status
    - Don't retry on 401, 403, 404 errors
    - Retry up to 3 times for 5xx and network errors
    - Configure exponential backoff with retryDelay
    - _Requirements: 10.1_

  - [x] 15.2 Implement network connectivity monitoring
    - Create src/lib/networkSync.ts
    - Use NetInfo to detect connectivity changes
    - Resume paused mutations when online
    - Invalidate all queries when connectivity restored
    - _Requirements: 10.4_

  - [x] 15.3 Add error UI components
    - Create error message display for mutations
    - Add stale data indicator for failed queries
    - Implement pull-to-refresh for manual refetch
    - _Requirements: 10.2, 10.3, 10.5_

  - [x] 15.4 Write unit tests for error handling
    - Test retry configuration
    - Test error message display
    - Test stale data fallback
    - Test network reconnect refetch
    - Test pull-to-refresh
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 16. Implement loading state management
  - [x] 16.1 Create loading UI components
    - Create loading skeleton for first-time loads (isLoading)
    - Create subtle loading indicator for background refetch (isFetching)
    - Create error UI with retry button (isError)
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 16.2 Update screens to use loading states
    - Update HomeScreen to show loading skeleton
    - Update VenueDetailScreen to show background refetch indicator
    - Update all screens to show error UI with retry
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 16.3 Write property test for query state availability
    - **Property 3: Query state availability**
    - **Validates: Requirements 11.5**
    - Test that all query hooks return isLoading, isFetching, isError states
    - _Requirements: 11.5_

  - [x] 16.4 Write unit tests for loading states
    - Test loading skeleton displays when isLoading is true
    - Test subtle indicator displays when isFetching is true
    - Test error UI displays when isError is true
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 17. Migrate existing components to React Query hooks
  - [x] 17.1 Create backward-compatible wrapper hooks
    - Wrap new React Query hooks to match old hook interfaces
    - Ensure return value structure matches legacy hooks
    - _Requirements: 12.1, 12.2, 12.4_

  - [x] 17.2 Migrate HomeScreen to use useVenuesQuery
    - Replace legacy venue fetching with useVenuesQuery
    - Test that screen functions identically
    - _Requirements: 12.1, 12.2_

  - [x] 17.3 Migrate VenueDetailScreen to use useVenueQuery
    - Replace legacy venue detail fetching with useVenueQuery
    - Replace check-in logic with useCheckInMutation
    - Test that screen functions identically
    - _Requirements: 12.1, 12.2_

  - [x] 17.4 Migrate remaining screens incrementally
    - Migrate ProfileScreen, FriendsScreen, CollectionsScreen
    - Test each screen after migration
    - _Requirements: 12.1, 12.2_

  - [x] 17.5 Write property test for backward compatibility
    - **Property 4: Backward compatibility**
    - **Validates: Requirements 12.1, 12.2**
    - Test that migrated hooks maintain same interface
    - _Requirements: 12.1, 12.2_

- [x] 18. Checkpoint - Verify all screens migrated successfully
  - Test all screens work with React Query
  - Verify no regressions in functionality
  - Check performance metrics
  - Ask user if questions arise

- [x] 19. Implement performance optimizations
  - [x] 19.1 Add prefetching for common navigation paths
    - Prefetch venue details when hovering/pressing venue cards
    - Prefetch user profiles when viewing friends list
    - _Requirements: 13.3_

  - [x] 19.2 Implement selective query invalidation
    - Review all invalidation calls to ensure precision
    - Use specific query keys instead of broad patterns where possible
    - _Requirements: 13.4_

  - [x] 19.3 Write property test for selective invalidation
    - **Property 11: Selective invalidation**
    - **Validates: Requirements 13.4**
    - Test that only matching queries are invalidated
    - _Requirements: 13.4_

  - [x] 19.4 Write unit test for prefetching
    - Test prefetchQuery is called for anticipated navigation
    - _Requirements: 13.3_

- [x] 20. Remove legacy data fetching code
  - [x] 20.1 Remove old custom hooks
    - Delete legacy useVenues, useVenue, useCheckIns hooks
    - Remove old data fetching utilities
    - _Requirements: 12.5_

  - [x] 20.2 Clean up unused dependencies
    - Remove any data fetching libraries no longer needed
    - Update package.json
    - _Requirements: 12.5_

  - [x] 20.3 Update documentation
    - Document React Query patterns used in the app
    - Add examples of common query and mutation patterns
    - Document query key structure
    - _Requirements: 12.5_

- [x] 21. Final checkpoint - Complete integration verification
  - Run full test suite (unit + property tests)
  - Verify all acceptance criteria are met
  - Test end-to-end user flows
  - Check performance metrics against targets
  - Ask user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Migration is incremental to minimize risk and allow for testing at each step
- Performance optimization comes after core functionality is stable
