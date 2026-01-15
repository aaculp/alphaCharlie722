# Requirements Document

## Introduction

The Swipeable Venue Card feature adds intuitive swipe gestures to venue cards on the HomeScreen, allowing users to quickly check in or check out of venues with a simple drag gesture. This enhancement provides a faster, more engaging alternative to tapping buttons while maintaining the existing button-based interactions for users who prefer them. The feature aims to improve user experience, reduce friction in the check-in/check-out flow, and make venue interactions feel more natural and fluid.

## Glossary

- **WideVenueCard**: The renamed venue card component (formerly TestVenueCard) that displays venue information in a horizontal layout
- **Swipe_Gesture**: A horizontal pan gesture where the user drags a venue card left or right
- **Check_In_Swipe**: A left swipe gesture that triggers a check-in action at the venue
- **Check_Out_Swipe**: A right swipe gesture that triggers a check-out action from the venue
- **Action_Background**: A colored background (green or red) that appears behind the card during a swipe
- **Action_Icon**: A visual indicator (check mark or logout icon) that appears on the Action_Background
- **Action_Label**: Text label ("Arriving" or "Leaving") that appears on the Action_Background
- **Swipe_Threshold**: The minimum horizontal distance (in pixels) a card must be dragged to trigger the action
- **Snap_Back**: Animation that returns the card to its original position when released before reaching the threshold
- **Haptic_Feedback**: Tactile vibration feedback provided when an action is triggered

## Requirements

### Requirement 1: Component Refactoring

**User Story:** As a developer, I want to rename and reorganize the venue card component, so that the codebase follows consistent naming conventions and structure.

#### Acceptance Criteria

1. THE System SHALL rename TestVenueCard component to WideVenueCard
2. THE System SHALL move WideVenueCard from src/components/venue to src/components/ui
3. THE System SHALL update all imports in HomeScreen and other files that reference the component
4. THE System SHALL maintain all existing props and functionality during the refactor
5. THE System SHALL preserve the component's current visual design and layout

### Requirement 2: Swipe Gesture Detection

**User Story:** As a user, I want to drag venue cards left or right, so that I can quickly check in or check out of venues.

#### Acceptance Criteria

1. WHEN a user touches a WideVenueCard, THE System SHALL enable horizontal pan gesture detection
2. WHEN a user drags a card horizontally, THE System SHALL translate the card position based on drag distance
3. WHEN a user drags a card, THE System SHALL prevent vertical scrolling of the parent ScrollView
4. WHEN a user releases the card before reaching Swipe_Threshold, THE System SHALL animate the card back to center using spring physics
5. THE System SHALL set Swipe_Threshold to 120 pixels from center position

### Requirement 3: Swipe Left to Check In

**User Story:** As a user, I want to swipe a venue card left, so that I can quickly check in to that venue.

#### Acceptance Criteria

1. WHEN a user swipes a WideVenueCard left beyond Swipe_Threshold, THE System SHALL trigger a check-in action for that venue
2. WHEN swiping left, THE System SHALL display a green Action_Background behind the card
3. WHEN swiping left, THE System SHALL display a check mark Action_Icon on the green background
4. WHEN swiping left, THE System SHALL display "Arriving" Action_Label on the green background
5. WHEN the check-in action completes successfully, THE System SHALL provide Haptic_Feedback and snap the card back to center

### Requirement 4: Swipe Right to Check Out

**User Story:** As a user, I want to swipe a venue card right, so that I can quickly check out from that venue.

#### Acceptance Criteria

1. WHEN a user swipes a WideVenueCard right beyond Swipe_Threshold, THE System SHALL trigger a check-out action for that venue
2. WHEN swiping right, THE System SHALL display a red Action_Background behind the card
3. WHEN swiping right, THE System SHALL display a logout icon Action_Icon on the red background
4. WHEN swiping right, THE System SHALL display "Leaving" Action_Label on the red background
5. WHEN the check-out action completes successfully, THE System SHALL provide Haptic_Feedback and snap the card back to center

### Requirement 5: Visual Feedback During Swipe

**User Story:** As a user, I want to see clear visual feedback while swiping, so that I understand what action will occur.

#### Acceptance Criteria

1. WHEN a card is dragged left, THE System SHALL reveal a green Action_Background with opacity interpolated from 0 to 1 based on drag distance
2. WHEN a card is dragged right, THE System SHALL reveal a red Action_Background with opacity interpolated from 0 to 1 based on drag distance
3. WHEN drag distance exceeds 50% of Swipe_Threshold, THE System SHALL display the Action_Icon at full opacity
4. WHEN drag distance exceeds 75% of Swipe_Threshold, THE System SHALL display the Action_Label at full opacity
5. WHEN the card returns to center, THE System SHALL fade out all Action_Background elements

