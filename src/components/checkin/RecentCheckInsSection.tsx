import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCheckInHistory } from '../../hooks/useCheckInHistory';
import { useEngagementColor } from '../../hooks/useEngagementColor';
import { CheckInService } from '../../services/api/checkins';
import { formatCheckInTime } from '../../utils/formatting/time';
import { VenueCustomerCount, VenueEngagementChip } from '../venue';
import type { CheckInWithVenue, VenueCheckInStats } from '../../types';

interface RecentCheckInsSectionProps {
  onVenuePress: (venueId: string, venueName: string) => void;
}

/**
 * RecentCheckInsSection Component
 * 
 * Displays a horizontal scrolling list of the user's most recently visited venues.
 * Shows up to 10 recent check-ins from the past 30 days.
 */
const RecentCheckInsSection: React.FC<RecentCheckInsSectionProps> = ({ onVenuePress }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const {
    checkIns,
    loading,
    error,
  } = useCheckInHistory({
    enabled: true,
    daysBack: 30,
  });

  // State for check-in stats
  const [checkInStats, setCheckInStats] = useState<Map<string, VenueCheckInStats>>(new Map());
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Limit to 10 most recent check-ins for the horizontal scroll
  const recentCheckIns = useMemo(() => {
    return checkIns.slice(0, 10);
  }, [checkIns]);

  // Extract venue IDs for fetching stats
  const venueIds = useMemo(() => {
    return recentCheckIns.map(checkIn => checkIn.venue_id);
  }, [recentCheckIns]);

  // Fetch check-in stats for all venues
  useEffect(() => {
    const fetchStats = async () => {
      if (venueIds.length === 0) return;

      try {
        setLoadingStats(true);
        const stats = await CheckInService.getMultipleVenueStats(venueIds, user?.id);
        setCheckInStats(stats);
      } catch (error) {
        console.error('Error fetching venue stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [venueIds, user?.id]);

  // Don't render if there are no check-ins
  if (!loading && recentCheckIns.length === 0) {
    return null;
  }

  // Don't render if there's an error
  if (error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="time-outline" size={20} color={theme.colors.text} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Recently Visited
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {recentCheckIns.map((checkIn) => {
            const stats = checkInStats.get(checkIn.venue_id);
            return (
              <RecentCheckInCard
                key={checkIn.id}
                checkIn={checkIn}
                checkInCount={stats?.active_checkins || 0}
                maxCapacity={checkIn.venue.max_capacity || 100}
                onPress={() => onVenuePress(checkIn.venue_id, checkIn.venue.name)}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

interface RecentCheckInCardProps {
  checkIn: CheckInWithVenue;
  checkInCount: number;
  maxCapacity: number;
  onPress: () => void;
}

const RecentCheckInCard: React.FC<RecentCheckInCardProps> = ({
  checkIn,
  checkInCount,
  maxCapacity,
  onPress
}) => {
  const { theme } = useTheme();
  const formattedTime = formatCheckInTime(checkIn.checked_in_at);

  // Get engagement color for border
  const engagementColor = useEngagementColor(checkInCount, maxCapacity);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: engagementColor.borderColor,
          borderWidth: 2,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: checkIn.venue.image_url || 'https://via.placeholder.com/120x120'
        }}
        style={styles.image}
      />

      <View style={styles.cardContent}>
        <Text
          style={[styles.venueName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {checkIn.venue.name}
        </Text>

        <View style={styles.categoryBadge}>
          <Text
            style={[styles.categoryText, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {checkIn.venue.category}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <Icon name="time-outline" size={12} color={theme.colors.textSecondary} />
          <Text
            style={[styles.timeText, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {formattedTime}
          </Text>
        </View>

        {/* Engagement Stats Row */}
        <View style={styles.statsRow}>
          <VenueCustomerCount
            count={checkInCount}
            maxCapacity={maxCapacity}
            size="small"
            variant="traffic"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 15,
    gap: 12,
  },
  card: {
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 100,
  },
  cardContent: {
    padding: 10,
  },
  venueName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  categoryBadge: {
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  statsRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 6,
  },
});

export default RecentCheckInsSection;
