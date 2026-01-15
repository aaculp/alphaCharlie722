# Implementation Plan: Swipeable Venue Card

## Overview

This implementation plan breaks down the Swipeable Venue Card feature into discrete, manageable tasks. The approach follows a phased strategy: first refactoring the existing component, then building the swipe infrastructure, integrating gesture handling, and finally polishing with tests and animations. Each task builds incrementally to ensure the feature can be tested and validated at every step.

## Tasks

- [x] 1. Component Refactoring and Setup
  - Rename TestVenueCard to WideVenueCard and move to UI folder
  - Update all imports and ensure existing functionality is preserved
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Rename and move TestVenueCard component
  - Rename `src/components/venue/TestVenueCard.tsx` to `src/components/ui/WideVenueCard.tsx`
  - Update component name in the file
  - Add export to `src/components/ui/index.ts`
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Update all imports across the codebase
  - Update import in `src/screens/customer/HomeScreen.tsx`
  - Search for any other files importing TestVenueCard
  - Update import paths to use new location
  - _Requirements: 1.3_

- [x] 1.3 Verify existing functionality is preserved

  - Run existing tests to ensure no regressions
  - Manually test venue card rendering
  - Verify check-in button still works
  - _Requirements: 1.4_

- [x] 2. Create Type Definitions and Constants
  - Define TypeScript interfaces for swipe functionality
  - Create animation constants and configuration
  - _Requirements: 2.5, 8.4_

- [x] 2.1 Create swipe type definitions
  - Create `src/types/swipe.types.ts`
  - Define `SwipeState`, `SwipeAnimationConfig`, `SwipeDirection` types
  - Export all types
  - _Requirements: 2.5_

- [x] 2.2 Create animation constants file
  - Create `src/utils/animations/swipeAnimations.ts`
  - Define `SWIPE_THRESHOLD = 120`
  - Define `RESISTANCE_FACTOR = 0.3`
  - Define spring config: `{ damping: 0.7, stiffness: 300, mass: 0.5 }`
  - Define opacity interpolation ranges
  - _Requirements: 2.5, 8.4_

- [x] 3. Build SwipeActionBackground Component
  - Create reusable background component for swipe feedback
  - Implement icon and label rendering
  - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 5.1, 5.2_

- [x] 3.1 Create SwipeActionBackground component
  - Create `src/components/ui/SwipeActionBackground.tsx`
  - Accept props: direction, opacity, icon, label, backgroundColor
  - Use Animated.View with absolute positioning
  - Render Ionicons icon and Text label
  - Apply opacity from shared value
  - _Requirements: 3.2, 4.2, 5.1, 5.2_

- [ ]* 3.2 Write unit tests for SwipeActionBackground
  - Test component renders with correct props
  - Test icon and label display correctly
  - Test background color is applied
  - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3, 4.4_

- [x] 4. Implement useHapticFeedback Hook
  - Create custom hook for haptic feedback
  - Implement success, error, warning, and selection patterns
  - _Requirements: 3.5, 4.5, 9.5_

- [x] 4.1 Create useHapticFeedback hook
  - Create `src/hooks/useHapticFeedback.ts`
  - Import React Native Haptic Feedback library
  - Implement `triggerSuccess()` - medium impact
  - Implement `triggerError()` - notification error
  - Implement `triggerWarning()` - light impact
  - Implement `triggerSelection()` - selection feedback
  - _Requirements: 3.5, 4.5, 9.5_

- [ ]* 4.2 Write unit tests for useHapticFeedback
  - Test each haptic pattern triggers correctly
  - Mock haptic feedback library
  - _Requirements: 3.5, 4.5, 9.5_

- [x] 5. Implement useSwipeGesture Hook
  - Create custom hook encapsulating swipe gesture logic
  - Handle pan gesture events (onStart, onUpdate, onEnd)
  - Implement threshold detection and action triggering
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 4.1, 5.1, 5.2, 7.1, 7.2, 7.3_

- [x] 5.1 Create useSwipeGesture hook structure
  - Create `src/hooks/useSwipeGesture.ts`
  - Define hook interface with options and return type
  - Initialize shared values: translateX, leftActionOpacity, rightActionOpacity
  - _Requirements: 2.1, 2.2_

- [x] 5.2 Implement pan gesture handler
  - Create PanGesture using Gesture.Pan()
  - Implement onStart: store initial position
  - Implement onUpdate: update translateX based on drag
  - Apply resistance for invalid swipe directions
  - _Requirements: 2.2, 7.1, 7.2, 7.3_

