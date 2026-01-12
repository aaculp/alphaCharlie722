import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useEngagementColor } from '../../hooks/useEngagementColor';

/**
 * VenueCustomerCount - Displays customer count with person icon and customizable background colors
 * 
 * Available variants:
 * - 'themed': Uses glassmorphism theme colors (default)
 * - 'traffic': Uses OTW traffic light colors (red/yellow/green based on capacity)
 * - 'primary': Uses theme primary color
 * - 'success': Uses theme success color (green)
 * - 'warning': Uses theme warning color (orange)
 * - 'error': Uses theme error color (red)
 */
interface VenueCustomerCountProps {
  count: number;
  maxCapacity?: number; // Added to support traffic light colors
  size?: 'small' | 'medium' | 'large';
  variant?: 'themed' | 'traffic' | 'primary' | 'success' | 'warning' | 'error';
}

const VenueCustomerCount: React.FC<VenueCustomerCountProps> = ({
  count,
  maxCapacity = 100, // Default capacity for traffic light calculation
  size = 'medium',
  variant = 'traffic' // Default to traffic light colors
}) => {
  const { theme, isDark } = useTheme();
  const engagementColor = useEngagementColor(count, maxCapacity);

  const sizeConfig = {
    small: {
      iconSize: 14,
      textSize: 12,
      padding: { paddingHorizontal: 12, paddingVertical: 6 },
      borderRadius: 18,
      minWidth: 60,
    },
    medium: {
      iconSize: 16,
      textSize: 13,
      padding: { paddingHorizontal: 14, paddingVertical: 7 },
      borderRadius: 20,
      minWidth: 70,
    },
    large: {
      iconSize: 18,
      textSize: 14,
      padding: { paddingHorizontal: 16, paddingVertical: 8 },
      borderRadius: 22,
      minWidth: 80,
    },
  };

  const config = sizeConfig[size];

  // Choose background style based on variant
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'traffic':
        // Use OTW traffic light colors
        return {
          backgroundColor: engagementColor.backgroundColor,
          borderColor: engagementColor.borderColor,
        };
      case 'primary':
        return {
          backgroundColor: theme.colors.primary + '40',
          borderColor: theme.colors.primary + '60',
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success + '40',
          borderColor: theme.colors.success + '60',
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning + '40',
          borderColor: theme.colors.warning + '60',
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error + '40',
          borderColor: theme.colors.error + '60',
        };
      default: // 'themed'
        return {
          backgroundColor: isDark 
            ? 'rgba(20, 20, 20, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
        };
    }
  };

  const backgroundStyle = getBackgroundStyle();

  return (
    <View style={[
      styles.container,
      config.padding,
      { 
        ...backgroundStyle,
        borderRadius: config.borderRadius,
        minWidth: config.minWidth,
        justifyContent: 'center',
      }
    ]}>
      <Icon 
        name="person" 
        size={config.iconSize} 
        color="white" 
      />
      <Text style={[
        styles.countText,
        { 
          color: 'white',
          fontSize: config.textSize,
        }
      ]}>
        {count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  countText: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    lineHeight: 14,
  },
});

export default VenueCustomerCount;