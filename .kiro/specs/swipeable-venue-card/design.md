# Design Document: Swipeable Venue Card

## Overview

The Swipeable Venue Card feature enhances the existing venue card component with intuitive swipe gestures for quick check-in and check-out actions. By adding horizontal drag interactions with visual feedback, users can perform common actions more naturally and efficiently. The design leverages React Native Reanimated 2 and Gesture Handler to deliver smooth, performant animations that run on the UI thread at 60fps.

**Key Design Principles:**
- **Progressive Enhancement**: Swipe gestures complement, not replace, existing button interactions
- **Clear Visual Feedback**: Colored backgrounds and icons provide immediate understanding of actions
- **State Awareness**: Gestures adapt based on current check-in status
- **Performance First**: All animations run on the UI thread using Reanimated worklets
- **Accessibility**: Maintain full functionality for users who cannot perform swipe gestures

## Architecture

### Component Hierarchy

```
HomeScreen
└── ScrollView
    └── WideVenueCard (formerly TestVenueCard)
        ├── GestureDetector (PanGesture)
        ├── Animated.View (Card Container)
        │   ├── SwipeActionBackground (Left - Green "Arriving")
        │   ├── SwipeActionBackground (Right - Red "Leaving")
        │   └── CardContent
        │       ├── VenueImage
        │       ├── VenueInfo
        │       ├── EngagementChips
        │       └── CheckInButton (existing)
        └── HapticFeedback (on action trigger)
```

### File Structure

```
src/
├── components/
│   └── ui/
│       ├── WideVenueCard.tsx          (renamed from TestVenueCard)
│       ├── SwipeActionBackground.tsx  (new - reusable background component)
│       └── index.ts                   (export WideVenueCard)
├── hooks/
│   ├── useSwipeGesture.ts            (new - gesture logic)
│   └── useHapticFeedback.ts          (new - haptic utilities)
├── utils/
│   └── animations/
│       └── swipeAnimations.ts         (new - animation constants and helpers)
└── types/
    └── swipe.types.ts                 (new - swipe-related types)
```

## Components and Interfaces

### 1. WideVenueCard Component

**Purpose**: Main venue card component with swipe gesture support

**Props Interface**:
```typescript
interface WideVenueCardProps {
  venue: Venue;
  checkInCount: number;
  onPress: () => void;
  customerCountVariant?: 'traffic' | 'numeric';
  engagementChipVariant?: 'traffic' | 'numeric';
  distance?: string;
  onCheckInChange?: (isCheckedIn: boolean, newCount: number) => void;
  userCheckInId?: string;
  userCheckInTime?: string;
  isUserCheckedIn: boolean;
  
  // New props for swipe functionality
  enableSwipe?: boolean;              // Default: true
  swipeThreshold?: number;            // Default: 120
  onSwipeCheckIn?: () => Promise<void>;
  onSwipeCheckOut?: () => Promise<void>;
}
```

**Key Responsibilities**:
- Render venue information and engagement stats
- Handle pan gestures for swipe interactions
- Manage animated values for card translation and rotation
- Display appropriate action backgrounds based on swipe direction
- Trigger check-in/check-out actions when threshold is reached
- Provide haptic feedback on action completion

**Animation Values**:
```typescript
const translateX = useSharedValue(0);      // Card horizontal position
const opacity = useSharedValue(1);         // Card opacity
const leftActionOpacity = useSharedValue(0);  // Green background opacity
const rightActionOpacity = useSharedValue(0); // Red background opacity
```

### 2. SwipeActionBackground Component

**Purpose**: Reusable background component that appears during swipes

**Props Interface**:
```typescript
interface SwipeActionBackgroundProps {
  direction: 'left' | 'right';
  opacity: Animated.SharedValue<number>;
  icon: string;                    // Ionicons name
  label: string;                   // "Arriving" or "Leaving"
  backgroundColor: string;         // Green or red
  iconColor?: string;              // Default: white
  labelColor?: string;             // Default: white
}
```

