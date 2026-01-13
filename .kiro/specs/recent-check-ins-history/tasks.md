# Implementation Plan: Recent Check-Ins History

## Overview

This implementation plan breaks down the Recent Check-Ins History feature into discrete, incremental tasks. Each task builds on previous work and includes testing to ensure correctness. The plan follows a bottom-up approach: backend services first, then utilities, hooks, components, and finally screen integration.

## Tasks

- [x] 1. Extend CheckInService with history methods
  - Add `getUserCheckInHistory()` method to fetch check-ins with venue details
  - Add `getUserVenueVisitCount()` method to get visit count for a single venue
  - Add `getUserVenueVisitCounts()` method to batch fetch visit counts
  - Implement Supabase query with proper joins, filters, and pagination
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.1, 10.4_

- [x] 1.1 Write property test for 30-day filter
  - **Property 1: 30-Day Filter**
  - **Validates: Requirements 1.1, 2.3**

- [x] 1.2 Write property test for user isolation
  - **Property 3: User Isolation**
  - **Validates: Requirements 2.1**

- [x] 1.3 Write property test for venue data inclusion
  - **Property 4: Venue Data Inclusion**
  - **Validates: Requirements 2.2, 2.4**

- [x] 1.4 Write property test for pagination limits
  - **Property 8: Pagination Limits**
  - **Validates: Requirements 7.1, 7.2**

- [x] 1.5 Write property test for visit count accuracy
  - **Property 6: Visit Count Accuracy**
  - **Validates: Requirements 10.1, 10.4**

- [x] 1.6 Write property test for error handling
  - **Property 11: Error Handling**
  - **Validates: Requirements 2.5**

- [x] 2. Create time formatting utilities
  - Create `src/utils/formatting/time.ts` file
  - Implement `formatCheckInTime()` for relative/absolute time formatting
  - Implement `formatDuration()` for check-in duration calculation and formatting
  - Implement `formatVisitCount()` for ordinal visit count formatting
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 10.2, 10.3_

- [x] 2.1 Write property test for timestamp formatting
  - **Property 7: Timestamp Formatting**
  - **Validates: Requirements 5.1, 5.2**

- [x] 2.2 Write property test for duration calculation
  - **Property 5: Duration Calculation and Formatting**
  - **Validates: Requirements 6.1, 6.2**

- [x] 2.3 Write property test for visit count formatting
  - **Property 12: Visit Count Formatting**
  - **Validates: Requirements 10.3**

- [x] 2.4 Write unit tests for edge cases
  - Test "Today" formatting (edge case for 5.3)
  - Test "Currently checked in" for active check-ins (edge case for 6.3)
  - Test "First visit" for count of 1 (edge case for 10.2)
  - Test short durations (<1 hour) formatting (edge case for 6.4)
  - _Requirements: 5.3, 6.3, 6.4, 10.2_

- [x] 3. Create CheckInWithVenue type definition
  - Add `CheckInWithVenue` interface to `src/types/checkin.types.ts`
  - Add `CheckInHistoryOptions` interface
  - Add `CheckInHistoryResponse` interface
  - Export new types from `src/types/index.ts`
  - _Requirements: 2.4_

- [x] 4. Create useCheckInHistory custom hook
  - Create `src/hooks/useCheckInHistory.ts` file
  - Implement hook with initial fetch, pagination, and refresh logic
  - Manage loading states (loading, refreshing, loadingMore)
  - Implement error handling
  - Export hook from `src/hooks/index.ts`
  - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.2, 4.3, 4.4, 7.1, 7.2, 7.4_

- [x] 4.1 Write property test for descending chronological order
  - **Property 2: Descending Chronological Order**
  - **Validates: Requirements 1.2**

- [x] 4.2 Write property test for refresh re-query
  - **Property 10: Refresh Re-Query**
  - **Validates: Requirements 4.2, 4.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create CheckInHistoryItem component
  - Create `src/components/checkin/CheckInHistoryItem.tsx` file
  - Design card layout with venue image, name, location, category badge
  - Display formatted check-in timestamp using time utilities
  - Display check-in duration or "Currently checked in" status
  - Display visit count badge with formatted count
  - Make component tappable with onPress callback
  - Export component from `src/components/checkin/index.ts`
  - _Requirements: 1.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 9.1, 10.2, 10.3_

- [x] 6.1 Write property test for required data fields
  - **Property 14: Required Data Fields**
  - **Validates: Requirements 1.3**

- [x] 6.2 Write property test for venue category display
  - **Property 13: Venue Category Display**
  - **Validates: Requirements 9.1**

- [x] 6.3 Write unit tests for component rendering
  - Test component renders with all props
  - Test onPress callback is triggered
  - Test empty state when no image_url
  - _Requirements: 1.3, 3.1_

- [x] 7. Create HistoryScreen component
  - Create `src/screens/customer/HistoryScreen.tsx` file
  - Implement screen layout with SafeAreaView and ScrollView
  - Use useCheckInHistory hook to fetch data
  - Implement pull-to-refresh with RefreshControl
  - Implement infinite scroll pagination
  - Display loading indicator during initial load
  - Display empty state when no check-ins (with suggestion to explore venues)
  - Display error state with retry button
  - Render list of CheckInHistoryItem components
  - Implement navigation to VenueDetailScreen on item tap
  - Export screen from `src/screens/customer/index.ts`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3_

- [x] 7.1 Write property test for navigation parameter passing
  - **Property 9: Navigation Parameter Passing**
  - **Validates: Requirements 3.2**

- [x] 7.2 Write unit tests for screen interactions
  - Test pull-to-refresh triggers refetch
  - Test scroll to bottom triggers loadMore
  - Test tap on item navigates with correct venue_id
  - Test empty state displays when no check-ins
  - Test error state displays on error
  - _Requirements: 1.4, 3.1, 4.1, 8.1_

- [ ] 8. Add History tab to navigation
  - Update `src/navigation/AppNavigator.tsx` to add History screen to customer tab navigator
  - Add History icon to tab bar (use "time-outline" or "list-outline" icon)
  - Ensure proper navigation flow between History and VenueDetail screens
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8.1 Write integration test for navigation flow
  - Test navigation from Home → History → VenueDetail
  - Test back navigation from VenueDetail → History
  - _Requirements: 3.1, 3.2_

- [ ] 9. Optimize visit count fetching
  - Update HistoryScreen to batch fetch visit counts for all displayed venues
  - Use `getUserVenueVisitCounts()` instead of individual calls
  - Cache visit counts to prevent redundant queries
  - _Requirements: 10.1, 10.4_

- [ ] 10. Add styling and theming
  - Apply theme colors to CheckInHistoryItem component
  - Ensure dark mode support for all new components
  - Add consistent spacing and typography
  - Ensure accessibility (touch targets, contrast, labels)
  - _Requirements: 9.2, 9.3_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: services → utilities → hooks → components → screens
- Batch operations (visit counts) are optimized for performance
- All new components support theming and dark mode
