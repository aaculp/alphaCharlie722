/**
 * Swipe Animation Constants and Configuration
 * 
 * Defines constants and configuration for swipeable venue card animations
 * using React Native Reanimated 2
 */

import type { SwipeAnimationConfig } from '../../types/swipe.types';

/**
 * Minimum horizontal distance (in pixels) a card must be dragged to trigger an action
 */
export const SWIPE_THRESHOLD = 120;

/**
 * Maximum horizontal distance (in pixels) a card can be dragged
 * Prevents excessive pulling which can cause bouncy animations
 * Set to 120px to match the action threshold
 */
export const MAX_SWIPE_DISTANCE = 120;

/**
 * Factor applied to reduce movement for invalid swipe directions
 * Value between 0 and 1, where lower values provide more resistance
 */
export const RESISTANCE_FACTOR = 0.3;

/**
 * Spring animation configuration for snap-back behavior
 * Used when card is released before reaching threshold
 * 
 * Physics explanation:
 * For NO BOUNCE (critical damping), the relationship must be:
 * damping = 2 × √(stiffness × mass)
 * 
 * With stiffness: 500 and mass: 1.0:
 * Critical damping = 2 × √(500 × 1.0) = 2 × √500 ≈ 44.7
 * 
 * - damping (45): Critically damped - NO bounce, smooth snap-back
 *   This value is calculated to prevent oscillation completely
 * 
 * - stiffness (500): Controls spring tension - high for fast motion
 *   Range: 1 (very slow) to 1000+ (very fast)
 *   500 provides quick, responsive snap-back
 * 
 * - mass (1.0): Controls inertia - moderate mass for balanced feel
 *   Range: 0.1 (light, quick) to 10+ (heavy, slow)
 *   1.0 provides substantial feel
 * 
 * Requirement 8.4: Spring config optimized for consistent behavior regardless of pull distance
 */
export const SPRING_CONFIG = {
  damping: 45,
  stiffness: 500,
  mass: 1.0,
} as const;

/**
 * Opacity interpolation configuration for action backgrounds
 * Defines how background opacity changes based on drag distance
 */
export const OPACITY_RANGE = {
  start: 0,
  end: 1,
  inputRange: [0, SWIPE_THRESHOLD] as [number, number],
} as const;

/**
 * Icon visibility threshold as percentage of swipe threshold
 * Icon becomes visible at 50% of threshold distance
 */
export const ICON_VISIBILITY_THRESHOLD = 0.5;

/**
 * Label visibility threshold as percentage of swipe threshold
 * Label becomes visible at 75% of threshold distance
 */
export const LABEL_VISIBILITY_THRESHOLD = 0.75;

/**
 * Icon opacity interpolation range
 * Icon fades in between 50% and 60% of threshold
 */
export const ICON_OPACITY_RANGE = {
  start: SWIPE_THRESHOLD * 0.5,
  end: SWIPE_THRESHOLD * 0.6,
} as const;

/**
 * Label opacity interpolation range
 * Label fades in between 75% and 85% of threshold
 */
export const LABEL_OPACITY_RANGE = {
  start: SWIPE_THRESHOLD * 0.75,
  end: SWIPE_THRESHOLD * 0.85,
} as const;

/**
 * Gesture direction detection threshold (in pixels)
 * Minimum movement required to determine swipe direction
 */
export const DIRECTION_THRESHOLD = 10;

/**
 * Complete swipe animation configuration object
 */
export const SWIPE_ANIMATION_CONFIG: SwipeAnimationConfig = {
  threshold: SWIPE_THRESHOLD,
  resistanceFactor: RESISTANCE_FACTOR,
  springConfig: SPRING_CONFIG,
  opacityRange: OPACITY_RANGE,
} as const;

/**
 * Action completion animation duration (in milliseconds)
 * Duration for card to animate off-screen after action triggers
 */
export const ACTION_COMPLETE_DURATION = 200;

/**
 * Snap-back animation duration (in milliseconds)
 * Approximate duration for spring animation (actual duration varies with velocity)
 * 
 * Note: Spring animations are physics-based, so actual duration depends on:
 * - Initial velocity (faster swipes snap back quicker)
 * - Distance from center (further cards take longer)
 * - Spring configuration (damping, stiffness, mass)
 * 
 * Current config (damping: 1.0, stiffness: 150, mass: 0.7) provides:
 * - Very smooth, gentle snap-back
 * - No bounce/overshoot
 * - Heavy, deliberate feel (no rubber band effect)
 * 
 * Duration set to 0 for testing - spring physics will determine actual duration
 * 
 * Alternative spring configurations for different feels:
 * 
 * Very Bouncy (lots of overshoot):
 * { damping: 0.5, stiffness: 300, mass: 0.5 }
 * 
 * Balanced (moderate bounce):
 * { damping: 0.7, stiffness: 300, mass: 0.5 }
 * 
 * Some Bounce (2-3 bounces):
 * { damping: 0.85, stiffness: 350, mass: 0.4 }
 * 
 * Minimal Bounce (1-2 bounces):
 * { damping: 0.9, stiffness: 380, mass: 0.35 }
 * 
 * Almost No Bounce (1 tiny bounce max):
 * { damping: 0.95, stiffness: 400, mass: 0.3 }
 * 
 * No Overshoot, Very Smooth (gentle, weighted) - CURRENT:
 * { damping: 1.0, stiffness: 150, mass: 0.7 }
 */
export const SNAP_BACK_DURATION = 0;
