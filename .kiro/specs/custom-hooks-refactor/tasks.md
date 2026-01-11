# Implementation Plan: Custom Hooks Refactor

## Overview

This plan outlines the step-by-step implementation of custom React hooks to extract business logic from screen components. The approach is incremental, starting with utility hooks and building up to screen refactoring.

## Tasks

- [ ] 1. Create hooks directory structure
  - Create `src/hooks/` directory
  - Create `src/hooks/index.ts` for exports
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 2. Implement useDebounce hook
  - [ ] 2.1 Create `src/hooks/useDebounce.ts`
    - Implement generic debounce logic with useState and useEffect
    - Add TypeScript generic type parameter
    - Set default delay to 300ms
    - Clean up timeout on unmount
    - _Requirements: 5.1, 5.2, 5.6, 5.7_
  
  - [ ]* 2.2 Write property test for useDebounce
    - **Property 3: Debounce Delay Accuracy**
    - **Validates: Requirements 5.3, 5.4, 5.5**
  
  - [ ]* 2.3 Write unit tests for useDebounce
    - Test default delay behavior
    - Test custom delay behavior
    - Test rapid value changes
    - Test cleanup on unmount
    - _Requirements: 5.8_

- [ ] 3. Implement useVenues hook
  - [ ] 3.1 Create `src/hooks/useVenues.ts`
    - Define UseVenuesOptions and UseVenuesReturn interfaces
    - Implement state management (venues, loading, error)
    - Implement useEffect for data fetching
    - Handle featured venues vs regular venues
    - Implement refetch function with useCallback
    - Add abort controller for cleanup
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.9, 1.10_
  
  - [ ] 3.2 Add search and filter support
    - Support search query option
    - Support category filter option
    - Support location filter option
    - Support limit and offset options
    - _Requirements: 1.5, 1.6_
  
  - [ ]* 3.3 Write property test for useVenues
    - **Property 1: Hook State Consistency**
    - **Validates: Requirements 1.1, 1.8**
  
  - [ ]* 3.4 Write unit tests for useVenues
    - Test featured venues fetching
    - Test search filtering
    - Test category filtering
    - Test refetch functionality
    - Test error handling
    - _Requirements: 1.8_

- [ ] 4. Implement useFavorites hook
  - [ ] 4.1 Create `src/hooks/useFavorites.ts`
    - Define UseFavoritesReturn interface
    - Implement state management (favorites Set, loading, error)
    - Use useAuth to get current user
    - Implement useEffect to load favorites
    - Handle unauthenticated state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.10_
  
  - [ ] 4.2 Implement toggleFavorite with optimistic updates
    - Implement optimistic UI update
    - Call FavoriteService.toggleFavorite
    - Revert on error
    - Return success/failure indicator
    - Handle authentication check
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9_
  
  - [ ] 4.3 Add isFavorite helper function
    - Implement helper to check if venue is favorited
    - Return boolean result
  
  - [ ]* 4.4 Write property test for useFavorites
    - **Property 2: Optimistic Update Rollback**
    - **Validates: Requirements 2.8**
  
  - [ ]* 4.5 Write unit tests for useFavorites
    - Test favorites loading
    - Test toggleFavorite success
    - Test toggleFavorite failure and rollback
    - Test unauthenticated behavior
    - Test isFavorite helper
    - _Requirements: 2.3, 2.9_

- [ ] 5. Implement useCheckInStats hook
  - [ ] 5.1 Create `src/hooks/useCheckInStats.ts`
    - Define UseCheckInStatsOptions and UseCheckInStatsReturn interfaces
    - Implement state management (stats Map, loading, error)
    - Use useAuth to get current user ID
    - Implement useEffect to fetch stats
    - Handle empty venue IDs array
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.10_
  
  - [ ] 5.2 Add debouncing for venue ID changes
    - Use useDebounce for venueIds array
    - Prevent excessive API calls
    - _Requirements: 3.9_
  
  - [ ] 5.3 Add support for single and multiple venues
    - Support single venue ID
    - Support array of venue IDs
    - Call CheckInService.getMultipleVenueStats
    - _Requirements: 3.6, 3.7_
  
  - [ ] 5.4 Add enabled flag for conditional fetching
    - Add enabled option to control fetching
    - Skip fetch when enabled is false
  
  - [ ]* 5.5 Write property test for useCheckInStats
    - **Property 10: Venue ID Change Reactivity**
    - **Validates: Requirements 3.4**
  
  - [ ]* 5.6 Write unit tests for useCheckInStats
    - Test single venue stats
    - Test multiple venue stats
    - Test debouncing behavior
    - Test error handling
    - Test enabled flag
    - _Requirements: 3.8_

