import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Venue } from '../../types/venue.types';
import { CarouselSkeleton } from '../social/SkeletonLoaders';
import { calculateDaysSinceSignup, formatSignupText } from '../../utils/formatting/venue';
import CompactVenueCard from './CompactVenueCard';

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
      errorMessage: error ? String(error) : null,
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

    return (
      <View style={styles.cardWrapper}>
        <CompactVenueCard
          venue={venue}
          onPress={() => onVenuePress(venue.id)}
          badge={{
            icon: 'sparkles',
            text: 'NEW',
          }}
          subtitle={signupText || undefined}
          showEngagementStats={false}
        />
      </View>
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
        snapToInterval={140 + 12} // Card width + margin
        decelerationRate="fast"
        accessibilityLabel="New venues carousel"
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
    paddingHorizontal: 15,
    marginBottom: 12,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  skeletonTitle: {
    width: 120,
    height: 20,
    borderRadius: 4,
  },
  carouselContent: {
    paddingHorizontal: 15,
  },
  cardWrapper: {
    marginRight: 12,
  },
});

export default NewVenuesSpotlightCarousel;