**Layout**:
- Positioned absolutely behind the card
- Full width and height of card
- Icon and label centered vertically
- Icon positioned 20px from edge
- Label positioned 60px from edge

### 3. useSwipeGesture Hook

**Purpose**: Encapsulate swipe gesture logic and animations

**Interface**:
```typescript
interface UseSwipeGestureOptions {
  threshold: number;
  isCheckedIn: boolean;
  onCheckIn: () => Promise<void>;
  onCheckOut: () => Promise<void>;
  onError: (error: Error) => void;
}

interface UseSwipeGestureReturn {
  panGesture: PanGesture;
  translateX: Animated.SharedValue<number>;
  leftActionOpacity: Animated.SharedValue<number>;
  rightActionOpacity: Animated.SharedValue<number>;
  animatedCardStyle: AnimatedStyle;
}

function useSwipeGesture(options: UseSwipeGestureOptions): UseSwipeGestureReturn
```

**Gesture Logic**:
1. **onStart**: Store initial position
2. **onUpdate**: 
   - Update translateX based on drag distance
   - Interpolate action background opacities
   - Apply resistance if swiping in invalid direction
3. **onEnd**:
   - Check if threshold is reached
   - If yes: trigger action and animate off-screen, then snap back
   - If no: animate back to center with spring

### 4. useHapticFeedback Hook

**Purpose**: Provide consistent haptic feedback across the app

**Interface**:
```typescript
interface UseHapticFeedbackReturn {
  triggerSuccess: () => void;
  triggerError: () => void;
  triggerWarning: () => void;
  triggerSelection: () => void;
}

function useHapticFeedback(): UseHapticFeedbackReturn
```

**Haptic Patterns**:
- **Success**: Medium impact (check-in/check-out success)
- **Error**: Notification error (action failed)
- **Warning**: Light impact (invalid swipe direction)
- **Selection**: Selection feedback (threshold reached)

## Data Models

### Swipe State

```typescript
interface SwipeState {
  isActive: boolean;           // Is user currently swiping
  direction: 'left' | 'right' | null;
  distance: number;            // Current drag distance
  velocity: number;            // Gesture velocity
  hasReachedThreshold: boolean;
}
```

### Animation Configuration

