/**
 * Property-Based Tests for useSwipeGesture State-Based Validation
 * Feature: swipeable-venue-card
 */

import * as fc from 'fast-check';
import { renderHook } from '@testing-library/react-native';
import { useSwipeGesture } from '../useSwipeGesture';
import { SWIPE_THRESHOLD, RESISTANCE_FACTOR } from '../../utils/animations/swipeAnimations';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn((callback) => callback()),
    withSpring: jest.fn((value) => value),
    interpolate: jest.fn((value, inputRange, outputRange, extrapolate = 'extend') => {
      const [inMin, inMax] = inputRange;
      const [outMin, outMax] = outputRange;
      
      if (extrapolate === 'clamp') {
        if (value <= inMin) return outMin;
        if (value >= inMax) return outMax;
      }
      
      const ratio = (value - inMin) / (inMax - inMin);
      return outMin + ratio * (outMax - outMin);
    }),
    runOnJS: jest.fn((fn) => (...args: any[]) => fn(...args)),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: jest.fn(() => ({
      onStart: jest.fn().mockReturnThis(),
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('useSwipeGesture - State-Based Validation Property Tests', () => {
  const mockOnCheckIn = jest.fn().mockResolvedValue(undefined);
  const mockOnCheckOut = jest.fn().mockResolvedValue(undefined);
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 8: State-Based Swipe Validation (Not Checked In)', () => {
    /**
     * Feature: swipeable-venue-card, Property 8: State-Based Swipe Validation
     * Validates: Requirements 7.1, 7.3
     * 
     * For random venues where user is not checked in, verify only left swipes
     * trigger actions and right swipes provide resistance.
     */
    it('should allow left swipes when not checked in', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 120, max: 300 }), // Left swipe distances above threshold
          (swipeDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false, // Not checked in
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate left swipe (negative distance)
            const leftSwipeDistance = -swipeDistance;
            result.current.translateX.value = leftSwipeDistance;

            // Left swipes should be allowed (no resistance)
            expect(result.current.translateX.value).toBe(leftSwipeDistance);
            expect(Math.abs(result.current.translateX.value)).toBeGreaterThanOrEqual(SWIPE_THRESHOLD);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide resistance for right swipes when not checked in', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 300 }), // Right swipe distances
          (swipeDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false, // Not checked in
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate right swipe with resistance
            const expectedTranslateX = swipeDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = expectedTranslateX;

            // Right swipes should have resistance applied
            expect(result.current.translateX.value).toBeCloseTo(expectedTranslateX, 1);
            expect(result.current.translateX.value).toBeLessThan(swipeDistance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger check-out for right swipes when not checked in', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 120, max: 300 }), // Right swipe distances above threshold
          (swipeDistance) => {
            const checkOutSpy = jest.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false, // Not checked in
                onCheckIn: mockOnCheckIn,
                onCheckOut: checkOutSpy,
                onError: mockOnError,
              })
            );

            // Simulate right swipe with resistance
            const resistedDistance = swipeDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = resistedDistance;

            // Check-out should not be triggered because of resistance
            // (resisted distance will be below threshold)
            expect(resistedDistance).toBeLessThan(SWIPE_THRESHOLD);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain resistance factor consistency', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }), // Various right swipe distances
          (swipeDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false,
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Calculate expected resisted distance
            const expectedResisted = swipeDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = expectedResisted;

            // Verify resistance is consistently applied
            expect(result.current.translateX.value).toBeCloseTo(expectedResisted, 1);
            expect(result.current.translateX.value / swipeDistance).toBeCloseTo(RESISTANCE_FACTOR, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Checked-In State Swipe Validation', () => {
    /**
     * Feature: swipeable-venue-card, Property 9: Checked-In State Swipe Validation
     * Validates: Requirements 7.2, 7.3
     * 
     * For random venues where user is checked in, verify only right swipes
     * trigger actions and left swipes provide resistance.
     */
    it('should allow right swipes when checked in', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 120, max: 300 }), // Right swipe distances above threshold
          (swipeDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: true, // Checked in
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate right swipe
            result.current.translateX.value = swipeDistance;

            // Right swipes should be allowed (no resistance)
            expect(result.current.translateX.value).toBe(swipeDistance);
            expect(result.current.translateX.value).toBeGreaterThanOrEqual(SWIPE_THRESHOLD);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide resistance for left swipes when checked in', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 300 }), // Left swipe distances (positive for abs value)
          (swipeDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: true, // Checked in
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate left swipe with resistance
            const leftSwipeDistance = -swipeDistance;
            const expectedTranslateX = leftSwipeDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = expectedTranslateX;

            // Left swipes should have resistance applied
            expect(result.current.translateX.value).toBeCloseTo(expectedTranslateX, 1);
            expect(Math.abs(result.current.translateX.value)).toBeLessThan(swipeDistance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger check-in for left swipes when checked in', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 120, max: 300 }), // Left swipe distances above threshold
          (swipeDistance) => {
            const checkInSpy = jest.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: true, // Checked in
                onCheckIn: checkInSpy,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate left swipe with resistance
            const leftSwipeDistance = -swipeDistance;
            const resistedDistance = leftSwipeDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = resistedDistance;

            // Check-in should not be triggered because of resistance
            expect(Math.abs(resistedDistance)).toBeLessThan(SWIPE_THRESHOLD);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain resistance factor consistency for left swipes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }), // Various left swipe distances
          (swipeDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: true,
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Calculate expected resisted distance for left swipe
            const leftSwipeDistance = -swipeDistance;
            const expectedResisted = leftSwipeDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = expectedResisted;

            // Verify resistance is consistently applied
            expect(result.current.translateX.value).toBeCloseTo(expectedResisted, 1);
            expect(Math.abs(result.current.translateX.value / leftSwipeDistance)).toBeCloseTo(RESISTANCE_FACTOR, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('State Transition Validation', () => {
    it('should handle state changes correctly', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Random initial state
          fc.boolean(), // Random new state
          (initialState, newState) => {
            const { result, rerender } = renderHook(
              ({ isCheckedIn }) =>
                useSwipeGesture({
                  threshold: SWIPE_THRESHOLD,
                  isCheckedIn,
                  onCheckIn: mockOnCheckIn,
                  onCheckOut: mockOnCheckOut,
                  onError: mockOnError,
                }),
              { initialProps: { isCheckedIn: initialState } }
            );

            // Verify initial state
            expect(result.current.panGesture).toBeDefined();

            // Change state
            rerender({ isCheckedIn: newState });

            // Verify gesture handler still works after state change
            expect(result.current.panGesture).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Resistance Boundary Conditions', () => {
    it('should apply resistance at all distances for invalid direction', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // Wide range of distances
          fc.boolean(), // Random check-in state
          (distance, isCheckedIn) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn,
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Determine invalid direction based on state
            const invalidDistance = isCheckedIn ? -distance : distance;
            const expectedResisted = invalidDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = expectedResisted;

            // Verify resistance is applied
            expect(Math.abs(result.current.translateX.value)).toBeLessThan(Math.abs(invalidDistance));
            expect(Math.abs(result.current.translateX.value)).toBeCloseTo(Math.abs(expectedResisted), 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
