import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCheckInHistory } from '../../hooks/useCheckInHistory';
import { CheckInService } from '../../services/api/checkins';
import { formatCheckInTime } from '../../utils/formatting/time';
import { CompactVenueCard } from '../venue';
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
            const formattedTime = formatCheckInTime(checkIn.checked_in_at);
            
            return (
              <View key={checkIn.id} style={styles.cardWrapper}>
                <CompactVenueCard
                  venue={checkIn.venue}
                  onPress={() => onVenuePress(checkIn.venue_id, checkIn.venue.name)}
                  subtitle={formattedTime}
                  checkInCount={stats?.active_checkins || 0}
                  maxCapacity={checkIn.venue.max_capacity || 100}
                />
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
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
  },
  cardWrapper: {
    marginRight: 12,
  },
});

export default RecentCheckInsSection;
