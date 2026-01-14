import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Collection } from '../../types/social.types';
import type { Venue } from '../../types/venue.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.65;
const CARD_MARGIN = 12;

interface SharedCollectionCarouselProps {
  collection: Collection;
  venues: Venue[];
  onVenuePress: (venueId: string) => void;
  onFollowPress?: () => void;
  isFollowing?: boolean;
}

/**
 * SharedCollectionCarousel Component
 * 
 * Displays a horizontal scrolling carousel of venues from a friend's collection.
 * Shows collection name, follower count, and follow button.
 * 
 * Requirements: 5.4, 5.5, 5.11
 */
const SharedCollectionCarousel: React.FC<SharedCollectionCarouselProps> = ({
  collection,
  venues,
  onVenuePress,
  onFollowPress,
  isFollowing = false,
}) => {
  const { theme } = useTheme();

  if (venues.length === 0) {
    return null;
  }

  const renderVenueCard = ({ item: venue }: { item: Venue }) => {
    return (
      <TouchableOpacity
        style={[
          styles.venueCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            width: CARD_WIDTH,
          }
        ]}
        onPress={() => onVenuePress(venue.id)}
        activeOpacity={0.7}
      >
        {/* Venue Image */}
        <Image
          source={{
            uri: venue.image_url || 'https://via.placeholder.com/300x150'
          }}
          style={styles.venueImage}
        />

        {/* Venue Info */}
        <View style={styles.venueInfo}>
          <Text
            style={[
              styles.venueName,
              { color: theme.colors.text }
            ]}
            numberOfLines={1}
          >
            {venue.name}
          </Text>

          <View style={styles.venueMetadata}>
            <View style={styles.categoryBadge}>
              <Text
                style={[
                  styles.categoryText,
                  { color: theme.colors.primary }
                ]}
              >
                {venue.category}
              </Text>
            </View>

            {venue.rating && (
              <View style={styles.ratingContainer}>
                <Icon name="star" size={12} color="#FFB800" />
                <Text
                  style={[
                    styles.ratingText,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  {venue.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {venue.location && (
            <View style={styles.locationRow}>
              <Icon
                name="location-outline"
                size={12}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.locationText,
                  { color: theme.colors.textSecondary }
                ]}
                numberOfLines={1}
              >
                {venue.location}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Collection Icon */}
          <View
            style={[
              styles.collectionIcon,
              { backgroundColor: theme.colors.primary + '20' }
            ]}
          >
            <Icon
              name="albums-outline"
              size={20}
              color={theme.colors.primary}
            />
          </View>

          {/* Title and Stats */}
          <View style={styles.headerText}>
            <Text
              style={[
                styles.headerTitle,
                { color: theme.colors.text }
              ]}
              numberOfLines={1}
            >
              {collection.user?.name || 'Friend'}'s {collection.name}
            </Text>
            <View style={styles.statsRow}>
              <Icon
                name="albums-outline"
                size={12}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.statsText,
                  { color: theme.colors.textSecondary }
                ]}
              >
                {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
              </Text>
              {collection.follower_count !== undefined && collection.follower_count > 0 && (
                <>
                  <Text
                    style={[
                      styles.statsSeparator,
                      { color: theme.colors.textSecondary }
                    ]}
                  >
                    •
                  </Text>
                  <Icon
                    name="people-outline"
                    size={12}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statsText,
                      { color: theme.colors.textSecondary }
                    ]}
                  >
                    {collection.follower_count} {collection.follower_count === 1 ? 'follower' : 'followers'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Follow Button */}
        {onFollowPress && (
          <TouchableOpacity
            style={[
              styles.followButton,
              {
                backgroundColor: isFollowing
                  ? theme.colors.surface
                  : theme.colors.primary,
                borderColor: isFollowing
                  ? theme.colors.border
                  : theme.colors.primary,
              }
            ]}
            onPress={onFollowPress}
            activeOpacity={0.7}
          >
            <Icon
              name={isFollowing ? 'checkmark' : 'add'}
              size={16}
              color={isFollowing ? theme.colors.text : 'white'}
            />
            <Text
              style={[
                styles.followButtonText,
                {
                  color: isFollowing ? theme.colors.text : 'white',
                }
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      {collection.description && (
        <Text
          style={[
            styles.description,
            { color: theme.colors.textSecondary }
          ]}
          numberOfLines={2}
        >
          {collection.description}
        </Text>
      )}

      {/* Venue Carousel */}
      <FlatList
        data={venues}
        renderItem={renderVenueCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        decelerationRate="fast"
        snapToAlignment="start"
      />
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
    flex: 1,
    marginRight: 12,
  },
  collectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statsSeparator: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  followButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 16,
    marginBottom: 12,
    lineHeight: 20,
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  venueCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginRight: CARD_MARGIN,
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  venueInfo: {
    padding: 12,
  },
  venueName: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 6,
  },
  venueMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
});

export default SharedCollectionCarousel;
