import { Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

/**
 * Haptic Feedback Utility
 * 
 * Provides consistent haptic feedback across the app
 * Enhances user experience with tactile responses
 */

// Haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Trigger light haptic feedback
 * Use for: Button taps, selections, toggles
 */
export const triggerLightHaptic = (): void => {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  } else {
    // Android fallback
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  }
};

/**
 * Trigger medium haptic feedback
 * Use for: Important actions, confirmations
 */
export const triggerMediumHaptic = (): void => {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  } else {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  }
};

/**
 * Trigger heavy haptic feedback
 * Use for: Critical actions, errors, deletions
 */
export const triggerHeavyHaptic = (): void => {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  } else {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  }
};

/**
 * Trigger success haptic feedback
 * Use for: Successful operations, completions
 */
export const triggerSuccessHaptic = (): void => {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  } else {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  }
};

/**
 * Trigger warning haptic feedback
 * Use for: Warnings, cautions
 */
export const triggerWarningHaptic = (): void => {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
  } else {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  }
};

/**
 * Trigger error haptic feedback
 * Use for: Errors, failures
 */
export const triggerErrorHaptic = (): void => {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
  } else {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  }
};

/**
 * Trigger selection haptic feedback
 * Use for: Selecting items in lists, changing tabs
 */
export const triggerSelectionHaptic = (): void => {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
  } else {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  }
};
