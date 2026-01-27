/**
 * ConnectionWarningBanner Component
 * 
 * Displays a warning banner when real-time connection is unavailable.
 * Shows at the top of the screen with a clear message and optional retry action.
 * 
 * Features:
 * - Non-blocking warning (user can still view cached data)
 * - Clear call-to-action for manual refresh
 * - Accessible with screen reader support
 * - Consistent styling with app theme
 * 
 * @module ConnectionWarningBanner
 * @category Components
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for ConnectionWarningBanner component
 */
export interface ConnectionWarningBannerProps {
  /** Optional callback when user taps the banner to retry */
  onRetry?: () => void;
  /** Optional custom message (defaults to standard warning) */
  message?: string;
}

/**
 * ConnectionWarningBanner Component
 * 
 * Displays a warning banner indicating real-time updates are unavailable.
 * Non-blocking - user can still view cached data and interact with the app.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ConnectionWarningBanner />
 * 
 * // With retry callback
 * <ConnectionWarningBanner 
 *   onRetry={() => {
 *     console.log('User tapped retry');
 *     // Trigger manual refresh
 *   }}
 * />
 * 
 * // With custom message
 * <ConnectionWarningBanner 
 *   message="Connection lost. Reconnecting..."
 *   onRetry={handleRetry}
 * />
 * ```
 */
export const ConnectionWarningBanner: React.FC<ConnectionWarningBannerProps> = ({
  onRetry,
  message = 'Real-time updates unavailable',
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.warning || '#FFA500' },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`Warning: ${message}. ${onRetry ? 'Tap to refresh manually.' : ''}`}
    >
      <View style={styles.content}>
        <Icon name="warning-outline" size={20} color="#fff" style={styles.icon} />
        <Text style={[styles.message, { fontFamily: theme.fonts.secondary.semiBold }]}>
          {message}
        </Text>
      </View>
      
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Tap to refresh manually"
          accessibilityHint="Attempts to reconnect and fetch latest data"
        >
          <Icon name="refresh-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  retryButton: {
    padding: 8,
    marginLeft: 8,
  },
});

