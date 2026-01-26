import { useCallback, useMemo } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, interpolate, runOnJS } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import type { PanGesture } from 'react-native-gesture-handler';
import { SWIPE_THRESHOLD, RESISTANCE_FACTOR, SPRING_CONFIG, MAX_SWIPE_DISTANCE } from '../utils/animations/swipeAnimations';

/**
 * Options for configuring the swipe gesture behavior
 */
export interface UseSwipeGestureOptions {
  /** 
   * Minimum distance in pixels to trigger an action (default: 120)
   * When the card is dragged beyond this threshold and released, the action is triggered
   */
  threshold?: number;
  
  /** 
   * Whether the user is currently checked in to this venue
   * Determines which swipe directions are valid:
   * - false: only left swipes (check-in) are allowed
   * - true: only right swipes (check-out) are allowed
   */
  isCheckedIn: boolean;
  
  /** 
   * Callback triggered when check-in action is performed (left swipe beyond threshold)
   * Should handle the check-in API call and update state
   * @throws Error if check-in fails (will be caught and handled by onError)
   */
  onCheckIn: () => Promise<void>;
  
  /** 
   * Callback triggered when check-out action is performed (right swipe beyond threshold)
   * Should handle the check-out API call and update state
   * @throws Error if check-out fails (will be caught and handled by onError)
   */
  onCheckOut: () => Promise<void>;
  
  /** 
   * Callback triggered when an error occurs during check-in/check-out
   * Receives the error object for display or logging
   */
  onError: (error: Error) => void;
  
  /** 
   * Shared value to control parent ScrollView scrolling (optional)
   * When horizontal swipe is detected, this is set to false to prevent scroll conflicts
   * Re-enabled when gesture ends
   */
  scrollEnabled?: ReturnType<typeof useSharedValue<boolean>>;
  
  /** 
   * Whether the gesture is enabled (default: true)
   * Set to false to disable swipe gestures (e.g., during loading states)
   * Requirement 9.4: Prevents gestures during API calls
   */
  enabled?: boolean;
}

/**
 * Return type for useSwipeGesture hook
 */
export interface UseSwipeGestureReturn {
  /** 
   * Pan gesture handler for the swipeable card
   * Attach to GestureDetector component wrapping the card
   */
  panGesture: PanGesture;
  
  /** 
   * Shared value for card horizontal translation
   * Use in animated style: transform: [{ translateX: translateX.value }]
   */
  translateX: ReturnType<typeof useSharedValue<number>>;
  
  /** 
   * Shared value for left action background opacity (0-1)
   * Interpolated from translateX for green "Arriving" background
   */
  leftActionOpacity: ReturnType<typeof useSharedValue<number>>;
  
  /** 
   * Shared value for right action background opacity (0-1)
   * Interpolated from translateX for red "Leaving" background
   */
  rightActionOpacity: ReturnType<typeof useSharedValue<number>>;
  
  /** 
   * Animated style for the card container
   * Apply to Animated.View wrapping the card content
   */
  animatedCardStyle: ReturnType<typeof useAnimatedStyle>;
}

