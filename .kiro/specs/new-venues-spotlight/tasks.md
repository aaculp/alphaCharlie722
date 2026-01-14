# Implementation Plan: New Venues Spotlight

## Overview

This implementation plan breaks down the New Venues Spotlight feature into discrete, incremental tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The implementation follows the established patterns from existing social carousel components (FriendVenueCarousel, SharedCollectionCarousel) to maintain consistency.

## Tasks

- [x] 1. Create utility functions for venue spotlight calculations
  - Create `src/utils/formatting/venue.ts` with helper functions
  - Implement `calculateDaysSinceSignup(signupDate: string): number`
  - Implement `formatSignupText(days: number): string`
  - Implement `isEligibleForSpotlight(signupDate: string, maxDays: number): boolean`
  - Export all functions from `src/utils/formatting/index.ts`
  - _Requirements: 2.4, 5.1, 5.2, 5.3, 5.4_

- [x]* 1.1 Write unit tests for venue utility functions
  - Test `calculateDaysSinceSignup` with various dates (today, yesterday, 30 days ago)
  - Test `formatSignupText` for 0, 1, and N days
  - Test `isEligibleForSpotlight` for dates within and outside 30-day window
  - _Requirements: 2.4, 5.1, 5.2_

- [x]* 1.2 Write property test for days calculation
  - **Property 7: Days Since Signup Display**
  - **Validates: Requirements 2.4**

- [x] 2. Extend VenueService with getNewVenues method
  - Add `getNewVenues(limit?: number)` method to `src/services/api/venues.ts`
  - Implement query with INNER JOIN to venue_business_accounts
  - Filter by `created_at >= NOW() - INTERVAL '30 days'`
  - Filter by `account_status = 'active'` and `verification_status = 'verified'`
  - Order by `created_at DESC`
  - Apply limit (default 10)
  - Return venues with signup_date included
  - _Requirements: 1.2, 1.3, 1.4, 4.1, 5.2, 5.5_

- [x]* 2.1 Write unit tests for getNewVenues
  - Test query returns venues within 30-day window
  - Test query excludes venues older than 30 days
  - Test query orders by newest first
  - Test query respects limit parameter
  - Test error handling when query fails
  - _Requirements: 1.2, 1.3, 1.4, 4.5_

- [ ]* 2.2 Write property test for spotlight period filtering
  - **Property 1: Spotlight Period Filtering**
  - **Validates: Requirements 1.2, 5.2, 5.5**

- [ ]* 2.3 Write property test for descending date order
  - **Property 2: Descending Date Order**
  - **Validates: Requirements 1.3**

- [ ]* 2.4 Write property test for result set size limit
  - **Property 3: Result Set Size Limit**
  - **Validates: Requirements 1.4**

- [x] 3. Create useNewVenues custom hook
  - Create `src/hooks/useNewVenues.ts`
  - Implement hook with useState for venues, loading, error
  - Implement useEffect for initial data fetch
  - Implement useCallback for refetch function
  - Call VenueService.getNewVenues in fetch logic
  - Handle loading and error states
  - Export hook from `src/hooks/index.ts`
  - _Requirements: 1.2, 4.1, 4.3, 4.4, 4.5_

- [x]* 3.1 Write unit tests for useNewVenues hook
  - Test initial loading state
  - Test successful data fetch
  - Test error handling
  - Test refetch function
  - _Requirements: 4.3, 4.5_

- [x] 4. Checkpoint - Ensure data layer tests pass
  - Ensure all tests pass for utility functions, VenueService, and useNewVenues hook
  - Ask the user if questions arise

- [x] 5. Create NewVenuesSpotlightCarousel component
  - Create `src/components/venue/NewVenuesSpotlightCarousel.tsx`
  - Define component props interface (venues, onVenuePress, loading, userLocation)
  - Implement component structure with header and FlatList
  - Add conditional rendering (return null if venues.length === 0)
  - Implement loading skeleton using pattern from FriendVenueCarousel
  - Export component from `src/components/venue/index.ts`
  - _Requirements: 1.1, 1.5, 7.1, 7.2_

