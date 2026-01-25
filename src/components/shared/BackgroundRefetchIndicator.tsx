/**
 * Background Refetch Indicator Component
 * 
 * Displays a subtle loading indicator when queries are refetching in the background (isFetching state).
 * Shows at the top of the screen without blocking content.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BackgroundRefetchIndicatorProps {
  /**
   * Whether the indicator should be visible
   */
  isVisible: boolean;
  
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
  
  /**
   * Position of the indicator
   * @default 'top'
   */
  position?: 'top' | 'bottom';
}

/**
 * BackgroundRefetchIndicator Component
 * 
 * Shows a subtle animated bar when data is being refetched in the background
 * 
 * @param isVisible - Whether to show the indicator
 * @param style - Custom container style
 * @param position - Position of the indicator (top or bottom)
 * 
 * @example
 * ```tsx
 * const { data, isFetching } = useVenuesQuery();
 * 
 * return (
 *   <View>
 *     <BackgroundRefetchIndicator isVisible={isFetching} />
 *     <VenueList venues={data} />
 *   </View>
 * );
 * ```
 */
export const BackgroundRefetchIndicator: React.FC<BackgroundRefetchIndicatorProps> = ({
  isVisible,
  style,
  position = 'top',
}) => {
  const { theme } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animate progress bar
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Fade out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Reset progress
      progressAnim.setValue(0);
    }
  }, [isVisible, progressAnim, opacityAnim]);

  const translateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  if (!isVisible && opacityAnim._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'bottom' ? styles.bottom : styles.top,
        { opacity: opacityAnim },
        style,
      ]}
    >
      <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
        <Animated.View
          style={[
            styles.progress,
            {
              backgroundColor: theme.colors.primary,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  track: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    width: '30%',
  },
});
