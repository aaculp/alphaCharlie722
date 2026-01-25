import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface VenueCategoryBadgeProps {
  category: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

/**
 * VenueCategoryBadge - Reusable badge component for displaying venue categories
 * 
 * Features:
 * - Multiple size options (xsmall, small, medium, large)
 * - Color variants (primary, secondary, success, warning, error)
 * - Consistent styling across the app
 * 
 * Usage:
 * <VenueCategoryBadge category="Coffee Shop" size="small" variant="primary" />
 */
const VenueCategoryBadge: React.FC<VenueCategoryBadgeProps> = ({
  category,
  size = 'small',
  variant = 'primary',
}) => {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'xsmall':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 9,
          borderRadius: 6,
        };
      case 'small':
        return {
          paddingHorizontal: 8,
          paddingVertical: 3,
          fontSize: 10,
          borderRadius: 8,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 5,
          fontSize: 12,
          borderRadius: 10,
        };
      default: // medium
        return {
          paddingHorizontal: 10,
          paddingVertical: 4,
          fontSize: 11,
          borderRadius: 9,
        };
    }
  };

  const getColorStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.textSecondary + '20',
          borderColor: theme.colors.textSecondary + '40',
          textColor: theme.colors.textSecondary,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success + '20',
          borderColor: theme.colors.success + '40',
          textColor: theme.colors.success,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning + '20',
          borderColor: theme.colors.warning + '40',
          textColor: theme.colors.warning,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error + '20',
          borderColor: theme.colors.error + '40',
          textColor: theme.colors.error,
        };
      default: // primary
        return {
          backgroundColor: theme.colors.primary + '20',
          borderColor: theme.colors.primary + '40',
          textColor: theme.colors.primary,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const colorStyles = getColorStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colorStyles.backgroundColor,
          borderColor: colorStyles.borderColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
        }
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: colorStyles.textColor,
            fontSize: sizeStyles.fontSize,
          }
        ]}
      >
        {category}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
  },
});

export default VenueCategoryBadge;
