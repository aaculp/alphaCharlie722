/**
 * Mutation Error Toast Component
 * 
 * Displays error messages for failed mutations as a toast notification.
 * Auto-dismisses after a timeout or can be manually dismissed.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface MutationErrorToastProps {
  error: Error | null;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

/**
 * MutationErrorToast Component
 * 
 * Shows a toast notification for mutation errors
 * 
 * @param error - The error object
 * @param visible - Whether the toast is visible
 * @param onDismiss - Callback to dismiss the toast
 * @param duration - Auto-dismiss duration in ms (default: 4000)
 */
export const MutationErrorToast: React.FC<MutationErrorToastProps> = ({
  error,
  visible,
  onDismiss,
  duration = 4000,
}) => {
  const { theme } = useTheme();
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Slide out
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible && translateY._value === -100) {
    return null;
  }

  const errorMessage = error?.message || 'An error occurred';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.error,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.message} numberOfLines={2}>
          {errorMessage}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
});