- [x] 5.3 Implement opacity interpolation
  - Interpolate leftActionOpacity from translateX (range: [-120, 0] → [1, 0])
  - Interpolate rightActionOpacity from translateX (range: [0, 120] → [0, 1])
  - Clamp values to [0, 1]
  - _Requirements: 5.1, 5.2_

- [x] 5.4 Implement onEnd gesture handler
  - Check if abs(translateX) >= threshold
  - If threshold reached and valid direction: trigger action callback
  - If threshold not reached: animate back to center with spring
  - Reset translateX to 0 after action completes
  - _Requirements: 2.4, 3.1, 4.1_

- [ ]* 5.5 Write unit tests for useSwipeGesture
  - Test gesture handler creation
  - Test translateX updates correctly
  - Test opacity interpolation
  - Test threshold detection
  - Test snap-back animation
  - _Requirements: 2.2, 2.4, 5.1, 5.2_

- [ ]* 5.6 Write property test for card translation
  - **Property 1: Card Translation Matches Drag Distance**
  - Generate random drag distances (-200 to 200)
  - Verify translateX matches expected value with resistance
  - Run 100+ iterations
  - **Validates: Requirements 2.2**

- [ ]* 5.7 Write property test for snap-back
  - **Property 2: Snap-Back Below Threshold**
  - Generate random release positions (0 to 119)
  - Verify card returns to center (translateX = 0)
  - Run 100+ iterations
  - **Validates: Requirements 2.4**

- [ ]* 5.8 Write property test for opacity interpolation
  - **Property 4: Green Background on Left Swipe**
  - **Property 6: Red Background on Right Swipe**
  - Generate random drag distances
  - Verify opacity values are correctly interpolated
  - Run 100+ iterations
  - **Validates: Requirements 5.1, 5.2**

- [x] 6. Integrate Swipe Gesture into WideVenueCard
  - Add gesture detection to WideVenueCard
  - Render SwipeActionBackground components
  - Wire up check-in/check-out callbacks
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 6.4_

- [x] 6.1 Add swipe gesture to WideVenueCard
  - Import useSwipeGesture hook
  - Pass threshold, isCheckedIn, onCheckIn, onCheckOut callbacks
  - Wrap card content with GestureDetector
  - Apply animated style to card container
  - _Requirements: 2.1, 2.2_

- [x] 6.2 Add SwipeActionBackground components
  - Render left SwipeActionBackground (green, check icon, "Arriving")
  - Render right SwipeActionBackground (red, logout icon, "Leaving")
  - Position absolutely behind card content
  - Pass opacity shared values from useSwipeGesture
  - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3, 4.4_

- [x] 6.3 Implement check-in/check-out handlers
  - Create onSwipeCheckIn handler that calls existing check-in logic
  - Create onSwipeCheckOut handler that calls existing check-out logic
  - Ensure both handlers call onCheckInChange callback
  - Add error handling with try/catch
  - Trigger haptic feedback on success/error
  - _Requirements: 3.1, 4.1, 6.2, 6.3, 6.4_

- [ ]* 6.4 Write integration tests for WideVenueCard swipe
  - Test swipe left triggers check-in
  - Test swipe right triggers check-out
  - Test button and swipe call same callbacks
  - Test error handling displays messages
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 6.5 Write property test for check-in trigger
  - **Property 3: Check-In Triggered on Left Swipe**
  - Generate random left swipe distances (120 to 300)
  - Verify check-in called exactly once
  - Run 100+ iterations
  - **Validates: Requirements 3.1**

- [ ]* 6.6 Write property test for check-out trigger
  - **Property 5: Check-Out Triggered on Right Swipe**
  - Generate random right swipe distances (120 to 300)
  - Verify check-out called exactly once
  - Run 100+ iterations
  - **Validates: Requirements 4.1**

- [ ]* 6.7 Write property test for button-swipe equivalence
  - **Property 7: Button and Swipe Equivalence**
  - For random venues, verify button and swipe call same function
  - Verify state changes are identical
  - Run 100+ iterations
  - **Validates: Requirements 6.4**

- [x] 7. Implement State-Based Swipe Validation
  - Add logic to prevent invalid swipes based on check-in state
  - Apply resistance for invalid directions
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7.1 Add state validation to useSwipeGesture
  - In onUpdate: check if swipe direction is valid for current state
  - If user not checked in: only allow left swipes
  - If user checked in: only allow right swipes
  - Apply resistance factor (0.3) for invalid directions
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7.2 Handle multi-venue check-in scenario
  - If user checked in elsewhere, show confirmation modal
  - "Check out from [Venue Name] first?"
  - On confirm: check out from current venue, then check in to new venue
  - On cancel: snap card back to center
  - _Requirements: 7.4_