/**
 * useSwipeGesture Hook
 * 
 * Custom hook that encapsulates swipe gesture logic for venue cards.
 * Handles pan gestures, threshold detection, action triggering, and conflict resolution.
 * 
 * **Features:**
 * - Horizontal pan gesture detection with configurable threshold
 * - State-aware swipe validation (only valid directions allowed)
 * - Resistance feedback for invalid swipe directions (0.3x factor)
 * - Smooth spring animations for snap-back and reset
 * - Opacity interpolation for action backgrounds
 * - Gesture conflict resolution with vertical scrolling
 * - Error handling with automatic card reset
 * - Performance optimized with worklets (runs on UI thread)
 * 
 * **Gesture Phases:**
 * 1. **onStart**: Store initial position, reset locked direction
 * 2. **onUpdate**: 
 *    - Detect dominant direction (horizontal vs vertical)
 *    - Apply resistance for invalid swipe directions
 *    - Update translateX and interpolate background opacities
 *    - Disable scroll if horizontal movement detected
 * 3. **onEnd**:
 *    - Check if threshold reached
 *    - Trigger action if valid direction
 *    - Animate back to center with spring
 *    - Re-enable scrolling
 * 
 * **Requirements Satisfied:**
 * - Requirement 2.1, 2.2: Swipe gesture detection and translation
 * - Requirement 2.4: Snap-back animation below threshold
 * - Requirement 3.1, 4.1: Action triggering on threshold
 * - Requirement 5.1, 5.2: Opacity interpolation for backgrounds
 * - Requirement 7.1, 7.2, 7.3: State-based swipe validation
 * - Requirement 8.1, 8.2, 8.5: Performance optimization with worklets
 * - Requirement 9.1: Error handling with card reset
 * - Requirement 12.1, 12.2, 12.3: Gesture conflict resolution
 * 
 * @param options - Configuration options for the swipe gesture
 * @returns Gesture handler, shared values, and animated styles
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { panGesture, translateX, leftActionOpacity, rightActionOpacity, animatedCardStyle } = useSwipeGesture({
 *   isCheckedIn: false,
 *   onCheckIn: async () => {
 *     await checkInToVenue(venueId);
 *   },
 *   onCheckOut: async () => {
 *     await checkOutFromVenue(venueId);
 *   },
 *   onError: (error) => {
 *     showErrorToast(error.message);
 *   }
 * });
 * 
 * return (
 *   <GestureDetector gesture={panGesture}>
 *     <Animated.View style={animatedCardStyle}>
 *       <SwipeActionBackground direction="left" opacity={leftActionOpacity} />
 *       <SwipeActionBackground direction="right" opacity={rightActionOpacity} />
 *       <CardContent />
 *     </Animated.View>
 *   </GestureDetector>
 * );
 * 
 * // With scroll control and custom threshold
 * const scrollEnabled = useSharedValue(true);
 * const gesture = useSwipeGesture({
 *   threshold: 150,
 *   isCheckedIn: true,
 *   onCheckIn: handleCheckIn,
 *   onCheckOut: handleCheckOut,
 *   onError: handleError,
 *   scrollEnabled,
 *   enabled: !isLoading
 * });
 * ```
 */
