import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCheckInTime } from '../../utils/formatting/time';
import type { ActivityFeedEntry } from '../../types/social.types';
import { ActivityFeedSkeleton } from './SkeletonLoaders';
import { queryClient } from '../../lib/queryClient';
import { queryKeys } from '../../lib/queryKeys';
import { ProfileService } from '../../services/api/profile';
import { VenueService } from '../../services/api/venues';

interface FriendActivityFeedProps {
  activities: ActivityFeedEntry[];
  onActivityPress: (activity: ActivityFeedEntry) => void;
  onSeeMorePress?: () => void;
  maxItems?: number;
  loading?: boolean;
}

/**
 * FriendActivityFeed Component
 * 
 * Displays a compact vertical list of recent friend activities.
 * Shows 3-5 most recent items with "See More" button to expand.
 * 
 * Requirements: 3.1, 3.11
 */
const FriendActivityFeed: React.FC<FriendActivityFeedProps> = ({
  activities,
  onActivityPress,
  onSeeMorePress,
  maxItems = 5,
  loading = false,
}) => {
  const { theme } = useTheme();

  // Show skeleton loader while loading
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Friend Activity
        </Text>
        <ActivityFeedSkeleton count={maxItems} />
      </View>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  const displayedActivities = activities.slice(0, maxItems);
  const hasMore = activities.length > maxItems;

  const getActivityIcon = (activityType: string): string => {
    switch (activityType) {
      case 'checkin':
        return 'location';
      case 'favorite':
        return 'heart';
      case 'collection_created':
      case 'collection_updated':
        return 'albums';
      case 'group_outing':
        return 'people';
      default:
        return 'flash';
    }
  };

  const getActivityText = (activity: ActivityFeedEntry): string => {
    const userName = activity.user?.name || 'Someone';
    const venueName = activity.venue?.name || 'a venue';

    switch (activity.activity_type) {
      case 'checkin':
        return `checked in at ${venueName}`;
      case 'favorite':
        return `favorited ${venueName}`;
      case 'collection_created':
        return `created a collection "${activity.collection?.name || 'Untitled'}"`;
      case 'collection_updated':
        return `updated "${activity.collection?.name || 'a collection'}"`;
      case 'group_outing':
        return `created a group outing at ${venueName}`;
      default:
        return 'had an activity';
    }
  };

  const getActivityColor = (activityType: string): string => {
    switch (activityType) {
      case 'checkin':
        return '#5B9BFF';
      case 'favorite':
        return '#FF69B4';
      case 'collection_created':
      case 'collection_updated':
        return '#6B73FF';
      case 'group_outing':
        return '#52C41A';
      default:
        return theme.colors.primary;
    }
  };

  const renderActivityItem = ({ item: activity }: { item: ActivityFeedEntry }) => {
    const activityColor = getActivityColor(activity.activity_type);
    const activityIcon = getActivityIcon(activity.activity_type);
    const activityText = getActivityText(activity);
    const formattedTime = formatCheckInTime(activity.created_at);

    // Prefetch user profile and venue details when user starts pressing
    const handlePressIn = () => {
      // Prefetch user profile
      if (activity.user?.id) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.users.profile(activity.user.id),
          queryFn: () => ProfileService.getProfile(activity.user.id),
          staleTime: 30000,
        });
      }
      
      // Prefetch venue details if activity is venue-related
      if (activity.venue?.id) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.venues.detail(activity.venue.id),
          queryFn: () => VenueService.getVenueById(activity.venue.id),
          staleTime: 30000,
        });
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }
        ]}
        onPress={() => onActivityPress(activity)}
        onPressIn={handlePressIn}
        activeOpacity={0.7}
      >
        {/* Friend Avatar */}
        <View style={styles.avatarContainer}>
          {activity.user?.avatar_url ? (
            <Image
              source={{ uri: activity.user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: theme.colors.primary + '30' }
              ]}
            >
              <Icon
                name="person"
                size={16}
                color={theme.colors.primary}
              />
            </View>
          )}

          {/* Activity Type Badge */}
          <View
            style={[
              styles.activityBadge,
              { backgroundColor: activityColor }
            ]}
          >
            <Icon
              name={activityIcon}
              size={10}
              color="white"
            />
          </View>
        </View>

        {/* Activity Content */}
        <View style={styles.activityContent}>
          <Text
            style={[
              styles.activityText,
              { color: theme.colors.text }
            ]}
            numberOfLines={2}
          >
            <Text style={styles.userName}>
              {activity.user?.name || 'Someone'}
            </Text>
            {' '}
            {activityText}
          </Text>

          <Text
            style={[
              styles.timeText,
              { color: theme.colors.textSecondary }
            ]}
          >
            {formattedTime}
          </Text>
        </View>

        {/* Chevron */}
        <Icon
          name="chevron-forward"
          size={16}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIcon,
              { backgroundColor: theme.colors.primary + '20' }
            ]}
          >
            <Icon
              name="flash"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text }
            ]}
          >
            Friend Activity
          </Text>
        </View>
      </View>

      {/* Activity List */}
      <FlatList
        data={displayedActivities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />

      {/* See More Button */}
      {hasMore && onSeeMorePress && (
        <TouchableOpacity
          style={[
            styles.seeMoreButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={onSeeMorePress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.seeMoreText,
              { color: theme.colors.primary }
            ]}
          >
            See More
          </Text>
          <Icon
            name="chevron-down"
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
    lineHeight: 20,
  },
  userName: {
    fontFamily: 'Inter-SemiBold',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  seeMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});

export default FriendActivityFeed;
