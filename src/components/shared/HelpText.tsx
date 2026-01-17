import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

interface HelpTextProps {
  text: string;
  type?: 'info' | 'tip' | 'warning';
  icon?: string;
}

/**
 * HelpText Component
 * 
 * Displays inline help text with an icon for form fields and features.
 * Provides contextual guidance without requiring user interaction.
 */
export const HelpText: React.FC<HelpTextProps> = ({
  text,
  type = 'info',
  icon,
}) => {
  const { theme } = useTheme();

  const getIconName = (): string => {
    if (icon) return icon;
    switch (type) {
      case 'tip':
        return 'bulb-outline';
      case 'warning':
        return 'warning-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getIconColor = (): string => {
    switch (type) {
      case 'tip':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  const getBackgroundColor = (): string => {
    switch (type) {
      case 'tip':
        return '#4CAF50' + '15';
      case 'warning':
        return '#FF9800' + '15';
      default:
        return theme.colors.primary + '15';
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
      ]}
    >
      <Icon name={getIconName()} size={16} color={getIconColor()} />
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    marginTop: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
});