- [x]* 5.1 Write unit tests for component rendering
  - Test component renders with valid venue data
  - Test component returns null when venues array is empty
  - Test component displays loading skeleton when loading is true
  - _Requirements: 1.1, 1.5, 7.1, 7.2_

- [x] 6. Implement spotlight section header
  - Add header View with icon and title
  - Use Icon component with name="sparkles"
  - Display "New Venues" title text
  - Apply theme colors to header elements
  - Add accessibilityLabel="New Venues Spotlight"
  - _Requirements: 1.1, 6.2, 9.1, 9.2_

- [x]* 6.1 Write unit tests for header
  - Test header contains sparkles icon
  - Test header displays "New Venues" text
  - Test header has correct accessibility label
  - _Requirements: 6.2, 9.1, 9.2_

- [x] 7. Implement venue card rendering in FlatList
  - Create renderVenueCard function
  - Configure FlatList with horizontal scrolling
  - Set showsHorizontalScrollIndicator={false}
  - Set snapToInterval={CARD_WIDTH + CARD_MARGIN}
  - Set decelerationRate="fast"
  - Calculate CARD_WIDTH as SCREEN_WIDTH * 0.7
  - Set CARD_MARGIN to 12
  - _Requirements: 3.2, 3.3, 3.4, 6.3, 6.4_

- [x]* 7.1 Write unit tests for FlatList configuration
  - Test FlatList has horizontal={true}
  - Test FlatList has showsHorizontalScrollIndicator={false}
  - Test snapToInterval equals CARD_WIDTH + CARD_MARGIN
  - Test CARD_WIDTH equals 70% of screen width
  - Test CARD_MARGIN equals 12
  - _Requirements: 3.2, 3.3, 3.4, 6.3, 6.4_

- [x] 8. Implement venue card UI elements
  - Add venue image with Image component
  - Add "NEW" badge with sparkles icon in top-left corner
  - Add days since signup text using formatSignupText
  - Add venue name (bold, 16px)
  - Add category badge
  - Add rating or "New - No ratings yet" for zero ratings
  - Add location with icon
  - Add distance if userLocation is provided
  - Apply theme colors to all elements
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 8.3_

- [x]* 8.1 Write unit tests for venue card elements
  - Test card displays venue name, category, location
  - Test card displays "NEW" badge
  - Test card displays days since signup
  - Test card shows "New - No ratings yet" when rating is 0 or null
  - Test card uses placeholder when image_url is null
  - Test card displays distance when userLocation is provided
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.3_

- [ ]* 8.2 Write property test for required card information display
  - **Property 4: Required Card Information Display**
  - **Validates: Requirements 2.1**

- [ ]* 8.3 Write property test for image display guarantee
  - **Property 5: Image Display Guarantee**
  - **Validates: Requirements 2.2**

- [ ]* 8.4 Write property test for NEW badge presence
  - **Property 6: NEW Badge Presence**
  - **Validates: Requirements 2.3**

- [ ]* 8.5 Write property test for distance display
  - **Property 11: Distance Display When Location Available**
  - **Validates: Requirements 8.3**

- [x] 9. Implement venue card interaction
  - Add TouchableOpacity wrapper for each card
  - Implement onPress handler that calls onVenuePress(venue.id)
  - Validate venue.id exists before calling onVenuePress
  - Set activeOpacity={0.7}
  - Add accessibilityLabel with venue name and "new venue" text
  - Ensure minimum touch target height of 44 points
  - _Requirements: 3.1, 9.3, 9.4_

- [x]* 9.1 Write unit tests for card interaction
  - Test onPress calls onVenuePress with correct venue ID
  - Test onPress validates venue ID before calling
  - Test card has correct accessibility label
  - Test card meets minimum touch target size
  - _Requirements: 3.1, 9.3, 9.4_