- [ ]* 7.3 Write property test for state-based validation (not checked in)
  - **Property 8: State-Based Swipe Validation**
  - For random venues where user not checked in
  - Verify only left swipes trigger actions
  - Verify right swipes provide resistance
  - Run 100+ iterations
  - **Validates: Requirements 7.1, 7.3**

- [ ]* 7.4 Write property test for state-based validation (checked in)
  - **Property 9: Checked-In State Swipe Validation**
  - For random venues where user is checked in
  - Verify only right swipes trigger actions
  - Verify left swipes provide resistance
  - Run 100+ iterations
  - **Validates: Requirements 7.2, 7.3**

- [x] 8. Implement Gesture Conflict Resolution
  - Handle conflicts between horizontal swipe and vertical scroll
  - Detect dominant direction and lock gesture
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 8.1 Add gesture direction detection
  - In useSwipeGesture onUpdate: track both X and Y movement
  - If abs(gestureX) > 10 && abs(gestureX) > abs(gestureY): lock to horizontal
  - If abs(gestureY) > 10: lock to vertical (disable swipe)
  - Store locked direction in ref
  - _Requirements: 12.1, 12.2_

- [x] 8.2 Integrate with ScrollView
  - Pass scrollEnabled shared value to parent ScrollView
  - When horizontal swipe detected: set scrollEnabled.value = false
  - On gesture end: set scrollEnabled.value = true
  - _Requirements: 12.1, 12.3_

- [ ]* 8.3 Write integration tests for gesture conflicts
  - Test horizontal drag disables scroll
  - Test vertical drag disables swipe
  - Test gesture re-enables after release
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 9. Implement Error Handling and Visual Feedback
  - Add error handling for failed actions
  - Implement visual state atomicity
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9.1 Add error handling to swipe handlers
  - Wrap check-in/check-out calls in try/catch
  - On error: animate card back to center
  - Display error toast with message
  - Trigger error haptic feedback
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 9.2 Implement visual state atomicity
  - Do not update card visual state until action succeeds
  - Use loading state during API call
  - Only update isUserCheckedIn after successful response
  - _Requirements: 9.4_

- [ ]* 9.3 Write property test for visual state atomicity
  - **Property 10: Visual State Atomicity**
  - For random check-in/out actions
  - Verify visual state updates only after success
  - Verify state doesn't change on error
  - Run 100+ iterations
  - **Validates: Requirements 9.4**

- [ ]* 9.4 Write unit tests for error handling
  - Test network error displays correct message
  - Test validation error displays correct message
  - Test error haptic feedback triggers
  - Test card snaps back on error
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 10. Implement Icon and Label Visibility Thresholds
  - Add progressive reveal for icons and labels
  - Interpolate opacity based on drag distance
  - _Requirements: 5.3, 5.4_

- [x] 10.1 Add icon opacity interpolation
  - In SwipeActionBackground: interpolate icon opacity
  - Input range: [threshold * 0.5, threshold * 0.6] → [0, 1]
  - Apply to icon style
  - _Requirements: 5.3_

- [x] 10.2 Add label opacity interpolation
  - In SwipeActionBackground: interpolate label opacity
  - Input range: [threshold * 0.75, threshold * 0.85] → [0, 1]
  - Apply to label style
  - _Requirements: 5.4_

- [ ]* 10.3 Write unit tests for visibility thresholds
  - Test icon appears at 50% threshold
  - Test label appears at 75% threshold
  - Test both fade in smoothly
  - _Requirements: 5.3, 5.4_

- [x] 11. Add Accessibility Features
  - Implement accessibility labels and announcements
  - Ensure touch targets meet minimum size
  - _Requirements: 10.2, 10.3, 10.5_

- [x] 11.1 Add accessibility labels
  - Add accessibilityLabel to WideVenueCard: "Swipe left to check in, swipe right to check out"
  - Add accessibilityHint for current state
  - Add accessibilityRole="button" to card
  - _Requirements: 10.2_

- [x] 11.2 Implement screen reader announcements
  - Use AccessibilityInfo.announceForAccessibility on action complete
  - Announce: "Checked in to [Venue Name]" or "Checked out from [Venue Name]"
  - _Requirements: 10.3_

- [x] 11.3 Verify touch target sizes
  - Ensure check-in button is at least 44x44 points
  - Ensure card has sufficient height for touch
  - Test with accessibility inspector
  - _Requirements: 10.5_

