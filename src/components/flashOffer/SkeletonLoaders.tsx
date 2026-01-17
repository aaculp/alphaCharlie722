import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

/**
 * Skeleton loader components for Flash Offers
 * Provides loading placeholders with shimmer animation
 */

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
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
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton loader for FlashOfferCard
 */
export const FlashOfferCardSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.offerCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Skeleton width="70%" height={24} borderRadius={4} style={{ marginBottom: 12 }} />
      <Skeleton width="50%" height={16} borderRadius={4} style={{ marginBottom: 16 }} />
      <Skeleton width="40%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
      <View style={styles.skeletonRow}>
        <Skeleton width="60%" height={16} borderRadius={4} />
      </View>
      <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 8 }} />
    </View>
  );
};

/**
 * Skeleton loader for offer list items
 */
export const OfferListItemSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.listItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.listItemHeader}>
        <View style={{ flex: 1 }}>
          <Skeleton width="80%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={14} borderRadius={4} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.listItemStats}>
        <Skeleton width="30%" height={14} borderRadius={4} />
        <Skeleton width="30%" height={14} borderRadius={4} />
        <Skeleton width="30%" height={14} borderRadius={4} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for claim list items
 */
export const ClaimListItemSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.claimCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.claimHeader}>
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width="50%" height={14} borderRadius={4} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <View style={styles.claimBody}>
        <View style={{ flex: 1 }}>
          <Skeleton width={40} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width={120} height={28} borderRadius={4} />
        </View>
        <Skeleton width={80} height={28} borderRadius={8} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for detail screens
 */
export const DetailScreenSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.detailContainer}>
      {/* Header Card */}
      <View
        style={[
          styles.detailCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Skeleton width="90%" height={28} borderRadius={4} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={16} borderRadius={4} style={{ marginBottom: 16 }} />
        <Skeleton width={100} height={32} borderRadius={16} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Skeleton width={32} height={32} borderRadius={16} style={{ marginBottom: 8 }} />
            <Skeleton width={40} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={12} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Info Card */}
      <View
        style={[
          styles.detailCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Skeleton width="40%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={16} borderRadius={4} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for horizontal scrolling offer list
 */
export const HorizontalOfferListSkeleton: React.FC = () => {
  return (
    <View style={styles.horizontalList}>
      {[1, 2].map((i) => (
        <FlashOfferCardSkeleton key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  offerCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
  },
  listItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listItemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  claimCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  claimBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailContainer: {
    padding: 20,
  },
  detailCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  horizontalList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
});
