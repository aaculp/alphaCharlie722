import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getActivityLevel } from '../../utils/formatting';
import { useEngagementColor } from '../../hooks/useEngagementColor';

/**
 * VenueEngagementChip - Displays venue activity level with customizable background colors
 * 
 * Available variants:
 * - 'themed': Uses glassmorphism theme colors (default dark/light backgrounds)
 * - 'colored': Uses activity level colors (dynamic based on activity)
 * - 'traffic': Uses OTW traffic light colors (red/yellow/green based on capacity)
 * - 'primary': Uses theme primary color
 * - 'success': Uses theme success color (green)
 * - 'warning': Uses theme warning color (orange)
 * - 'error': Uses theme error color (red)
 */
interface VenueEngagementChipProps {
  currentCheckIns: number;
  maxCapacity: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'themed' | 'colored' | 'traffic' | 'primary' | 'success' | 'warning' | 'error';
}

const VenueEngagementChip: React.FC<VenueEngagementChipProps> = ({
  currentCheckIns,
  maxCapacity,
  size = 'medium',
  variant = 'traffic', // Default to traffic light colors
}) => {
  const { theme, isDark } = useTheme();
  const activityLevel = getActivityLevel(currentCheckIns, maxCapacity);
  const engagementColor = useEngagementColor(currentCheckIns, maxCapacity);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 12,
          minWidth: 60,
        };
      case 'large':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          minWidth: 80,
        };
      default: // medium
        return {
          paddingHorizontal: 14,
          paddingVertical: 7,
          fontSize: 13,
          minWidth: 70,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Choose background style based on variant
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'themed':
        // Use glassmorphism theme colors
        return {
          backgroundColor: isDark 
            ? 'rgba(20, 20, 20, 0.8)' 
            : 'rgba(245, 245, 245, 0.95)', // Less transparent, darker background
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.15)', // Darker border
        };
      case 'traffic':
        // Use OTW traffic light colors
        return {
          backgroundColor: engagementColor.backgroundColor,
          borderColor: engagementColor.borderColor,
        };
      case 'primary':
        // Use theme primary color
        return {
          backgroundColor: theme.colors.primary + '40',
          borderColor: theme.colors.primary + '60',
        };
      case 'success':
        // Use theme success color
        return {
          backgroundColor: theme.colors.success + '40',
          borderColor: theme.colors.success + '60',
        };
      case 'warning':
        // Use theme warning color
        return {
          backgroundColor: theme.colors.warning + '40',
          borderColor: theme.colors.warning + '60',
        };
      case 'error':
        // Use theme error color
        return {
          backgroundColor: theme.colors.error + '40',
          borderColor: theme.colors.error + '60',
        };
      default: // 'colored'
        // Use activity level colors
        return {
          backgroundColor: activityLevel.color + '40',
          borderColor: activityLevel.color + '60',
        };
    }
  };

  const backgroundStyle = getBackgroundStyle();

  return (
    <View
      style={[
        styles.chip,
        {
          ...backgroundStyle,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          minWidth: sizeStyles.minWidth,
          justifyContent: 'center',
        }
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: 'white', // Force white text for visibility
            fontSize: sizeStyles.fontSize,
          }
        ]}
      >
        {activityLevel.emoji} {activityLevel.level}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
});

export default VenueEngagementChip;