- [ ] 6. Implement useCheckInActions hook
  - [ ] 6.1 Create `src/hooks/useCheckInActions.ts`
    - Define UseCheckInActionsOptions and UseCheckInActionsReturn interfaces
    - Implement state management (loading, error)
    - Use useAuth to get current user
    - _Requirements: 4.1, 4.2, 4.10_
  
  - [ ] 6.2 Implement checkIn function
    - Use useCallback for stable reference
    - Check authentication
    - Call CheckInService.checkIn
    - Invoke success callback
    - Handle errors with error callback
    - Prevent duplicate requests
    - _Requirements: 4.3, 4.5, 4.6, 4.7, 4.8, 4.9_
  
  - [ ] 6.3 Implement checkOut function
    - Use useCallback for stable reference
    - Check authentication
    - Call CheckInService.checkOut
    - Invoke success callback
    - Handle errors with error callback
    - _Requirements: 4.4, 4.6, 4.7_
  
  - [ ]* 6.4 Write unit tests for useCheckInActions
    - Test checkIn success
    - Test checkOut success
    - Test error handling
    - Test authentication check
    - Test duplicate request prevention
    - Test callbacks
    - _Requirements: 4.8, 4.9_

- [ ] 7. Export all hooks from index
  - Add named exports for all hooks in `src/hooks/index.ts`
  - Add JSDoc comments with usage examples
  - _Requirements: 9.5, 9.6, 9.7, 9.8, 9.10_

- [ ] 8. Checkpoint - Ensure all hooks are tested
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Refactor HomeScreen to use hooks
  - [ ] 9.1 Replace venue fetching with useVenues hook
    - Remove loadFeaturedVenues function
    - Remove venues state
    - Remove loading state for venues
    - Use useVenues({ featured: true, limit: 10 })
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [ ] 9.2 Replace favorites logic with useFavorites hook
    - Remove loadUserFavorites function
    - Remove toggleFavorite function
    - Remove favorites state
    - Use useFavorites hook
    - _Requirements: 6.2, 6.5_
  
  - [ ] 9.3 Replace check-in stats with useCheckInStats hook
    - Remove loadCheckInStats function
    - Remove checkInStats state
    - Use useCheckInStats with venue IDs
    - _Requirements: 6.3, 6.5_
  
  - [ ] 9.4 Update onRefresh to use hook refetch
    - Use refetch from useVenues
    - Maintain pull-to-refresh functionality
    - _Requirements: 6.10_
  
  - [ ] 9.5 Verify HomeScreen functionality
    - Test venue loading
    - Test favorites toggle
    - Test check-in stats display
    - Test pull-to-refresh
    - Verify line count reduction
    - _Requirements: 6.6, 6.7, 6.8, 6.9_

- [ ] 10. Refactor VenueDetailScreen to use hooks
  - [ ] 10.1 Replace venue fetching with useVenues hook
    - Remove fetchVenueDetails function
    - Remove venue state
    - Remove loading state
    - Use useVenues with single venue ID
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [ ] 10.2 Replace check-in stats with useCheckInStats hook
    - Remove check-in stats fetching
    - Remove checkInStats state
    - Use useCheckInStats with venue ID
    - _Requirements: 8.2, 8.3_
  
  - [ ] 10.3 Verify VenueDetailScreen functionality
    - Test venue detail loading
    - Test check-in stats display
    - Test scroll-to-top behavior
    - Test contact actions
    - Test mock data fallback
    - Verify line count reduction
    - _Requirements: 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [ ] 11. Refactor SearchScreen to use hooks
  - [ ] 11.1 Replace venue fetching with useVenues hook
    - Remove loadVenues function
    - Remove venues state
    - Remove loading state for venues
    - Use useVenues({ limit: 50 })
    - _Requirements: 7.1, 7.4, 7.5_
  
  - [ ] 11.2 Replace favorites logic with useFavorites hook
    - Remove loadUserFavorites function
    - Remove toggleFavorite function
    - Remove favorites state
    - Use useFavorites hook
    - _Requirements: 7.2, 7.5_
  
  - [ ] 11.3 Add debounced search with useDebounce hook
    - Use useDebounce for search query
    - Update filterVenues to use debounced value
    - _Requirements: 7.3, 7.8_
  
  - [ ] 11.4 Verify SearchScreen functionality
    - Test venue loading
    - Test search with debounce
    - Test category filters
    - Test price filters
    - Test favorites toggle
    - Test filter drawer
    - Verify line count reduction
    - _Requirements: 7.6, 7.7, 7.9, 7.10_

- [ ] 12. Checkpoint - Ensure all screens work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Clean up and verify
  - [ ] 13.1 Remove unused imports from screens
    - Remove unused service imports
    - Remove unused type imports
    - _Requirements: 10.7_
  
  - [ ] 13.2 Verify no console errors
    - Run app and check console
    - Test all screens
    - Test all user interactions
    - _Requirements: 10.10_
  
  - [ ] 13.3 Verify all functionality maintained
    - Test navigation between screens
    - Test data flows
    - Test error handling
    - Test loading states
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8_
  
  - [ ] 13.4 Update documentation
    - Add hook usage examples to README
    - Document hook patterns for future development

- [ ] 14. Final checkpoint - Complete refactoring
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
