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
      padding: { paddingHorizontal: 8, paddingVertical: 4 },
      borderRadius: 16,
    },
    medium: {
      iconSize: 14,
      textSize: 11,
      padding: { paddingHorizontal: 10, paddingVertical: 5 },
      borderRadius: 18,
    },
    large: {
      iconSize: 16,
      textSize: 12,
      padding: { paddingHorizontal: 12, paddingVertical: 6 },
      borderRadius: 20,
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
      { 
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: config.borderRadius,
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