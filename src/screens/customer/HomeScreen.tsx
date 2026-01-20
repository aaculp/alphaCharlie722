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
import Animated, { useSharedValue, useAnimatedProps } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Venue, HomeStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocationContext } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useVenues, useCheckInStats, useNewVenues, useFlashOffers } from '../../hooks';
import { useLocation } from '../../hooks/useLocation';
import { LocationService } from '../../services/locationService';
import { CheckInService } from '../../services/api/checkins';
import { populateVenuesDatabase } from '../../utils/populateVenues';
import { supabase } from '../../lib/supabase';
import { WideVenueCard } from '../../components/ui';
import { VenuesCarouselSection } from '../../components/ui';
import { QuickPickChip } from '../../components/quickpicks';
import { RecentCheckInsSection } from '../../components/checkin';
import { FriendVenueCarousel, SharedCollectionCarousel, FriendActivityFeed } from '../../components/social';
import { FlashOfferCard } from '../../components/flashOffer';
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
  const [checkInHistoryKey, setCheckInHistoryKey] = useState(0); // Key to force RecentCheckInsSection refetch
  const { theme } = useTheme();
  const { locationEnabled } = useLocationContext();
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Shared value to control ScrollView scrolling (for gesture conflict resolution)
  const scrollEnabled = useSharedValue(true);

  // Animated props for ScrollView
  const animatedScrollProps = useAnimatedProps(() => ({
    scrollEnabled: scrollEnabled.value,
  }));

  // Use custom hooks for data management
  const { venues, loading, error, refetch } = useVenues({ featured: true, limit: 10 });
  const { location, loading: locationLoading, error: locationError, refetch: refetchLocation } = useLocation();
  const { venues: newVenues, loading: newVenuesLoading, refetch: refetchNewVenues } = useNewVenues();
  const { 
    offers: flashOffers, 
    loading: flashOffersLoading, 
    refetch: refetchFlashOffers,
    locationPermissionDenied,
    requestLocationPermission,
    isOffline: flashOffersOffline,
  } = useFlashOffers({
    radiusMiles: 10,
    enabled: locationEnabled,
  });

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

  // Debug logging for new venues (using useMemo to avoid hook order issues)
  useMemo(() => {
    console.log('🆕 HomeScreen newVenues state:', {
      newVenuesCount: newVenues.length,
      newVenuesLoading,
      newVenues: newVenues.map(v => ({ id: v.id, name: v.name, signup_date: (v as any).signup_date })),
    });
    return null;
  }, [newVenues, newVenuesLoading]);

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

  // Requirement 7.7: Real-time rating updates
  // Subscribe to venue updates (aggregate_rating and review_count changes)
  useEffect(() => {
    // Only subscribe if we have venues to monitor
    if (venueIds.length === 0) {
      return;
    }

    console.log('🔄 Setting up real-time venue updates subscription for', venueIds.length, 'venues');
    
    // Subscribe to changes in the venues table
    const subscription = supabase
      .channel('venue-ratings-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'venues',
        },
        (payload) => {
          console.log('🔄 Venue updated:', payload);
          
          // Check if the updated venue is in our current list
          const updatedVenueId = payload.new?.id;
          if (updatedVenueId && venueIds.includes(updatedVenueId)) {
            console.log('🔄 Venue rating updated for displayed venue:', updatedVenueId);
            
            // Refetch venues to get updated ratings
            // This will trigger a re-render with new aggregate_rating and review_count
            refetch();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'reviews',
        },
        (payload) => {
          console.log('🔄 Review changed:', payload);
          
          // Check if the review is for a venue in our current list
          const venueId = payload.new?.venue_id || payload.old?.venue_id;
          if (venueId && venueIds.includes(venueId)) {
            console.log('🔄 Review changed for displayed venue:', venueId);
            
            // Refetch venues to get updated ratings
            // The database trigger will have already updated aggregate_rating and review_count
            refetch();
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('🔄 Cleaning up real-time venue updates subscription');
      subscription.unsubscribe();
    };
  }, [venueIds, refetch]);

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
    await Promise.all([
      refetch(),
      refetchNewVenues(),
      refetchFlashOffers(),
      sortByDistance && locationEnabled ? refetchLocation() : Promise.resolve()
    ]);
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
      <Animated.ScrollView
        testID="home-scroll-view"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        animatedProps={animatedScrollProps}
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

        {/* New Venues Spotlight Section */}
        <VenuesCarouselSection
          venues={newVenues}
          onVenuePress={(venueId) => {
            const venue = newVenues.find(v => v.id === venueId);
            if (venue) {
              navigation.navigate('VenueDetail', {
                venueId: venue.id,
                venueName: venue.name,
              });
            }
          }}
          loading={newVenuesLoading}
          title="New Venues"
          icon="sparkles"
          showNewBadge={true}
        />

        {/* Flash Offers Section */}
        {locationEnabled && flashOffers.length > 0 && (
          <View style={styles.flashOffersSection}>
            <View style={styles.sectionHeader}>
              <Icon name="flash" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Flash Offers
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flashOffersScroll}
            >
              {flashOffers.map((offer) => (
                <FlashOfferCard
                  key={offer.id}
                  offer={offer}
                  venueName={offer.venue_name}
                  onPress={() => {
                    // TODO: Navigate to FlashOfferDetail screen when implemented
                    console.log('Flash offer pressed:', offer.id);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Location permission prompt for flash offers */}
        {locationPermissionDenied && user && (
          <View style={styles.flashOffersPrompt}>
            <Icon name="location-outline" size={24} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.promptText, { color: theme.colors.text, fontWeight: '600' }]}>
                Location Permission Required
              </Text>
              <Text style={[styles.promptSubtext, { color: theme.colors.textSecondary, fontSize: 14 }]}>
                Enable location to see flash offers near you
              </Text>
              <TouchableOpacity
                style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
                onPress={requestLocationPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Offline indicator for flash offers */}
        {flashOffersOffline && !locationPermissionDenied && user && (
          <View style={[styles.flashOffersPrompt, { backgroundColor: '#FFF3E0' }]}>
            <Icon name="cloud-offline-outline" size={24} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.promptText, { color: '#E65100', fontWeight: '600' }]}>
                Offline Mode
              </Text>
              <Text style={[styles.promptSubtext, { color: '#E65100', fontSize: 14 }]}>
                Showing cached flash offers. Connect to see latest offers.
              </Text>
            </View>
          </View>
        )}

        {/* Recent Check-Ins Section */}
        {user && (
          <RecentCheckInsSection
            key={checkInHistoryKey}
            onVenuePress={(venueId, venueName) => {
              navigation.navigate('VenueDetail', {
                venueId,
                venueName,
              });
            }}
          />
        )}

        {/* Friends' Favorites Section */}
        {/* {user && (
          <View style={styles.socialSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Friends' Favorites</Text>
            <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
              See what venues your friends love - coming soon!
            </Text>
          </View>
        )} */}

        {/* Shared Collections Section */}
        {/* {user && (
          <View style={styles.socialSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Shared Collections</Text>
            <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
              Discover curated venue collections from friends - coming soon!
            </Text>
          </View>
        )} */}

        {/* Friend Activity Feed Section */}
        {/* {user && (
          <View style={styles.socialSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Friend Activity</Text>
            <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
              Stay updated with your friends' check-ins and favorites - coming soon!
            </Text>
          </View>
        )} */}

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
                <WideVenueCard
                  key={venue.id}
                  venue={venue}
                  checkInCount={venueCheckInStats?.active_checkins || 0}
                  onPress={() => handleVenuePress(venue)}
                  customerCountVariant="traffic"
                  engagementChipVariant="traffic"
                  distance={sortByDistance ? distance : undefined}
                  enableSwipe={true}
                  onCheckInChange={user ? async (isCheckedIn, newCount) => {
                    // Handle check-in state change (Requirement 11.3, 11.5)
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
                      // Requirement 11.2: Trigger check-in history refetch after check-in
                      setCheckInHistoryKey(prev => prev + 1);
                    } else {
                      // User checked out
                      setUserCheckIns(new Map());
                      // Requirement 11.2: Trigger check-in history refetch after check-out
                      setCheckInHistoryKey(prev => prev + 1);
                    }
                    // Requirement 11.1: Refetch check-in stats to get accurate counts
                    refetchCheckInStats();
                  } : undefined}
                  onSwipeCheckIn={user ? async () => {
                    // Requirement 11.4: Swipe check-in respects same business logic as button
                    try {
                      await CheckInService.checkIn(venue.id, user.id);
                      // Success - state will be updated via onCheckInChange callback
                    } catch (error) {
                      console.error('Error during swipe check-in:', error);
                      throw error; // Re-throw to trigger error handling in WideVenueCard
                    }
                  } : undefined}
                  onSwipeCheckOut={user ? async () => {
                    // Requirement 11.4: Swipe check-out respects same business logic as button
                    if (userCheckInInfo?.checkInId) {
                      try {
                        await CheckInService.checkOut(userCheckInInfo.checkInId, user.id);
                        // Success - state will be updated via onCheckInChange callback
                      } catch (error) {
                        console.error('Error during swipe check-out:', error);
                        throw error; // Re-throw to trigger error handling in WideVenueCard
                      }
                    }
                  } : undefined}
                  userCheckInId={userCheckInInfo?.checkInId}
                  userCheckInTime={userCheckInInfo?.checkInTime}
                  isUserCheckedIn={!!userCheckInInfo}
                  scrollEnabled={scrollEnabled}
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
      </Animated.ScrollView>
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
  socialSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 15,
    fontStyle: 'italic',
  },
  flashOffersSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
    gap: 8,
  },
  flashOffersScroll: {
    paddingHorizontal: 15,
  },
  flashOffersPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    marginBottom: 20,
    gap: 8,
    borderRadius: 12,
    marginHorizontal: 15,
  },
  promptText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  promptSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

export default HomeScreen;
