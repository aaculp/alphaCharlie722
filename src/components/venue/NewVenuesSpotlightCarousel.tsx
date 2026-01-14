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
import type { Venue } from '../../types/venue.types';
import { CarouselSkeleton } from '../social/SkeletonLoaders';
import { calculateDaysSinceSignup, formatSignupText } from '../../utils/formatting/venue';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_MARGIN = 12;

interface NewVenuesSpotlightCarouselProps {
  venues: Venue[];
  onVenuePress: (venueId: string) => void;
  loading?: boolean;
  error?: Error | null;
  userLocation?: { latitude: number; longitude: number } | null;
}

/**
 * NewVenuesSpotlightCarousel Component
 * 
 * Displays a horizontal scrolling carousel of newly signed up venues.
 * Shows "NEW" badge and days since signup for each venue.
 * 
 * Requirements: 1.1, 1.5, 7.1, 7.2
 */
const NewVenuesSpotlightCarousel: React.FC<NewVenuesSpotlightCarouselProps> = ({
  venues,
  onVenuePress,
  loading = false,
  error = null,
  userLocation,
}) => {
  const { theme } = useTheme();

  // Return null if there's an error (graceful degradation)
  if (error) {
    return null;
  }

  // Show skeleton loader while loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primary + '20' }
            ]}
          >
            <Icon
              name="sparkles"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.headerText}>
            <View
              style={[
                styles.skeletonTitle,
                { backgroundColor: theme.colors.border }
              ]}
            />
          </View>
        </View>
        <CarouselSkeleton count={3} />
      </View>
    );
  }

  // Hide section if no venues
  if (venues.length === 0) {
    console.log('NewVenuesSpotlightCarousel: Hidden due to no available venues', {
      timestamp: new Date().toISOString(),
      venuesCount: venues.length,
      loading,
      error: error ? error.message : null,
    });
    return null;
  }

  const renderVenueCard = ({ item: venue }: { item: Venue }) => {
    // Calculate days since signup if signup_date is available
    const daysSinceSignup = (venue as any).signup_date 
      ? calculateDaysSinceSignup((venue as any).signup_date)
      : null;
    
    const signupText = daysSinceSignup !== null 
      ? formatSignupText(daysSinceSignup)
      : null;

    // Calculate distance if user location is available
    let distance: string | null = null;
    if (userLocation && venue.latitude && venue.longitude) {
      const distanceKm = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        venue.latitude,
        venue.longitude
      );
      distance = distanceKm < 1 
        ? `${Math.round(distanceKm * 1000)}m`
        : `${distanceKm.toFixed(1)}km`;
    }

    // Handle venue press with validation
    const handleVenuePress = () => {
      if (!venue?.id) {
        console.warn('Cannot navigate: venue ID is missing', venue);
        return;
      }
      onVenuePress(venue.id);
    };

    // Use defaults for missing data
    const venueName = venue?.name || 'Unnamed Venue';
    const venueCategory = venue?.category || 'General';
    const venueLocation = venue?.location || 'Location not specified';
    const venueImageUrl = venue?.image_url || 'https://via.placeholder.com/300x150';

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
        onPress={handleVenuePress}
        activeOpacity={0.7}
        accessibilityLabel={`${venueName}, new venue`}
      >
        {/* Venue Image */}
        <Image
          source={{ uri: venueImageUrl }}
          style={styles.venueImage}
        />

        {/* NEW Badge */}
        <View
          style={[
            styles.newBadge,
            {
              backgroundColor: theme.colors.primary,
            }
          ]}
        >
          <Icon name="sparkles" size={12} color="white" />
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>

        {/* Venue Info */}
        <View style={styles.venueInfo}>
          {/* Days Since Signup */}
          {signupText && (
            <Text
              style={[
                styles.signupText,
                { color: theme.colors.primary }
              ]}
            >
              {signupText}
            </Text>
          )}

          {/* Venue Name */}
          <Text
            style={[
              styles.venueName,
              { color: theme.colors.text }
            ]}
            numberOfLines={1}
          >
            {venueName}
          </Text>

          {/* Category and Rating */}
          <View style={styles.venueMetadata}>
            <View style={styles.categoryBadge}>
              <Text
                style={[
                  styles.categoryText,
                  { color: theme.colors.primary }
                ]}
              >
                {venueCategory}
              </Text>
            </View>

            {venue?.rating && venue.rating > 0 ? (
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
            ) : (
              <Text
                style={[
                  styles.noRatingText,
                  { color: theme.colors.textSecondary }
                ]}
              >
                New - No ratings yet
              </Text>
            )}
          </View>

          {/* Location and Distance */}
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
              {venueLocation}
            </Text>
            {distance && (
              <>
                <Text
                  style={[
                    styles.locationSeparator,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.distanceText,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  {distance}
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header} accessibilityLabel="New Venues Spotlight">
        {/* Sparkles Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primary + '20' }
          ]}
        >
          <Icon
            name="sparkles"
            size={20}
            color={theme.colors.primary}
          />
        </View>

        {/* Title */}
        <View style={styles.headerText}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text }
            ]}
          >
            New Venues
          </Text>
        </View>
      </View>

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

/**
 * Calculate distance between two coordinates using Haversine formula
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

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
  iconContainer: {
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
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  skeletonTitle: {
    height: 18,
    width: '40%',
    borderRadius: 4,
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  venueCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginRight: CARD_MARGIN,
    overflow: 'hidden',
    minHeight: 44, // Minimum touch target height
  },
  venueImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  venueInfo: {
    padding: 12,
  },
  signupText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
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
  noRatingText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
  locationSeparator: {
    fontSize: 12,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});

export default NewVenuesSpotlightCarousel;
