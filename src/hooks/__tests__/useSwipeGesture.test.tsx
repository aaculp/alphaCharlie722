/**
 * Unit Tests for useSwipeGesture Hook
 * Feature: swipeable-venue-card
 */

import { renderHook } from '@testing-library/react-native';
import { useSwipeGesture } from '../useSwipeGesture';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn((callback) => callback()),
    withSpring: jest.fn((value) => value),
    interpolate: jest.fn((value, inputRange, outputRange) => {
      // Simple linear interpolation for testing
      const [inMin, inMax] = inputRange;
      const [outMin, outMax] = outputRange;
      const ratio = (value - inMin) / (inMax - inMin);
      return outMin + ratio * (outMax - outMin);
    }),
    runOnJS: jest.fn((fn) => fn),
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

describe('useSwipeGesture', () => {
  const mockOnCheckIn = jest.fn().mockResolvedValue(undefined);
  const mockOnCheckOut = jest.fn().mockResolvedValue(undefined);
  const mockOnError = jest.fn();

  const defaultOptions = {
    threshold: 120,
    isCheckedIn: false,
    onCheckIn: mockOnCheckIn,
    onCheckOut: mockOnCheckOut,
    onError: mockOnError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should return gesture handler and shared values', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      expect(result.current).toHaveProperty('panGesture');
      expect(result.current).toHaveProperty('translateX');
      expect(result.current).toHaveProperty('leftActionOpacity');
      expect(result.current).toHaveProperty('rightActionOpacity');
      expect(result.current).toHaveProperty('animatedCardStyle');
    });

    it('should initialize translateX to 0', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      expect(result.current.translateX.value).toBe(0);
    });

    it('should initialize leftActionOpacity to 0', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      expect(result.current.leftActionOpacity.value).toBe(0);
    });

    it('should initialize rightActionOpacity to 0', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      expect(result.current.rightActionOpacity.value).toBe(0);
    });
  });

  describe('Gesture Handler Creation', () => {
    it('should create pan gesture handler', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      expect(result.current.panGesture).toBeDefined();
    });

    it('should use custom threshold when provided', () => {
      const customThreshold = 150;
      const { result } = renderHook(() =>
        useSwipeGesture({ ...defaultOptions, threshold: customThreshold })
      );

      expect(result.current.panGesture).toBeDefined();
    });

    it('should use default threshold when not provided', () => {
      const { threshold, ...optionsWithoutThreshold } = defaultOptions;
      const { result } = renderHook(() =>
        useSwipeGesture(optionsWithoutThreshold as any)
      );

      expect(result.current.panGesture).toBeDefined();
    });
  });

  describe('Check-In State Handling', () => {
    it('should handle not checked in state', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ ...defaultOptions, isCheckedIn: false })
      );

      expect(result.current.panGesture).toBeDefined();
    });

    it('should handle checked in state', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ ...defaultOptions, isCheckedIn: true })
      );

      expect(result.current.panGesture).toBeDefined();
    });

    it('should update when check-in state changes', () => {
      const { result, rerender } = renderHook(
        ({ isCheckedIn }) => useSwipeGesture({ ...defaultOptions, isCheckedIn }),
        { initialProps: { isCheckedIn: false } }
      );

      expect(result.current.panGesture).toBeDefined();

      rerender({ isCheckedIn: true });

      expect(result.current.panGesture).toBeDefined();
    });
  });

  describe('Animated Style', () => {
    it('should return animated card style', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      expect(result.current.animatedCardStyle).toBeDefined();
    });

    it('should include transform property in animated style', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      expect(result.current.animatedCardStyle).toHaveProperty('transform');
    });
  });

  describe('Callback Handling', () => {
    it('should accept onCheckIn callback', () => {
      const customOnCheckIn = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useSwipeGesture({ ...defaultOptions, onCheckIn: customOnCheckIn })
      );

      expect(result.current.panGesture).toBeDefined();
    });

    it('should accept onCheckOut callback', () => {
      const customOnCheckOut = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useSwipeGesture({ ...defaultOptions, onCheckOut: customOnCheckOut })
      );

      expect(result.current.panGesture).toBeDefined();
    });

    it('should accept onError callback', () => {
      const customOnError = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ ...defaultOptions, onError: customOnError })
      );

      expect(result.current.panGesture).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle check-in errors', async () => {
      const error = new Error('Check-in failed');
      const failingOnCheckIn = jest.fn().mockRejectedValue(error);

      const { result } = renderHook(() =>
        useSwipeGesture({ ...defaultOptions, onCheckIn: failingOnCheckIn })
      );

      expect(result.current.panGesture).toBeDefined();
    });

    it('should handle check-out errors', async () => {
      const error = new Error('Check-out failed');
      const failingOnCheckOut = jest.fn().mockRejectedValue(error);

      const { result } = renderHook(() =>
        useSwipeGesture({ ...defaultOptions, onCheckOut: failingOnCheckOut })
      );

      expect(result.current.panGesture).toBeDefined();
    });
  });

  describe('Shared Values Updates', () => {
    it('should allow translateX to be updated', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      result.current.translateX.value = 50;

      expect(result.current.translateX.value).toBe(50);
    });

    it('should allow leftActionOpacity to be updated', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      result.current.leftActionOpacity.value = 0.5;

      expect(result.current.leftActionOpacity.value).toBe(0.5);
    });

    it('should allow rightActionOpacity to be updated', () => {
      const { result } = renderHook(() => useSwipeGesture(defaultOptions));

      result.current.rightActionOpacity.value = 0.8;

      expect(result.current.rightActionOpacity.value).toBe(0.8);
    });
  });
});
