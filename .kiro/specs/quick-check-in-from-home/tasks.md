# Implementation Plan: Quick Check-In from Home

## Overview

This implementation adds quick check-in functionality to venue cards on the HomeScreen by integrating the existing CheckInButton component. The approach leverages existing components and services to minimize new code while providing a seamless user experience.

## Tasks

- [x] 1. Add check-in state management to HomeScreen
  - Fetch user's current check-in status on mount using CheckInService
  - Create state to track which venue user is checked in to
  - Create Map to store check-in info (checkInId, venueId, checkInTime) for each venue
  - Add effect to update local state when check-in data loads
  - _Requirements: 6.1, 6.2_

- [x] 2. Modify TestVenueCard to accept check-in props
  - Add new optional props: `onCheckInChange`, `userCheckInId`, `userCheckInTime`, `isUserCheckedIn`
  - Update TypeScript interface for TestVenueCardProps
  - Add prop validation and default values
  - _Requirements: 1.1, 6.2_

- [x] 3. Integrate CheckInButton into TestVenueCard layout
  - Import CheckInButton component
  - Position button in bottom-right corner of card (below distance, non-overlapping)
  - Pass venue data and check-in state props to CheckInButton
  - Set size="medium" and showModalForCheckout={true}
  - Ensure button doesn't overlap with other interactive elements
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. Implement check-in state change handler in TestVenueCard
  - Create handleCheckInChange callback function
  - Update local check-in count state when check-in/out occurs
  - Call parent onCheckInChange prop if provided
  - Handle optimistic UI updates for immediate feedback
  - _Requirements: 1.5, 3.1, 3.2, 3.3_

- [x] 5. Connect check-in state from HomeScreen to venue cards
  - Map user's current check-in to corresponding venue card
  - Pass isUserCheckedIn, userCheckInId, userCheckInTime to each TestVenueCard
  - Ensure only one card shows "Checked In" state at a time
  - Update state when user checks in/out from any card
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 6. Implement check-in state update handler in HomeScreen
  - Create handleCheckInChange callback for venue cards
  - Update userCheckIns Map when check-in state changes
  - Refetch check-in stats after successful check-in/out
  - Handle checkout from previous venue when checking in to new venue
  - _Requirements: 2.3, 3.1, 3.2, 6.3_

- [x] 7. Add conditional rendering based on authentication
  - Check if user is authenticated before rendering CheckInButton
  - Hide button for non-authenticated users (CheckInButton handles login prompt internally)
  - Update button state when user logs in/out
  - _Requirements: 5.1, 5.4, 5.5_

- [x] 8. Test check-in flow from HomeScreen
  - Verify button appears on venue cards
  - Test check-in from card opens modal
  - Test successful check-in updates button and count
  - Test checkout updates button and count
  - Verify only one venue shows "Checked In" at a time
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 9. Test check-in with existing check-in at different venue
  - Check in to Venue A
  - Attempt check-in to Venue B from HomeScreen
  - Verify modal shows warning about current venue
  - Confirm check-in and verify Venue A updates to "Check In" state
  - Verify Venue B shows "Checked In" state
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Test error handling scenarios
  - Test network error during check-in (disable network)
  - Verify error alert displays with user-friendly message
  - Verify button state reverts after error
  - Test timeout scenario (mock slow response)
  - Verify authentication error handling (expired session)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11. Test visual feedback and loading states
  - Verify loading indicator appears during check-in
  - Verify button is disabled during loading
  - Test rapid taps don't create duplicate requests
  - Verify success feedback (toast or animation)
  - Test modal open/close states
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 12. Verify styling and layout
  - Check button placement on cards (bottom-right, non-overlapping)
  - Verify touch target size (minimum 44x44 points)
  - Test in light and dark themes
  - Verify button styling matches design system
  - Check for layout shifts when button state changes
  - Test on different screen sizes
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13. Final integration testing
  - Test complete flow: browse → check-in → checkout
  - Verify check-in stats update correctly
  - Test pull-to-refresh updates check-in states
  - Verify navigation to VenueDetail still works
  - Test with multiple venues in feed
  - Verify performance with 10+ venue cards
  - _Requirements: All_

## Notes

- The CheckInButton component already handles all modal logic, authentication checks, and error handling
- No modifications needed to CheckInButton or CheckInModal components
- Focus on state management and prop passing between HomeScreen and TestVenueCard
- Leverage existing CheckInService methods for all API calls
- Use existing useCheckInStats hook for fetching check-in counts
- All check-in logic is already tested in CheckInButton component tests
