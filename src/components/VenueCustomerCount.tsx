import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

interface VenueCustomerCountProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

const VenueCustomerCount: React.FC<VenueCustomerCountProps> = ({
  count,
  size = 'medium'
}) => {
  const { theme } = useTheme();

  const sizeConfig = {
    small: {
      iconSize: 12,
      textSize: 10,
      padding: { paddingHorizontal: 6, paddingVertical: 2 },
    },
    medium: {
      iconSize: 14,
      textSize: 11,
      padding: { paddingHorizontal: 8, paddingVertical: 3 },
    },
    large: {
      iconSize: 16,
      textSize: 12,
      padding: { paddingHorizontal: 10, paddingVertical: 4 },
    },
  };

  const config = sizeConfig[size];

  if (count === 0) {
    return null; // Don't show anything if no customers
  }

  return (
    <View style={[
      styles.container,
      config.padding,
      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
    ]}>
      <Icon 
        name="person" 
        size={config.iconSize} 
        color={theme.colors.textSecondary} 
      />
      <Text style={[
        styles.countText,
        { 
          color: theme.colors.textSecondary,
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  countText: {
    fontFamily: 'Inter-Medium',
    lineHeight: 14,
  },
});

export default VenueCustomerCount;