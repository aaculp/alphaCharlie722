import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Venue, HomeStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocationContext } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useVenues, useCheckInStats } from '../../hooks';
import { useLocation } from '../../hooks/useLocation';
import { LocationService } from '../../services/locationService';
import { CheckInService } from '../../services/api/checkins';
import { populateVenuesDatabase } from '../../utils/populateVenues';
import { TestVenueCard } from '../../components/venue';
import { QuickPickChip } from '../../components/quickpicks';
import Icon from 'react-native-vector-icons/Ionicons';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

interface CheckInInfo {
  checkInId: string;
  venueId: string;
  checkInTime: string;
  venueName: string;
}

interface QuickPickCategory {
  id: string;
  title: string;
  icon?: string;
  emoji?: string;
  color: string;
  filter: (venues: Venue[]) => Venue[];
}

const quickPickCategories: QuickPickCategory[] = [
  {
    id: 'party',
    title: 'Party',
    emoji: '💃',
    color: '#9C27B0',
    filter: (venues) => venues.filter(v =>
      (v.category === 'Nightclubs' || v.category === 'Bars' || v.category === 'Lounges') &&
      (v.rating || 0) >= 4.0
    )
  },
  {
    id: 'date_night',
    title: 'Date Night',
    icon: 'heart',
    color: '#E91E63',
    filter: (venues) => venues.filter(v =>
      v.category === 'Fine Dining' &&
      (v.rating || 0) >= 4.5
    )
  },
  {
    id: 'best_burgers',
    title: 'Best Burgers',
    icon: 'fast-food',
    color: '#FF6B35',
    filter: (venues) => venues.filter(v =>
      v.category === 'Fast Food' &&
      (v.name.toLowerCase().includes('burger') ||
        v.description?.toLowerCase().includes('burger')) &&
      (v.rating || 0) >= 4.0
    )
  },
  {
    id: 'study_cafes',
    title: 'Study Cafes',
    icon: 'library',
    color: '#4CAF50',
    filter: (venues) => venues.filter(v =>
      v.category === 'Coffee Shops' &&
      (v.rating || 0) >= 4.3
    )
  },
  {
    id: 'game_day',
    title: 'Game Day',
    icon: 'tv',
    color: '#FF9800',
    filter: (venues) => venues.filter(v =>
      v.category === 'Sports Bars' &&
      (v.rating || 0) >= 4.0
    )
  },
  {
    id: 'craft_beer',
    title: 'Craft Beer',
    icon: 'wine',
    color: '#795548',
    filter: (venues) => venues.filter(v =>
      v.category === 'Breweries' &&
      (v.rating || 0) >= 4.2
    )
  },
  {
    id: 'budget_eats',
    title: 'Budget Eats',
    icon: 'cash',
    color: '#2196F3',
    filter: (venues) => venues.filter(v =>
      v.price_range === '$' &&
      (v.rating || 0) >= 4.0
    )
  },
];

