/**
 * FollowersCard Component
 * 
 * Displays follower information with:
 * - Follower count
 * - Avatar row showing up to 4 recent followers
 * - "Invite friend" button
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import type { FollowersCardProps } from '../../types/profile.types';

const AVATAR_SIZE = 40;
const AVATAR_OVERLAP = 12;
const MAX_AVATARS = 4;

/**
 * FollowersCard component for Main Info tab
 * 
 * @param followerCount - Total number of followers
 * @param recentFollowers - Array of recent follower profiles (up to 4 displayed)
 * @param onInvitePress - Callback when invite button is pressed
 */
export const FollowersCard: React.FC<FollowersCardProps> = ({
  followerCount,
  recentFollowers,
  onInvitePress,
}) => {
  const { theme } = useTheme();

  // Limit to max 4 avatars
  const displayedFollowers = recentFollowers.slice(0, MAX_AVATARS);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.text,
        },
      ]}
      testID="followers-card"
    >
      {/* Follower Count */}
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.followerCount,
            {
              color: theme.colors.text,
              fontFamily: theme.fonts.primary.bold,
            },
          ]}
          testID="follower-count"
        >
          {followerCount}
        </Text>
        <Text
          style={[
            styles.followerLabel,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fonts.secondary.regular,
            },
          ]}
        >
          {followerCount === 1 ? 'Follower' : 'Followers'}
        </Text>
      </View>

      {/* Avatar Row */}
      {displayedFollowers.length > 0 && (
        <View style={styles.avatarRow} testID="avatar-row">
          {displayedFollowers.map((follower, index) => (
            <View
              key={follower.id}
              style={[
                styles.avatarContainer,
                {
                  marginLeft: index > 0 ? -AVATAR_OVERLAP : 0,
                  zIndex: MAX_AVATARS - index,
                },
              ]}
              testID={`avatar-${index}`}
            >
              {follower.avatar_url ? (
                <Image
                  source={{ uri: follower.avatar_url }}
                  style={[
                    styles.avatar,
                    { borderColor: theme.colors.surface },
                  ]}
                  testID={`avatar-image-${index}`}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.surface,
                    },
                  ]}
                  testID={`avatar-placeholder-${index}`}
                >
                  <Icon
                    name="person"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Invite Friend Button */}
      <TouchableOpacity
        style={[
          styles.inviteButton,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={onInvitePress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Invite friend"
        accessibilityHint="Double tap to invite a friend to follow you"
        testID="invite-button"
      >
        <Icon name="person-add-outline" size={20} color="#FFFFFF" />
        <Text
          style={[
            styles.inviteButtonText,
            { fontFamily: theme.fonts.secondary.semiBold },
          ]}
        >
          Invite friend
        </Text>
      </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: RESPONSIVE_SPACING.elementGap + 8,
  },
  followerCount: {
    fontSize: 32,
    marginRight: 8,
  },
  followerLabel: {
    fontSize: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.elementGap + 8,
    height: AVATAR_SIZE,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_SPACING.buttonVertical,
    paddingHorizontal: RESPONSIVE_SPACING.buttonHorizontal,
    borderRadius: 8,
    minHeight: 44, // Accessibility minimum touch target
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
});
