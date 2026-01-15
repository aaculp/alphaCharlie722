/**
 * StatisticsCard Component
 * 
 * Displays user engagement statistics with:
 * - Check-ins count with location icon
 * - Favorites count with heart icon
 * - Friends count with people icon
 * 
 * Requirements: 4.5, 4.6, 4.7, 4.8
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import type { StatisticsCardProps } from '../../types/profile.types';

/**
 * StatisticsCard component for Main Info tab
 * 
 * @param checkInsCount - Total number of check-ins
 * @param favoritesCount - Total number of favorites
 * @param friendsCount - Total number of friends
 */
export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  checkInsCount,
  favoritesCount,
  friendsCount,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.text,
        },
      ]}
      testID="statistics-card"
    >
      {/* Check-ins Stat */}
      <View style={styles.statItem} testID="checkins-stat">
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${theme.colors.primary}20` },
          ]}
        >
          <Icon
            name="location"
            size={24}
            color={theme.colors.primary}
            testID="checkins-icon"
          />
        </View>
        <View style={styles.statTextContainer}>
          <Text
            style={[
              styles.statValue,
              {
                color: theme.colors.text,
                fontFamily: theme.fonts.primary.bold,
              },
            ]}
            testID="checkins-count"
          >
            {checkInsCount}
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.secondary.regular,
              },
            ]}
          >
            Check-ins
          </Text>
        </View>
      </View>

      {/* Favorites Stat */}
      <View style={styles.statItem} testID="favorites-stat">
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: '#EF444420' },
          ]}
        >
          <Icon
            name="heart"
            size={24}
            color="#EF4444"
            testID="favorites-icon"
          />
        </View>
        <View style={styles.statTextContainer}>
          <Text
            style={[
              styles.statValue,
              {
                color: theme.colors.text,
                fontFamily: theme.fonts.primary.bold,
              },
            ]}
            testID="favorites-count"
          >
            {favoritesCount}
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.secondary.regular,
              },
            ]}
          >
            Favorites
          </Text>
        </View>
      </View>

      {/* Friends Stat */}
      <View style={styles.statItem} testID="friends-stat">
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: '#10B98120' },
          ]}
        >
          <Icon
            name="people"
            size={24}
            color="#10B981"
            testID="friends-icon"
          />
        </View>
        <View style={styles.statTextContainer}>
          <Text
            style={[
              styles.statValue,
              {
                color: theme.colors.text,
                fontFamily: theme.fonts.primary.bold,
              },
            ]}
            testID="friends-count"
          >
            {friendsCount}
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.secondary.regular,
              },
            ]}
          >
            Friends
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: RESPONSIVE_SPACING.cardPadding,
    borderRadius: 12,
    marginBottom: RESPONSIVE_SPACING.cardMargin,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.cardPadding,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.elementGap + 8,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
  },
});