- [ ]* 9.2 Write property test for navigation with correct venue ID
  - **Property 8: Navigation with Correct Venue ID**
  - **Validates: Requirements 3.1**

- [x] 10. Implement error handling and defensive rendering
  - Add error handling in useNewVenues hook
  - Log errors with console.error including context
  - Return null from component when error state is true
  - Use optional chaining for all venue fields
  - Provide defaults for missing data (name, category, location)
  - Add image fallback to placeholder URL
  - _Requirements: 4.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x]* 10.1 Write unit tests for error handling
  - Test component returns null when error is true
  - Test error is logged when fetch fails
  - Test image fallback when image_url is null
  - Test defaults are used for missing fields
  - _Requirements: 4.5, 10.1, 10.2, 10.3, 10.4_

- [ ]* 10.2 Write property test for defensive rendering
  - **Property 12: Defensive Rendering with Missing Data**
  - **Validates: Requirements 10.4**

- [x] 11. Implement theme support
  - Apply theme.colors.background to card backgrounds
  - Apply theme.colors.text to text elements
  - Apply theme.colors.textSecondary to secondary text
  - Apply theme.colors.border to card borders
  - Apply theme.colors.primary to badges and accents
  - Test in both light and dark modes
  - _Requirements: 6.1, 6.5_

- [x]* 11.1 Write unit tests for theming
  - Test light mode applies correct colors
  - Test dark mode applies correct colors
  - _Requirements: 6.1, 6.5_

- [ ]* 11.2 Write property test for theme color application
  - **Property 10: Theme Color Application**
  - **Validates: Requirements 6.1**

- [x] 12. Checkpoint - Ensure component tests pass
  - Ensure all tests pass for NewVenuesSpotlightCarousel component
  - Manually test component in isolation with mock data
  - Ask the user if questions arise

- [x] 13. Integrate NewVenuesSpotlightCarousel into HomeScreen
  - Import NewVenuesSpotlightCarousel in `src/screens/customer/HomeScreen.tsx`
  - Import useNewVenues hook
  - Call useNewVenues hook to fetch spotlight data
  - Add NewVenuesSpotlightCarousel component after RecentCheckInsSection
  - Pass venues, onVenuePress, loading, and userLocation props
  - Implement onVenuePress to navigate to VenueDetail screen
  - _Requirements: 1.1, 3.1, 8.4, 8.5_

- [x]* 13.1 Write integration tests for HomeScreen
  - Test spotlight section appears in correct position
  - Test spotlight section is independent of Quick Pick filters
  - Test navigation to venue detail works
  - _Requirements: 1.1, 3.1, 8.4, 8.5_

- [x] 14. Implement pull-to-refresh integration
  - Add spotlight refetch to HomeScreen's onRefresh function
  - Ensure spotlight data refreshes when user pulls to refresh
  - Test refresh updates spotlight venues
  - _Requirements: 4.3_

- [x]* 14.1 Write unit test for refresh integration
  - Test onRefresh calls spotlight refetch function
  - _Requirements: 4.3_

- [x] 15. Add empty state logging
  - Add console.log when venues.length === 0
  - Include timestamp and context in log message
  - _Requirements: 7.5_

- [x]* 15.1 Write unit test for empty state logging
  - Test console.log is called when venues array is empty
  - _Requirements: 7.5_

- [x] 16. Final checkpoint - End-to-end testing
  - Run all unit tests and property tests
  - Manually test feature in development environment
  - Test with various data scenarios (0 venues, 1 venue, 10+ venues)
  - Test in light and dark modes
  - Test with and without location services
  - Test pull-to-refresh behavior
  - Test navigation to venue detail
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The implementation follows the established pattern from FriendVenueCarousel and SharedCollectionCarousel
- All styling uses theme colors for light/dark mode support
- Error handling is graceful with no user-facing error messages
