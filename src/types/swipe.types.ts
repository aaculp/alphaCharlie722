/**
 * Swipe gesture type definitions for venue card interactions
 */

/**
 * Direction of the swipe gesture
 */
export type SwipeDirection = 'left' | 'right' | null;

/**
 * Current state of the swipe gesture
 */
export interface SwipeState {
  /** Whether the user is currently performing a swipe gesture */
  isActive: boolean;
  
  /** Direction of the current swipe (null if no swipe in progress) */
  direction: SwipeDirection;
  
  /** Current horizontal drag distance in pixels */
  distance: number;
  
  /** Velocity of the gesture in pixels per second */
  velocity: number;
  
  /** Whether the swipe has reached the action threshold */
  hasReachedThreshold: boolean;
}

/**
 * Configuration for swipe animations
 */
export interface SwipeAnimationConfig {
  /** Minimum distance in pixels to trigger an action */
  threshold: number;
  
  /** Factor applied to reduce movement for invalid swipe directions (0-1) */
  resistanceFactor: number;
  
  /** Spring animation configuration for snap-back */
  springConfig: {
    /** Damping ratio for spring animation (0-1) */
    damping: number;
    
    /** Stiffness of the spring */
    stiffness: number;
    
    /** Mass of the animated object */
    mass: number;
  };
  
  /** Opacity interpolation configuration */
  opacityRange: {
    /** Starting opacity value */
    start: number;
    
    /** Ending opacity value */
    end: number;
    
    /** Input range for interpolation [min, max] */
    inputRange: [number, number];
  };
}
