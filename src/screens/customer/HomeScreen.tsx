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
import { useVenues, useCheckInStats } from '../../hooks';
import { useLocation } from '../../hooks/useLocation';
import { LocationService } from '../../services/locationService';
import { populateVenuesDatabase } from '../../utils/populateVenues';
import { TestVenueCard } from '../../components/venue';
import Icon from 'react-native-vector-icons/Ionicons';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  const { theme } = useTheme();
  const { locationEnabled } = useLocationContext();
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
  
  // Get venue IDs for check-in stats
  const venueIds = venues.map(v => v.id);
  const { stats: checkInStats } = useCheckInStats({ venueIds, enabled: venueIds.length > 0 });

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
      {locationEnabled && (
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
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sortedVenues.length > 0 ? (
          <View style={styles.venueList}>
            {sortedVenues.map((venue) => {
              const venueCheckInStats = checkInStats.get(venue.id);
              
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