```typescript
interface SwipeAnimationConfig {
  threshold: number;           // 120px
  resistanceFactor: number;    // 0.5 (for invalid swipes)
  springConfig: {
    damping: number;           // 0.7
    stiffness: number;         // 300
    mass: number;              // 0.5
  };
  opacityRange: {
    start: number;             // 0
    end: number;               // 1
    inputRange: [number, number]; // [0, threshold]
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Card Translation Matches Drag Distance
*For any* horizontal drag distance within valid bounds, the card's translateX value should equal the drag distance (with resistance applied for invalid directions).

**Validates: Requirements 2.2**

### Property 2: Snap-Back Below Threshold
*For any* card release position where absolute distance is less than the swipe threshold (120px), the card should animate back to center position (translateX = 0).

**Validates: Requirements 2.4**

### Property 3: Check-In Triggered on Left Swipe
*For any* left swipe where distance exceeds the threshold and user is not checked in, the check-in action should be triggered exactly once.

**Validates: Requirements 3.1**

### Property 4: Green Background on Left Swipe
*For any* left drag distance, the green action background opacity should be interpolated from 0 to 1 proportionally to the drag distance.

**Validates: Requirements 3.2, 5.1**

### Property 5: Check-Out Triggered on Right Swipe
*For any* right swipe where distance exceeds the threshold and user is checked in, the check-out action should be triggered exactly once.

**Validates: Requirements 4.1**

### Property 6: Red Background on Right Swipe
*For any* right drag distance, the red action background opacity should be interpolated from 0 to 1 proportionally to the drag distance.

**Validates: Requirements 4.2, 5.2**

### Property 7: Button and Swipe Equivalence
*For any* venue, both button tap and swipe gesture should trigger the same underlying check-in/check-out function and produce identical state changes.

**Validates: Requirements 6.4**

### Property 8: State-Based Swipe Validation
*For any* venue where user is not checked in, only left swipes beyond threshold should trigger actions; right swipes should provide resistance and snap back immediately.

**Validates: Requirements 7.1, 7.3**

### Property 9: Checked-In State Swipe Validation
*For any* venue where user is checked in, only right swipes beyond threshold should trigger actions; left swipes should provide resistance and snap back immediately.

**Validates: Requirements 7.2, 7.3**

### Property 10: Visual State Atomicity
*For any* check-in or check-out action, the card's visual state (check-in indicator, button state) should not update until the action is confirmed successful.

**Validates: Requirements 9.4**

### Property 11: Callback Consistency
*For any* swipe action, the onCheckInChange callback should be triggered with the same parameters as when using the button interaction.

**Validates: Requirements 11.3**

### Property 12: Business Logic Preservation
*For any* swipe action, all existing check-in business rules (one check-in at a time, venue capacity limits, etc.) should be enforced identically to button interactions.

**Validates: Requirements 11.4**

## Animation Specifications

### Card Translation Animation

**Drag Phase**:
- **Input**: Pan gesture translation X
- **Output**: Card translateX (with resistance for invalid directions)
- **Resistance Formula**: `translateX = gestureX * (isValidDirection ? 1 : 0.3)`
- **Frame Rate**: 60fps (UI thread)

**Snap-Back Animation**:
- **Trigger**: Release before threshold
- **Duration**: ~300ms (spring-based, varies with velocity)
- **Easing**: Spring (damping: 0.7, stiffness: 300, mass: 0.5)
- **Target**: translateX = 0

**Action Complete Animation**:
- **Trigger**: Threshold reached
- **Phase 1**: Animate off-screen (200ms, easeOut)
  - Target: translateX = ±(screenWidth * 0.8)
- **Phase 2**: Reset and snap back (300ms, spring)
  - Reset translateX to 0 instantly
  - Fade in with opacity animation

### Action Background Opacity

**Left Swipe (Green Background)**:
```typescript
leftActionOpacity = interpolate(
  translateX,
  [-threshold, 0],
  [1, 0],
  'clamp'
);
```

**Right Swipe (Red Background)**:
```typescript
rightActionOpacity = interpolate(
  translateX,
  [0, threshold],
  [0, 1],
  'clamp'
);
```

### Icon and Label Visibility

**Icon Opacity**:
```typescript
iconOpacity = interpolate(
  Math.abs(translateX),
  [threshold * 0.5, threshold * 0.6],
  [0, 1],
  'clamp'
);
```

**Label Opacity**:
```typescript
labelOpacity = interpolate(
  Math.abs(translateX),
  [threshold * 0.75, threshold * 0.85],
  [0, 1],
  'clamp'
);
```

### Gesture Conflict Resolution

**Horizontal vs Vertical Detection**:
```typescript
const horizontalThreshold = 10; // pixels
const verticalThreshold = 10;   // pixels

