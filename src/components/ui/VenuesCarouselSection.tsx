import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Venue, VenueCheckInStats } from '../../types/venue.types';
import { CarouselSkeleton } from '../social/SkeletonLoaders';
import { calculateDaysSinceSignup, formatSignupText } from '../../utils/formatting/venue';
import { CheckInService } from '../../services/api/checkins';
import CompactVenueCard from './CompactVenueCard';

interface VenuesCarouselSectionProps {
  venues: Venue[];
  onVenuePress: (venueId: string) => void;
  loading?: boolean;
  error?: Error | null;
  title?: string;
  icon?: string;
  showNewBadge?: boolean;
}

/**
 * VenuesCarouselSection Component
 * 
 * A reusable horizontal scrolling carousel for displaying venues.
 * Can be used for New Venues, Featured Venues, or any venue list.
 * 
 * Features:
 * - Horizontal scrolling with snap behavior
 * - Optional "NEW" badge for new venues
 * - Loading skeleton states
 * - Empty state handling
 * - Customizable title and icon
 */
const VenuesCarouselSection: React.FC<VenuesCarouselSectionProps> = ({
  venues,
  onVenuePress,
  loading = false,
  error = null,
  title = 'New Venues',
  icon = 'sparkles',
  showNewBadge = true,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State for check-in stats
  const [checkInStats, setCheckInStats] = useState<Map<string, VenueCheckInStats>>(new Map());
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Extract venue IDs for fetching stats
  const venueIds = useMemo(() => {
    return venues.map(venue => venue.id);
  }, [venues]);

  // Fetch check-in stats for all venues
  useEffect(() => {
    const fetchStats = async () => {
      if (venueIds.length === 0) return;

      try {
        setLoadingStats(true);
        const stats = await CheckInService.getMultipleVenueStats(venueIds, user?.id);
        setCheckInStats(stats);
      } catch (error) {
        console.error('Error fetching venue stats for carousel:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [venueIds, user?.id]);

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
              name={icon}
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
    console.log('VenuesCarouselSection: Hidden due to no available venues', {
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

    // Get check-in stats for this venue
    const stats = checkInStats.get(venue.id);

    return (
      <View style={styles.cardWrapper}>
        <CompactVenueCard
          venue={venue}
          onPress={() => onVenuePress(venue.id)}
          badge={showNewBadge ? {
            icon: 'sparkles',
            text: 'NEW',
          } : undefined}
          subtitle={signupText || undefined}
          showEngagementStats={true}
          checkInCount={stats?.active_checkins || 0}
          maxCapacity={venue.max_capacity || 100}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header} accessibilityLabel={`${title} section`}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primary + '20' }
          ]}
        >
          <Icon
            name={icon}
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
            {title}
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
        accessibilityLabel={`${title} carousel`}
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

export default VenuesCarouselSection;
