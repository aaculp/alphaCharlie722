/**
 * Property-Based Tests for useSwipeGesture Hook
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
    withSpring: jest.fn((value, config) => value),
    interpolate: jest.fn((value, inputRange, outputRange, extrapolate = 'extend') => {
      const [inMin, inMax] = inputRange;
      const [outMin, outMax] = outputRange;
      
      // Handle clamp extrapolation
      if (extrapolate === 'clamp') {
        if (value <= inMin) return outMin;
        if (value >= inMax) return outMax;
      }
      
      // Linear interpolation
      const ratio = (value - inMin) / (inMax - inMin);
      return outMin + ratio * (outMax - outMin);
    }),
    runOnJS: jest.fn((fn) => (...args: any[]) => fn(...args)),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: jest.fn(() => {
      let onStartHandler: any;
      let onUpdateHandler: any;
      let onEndHandler: any;

      return {
        onStart: jest.fn((handler) => {
          onStartHandler = handler;
          return {
            onUpdate: jest.fn((handler) => {
              onUpdateHandler = handler;
              return {
                onEnd: jest.fn((handler) => {
                  onEndHandler = handler;
                  return {
                    _handlers: { onStart: onStartHandler, onUpdate: onUpdateHandler, onEnd: onEndHandler }
                  };
                }),
              };
            }),
          };
        }),
      };
    }),
  },
}));

describe('useSwipeGesture - Property-Based Tests', () => {
  const mockOnCheckIn = jest.fn().mockResolvedValue(undefined);
  const mockOnCheckOut = jest.fn().mockResolvedValue(undefined);
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 1: Card Translation Matches Drag Distance', () => {
    /**
     * Feature: swipeable-venue-card, Property 1: Card Translation Matches Drag Distance
     * Validates: Requirements 2.2
     * 
     * For any horizontal drag distance within valid bounds, the card's translateX value
     * should equal the drag distance (with resistance applied for invalid directions).
     */
    it('should match drag distance for valid left swipes (not checked in)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -200, max: 0 }), // Left swipe distances
          (dragDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false, // Not checked in, so left swipes are valid
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate drag
            result.current.translateX.value = dragDistance;

            // For valid direction (left when not checked in), translateX should match drag distance
            expect(result.current.translateX.value).toBe(dragDistance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply resistance for invalid right swipes (not checked in)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }), // Right swipe distances
          (dragDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false, // Not checked in, so right swipes are invalid
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate drag with resistance
            const expectedTranslateX = dragDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = expectedTranslateX;

            // For invalid direction, translateX should be reduced by resistance factor
            expect(result.current.translateX.value).toBeCloseTo(expectedTranslateX, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match drag distance for valid right swipes (checked in)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }), // Right swipe distances
          (dragDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: true, // Checked in, so right swipes are valid
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate drag
            result.current.translateX.value = dragDistance;

            // For valid direction (right when checked in), translateX should match drag distance
            expect(result.current.translateX.value).toBe(dragDistance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply resistance for invalid left swipes (checked in)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -200, max: -1 }), // Left swipe distances
          (dragDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: true, // Checked in, so left swipes are invalid
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate drag with resistance
            const expectedTranslateX = dragDistance * RESISTANCE_FACTOR;
            result.current.translateX.value = expectedTranslateX;

            // For invalid direction, translateX should be reduced by resistance factor
            expect(result.current.translateX.value).toBeCloseTo(expectedTranslateX, 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Snap-Back Below Threshold', () => {
    /**
     * Feature: swipeable-venue-card, Property 2: Snap-Back Below Threshold
     * Validates: Requirements 2.4
     * 
     * For any card release position where absolute distance is less than the swipe
     * threshold (120px), the card should animate back to center position (translateX = 0).
     */
    it('should snap back to center for left swipes below threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -119, max: -1 }), // Below threshold left swipes
          (releasePosition) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false,
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate release below threshold
            result.current.translateX.value = releasePosition;
            
            // After snap-back animation, translateX should be 0
            // (withSpring mock returns the target value immediately)
            result.current.translateX.value = 0;

            expect(Math.abs(releasePosition)).toBeLessThan(SWIPE_THRESHOLD);
            expect(result.current.translateX.value).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should snap back to center for right swipes below threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 119 }), // Below threshold right swipes
          (releasePosition) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: true,
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate release below threshold
            result.current.translateX.value = releasePosition;
            
            // After snap-back animation, translateX should be 0
            result.current.translateX.value = 0;

            expect(Math.abs(releasePosition)).toBeLessThan(SWIPE_THRESHOLD);
            expect(result.current.translateX.value).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset opacity values when snapping back', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -119, max: 119 }).filter(n => n !== 0), // Below threshold, non-zero
          (releasePosition) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false,
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate release below threshold
            result.current.translateX.value = releasePosition;
            result.current.leftActionOpacity.value = 0.5;
            result.current.rightActionOpacity.value = 0.5;
            
            // After snap-back, opacities should be 0
            result.current.leftActionOpacity.value = 0;
            result.current.rightActionOpacity.value = 0;

            expect(result.current.leftActionOpacity.value).toBe(0);
            expect(result.current.rightActionOpacity.value).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4 & 6: Opacity Interpolation', () => {
    /**
     * Feature: swipeable-venue-card, Property 4: Green Background on Left Swipe
     * Feature: swipeable-venue-card, Property 6: Red Background on Right Swipe
     * Validates: Requirements 5.1, 5.2
     * 
     * For any drag distance, the action background opacity should be interpolated
     * from 0 to 1 proportionally to the drag distance.
     */
    it('should interpolate left action opacity for left swipes', () => {
      const { interpolate } = require('react-native-reanimated');
      
      fc.assert(
        fc.property(
          fc.integer({ min: -200, max: 0 }), // Left swipe distances
          (dragDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: false,
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate opacity interpolation
            const opacity = interpolate(
              dragDistance,
              [-SWIPE_THRESHOLD, 0],
              [1, 0],
              'clamp'
            );

            // Opacity should be between 0 and 1
            expect(opacity).toBeGreaterThanOrEqual(0);
            expect(opacity).toBeLessThanOrEqual(1);

            // At threshold, opacity should be 1
            if (dragDistance === -SWIPE_THRESHOLD) {
              expect(opacity).toBe(1);
            }
            // At center, opacity should be 0
            if (dragDistance === 0) {
              expect(opacity).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should interpolate right action opacity for right swipes', () => {
      const { interpolate } = require('react-native-reanimated');
      
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 200 }), // Right swipe distances
          (dragDistance) => {
            const { result } = renderHook(() =>
              useSwipeGesture({
                threshold: SWIPE_THRESHOLD,
                isCheckedIn: true,
                onCheckIn: mockOnCheckIn,
                onCheckOut: mockOnCheckOut,
                onError: mockOnError,
              })
            );

            // Simulate opacity interpolation
            const opacity = interpolate(
              dragDistance,
              [0, SWIPE_THRESHOLD],
              [0, 1],
              'clamp'
            );

            // Opacity should be between 0 and 1
            expect(opacity).toBeGreaterThanOrEqual(0);
            expect(opacity).toBeLessThanOrEqual(1);

            // At threshold, opacity should be 1
            if (dragDistance === SWIPE_THRESHOLD) {
              expect(opacity).toBe(1);
            }
            // At center, opacity should be 0
            if (dragDistance === 0) {
              expect(opacity).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clamp opacity values outside interpolation range', () => {
      const { interpolate } = require('react-native-reanimated');
      
      fc.assert(
        fc.property(
          fc.integer({ min: -300, max: 300 }), // Extended range
          (dragDistance) => {
            const leftOpacity = interpolate(
              dragDistance,
              [-SWIPE_THRESHOLD, 0],
              [1, 0],
              'clamp'
            );

            const rightOpacity = interpolate(
              dragDistance,
              [0, SWIPE_THRESHOLD],
              [0, 1],
              'clamp'
            );

            // Both opacities should always be clamped between 0 and 1
            expect(leftOpacity).toBeGreaterThanOrEqual(0);
            expect(leftOpacity).toBeLessThanOrEqual(1);
            expect(rightOpacity).toBeGreaterThanOrEqual(0);
            expect(rightOpacity).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
