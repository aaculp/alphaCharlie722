/**
 * FlashOfferNotificationBanner
 * 
 * In-app notification banner for flash offer notifications.
 * Displays when a flash offer notification is received while app is in foreground.
 * Shows offer preview and allows tap to view details.
 * 
 * Requirements: Task 12.3 - Show in-app notification
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface FlashOfferNotificationBannerProps {
  visible: boolean;
  title: string;
  body: string;
  onPress: () => void;
  onDismiss: () => void;
  autoHideDuration?: number;
}

const FlashOfferNotificationBanner: React.FC<FlashOfferNotificationBannerProps> = ({
  visible,
  title,
  body,
  onPress,
  onDismiss,
  autoHideDuration = 5000,
}) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto-hide after duration
      autoHideTimer.current = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Clear auto-hide timer
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
        autoHideTimer.current = null;
      }
    }

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [visible, slideAnim, autoHideDuration]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    handleDismiss();
    onPress();
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.banner,
          {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            shadowColor: '#000',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Flash Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Icon name="flash" size={24} color="#FFFFFF" />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {body}
          </Text>
        </View>

        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
  },
});

export default FlashOfferNotificationBanner;