### Requirement 6: Dual Interaction Methods

**User Story:** As a user, I want to use either swipe gestures or buttons to check in/out, so that I can choose my preferred interaction method.

#### Acceptance Criteria

1. THE System SHALL maintain the existing check-in/check-out button functionality on WideVenueCard
2. WHEN a user taps the check-in button, THE System SHALL trigger the same check-in logic as a left swipe
3. WHEN a user taps the check-out button, THE System SHALL trigger the same check-out logic as a right swipe
4. THE System SHALL ensure both interaction methods update the same state and trigger the same callbacks
5. THE System SHALL provide consistent visual feedback for both button taps and swipe gestures

### Requirement 7: Check-In State Awareness

**User Story:** As a user, I want swipe actions to respect my current check-in state, so that I don't accidentally check in twice or check out when not checked in.

#### Acceptance Criteria

1. WHEN a user is not checked in to a venue, THE System SHALL only allow left swipe (check-in) actions
2. WHEN a user is already checked in to a venue, THE System SHALL only allow right swipe (check-out) actions
3. WHEN a user attempts an invalid swipe direction, THE System SHALL provide resistance and snap the card back immediately
4. WHEN a user is checked in to a different venue, THE System SHALL allow check-in swipe after confirming check-out from the current venue
5. THE System SHALL display appropriate visual indicators on the card to show current check-in state

### Requirement 8: Animation Performance

**User Story:** As a developer, I want smooth swipe animations at 60fps, so that the interaction feels responsive and polished.

#### Acceptance Criteria

1. THE System SHALL use React Native Reanimated for all swipe animations
2. THE System SHALL run gesture calculations on the UI thread using worklets
3. WHEN animating card translation, THE System SHALL maintain 60fps performance
4. WHEN snapping back to center, THE System SHALL use spring animation with damping ratio of 0.7
5. THE System SHALL optimize re-renders by memoizing gesture handlers and animated styles

### Requirement 9: Error Handling

**User Story:** As a user, I want clear feedback when check-in or check-out actions fail, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN a check-in action fails, THE System SHALL snap the card back to center and display an error message
2. WHEN a check-out action fails, THE System SHALL snap the card back to center and display an error message
3. WHEN network connectivity is lost during a swipe, THE System SHALL show a "No connection" message
4. THE System SHALL not update the card's visual state until the action is confirmed successful
5. WHEN an error occurs, THE System SHALL provide error Haptic_Feedback (different pattern from success)

### Requirement 10: Accessibility

**User Story:** As a user with accessibility needs, I want alternative ways to check in/out, so that I can use the app effectively.

#### Acceptance Criteria

1. THE System SHALL maintain button-based check-in/check-out for users who cannot perform swipe gestures
2. THE System SHALL provide accessibility labels for swipe actions
3. WHEN VoiceOver or TalkBack is enabled, THE System SHALL announce swipe actions
4. THE System SHALL ensure swipe gestures do not interfere with screen reader navigation
5. THE System SHALL provide sufficient touch target sizes for all interactive elements (minimum 44x44 points)

### Requirement 11: Integration with Existing Features

**User Story:** As a user, I want swipe actions to work seamlessly with existing app features, so that my experience is consistent.

#### Acceptance Criteria

1. WHEN a user swipes to check in, THE System SHALL update the check-in stats displayed on the card
2. WHEN a user swipes to check out, THE System SHALL update the user's check-in history
3. WHEN a user swipes on a card, THE System SHALL trigger the same onCheckInChange callback as button interactions
4. THE System SHALL respect all existing check-in business logic (one check-in at a time, venue capacity, etc.)
5. WHEN a user swipes, THE System SHALL update the HomeScreen state to reflect the new check-in status

### Requirement 12: Gesture Conflict Resolution

**User Story:** As a user, I want swipe gestures to work smoothly without interfering with scrolling, so that I can navigate the app naturally.

#### Acceptance Criteria

1. WHEN a user drags a card horizontally beyond 10 pixels, THE System SHALL disable vertical scrolling
2. WHEN a user drags a card vertically beyond 10 pixels, THE System SHALL disable horizontal card translation
3. WHEN a user lifts their finger, THE System SHALL re-enable all scroll gestures
4. THE System SHALL use gesture priority to ensure swipe gestures take precedence over scroll when horizontal movement is detected
5. THE System SHALL provide smooth transitions between gesture states without jank or stuttering
