/**
 * Unit Tests for useHapticFeedback Hook
 * Feature: swipeable-venue-card
 */

import { renderHook } from '@testing-library/react-native';
import { useHapticFeedback } from '../useHapticFeedback';
import * as haptics from '../../utils/haptics';

// Mock the haptics utility functions
jest.mock('../../utils/haptics', () => ({
  triggerMediumHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
  triggerLightHaptic: jest.fn(),
  triggerSelectionHaptic: jest.fn(),
}));

describe('useHapticFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should return all haptic feedback functions', () => {
      const { result } = renderHook(() => useHapticFeedback());

      expect(result.current).toHaveProperty('triggerSuccess');
      expect(result.current).toHaveProperty('triggerError');
      expect(result.current).toHaveProperty('triggerWarning');
      expect(result.current).toHaveProperty('triggerSelection');
    });

    it('should return functions that are callable', () => {
      const { result } = renderHook(() => useHapticFeedback());

      expect(typeof result.current.triggerSuccess).toBe('function');
      expect(typeof result.current.triggerError).toBe('function');
      expect(typeof result.current.triggerWarning).toBe('function');
      expect(typeof result.current.triggerSelection).toBe('function');
    });
  });

  describe('triggerSuccess', () => {
    it('should call triggerMediumHaptic when triggered', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerSuccess();

      expect(haptics.triggerMediumHaptic).toHaveBeenCalledTimes(1);
    });

    it('should call triggerMediumHaptic multiple times when triggered multiple times', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerSuccess();
      result.current.triggerSuccess();
      result.current.triggerSuccess();

      expect(haptics.triggerMediumHaptic).toHaveBeenCalledTimes(3);
    });
  });

  describe('triggerError', () => {
    it('should call triggerErrorHaptic when triggered', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerError();

      expect(haptics.triggerErrorHaptic).toHaveBeenCalledTimes(1);
    });

    it('should call triggerErrorHaptic multiple times when triggered multiple times', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerError();
      result.current.triggerError();

      expect(haptics.triggerErrorHaptic).toHaveBeenCalledTimes(2);
    });
  });

  describe('triggerWarning', () => {
    it('should call triggerLightHaptic when triggered', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerWarning();

      expect(haptics.triggerLightHaptic).toHaveBeenCalledTimes(1);
    });

    it('should call triggerLightHaptic multiple times when triggered multiple times', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerWarning();
      result.current.triggerWarning();
      result.current.triggerWarning();

      expect(haptics.triggerLightHaptic).toHaveBeenCalledTimes(3);
    });
  });

  describe('triggerSelection', () => {
    it('should call triggerSelectionHaptic when triggered', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerSelection();

      expect(haptics.triggerSelectionHaptic).toHaveBeenCalledTimes(1);
    });

    it('should call triggerSelectionHaptic multiple times when triggered multiple times', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerSelection();
      result.current.triggerSelection();

      expect(haptics.triggerSelectionHaptic).toHaveBeenCalledTimes(2);
    });
  });

  describe('Multiple Haptic Patterns', () => {
    it('should trigger different haptic patterns independently', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerSuccess();
      result.current.triggerError();
      result.current.triggerWarning();
      result.current.triggerSelection();

      expect(haptics.triggerMediumHaptic).toHaveBeenCalledTimes(1);
      expect(haptics.triggerErrorHaptic).toHaveBeenCalledTimes(1);
      expect(haptics.triggerLightHaptic).toHaveBeenCalledTimes(1);
      expect(haptics.triggerSelectionHaptic).toHaveBeenCalledTimes(1);
    });

    it('should not trigger other haptics when one is called', () => {
      const { result } = renderHook(() => useHapticFeedback());

      result.current.triggerSuccess();

      expect(haptics.triggerMediumHaptic).toHaveBeenCalledTimes(1);
      expect(haptics.triggerErrorHaptic).not.toHaveBeenCalled();
      expect(haptics.triggerLightHaptic).not.toHaveBeenCalled();
      expect(haptics.triggerSelectionHaptic).not.toHaveBeenCalled();
    });
  });

  describe('Function Stability', () => {
    it('should return stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useHapticFeedback());

      const firstSuccess = result.current.triggerSuccess;
      const firstError = result.current.triggerError;
      const firstWarning = result.current.triggerWarning;
      const firstSelection = result.current.triggerSelection;

      rerender();

      expect(result.current.triggerSuccess).toBe(firstSuccess);
      expect(result.current.triggerError).toBe(firstError);
      expect(result.current.triggerWarning).toBe(firstWarning);
      expect(result.current.triggerSelection).toBe(firstSelection);
    });
  });
});
