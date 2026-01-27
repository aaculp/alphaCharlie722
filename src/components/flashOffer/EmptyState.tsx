import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

interface EmptyStateProps {
  message?: string;
  icon?: string;
}

/**
 * EmptyState component displays a message when no flash offers are available
 * 
 * Features:
 * - Customizable message and icon
 * - Matches FlashOfferCard dimensions to prevent layout shift
 * - Muted colors for non-intrusive display
 * - Centered layout with icon and text
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No flash offers available right now',
  icon = 'flash-outline',
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Icon name={icon} size={48} color={theme.colors.textSecondary} style={styles.icon} />
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>
      <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>
        Check back soon for limited-time deals
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    minHeight: 180, // Approximate height of FlashOfferCard to prevent layout shift
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  subtext: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 16,
  },
});