export function useSwipeGesture(options: UseSwipeGestureOptions): UseSwipeGestureReturn {
  const {
    threshold = SWIPE_THRESHOLD,
    isCheckedIn,
    onCheckIn,
    onCheckOut,
    onError,
    scrollEnabled,
    enabled = true, // Requirement 9.4: Default to enabled
  } = options;

  // Initialize shared values for animations
  const translateX = useSharedValue(0);
  const leftActionOpacity = useSharedValue(0);
  const rightActionOpacity = useSharedValue(0);

  // Callbacks wrapped for use in worklets
  const handleCheckIn = useCallback(async () => {
    try {
      await onCheckIn();
    } catch (error) {
      onError(error as Error);
      // Animate card back to center on error
      translateX.value = withSpring(0, SPRING_CONFIG);
      leftActionOpacity.value = withSpring(0, SPRING_CONFIG);
      rightActionOpacity.value = withSpring(0, SPRING_CONFIG);
    }
  }, [onCheckIn, onError, translateX, leftActionOpacity, rightActionOpacity]);

  const handleCheckOut = useCallback(async () => {
    try {
      await onCheckOut();
    } catch (error) {
      onError(error as Error);
      // Animate card back to center on error
      translateX.value = withSpring(0, SPRING_CONFIG);
      leftActionOpacity.value = withSpring(0, SPRING_CONFIG);
      rightActionOpacity.value = withSpring(0, SPRING_CONFIG);
    }
  }, [onCheckOut, onError, translateX, leftActionOpacity, rightActionOpacity]);

  // Store initial position for gesture
  const startX = useSharedValue(0);
  
  // Store locked direction as a shared value instead of ref (fixes crash)
  const lockedDirectionValue = useSharedValue<'horizontal' | 'vertical' | null>(null);

  // Memoize the pan gesture to prevent recreation on every render (Requirement 8.5)
  const panGesture = useMemo(() => {
    const gesture = Gesture.Pan()
      .onStart(() => {
        'worklet';
        // Store initial position when gesture starts
        startX.value = translateX.value;
        // Reset locked direction on new gesture
        lockedDirectionValue.value = null;
      })
      .onUpdate((event) => {
        'worklet';
        const gestureX = event.translationX;
        const gestureY = event.translationY;
        
        // Detect dominant direction and lock gesture (Requirements 12.1, 12.2)
        const absGestureX = Math.abs(gestureX);
        const absGestureY = Math.abs(gestureY);
        
        // Check if we need to lock direction
        // Increased threshold to 30px and require horizontal to be 1.5x vertical for better scroll UX
        if (lockedDirectionValue.value === null) {
          if (absGestureX > 30 && absGestureX > absGestureY * 1.5) {
            // Clear horizontal swipe intent detected - lock to horizontal
            lockedDirectionValue.value = 'horizontal';
            // Disable vertical scrolling if scrollEnabled is provided
            if (scrollEnabled) {
              scrollEnabled.value = false;
            }
          } else if (absGestureY > 20 && absGestureY > absGestureX) {
            // Vertical movement detected - lock to vertical (disable swipe)
            lockedDirectionValue.value = 'vertical';
          }
        }
        
        // Only process horizontal swipe if locked to horizontal or not locked yet
        if (lockedDirectionValue.value === 'vertical') {
          // Vertical scroll is active, don't translate card
          return;
        }
        
        // Determine if swipe direction is valid based on check-in state
        const isSwipingLeft = gestureX < 0;
        const isSwipingRight = gestureX > 0;
        
        // Valid swipe directions:
        // - Not checked in: can only swipe right (check-in)
        // - Checked in: can only swipe left (check-out)
        const isValidDirection = isCheckedIn ? isSwipingLeft : isSwipingRight;
        
        // Apply resistance for invalid swipe directions
        if (!isValidDirection && gestureX !== 0) {
          translateX.value = gestureX * RESISTANCE_FACTOR;
        } else {
          translateX.value = gestureX;
        }

        // Clamp to maximum swipe distance
        if (Math.abs(translateX.value) > MAX_SWIPE_DISTANCE) {
          translateX.value = translateX.value > 0 ? MAX_SWIPE_DISTANCE : -MAX_SWIPE_DISTANCE;
        }

        // Interpolate opacity for action backgrounds
        // Right action (green "Arriving"): visible when swiping right (positive translateX)
        rightActionOpacity.value = interpolate(
          translateX.value,
          [0, threshold],
          [0, 1],
          'clamp'
        );

        // Left action (red "Leaving"): visible when swiping left (negative translateX)
        leftActionOpacity.value = interpolate(
          translateX.value,
          [-threshold, 0],
          [1, 0],
          'clamp'
        );
      })
      .onEnd(() => {
        'worklet';
        const absTranslateX = Math.abs(translateX.value);
        
        // Re-enable scrolling when gesture ends (Requirement 12.3)
        if (scrollEnabled) {
          scrollEnabled.value = true;
        }
        
        // Reset locked direction
        lockedDirectionValue.value = null;
        
        // Check if threshold is reached
        if (absTranslateX >= threshold) {
          // Determine swipe direction
          const isSwipingLeft = translateX.value < 0;
          const isSwipingRight = translateX.value > 0;
          
          // Check if direction is valid for current state
          const isValidDirection = isCheckedIn ? isSwipingRight : isSwipingLeft;
          
          if (isValidDirection) {
            // Trigger appropriate action
            if (isSwipingRight) {
              // Right swipe = check-in
              runOnJS(handleCheckIn)();
            } else {
              // Left swipe = check-out
              runOnJS(handleCheckOut)();
            }
          }
          
          // Reset card position with spring animation
          translateX.value = withSpring(0, SPRING_CONFIG);
          leftActionOpacity.value = withSpring(0, SPRING_CONFIG);
          rightActionOpacity.value = withSpring(0, SPRING_CONFIG);
        } else {
          // Threshold not reached - snap back to center
          translateX.value = withSpring(0, SPRING_CONFIG);
          leftActionOpacity.value = withSpring(0, SPRING_CONFIG);
          rightActionOpacity.value = withSpring(0, SPRING_CONFIG);
        }
      });
    
    // Apply enabled state if the method exists (Requirement 9.4)
    // This handles both real environment and test mocks
    if (typeof gesture.enabled === 'function') {
      return gesture.enabled(enabled);
    }
    
    return gesture;
  }, [enabled, threshold, isCheckedIn, handleCheckIn, handleCheckOut, scrollEnabled, translateX, leftActionOpacity, rightActionOpacity, startX]);

  // Animated style for card translation (memoized for performance - Requirement 8.5)
  const animatedCardStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  }, [translateX]);

  return {
    panGesture,
    translateX,
    leftActionOpacity,
    rightActionOpacity,
    animatedCardStyle,
  };
}
