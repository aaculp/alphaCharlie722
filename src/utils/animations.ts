import { Animated, Easing } from 'react-native';

/**
 * Animation Utilities
 * 
 * Provides reusable animation configurations for consistent UI transitions
 */

/**
 * Standard animation duration (in ms)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
} as const;

/**
 * Standard easing functions
 */
export const EASING = {
  EASE_IN: Easing.in(Easing.ease),
  EASE_OUT: Easing.out(Easing.ease),
  EASE_IN_OUT: Easing.inOut(Easing.ease),
  SPRING: Easing.elastic(1),
  BOUNCE: Easing.bounce,
} as const;

/**
 * Fade in animation
 * @param animatedValue - Animated value to animate
 * @param duration - Animation duration in ms
 * @param callback - Optional callback when animation completes
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.NORMAL,
  callback?: () => void
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Fade out animation
 * @param animatedValue - Animated value to animate
 * @param duration - Animation duration in ms
 * @param callback - Optional callback when animation completes
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.NORMAL,
  callback?: () => void
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Scale in animation (pop effect)
 * @param animatedValue - Animated value to animate
 * @param duration - Animation duration in ms
 */
export const scaleIn = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.NORMAL
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Scale out animation
 * @param animatedValue - Animated value to animate
 * @param duration - Animation duration in ms
 */
export const scaleOut = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.FAST
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Slide in from right animation
 * @param animatedValue - Animated value to animate
 * @param duration - Animation duration in ms
 */
export const slideInRight = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.NORMAL
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Slide out to right animation
 * @param animatedValue - Animated value to animate
 * @param toValue - Target value (typically screen width)
 * @param duration - Animation duration in ms
 */
export const slideOutRight = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATION.NORMAL
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Slide in from bottom animation (for modals/bottom sheets)
 * @param animatedValue - Animated value to animate
 * @param duration - Animation duration in ms
 */
export const slideInBottom = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.NORMAL
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue: 0,
    friction: 9,
    tension: 50,
    useNativeDriver: true,
  });
};

/**
 * Slide out to bottom animation (for modals/bottom sheets)
 * @param animatedValue - Animated value to animate
 * @param toValue - Target value (typically screen height)
 * @param duration - Animation duration in ms
 */
export const slideOutBottom = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATION.NORMAL
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Pulse animation (for attention-grabbing elements)
 * @param animatedValue - Animated value to animate
 * @param duration - Animation duration in ms
 */
export const pulse = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.SLOW
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.1,
      duration: duration / 2,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration / 2,
      easing: EASING.EASE_IN,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Shake animation (for errors)
 * Reduced to 2 shakes for a quicker, less distracting effect
 * @param animatedValue - Animated value to animate
 */
export const shake = (animatedValue: Animated.Value): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Stagger animation for lists
 * @param animations - Array of animations to stagger
 * @param staggerDelay - Delay between each animation in ms
 */
export const stagger = (
  animations: Animated.CompositeAnimation[],
  staggerDelay: number = 50
): Animated.CompositeAnimation => {
  return Animated.stagger(staggerDelay, animations);
};

/**
 * Parallel animation (run multiple animations simultaneously)
 * @param animations - Array of animations to run in parallel
 */
export const parallel = (
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.parallel(animations);
};

/**
 * Sequence animation (run animations one after another)
 * @param animations - Array of animations to run in sequence
 */
export const sequence = (
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
  return Animated.sequence(animations);
};

/**
 * Success celebration animation (scale + fade)
 * Perfect for claim confirmations and success states
 * @param scaleValue - Animated value for scale
 * @param fadeValue - Animated value for fade
 */
export const successCelebration = (
  scaleValue: Animated.Value,
  fadeValue: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.parallel([
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }),
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 300,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Countdown pulse animation (for urgent timers)
 * Creates a pulsing effect to draw attention
 * @param scaleValue - Animated value for scale
 */
export const countdownPulse = (
  scaleValue: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.05,
        duration: 800,
        easing: EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 800,
        easing: EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Slide in from top animation (for banners/notifications)
 * @param animatedValue - Animated value to animate
 * @param duration - Animation duration in ms
 */
export const slideInTop = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.NORMAL
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue: 0,
    friction: 9,
    tension: 50,
    useNativeDriver: true,
  });
};

/**
 * Slide out to top animation (for banners/notifications)
 * @param animatedValue - Animated value to animate
 * @param toValue - Target value (typically negative screen height)
 * @param duration - Animation duration in ms
 */
export const slideOutTop = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATION.NORMAL
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Bounce in animation (for cards and important elements)
 * @param scaleValue - Animated value for scale
 */
export const bounceIn = (
  scaleValue: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(scaleValue, {
      toValue: 1.1,
      duration: 200,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Rotate animation (for loading spinners or refresh indicators)
 * @param rotateValue - Animated value for rotation (0 to 1)
 * @param duration - Animation duration in ms
 */
export const rotate = (
  rotateValue: Animated.Value,
  duration: number = 1000
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.timing(rotateValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};
