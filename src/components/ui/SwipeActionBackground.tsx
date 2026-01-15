import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue, interpolate } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { ICON_OPACITY_RANGE, LABEL_OPACITY_RANGE } from '../../utils/animations/swipeAnimations';

interface SwipeActionBackgroundProps {
  /** Direction of the swipe action */
  direction: 'left' | 'right';
  
  /** Animated opacity value from shared value */
  opacity: SharedValue<number>;
  
  /** Animated translateX value for progressive reveal */
  translateX: SharedValue<number>;
  
  /** Ionicons icon name to display */
  icon: string;
  
  /** Text label to display (e.g., "Arriving" or "Leaving") */
  label: string;
  
  /** Background color for the action */
  backgroundColor: string;
  
  /** Icon color (default: white) */
  iconColor?: string;
  
  /** Label text color (default: white) */
  labelColor?: string;
}

/**
 * SwipeActionBackground Component
 * 
 * Displays a colored background with icon and label that appears behind
 * the venue card during swipe gestures. Provides visual feedback for
 * check-in (left swipe, green) and check-out (right swipe, red) actions.
 * 
 * Features:
 * - Absolutely positioned behind the card
 * - Animated opacity based on swipe distance
 * - Progressive reveal: icon appears at 50% threshold, label at 75%
 * - Icon positioned 20px from edge
 * - Label positioned 60px from edge
 * - Supports both left and right swipe directions
 * 
 * Progressive Reveal Thresholds:
 * - Icon: Fades in between 50%-60% of threshold (60px-72px for default 120px threshold)
 * - Label: Fades in between 75%-85% of threshold (90px-102px for default 120px threshold)
 * 
 * Usage:
 * 
 * // Left swipe (check-in)
 * <SwipeActionBackground
 *   direction="left"
 *   opacity={leftActionOpacity}
 *   translateX={translateX}
 *   icon="checkmark-circle"
 *   label="Arriving"
 *   backgroundColor="#10B981"
 * />
 * 
 * // Right swipe (check-out)
 * <SwipeActionBackground
 *   direction="right"
 *   opacity={rightActionOpacity}
 *   translateX={translateX}
 *   icon="log-out-outline"
 *   label="Leaving"
 *   backgroundColor="#EF4444"
 * />
 */
const SwipeActionBackground: React.FC<SwipeActionBackgroundProps> = React.memo(({
  direction,
  opacity,
  translateX,
  icon,
  label,
  backgroundColor,
  iconColor = 'white',
  labelColor = 'white',
}) => {
  // Animated style that applies the opacity from the shared value (Requirement 8.1, 8.2)
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
    };
  }, [opacity]);

  // Animated style for icon with progressive reveal (Requirement 8.1, 8.2)
  // Icon fades in between 50% and 60% of threshold (60px to 72px)
  const animatedIconStyle = useAnimatedStyle(() => {
    'worklet';
    const distance = Math.abs(translateX.value);
    const iconOpacity = interpolate(
      distance,
      [ICON_OPACITY_RANGE.start, ICON_OPACITY_RANGE.end],
      [0, 1],
      'clamp'
    );
    
    return {
      opacity: iconOpacity,
    };
  }, [translateX]);

  // Animated style for label with progressive reveal (Requirement 8.1, 8.2)
  // Label fades in between 75% and 85% of threshold (90px to 102px)
  const animatedLabelStyle = useAnimatedStyle(() => {
    'worklet';
    const distance = Math.abs(translateX.value);
    const labelOpacity = interpolate(
      distance,
      [LABEL_OPACITY_RANGE.start, LABEL_OPACITY_RANGE.end],
      [0, 1],
      'clamp'
    );
    
    return {
      opacity: labelOpacity,
    };
  }, [translateX]);

  // Determine alignment based on direction
  // Swap alignment: left swipe shows on right, right swipe shows on left
  const isLeft = direction === 'left';
  const alignItems = isLeft ? 'flex-end' : 'flex-start';
  const paddingHorizontal = 20;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          alignItems,
          paddingHorizontal,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {/* Icon with progressive reveal */}
        <Animated.View style={animatedIconStyle}>
          <Icon name={icon} size={48} color={iconColor} style={styles.icon} />
        </Animated.View>
        
        {/* Label with progressive reveal */}
        <Animated.Text style={[styles.label, { color: labelColor }, animatedLabelStyle]}>
          {label}
        </Animated.Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    borderRadius: 16,
  },
  content: {
    alignItems: 'center',
    gap: 12, // Increased gap between icon and label
  },
  icon: {
    marginBottom: 4,
    // Add shadow for better visibility
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  label: {
    fontSize: 18, // Increased from 16
    fontWeight: '700', // Increased from 600
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1, // Increased from 0.5
    textTransform: 'uppercase',
    // Add shadow for better visibility
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default SwipeActionBackground;
