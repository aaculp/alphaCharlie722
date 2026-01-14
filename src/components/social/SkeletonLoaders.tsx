import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Skeleton loader for venue cards in carousels
 */
export const VenueCardSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.venueCard}>
      <Animated.View style={[styles.venueImage, { opacity }]} />
      <View style={styles.venueInfo}>
        <Animated.View style={[styles.venueName, { opacity }]} />
        <Animated.View style={[styles.venueDetails, { opacity }]} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for horizontal carousel
 */
export const CarouselSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.carousel}>
      {Array.from({ length: count }).map((_, index) => (
        <VenueCardSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton loader for activity feed items
 */
export const ActivityFeedItemSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.activityItem}>
      <Animated.View style={[styles.avatar, { opacity }]} />
      <View style={styles.activityContent}>
        <Animated.View style={[styles.activityText, { opacity }]} />
        <Animated.View style={[styles.activitySubtext, { opacity }]} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for activity feed
 */
export const ActivityFeedSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.activityFeed}>
      {Array.from({ length: count }).map((_, index) => (
        <ActivityFeedItemSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton loader for friend list items
 */
export const FriendListItemSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.friendItem}>
      <Animated.View style={[styles.avatar, { opacity }]} />
      <View style={styles.friendInfo}>
        <Animated.View style={[styles.friendName, { opacity }]} />
        <Animated.View style={[styles.friendSubtext, { opacity }]} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for friend list
 */
export const FriendListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <View style={styles.friendList}>
      {Array.from({ length: count }).map((_, index) => (
        <FriendListItemSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton loader for collection cards
 */
export const CollectionCardSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.collectionCard}>
      <Animated.View style={[styles.collectionImage, { opacity }]} />
      <View style={styles.collectionInfo}>
        <Animated.View style={[styles.collectionName, { opacity }]} />
        <Animated.View style={[styles.collectionDetails, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Venue Card Skeleton
  venueCard: {
    width: SCREEN_WIDTH * 0.7,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
  },
  venueInfo: {
    padding: 12,
  },
  venueName: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  venueDetails: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '50%',
  },

  // Carousel Skeleton
  carousel: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },

  // Activity Feed Skeleton
  activityFeed: {
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityText: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
    width: '80%',
  },
  activitySubtext: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '50%',
  },

  // Friend List Skeleton
  friendList: {
    paddingHorizontal: 16,
  },
  friendItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  friendName: {
    height: 18,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
    width: '60%',
  },
  friendSubtext: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '40%',
  },

  // Collection Card Skeleton
  collectionCard: {
    width: SCREEN_WIDTH * 0.6,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  collectionImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e0e0e0',
  },
  collectionInfo: {
    padding: 12,
  },
  collectionName: {
    height: 18,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
    width: '70%',
  },
  collectionDetails: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '50%',
  },
});
