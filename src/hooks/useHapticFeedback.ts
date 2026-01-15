import { useCallback } from 'react';
import {
  triggerMediumHaptic,
  triggerErrorHaptic,
  triggerLightHaptic,
  triggerSelectionHaptic,
} from '../utils/haptics';

/**
 * Return type for useHapticFeedback hook
 */
export interface UseHapticFeedbackReturn {
  /**
   * Trigger success haptic feedback
   * 
   * **Use for:** Successful check-in/check-out actions
   * 
   * **Pattern:** Medium impact - provides satisfying tactile confirmation
   * 
   * **Requirements:** 3.5, 4.5, 9.5
   * 
   * @example
   * ```tsx
   * const { triggerSuccess } = useHapticFeedback();
   * 
   * const handleCheckIn = async () => {
   *   await checkInToVenue();
   *   triggerSuccess(); // Confirm successful action
   * };
   * ```
   */
  triggerSuccess: () => void;

  /**
   * Trigger error haptic feedback
   * 
   * **Use for:** Failed actions, network errors, validation errors
   * 
   * **Pattern:** Notification error - distinct pattern to indicate failure
   * 
   * **Requirements:** 9.3, 9.5
   * 
   * @example
   * ```tsx
   * const { triggerError } = useHapticFeedback();
   * 
   * const handleCheckIn = async () => {
   *   try {
   *     await checkInToVenue();
   *   } catch (error) {
   *     triggerError(); // Alert user to failure
   *     showErrorMessage(error.message);
   *   }
   * };
   * ```
   */
  triggerError: () => void;

  /**
   * Trigger warning haptic feedback
   * 
   * **Use for:** Invalid swipe directions, resistance feedback, boundary conditions
   * 
   * **Pattern:** Light impact - subtle feedback for invalid actions
   * 
   * **Requirements:** 7.3
   * 
   * @example
   * ```tsx
   * const { triggerWarning } = useHapticFeedback();
   * 
   * // In gesture handler
   * if (!isValidSwipeDirection) {
   *   triggerWarning(); // Subtle feedback for invalid swipe
   * }
   * ```
   */
  triggerWarning: () => void;

  /**
   * Trigger selection haptic feedback
   * 
   * **Use for:** Threshold reached, action about to trigger, UI state changes
   * 
   * **Pattern:** Selection feedback - indicates a selection or state change
   * 
   * **Requirements:** 2.4
   * 
   * @example
   * ```tsx
   * const { triggerSelection } = useHapticFeedback();
   * 
   * // In gesture handler
   * if (Math.abs(translateX) >= threshold) {
   *   triggerSelection(); // Indicate threshold reached
   * }
   * ```
   */
  triggerSelection: () => void;
}

/**
 * useHapticFeedback Hook
 * 
 * Custom hook for haptic feedback in swipeable venue card interactions.
 * Provides consistent tactile responses for different user actions.
 * 
 * **Features:**
 * - Four distinct haptic patterns for different interaction types
 * - Consistent feedback across iOS and Android
 * - Memoized callbacks for performance
 * - Simple, intuitive API
 * 
 * **Haptic Patterns:**
 * - **Success**: Medium impact - for successful actions
 * - **Error**: Notification error - for failed actions
 * - **Warning**: Light impact - for invalid actions
 * - **Selection**: Selection feedback - for threshold/state changes
 * 
 * **Requirements Satisfied:**
 * - Requirement 3.5: Haptic feedback on check-in success
 * - Requirement 4.5: Haptic feedback on check-out success
 * - Requirement 7.3: Warning feedback for invalid swipes
 * - Requirement 9.3: Error feedback for failed actions
 * - Requirement 9.5: Different haptic patterns for success vs error
 * 
 * @returns Object containing haptic feedback trigger functions
 * 
 * @example
 * ```tsx
 * // Basic usage in a component
 * const { triggerSuccess, triggerError, triggerWarning } = useHapticFeedback();
 * 
 * const handleSwipeCheckIn = async () => {
 *   try {
 *     await checkInToVenue(venueId);
 *     triggerSuccess(); // Confirm successful check-in
 *   } catch (error) {
 *     triggerError(); // Alert user to failure
 *     showErrorToast(error.message);
 *   }
 * };
 * 
 * // Usage in gesture handler
 * const handleInvalidSwipe = () => {
 *   triggerWarning(); // Subtle feedback for invalid direction
 *   animateCardBack();
 * };
 * 
 * // Usage for threshold feedback
 * const handleThresholdReached = () => {
 *   triggerSelection(); // Indicate action will trigger
 * };
 * ```
 * 
 * @example
 * ```tsx
 * // Complete swipe gesture example
 * function SwipeableCard() {
 *   const { triggerSuccess, triggerError, triggerWarning } = useHapticFeedback();
 *   
 *   const handleCheckIn = async () => {
 *     try {
 *       await api.checkIn(venueId);
 *       triggerSuccess();
 *     } catch (err) {
 *       triggerError();
 *     }
 *   };
 *   
 *   const gesture = useSwipeGesture({
 *     onCheckIn: handleCheckIn,
 *     onInvalidSwipe: triggerWarning,
 *   });
 *   
 *   return <GestureDetector gesture={gesture}>...</GestureDetector>;
 * }
 * ```
 */
export function useHapticFeedback(): UseHapticFeedbackReturn {
  // Success haptic - medium impact for successful check-in/check-out
  const triggerSuccess = useCallback(() => {
    triggerMediumHaptic();
  }, []);

  // Error haptic - notification error for failed actions
  const triggerError = useCallback(() => {
    triggerErrorHaptic();
  }, []);

  // Warning haptic - light impact for invalid swipe directions
  const triggerWarning = useCallback(() => {
    triggerLightHaptic();
  }, []);

  // Selection haptic - selection feedback for threshold reached
  const triggerSelection = useCallback(() => {
    triggerSelectionHaptic();
  }, []);

  return {
    triggerSuccess,
    triggerError,
    triggerWarning,
    triggerSelection,
  };
}
