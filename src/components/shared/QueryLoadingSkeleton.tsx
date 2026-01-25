/**
 * Query Loading Skeleton Component
 * 
 * Displays loading skeleton for first-time query loads (isLoading state).
 * Provides a shimmer animation effect while data is being fetched.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface QueryLoadingSkeletonProps {
  /**
   * Number of skeleton items to display
   * @default 3
   */
  count?: number;
  
  /**
   * Height of each skeleton item
   * @default 80
   */
  itemHeight?: number;
  
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
  
  /**
   * Variant of skeleton layout
   * @default 'list'
   */
  variant?: 'list' | 'card' | 'detail';
}

/**
 * QueryLoadingSkeleton Component
 * 
 * Shows animated skeleton placeholders during initial data load
 * 
 * @param count - Number of skeleton items to display
 * @param itemHeight - Height of each skeleton item
 * @param style - Custom container style
 * @param variant - Layout variant (list, card, or detail)
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useVenuesQuery();
 * 
 * if (isLoading) {
 *   return <QueryLoadingSkeleton count={5} variant="list" />;
 * }
 * 
 * return <VenueList venues={data} />;
 * ```
 */
export const QueryLoadingSkeleton: React.FC<QueryLoadingSkeletonProps> = ({
  count = 3,
  itemHeight = 80,
  style,
  variant = 'list',
}) => {
  const { theme } = useTheme();
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

  const renderListItem = (index: number) => (
    <View
      key={index}
      style={[
        styles.listItem,
        { height: itemHeight, backgroundColor: theme.colors.surface },
      ]}
    >
      <Animated.View
        style={[
          styles.listItemAvatar,
          { opacity, backgroundColor: theme.colors.border },
        ]}
      />
      <View style={styles.listItemContent}>
        <Animated.View
          style={[
            styles.listItemTitle,
            { opacity, backgroundColor: theme.colors.border },
          ]}
        />
        <Animated.View
          style={[
            styles.listItemSubtitle,
            { opacity, backgroundColor: theme.colors.border },
          ]}
        />
      </View>
    </View>
  );

  const renderCardItem = (index: number) => (
    <View
      key={index}
      style={[
        styles.cardItem,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <Animated.View
        style={[
          styles.cardImage,
          { opacity, backgroundColor: theme.colors.border },
        ]}
      />
      <View style={styles.cardContent}>
        <Animated.View
          style={[
            styles.cardTitle,
            { opacity, backgroundColor: theme.colors.border },
          ]}
        />
        <Animated.View
          style={[
            styles.cardSubtitle,
            { opacity, backgroundColor: theme.colors.border },
          ]}
        />
      </View>
    </View>
  );

  const renderDetailItem = () => (
    <View style={[styles.detailContainer, { backgroundColor: theme.colors.surface }]}>
      <Animated.View
        style={[
          styles.detailHeader,
          { opacity, backgroundColor: theme.colors.border },
        ]}
      />
      <View style={styles.detailContent}>
        <Animated.View
          style={[
            styles.detailTitle,
            { opacity, backgroundColor: theme.colors.border },
          ]}
        />
        <Animated.View
          style={[
            styles.detailSubtitle,
            { opacity, backgroundColor: theme.colors.border },
          ]}
        />
        <Animated.View
          style={[
            styles.detailText,
            { opacity, backgroundColor: theme.colors.border },
          ]}
        />
        <Animated.View
          style={[
            styles.detailText,
            { opacity, backgroundColor: theme.colors.border },
          ]}
        />
      </View>
    </View>
  );

  const renderItems = () => {
    switch (variant) {
      case 'card':
        return Array.from({ length: count }).map((_, index) => renderCardItem(index));
      case 'detail':
        return renderDetailItem();
      case 'list':
      default:
        return Array.from({ length: count }).map((_, index) => renderListItem(index));
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderItems()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // List variant styles
  listItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  listItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemTitle: {
    height: 18,
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  listItemSubtitle: {
    height: 14,
    borderRadius: 4,
    width: '50%',
  },
  
  // Card variant styles
  cardItem: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    height: 20,
    borderRadius: 4,
    marginBottom: 10,
    width: '70%',
  },
  cardSubtitle: {
    height: 16,
    borderRadius: 4,
    width: '50%',
  },
  
  // Detail variant styles
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    width: '100%',
    height: 250,
  },
  detailContent: {
    padding: 20,
  },
  detailTitle: {
    height: 28,
    borderRadius: 4,
    marginBottom: 12,
    width: '80%',
  },
  detailSubtitle: {
    height: 20,
    borderRadius: 4,
    marginBottom: 20,
    width: '60%',
  },
  detailText: {
    height: 16,
    borderRadius: 4,
    marginBottom: 10,
    width: '100%',
  },
});
