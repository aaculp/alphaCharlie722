/**
 * Stale Data Indicator Component
 * 
 * Displays a subtle indicator when showing cached data that may be outdated.
 * Used when queries fail but cached data is available.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface StaleDataIndicatorProps {
  onRefresh?: () => void;
  message?: string;
}

/**
 * StaleDataIndicator Component
 * 
 * Shows a banner indicating data may be outdated with optional refresh action
 * 
 * @param onRefresh - Callback function to refresh the data
 * @param message - Custom message (optional)
 */
export const StaleDataIndicator: React.FC<StaleDataIndicatorProps> = ({
  onRefresh,
  message = 'Data may be outdated',
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.warning + '20' }]}>
      <View style={styles.content}>
        <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
        <Text style={[styles.message, { color: theme.colors.text }]}>
          {message}
        </Text>
      </View>
      
      {onRefresh && (
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Text style={[styles.refreshText, { color: theme.colors.primary }]}>
            Refresh
          </Text>
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
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  refreshButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  refreshText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
});
