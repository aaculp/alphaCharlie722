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
import type { SocialProfile } from '../../types/social.types';
import type { Venue } from '../../types/venue.types';
import { CarouselSkeleton } from './SkeletonLoaders';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_MARGIN = 12;

interface FriendVenueCarouselProps {
  friend: SocialProfile;
  venues: Venue[];
  mutualFavorites?: Set<string>; // Set of venue IDs that are mutual favorites
  onVenuePress: (venueId: string) => void;
  onFriendPress?: () => void;
  loading?: boolean;
}

/**
 * FriendVenueCarousel Component
 * 
 * Displays a horizontal scrolling carousel of venues favorited by a friend.
 * Shows friend's profile picture in header and mutual favorites badge.
 * 
 * Requirements: 3.1, 4.1
 */
const FriendVenueCarousel: React.FC<FriendVenueCarouselProps> = ({
  friend,
  venues,
  mutualFavorites = new Set(),
  onVenuePress,
  onFriendPress,
  loading = false,
}) => {
  const { theme } = useTheme();

  // Show skeleton loader while loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: theme.colors.primary + '30' }
              ]}
            />
          </View>
          <View style={styles.headerText}>
            <View
              style={[
                styles.skeletonTitle,
                { backgroundColor: theme.colors.border }
              ]}
            />
            <View
              style={[
                styles.skeletonSubtitle,
                { backgroundColor: theme.colors.border }
              ]}
            />
          </View>
        </View>
        <CarouselSkeleton count={3} />
      </View>
    );
  }

  if (venues.length === 0) {
    return null;
  }

  const renderVenueCard = ({ item: venue }: { item: Venue }) => {
    const isMutualFavorite = mutualFavorites.has(venue.id);

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

        {/* Mutual Favorite Badge */}
        {isMutualFavorite && (
          <View
            style={[
              styles.mutualBadge,
              {
                backgroundColor: theme.colors.primary,
              }
            ]}
          >
            <Icon name="heart" size={12} color="white" />
            <Text style={styles.mutualBadgeText}>Mutual</Text>
          </View>
        )}

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
      <TouchableOpacity
        style={styles.header}
        onPress={onFriendPress}
        activeOpacity={onFriendPress ? 0.7 : 1}
        disabled={!onFriendPress}
      >
        {/* Friend Avatar */}
        <View style={styles.avatarContainer}>
          {friend.avatar_url ? (
            <Image
              source={{ uri: friend.avatar_url }}
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
                size={20}
                color={theme.colors.primary}
              />
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.headerText}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text }
            ]}
          >
            Places {friend.name || 'Friend'} Loves
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary }
            ]}
          >
            {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
          </Text>
        </View>

        {/* Chevron */}
        {onFriendPress && (
          <Icon
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        )}
      </TouchableOpacity>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
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
    height: 150,
    resizeMode: 'cover',
  },
  mutualBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mutualBadgeText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  venueInfo: {
    padding: 12,
  },
  venueName: {
    fontSize: 16,
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
  skeletonTitle: {
    height: 18,
    width: '70%',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    height: 14,
    width: '40%',
    borderRadius: 4,
  },
});

export default FriendVenueCarousel;
