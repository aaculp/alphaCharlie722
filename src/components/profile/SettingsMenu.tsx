/**
 * SettingsMenu Component
 * 
 * Displays settings options with:
 * - Notifications option with icon
 * - Privacy option with icon
 * - Security option with icon
 * - Help & Support option with icon
 * - Log Out option with red styling
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import type { SettingsMenuProps, SettingType } from '../../types/profile.types';

interface SettingOption {
  type: SettingType;
  icon: string;
  label: string;
  isDestructive?: boolean;
}

const SETTINGS_OPTIONS: SettingOption[] = [
  {
    type: 'notifications',
    icon: 'notifications-outline',
    label: 'Notifications',
  },
  {
    type: 'privacy',
    icon: 'lock-closed-outline',
    label: 'Privacy',
  },
  {
    type: 'security',
    icon: 'shield-checkmark-outline',
    label: 'Security',
  },
  {
    type: 'help',
    icon: 'help-circle-outline',
    label: 'Help & Support',
  },
  {
    type: 'logout',
    icon: 'log-out-outline',
    label: 'Log Out',
    isDestructive: true,
  },
];

/**
 * SettingsMenu component for Settings tab
 * 
 * @param onSettingPress - Callback when a setting option is pressed
 */
export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  onSettingPress,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.text,
        },
      ]}
      testID="settings-menu"
    >
      {SETTINGS_OPTIONS.map((option, index) => (
        <React.Fragment key={option.type}>
          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                borderBottomColor: theme.colors.border,
                borderBottomWidth: index < SETTINGS_OPTIONS.length - 1 ? 1 : 0,
              },
            ]}
            onPress={() => onSettingPress(option.type)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityHint={`Double tap to open ${option.label.toLowerCase()} settings`}
            testID={`setting-${option.type}`}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: option.isDestructive
                    ? 'rgba(239, 68, 68, 0.1)'
                    : theme.isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)', // Darker background
                },
              ]}
            >
              <Icon
                name={option.icon}
                size={24}
                color={option.isDestructive ? '#EF4444' : theme.colors.text}
              />
            </View>

            {/* Label */}
            <Text
              style={[
                styles.label,
                {
                  color: option.isDestructive ? '#EF4444' : theme.colors.text,
                  fontFamily: theme.fonts.secondary.medium,
                },
              ]}
              testID={`setting-label-${option.type}`}
            >
              {option.label}
            </Text>

            {/* Chevron */}
            <Icon
              name="chevron-forward"
              size={20}
              color={option.isDestructive ? '#EF4444' : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.elementGap + 8,
    paddingHorizontal: RESPONSIVE_SPACING.sectionHorizontal,
    minHeight: 64, // Ensures accessibility minimum touch target (44pt + padding)
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.elementGap + 8,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
});