- [x] 12. Integration with Existing Features
  - Ensure swipe actions update all relevant state
  - Verify callbacks are triggered correctly
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12.1 Wire up onCheckInChange callback
  - Ensure swipe check-in calls onCheckInChange(true, newCount)
  - Ensure swipe check-out calls onCheckInChange(false, newCount)
  - Verify HomeScreen state updates correctly
  - _Requirements: 11.3, 11.5_

- [x] 12.2 Update check-in stats on swipe
  - After successful check-in: refetch check-in stats
  - Update card's checkInCount prop
  - Update engagement chips
  - _Requirements: 11.1_

- [x] 12.3 Update check-in history on swipe
  - Ensure check-out updates user's check-in history
  - Verify RecentCheckInsSection reflects changes
  - _Requirements: 11.2_

- [ ]* 12.4 Write property test for callback consistency
  - **Property 11: Callback Consistency**
  - For random swipe actions
  - Verify onCheckInChange called with correct params
  - Verify params match button interaction
  - Run 100+ iterations
  - **Validates: Requirements 11.3**

- [ ]* 12.5 Write property test for business logic preservation
  - **Property 12: Business Logic Preservation**
  - For random venues with various states
  - Verify all business rules enforced (one check-in at a time, capacity, etc.)
  - Verify swipe respects same rules as button
  - Run 100+ iterations
  - **Validates: Requirements 11.4**

- [x] 13. Polish Animations and Timing
  - Fine-tune animation curves and durations
  - Ensure smooth 60fps performance
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13.1 Optimize animation performance
  - Verify all animations use worklets
  - Ensure no JS thread calculations during gestures
  - Use runOnJS only for callbacks
  - Memoize gesture handlers with useCallback
  - _Requirements: 8.1, 8.2, 8.5_

- [x] 13.2 Test animation performance
  - Use React DevTools Profiler
  - Enable Reanimated debug mode
  - Verify 60fps during swipes
  - Test on low-end Android device
  - _Requirements: 8.3_

- [x] 13.3 Fine-tune spring animation
  - Adjust damping, stiffness, mass if needed
  - Test snap-back feels natural
  - Verify spring config: { damping: 0.7, stiffness: 300, mass: 0.5 }
  - _Requirements: 8.4_

- [x] 14. Update HomeScreen Integration
  - Update HomeScreen to use WideVenueCard with swipe
  - Ensure all props are passed correctly
  - _Requirements: 1.3, 11.5_

- [x] 14.1 Update HomeScreen imports and usage
  - Update import to use WideVenueCard from ui folder
  - Ensure all existing props are passed
  - Add enableSwipe={true} prop
  - Pass onSwipeCheckIn and onSwipeCheckOut handlers
  - _Requirements: 1.3_

- [x] 14.2 Test HomeScreen integration
  - Verify cards render correctly
  - Test swipe gestures work in list
  - Test scrolling still works
  - Verify check-in state updates correctly
  - _Requirements: 11.5_

- [x] 15. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Fix any failing tests
  - Ensure 60fps performance

- [x] 16. Manual Testing and Bug Fixes
  - Test on iOS and Android devices
  - Test with various network conditions
  - Test accessibility features
  - Fix any discovered bugs

- [ ] 16.1 Test on iOS device
  - Test swipe gestures feel natural
  - Test haptic feedback works
  - Test with VoiceOver enabled
  - Test animations are smooth

- [ ] 16.2 Test on Android device
  - Test swipe gestures feel natural
  - Test haptic feedback works
  - Test with TalkBack enabled
  - Test animations are smooth
  - Test on low-end device

- [ ] 16.3 Test edge cases
  - Test rapid swipes in succession
  - Test swipe during network request
  - Test with slow network (throttle to 3G)
  - Test with no network connection
  - Test switching between venues quickly

- [x] 17. Documentation and Cleanup
  - Update component documentation
  - Add usage examples
  - Clean up console logs
  - Remove debug code

- [x] 17.1 Document WideVenueCard component
  - Add JSDoc comments to component
  - Document all props with descriptions
  - Add usage examples
  - Document swipe gesture behavior

- [x] 17.2 Document custom hooks
  - Add JSDoc to useSwipeGesture
  - Add JSDoc to useHapticFeedback
  - Document parameters and return values
  - Add usage examples

- [x] 17.3 Clean up code
  - Remove console.log statements
  - Remove commented-out code
  - Remove debug flags
  - Run linter and fix warnings

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (100+ iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Manual testing ensures real-world usability