if (Math.abs(gestureX) > horizontalThreshold && Math.abs(gestureX) > Math.abs(gestureY)) {
  // Enable horizontal swipe, disable vertical scroll
  scrollEnabled.value = false;
} else if (Math.abs(gestureY) > verticalThreshold) {
  // Enable vertical scroll, disable horizontal swipe
  swipeEnabled.value = false;
}
```

## Error Handling

### Network Errors

**Scenario**: Check-in/check-out API call fails due to network issues

**Handling**:
1. Catch error in onCheckIn/onCheckOut handler
2. Animate card back to center with spring
3. Display error toast: "No connection. Please try again."
4. Trigger error haptic feedback
5. Do not update card visual state

### Validation Errors

**Scenario**: User attempts invalid action (e.g., check-in when already checked in elsewhere)

**Handling**:
1. Catch validation error from API
2. Animate card back to center
3. Display specific error message from API
4. Trigger error haptic feedback
5. Optionally show modal for complex errors (e.g., "Check out from [Venue Name] first?")

### Gesture Conflicts

**Scenario**: User drags diagonally, unclear intent

**Handling**:
1. Detect dominant direction (horizontal vs vertical) within first 10px
2. Lock to that direction for remainder of gesture
3. Provide resistance if user tries to change direction mid-gesture
4. If ambiguous, default to vertical scroll (preserve existing behavior)

## Testing Strategy

### Unit Tests

**Component Tests**:
- WideVenueCard renders correctly with all props
- SwipeActionBackground displays correct icon and label
- Buttons trigger onCheckInChange callback
- Accessibility labels are present

**Hook Tests**:
- useSwipeGesture returns correct gesture handler
- useHapticFeedback triggers correct patterns
- Animation values update correctly

**Edge Cases**:
- Card at threshold boundary (119px vs 121px)
- Rapid swipe gestures in succession
- Swipe during network request
- Invalid swipe direction based on check-in state

### Property-Based Tests

Each property test should run a minimum of 100 iterations with randomized inputs.

**Property 1 Test**: Card Translation
- Generate random drag distances (-200 to 200)
- Verify translateX matches expected value with resistance
- **Tag**: Feature: swipeable-venue-card, Property 1: Card Translation Matches Drag Distance

**Property 2 Test**: Snap-Back
- Generate random release positions (0 to 119)
- Verify card returns to center
- **Tag**: Feature: swipeable-venue-card, Property 2: Snap-Back Below Threshold

**Property 3 Test**: Check-In Trigger
- Generate random left swipe distances (120 to 300)
- Verify check-in called exactly once
- **Tag**: Feature: swipeable-venue-card, Property 3: Check-In Triggered on Left Swipe

**Property 4 Test**: Green Background Opacity
- Generate random left drag distances (-200 to 0)
- Verify opacity interpolation is correct
- **Tag**: Feature: swipeable-venue-card, Property 4: Green Background on Left Swipe

**Property 5 Test**: Check-Out Trigger
- Generate random right swipe distances (120 to 300)
- Verify check-out called exactly once
- **Tag**: Feature: swipeable-venue-card, Property 5: Check-Out Triggered on Right Swipe

**Property 6 Test**: Red Background Opacity
- Generate random right drag distances (0 to 200)
- Verify opacity interpolation is correct
- **Tag**: Feature: swipeable-venue-card, Property 6: Red Background on Right Swipe

**Property 7 Test**: Button-Swipe Equivalence
- For random venues, verify button and swipe call same function
- **Tag**: Feature: swipeable-venue-card, Property 7: Button and Swipe Equivalence

**Property 8 Test**: Not Checked In Validation
- For random venues where user not checked in
- Verify only left swipes trigger actions
- **Tag**: Feature: swipeable-venue-card, Property 8: State-Based Swipe Validation

**Property 9 Test**: Checked In Validation
- For random venues where user is checked in
- Verify only right swipes trigger actions
- **Tag**: Feature: swipeable-venue-card, Property 9: Checked-In State Swipe Validation

**Property 10 Test**: Visual State Atomicity
- For random check-in/out actions
- Verify visual state updates only after success
- **Tag**: Feature: swipeable-venue-card, Property 10: Visual State Atomicity

**Property 11 Test**: Callback Consistency
- For random swipe actions
- Verify onCheckInChange called with correct params
- **Tag**: Feature: swipeable-venue-card, Property 11: Callback Consistency

**Property 12 Test**: Business Logic Preservation
- For random venues with various states
- Verify all business rules enforced
- **Tag**: Feature: swipeable-venue-card, Property 12: Business Logic Preservation

### Integration Tests

- Swipe gesture works within ScrollView
- Multiple cards can be swiped in sequence
- Swipe state persists across screen navigation
- Haptic feedback triggers on device
- Error handling displays correct messages

### Manual Testing

- Test on iOS and Android devices
- Verify haptic feedback feels appropriate
- Test with VoiceOver/TalkBack enabled
- Verify animations feel smooth and natural
- Test with slow network conditions

## Performance Considerations

### Optimization Strategies

1. **UI Thread Animations**: All gesture calculations run on UI thread using Reanimated worklets
2. **Memoization**: Gesture handlers and animated styles are memoized to prevent re-creation
3. **Lazy Evaluation**: Action backgrounds only render when opacity > 0
4. **Debouncing**: Prevent multiple simultaneous swipe actions with state flag
5. **Cleanup**: Remove gesture listeners when component unmounts

### Performance Targets

- **Frame Rate**: Maintain 60fps during all animations
- **Gesture Response**: < 16ms from touch to visual feedback
- **Action Completion**: < 500ms from threshold to action complete
- **Memory**: No memory leaks from gesture handlers or animated values

### Monitoring

- Use React DevTools Profiler to measure render performance
- Monitor frame drops with Reanimated debug mode
- Track gesture handler memory usage
- Log animation completion times in development

## Accessibility

### Screen Reader Support

- Announce swipe actions: "Swipe left to check in, swipe right to check out"
- Provide alternative button interactions for users who cannot swipe
- Ensure focus order is logical
- Announce action results: "Checked in to [Venue Name]"

### Touch Targets

- Maintain minimum 44x44pt touch targets for buttons
- Ensure swipe gesture doesn't interfere with button taps
- Provide sufficient spacing between interactive elements

### Visual Accessibility

- Ensure sufficient color contrast for action backgrounds
- Provide text labels in addition to icons
- Support dynamic type for labels
- Respect reduced motion preferences (disable animations if requested)

## Migration Strategy

### Phase 1: Component Refactoring
1. Rename TestVenueCard to WideVenueCard
2. Move to src/components/ui
3. Update all imports
4. Verify existing functionality works
5. Deploy and monitor for issues

### Phase 2: Swipe Infrastructure
1. Create SwipeActionBackground component
2. Implement useSwipeGesture hook
3. Implement useHapticFeedback hook
4. Add animation utilities
5. Write unit tests for new components

### Phase 3: Integration
1. Add swipe gesture to WideVenueCard
2. Wire up check-in/check-out actions
3. Add visual feedback
4. Implement error handling
5. Write integration tests

### Phase 4: Polish and Testing
1. Fine-tune animation timing
2. Add haptic feedback
3. Implement accessibility features
4. Conduct user testing
5. Fix bugs and iterate

### Rollout Plan

- **Week 1**: Phase 1 (refactoring)
- **Week 2**: Phase 2 (infrastructure)
- **Week 3**: Phase 3 (integration)
- **Week 4**: Phase 4 (polish and testing)
- **Week 5**: Beta testing with select users
- **Week 6**: Full rollout

## Future Enhancements

### Potential Additions

1. **Customizable Swipe Actions**: Allow users to configure what left/right swipes do
2. **Swipe Gestures on Other Cards**: Apply to CompactVenueCard, search results, etc.
3. **Multi-Direction Swipes**: Add swipe down for "save for later", swipe up for "share"
4. **Swipe Tutorials**: Show first-time users how to use swipe gestures
5. **Swipe Analytics**: Track swipe vs button usage to measure feature adoption
6. **Gesture Customization**: Allow power users to adjust threshold and sensitivity

### Technical Debt

- Consider extracting swipe logic into a higher-order component for reusability
- Evaluate performance on low-end Android devices
- Add comprehensive error logging for gesture failures
- Create Storybook stories for all swipe states
