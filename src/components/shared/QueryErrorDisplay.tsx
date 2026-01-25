/**
 * Query Error Display Component
 * 
 * Displays error messages for failed queries with retry functionality.
 * Used when queries fail after all retry attempts.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface QueryErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
  message?: string;
}

/**
 * QueryErrorDisplay Component
 * 
 * Shows error message with optional retry button
 * 
 * @param error - The error object
 * @param onRetry - Callback function to retry the query
 * @param message - Custom error message (optional)
 */
export const QueryErrorDisplay: React.FC<QueryErrorDisplayProps> = ({
  error,
  onRetry,
  message,
}) => {
  const { theme } = useTheme();

  const errorMessage = message || error?.message || 'Something went wrong';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '20' }]}>
        <Text style={[styles.iconText, { color: theme.colors.error }]}>!</Text>
      </View>
      
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Unable to Load Data
      </Text>
      
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {errorMessage}
      </Text>
      
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
});
