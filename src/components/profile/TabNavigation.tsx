/**
 * TabNavigation Component
 * 
 * Provides tab switching interface between Main Info and Settings:
 * - Two tabs: Main Info (default) and Settings
 * - Active tab indicator with bottom border
 * - Bold text styling for active tab
 * - Handles tab press events and triggers content change
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import type { TabNavigationProps, TabType } from '../../types/profile.types';

/**
 * TabNavigation component for profile screen
 * 
 * @param activeTab - Currently active tab ('main' or 'settings')
 * @param onTabChange - Callback when tab is pressed with new tab type
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { theme } = useTheme();

  const handleTabPress = (tab: TabType) => {
    if (tab !== activeTab) {
      onTabChange(tab);
      // Announce tab change for screen readers (Requirement 8.2)
      const tabName = tab === 'main' ? 'Main Info' : 'Settings';
      AccessibilityInfo.announceForAccessibility(`${tabName} tab selected`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID="tab-navigation">
      {/* Main Info Tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handleTabPress('main')}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="Main Info tab"
        accessibilityHint="Double tap to view main info"
        accessibilityState={{ selected: activeTab === 'main' }}
        testID="main-info-tab"
      >
        <Text
          style={[
            styles.tabText,
            {
              color: activeTab === 'main' ? theme.colors.text : theme.colors.textSecondary,
              fontFamily: activeTab === 'main' 
                ? theme.fonts.secondary.semiBold 
                : theme.fonts.secondary.medium,
            }
          ]}
        >
          Main Info
        </Text>
        {activeTab === 'main' && (
          <View
            style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]}
            testID="main-info-indicator"
          />
        )}
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handleTabPress('settings')}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="Settings tab"
        accessibilityHint="Double tap to view settings"
        accessibilityState={{ selected: activeTab === 'settings' }}
        testID="settings-tab"
      >
        <Text
          style={[
            styles.tabText,
            {
              color: activeTab === 'settings' ? theme.colors.text : theme.colors.textSecondary,
              fontFamily: activeTab === 'settings' 
                ? theme.fonts.secondary.semiBold 
                : theme.fonts.secondary.medium,
            }
          ]}
        >
          Settings
        </Text>
        {activeTab === 'settings' && (
          <View
            style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]}
            testID="settings-indicator"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.sectionHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: RESPONSIVE_SPACING.elementGap + 8,
    alignItems: 'center',
    position: 'relative',
    minHeight: 44, // Accessibility minimum touch target (Requirement 7.3, 8.4)
  },
  tabText: {
    fontSize: 16,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