const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [userCheckIns, setUserCheckIns] = useState<Map<string, CheckInInfo>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { theme } = useTheme();
  const { locationEnabled } = useLocationContext();
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Use custom hooks for data management
  const { venues, loading, error, refetch } = useVenues({ featured: true, limit: 10 });
  const { location, loading: locationLoading, error: locationError, refetch: refetchLocation } = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('🏠 HomeScreen state:', {
      venuesCount: venues.length,
      loading,
      hasError: !!error,
      locationEnabled,
      hasLocation: !!location,
      sortByDistance
    });
  }, [venues.length, loading, error, locationEnabled, location, sortByDistance]);

  // Get venue IDs for check-in stats (memoized to prevent infinite loop)
  const venueIds = useMemo(() => venues.map(v => v.id), [venues]);
  const { stats: checkInStats, refetch: refetchCheckInStats } = useCheckInStats({ venueIds, enabled: venueIds.length > 0 });

  // Fetch user's current check-in on mount and when user changes
  useEffect(() => {
    const fetchUserCheckIn = async () => {
      if (!user) {
        setUserCheckIns(new Map());
        return;
      }

      try {
        const currentCheckIn = await CheckInService.getUserCurrentCheckInWithVenue(user.id);
        if (currentCheckIn) {
          const checkInInfo: CheckInInfo = {
            checkInId: currentCheckIn.checkIn.id,
            venueId: currentCheckIn.checkIn.venue_id,
            checkInTime: currentCheckIn.checkIn.checked_in_at,
            venueName: currentCheckIn.venueName
          };
          setUserCheckIns(new Map([[currentCheckIn.checkIn.venue_id, checkInInfo]]));
        } else {
          setUserCheckIns(new Map());
        }
      } catch (error) {
        console.error('Error fetching user check-in:', error);
        setUserCheckIns(new Map());
      }
    };

    fetchUserCheckIn();
  }, [user]);

  // Handle database population if no venues found
  useEffect(() => {
    const populateIfNeeded = async () => {
      if (!loading && venues.length === 0 && !error) {
        console.log('📝 No venues found, populating database...');
        await populateVenuesDatabase();
        await refetch();
      }
    };

    populateIfNeeded();
  }, [loading, venues.length, error, refetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    if (sortByDistance && locationEnabled) {
      await refetchLocation();
    }
    setRefreshing(false);
  };

  const handleNearMePress = async () => {
    if (!locationEnabled) {
      console.log('📍 Location services disabled');
      return;
    }

    if (sortByDistance) {
      // Turn off distance sorting
      setSortByDistance(false);
    } else {
      // Turn on distance sorting and fetch location
      setSortByDistance(true);
      if (!location) {
        await refetchLocation();
      }
    }
  };

  // Sort venues by distance if location is available and sorting is enabled
  const sortedVenues = useMemo(() => {
    if (!sortByDistance || !location || !locationEnabled) {
      return venues;
    }

    return [...venues].sort((a, b) => {
      const distanceA = a.latitude && a.longitude
        ? LocationService.calculateDistance(location.latitude, location.longitude, a.latitude, a.longitude)
        : Infinity;

      const distanceB = b.latitude && b.longitude
        ? LocationService.calculateDistance(location.latitude, location.longitude, b.latitude, b.longitude)
        : Infinity;

      return distanceA - distanceB;
    });
  }, [venues, location, sortByDistance, locationEnabled]);

  // Filter venues by selected category
  const filteredVenues = useMemo(() => {
    if (!selectedCategory) {
      return sortedVenues;
    }

    const category = quickPickCategories.find(cat => cat.id === selectedCategory);
    if (!category) {
      return sortedVenues;
    }

    return category.filter(sortedVenues);
  }, [sortedVenues, selectedCategory]);

  const handleCategoryPress = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      // Deselect if already selected
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', {
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading venues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Near Me Button */}
      {/* {locationEnabled && (
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[
              styles.nearMeButton,
              { 
                backgroundColor: sortByDistance ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
            onPress={handleNearMePress}
            disabled={locationLoading}
          >
            <Icon 
              name={sortByDistance ? "location" : "location-outline"} 
              size={20} 
              color={sortByDistance ? '#fff' : theme.colors.primary} 
            />
            <Text style={[
              styles.nearMeText,
              { color: sortByDistance ? '#fff' : theme.colors.primary }
            ]}>
              {locationLoading ? 'Getting location...' : sortByDistance ? 'Near Me' : 'Sort by Distance'}
            </Text>
          </TouchableOpacity>
          {locationError && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {locationError.message.includes('permanently denied')
                  ? 'Location permission is disabled. Please enable it in Settings.'
                  : locationError.message === 'Location permission denied' 
                  ? 'Location permission is required.'
                  : locationError.message}
              </Text>
              {(locationError.message.includes('permanently denied') || locationError.message === 'Location permission denied') && (
                <TouchableOpacity 
                  style={[styles.settingsButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    LocationService.openAppSettings();
                  }}
                >
                  <Text style={styles.settingsButtonText}>
                    Open Settings
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
       */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Picks Section */}
        <View style={styles.quickPicksSection}>
          <View style={styles.quickPicksHeader}>
            <Text style={[styles.quickPicksTitle, { color: theme.colors.text }]}>Quick Picks</Text>
            {selectedCategory && (
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={[styles.clearFilter, { color: theme.colors.primary }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPicksScroll}
          >
            {quickPickCategories.map((category) => (
              <QuickPickChip
                key={category.id}
                title={category.title}
                icon={category.icon}
                emoji={category.emoji}
                color={category.color}
                onPress={() => handleCategoryPress(category.id)}
                selected={selectedCategory === category.id}
              />
            ))}
          </ScrollView>
        </View>

        {filteredVenues.length > 0 ? (
          <View style={styles.venueList}>
            {filteredVenues.map((venue) => {
              const venueCheckInStats = checkInStats.get(venue.id);
              const userCheckInInfo = userCheckIns.get(venue.id);

              // Calculate distance if location is available
              let distance: string | undefined;
              if (location && venue.latitude && venue.longitude) {
                const distanceKm = LocationService.calculateDistance(
                  location.latitude,
                  location.longitude,
                  venue.latitude,
                  venue.longitude
                );
                distance = LocationService.formatDistance(distanceKm);
              }

              return (
                <TestVenueCard
                  key={venue.id}
                  venue={venue}
                  checkInCount={venueCheckInStats?.active_checkins || 0}
                  onPress={() => handleVenuePress(venue)}
                  customerCountVariant="traffic"
                  engagementChipVariant="traffic"
                  distance={sortByDistance ? distance : undefined}
                  onCheckInChange={user ? async (isCheckedIn, newCount) => {
                    // Handle check-in state change
                    if (isCheckedIn) {
                      // User checked in to this venue - fetch the actual check-in data
                      try {
                        const currentCheckIn = await CheckInService.getUserCurrentCheckInWithVenue(user.id);
                        if (currentCheckIn && currentCheckIn.checkIn.venue_id === venue.id) {
                          const checkInInfo: CheckInInfo = {
                            checkInId: currentCheckIn.checkIn.id,
                            venueId: currentCheckIn.checkIn.venue_id,
                            checkInTime: currentCheckIn.checkIn.checked_in_at,
                            venueName: currentCheckIn.venueName
                          };
                          setUserCheckIns(new Map([[venue.id, checkInInfo]]));
                        }
                      } catch (error) {
                        console.error('Error fetching check-in after check-in:', error);
                      }
                    } else {
                      // User checked out
                      setUserCheckIns(new Map());
                    }
                    // Refetch check-in stats to get accurate counts
                    refetchCheckInStats();
                  } : undefined}
                  userCheckInId={userCheckInInfo?.checkInId}
                  userCheckInTime={userCheckInInfo?.checkInTime}
                  isUserCheckedIn={!!userCheckInInfo}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No venues found</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Pull to refresh</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  nearMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  nearMeText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  settingsButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90, // Space for floating tab bar
  },
  quickPicksSection: {
    marginBottom: 16,
  },
  quickPicksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
    marginTop: 8,
  },
  quickPicksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
  clearFilter: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  quickPicksScroll: {
    paddingHorizontal: 15,
  },
  venueList: {
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});

export default HomeScreen;
