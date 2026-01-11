import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Venue, HomeStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useVenues, useCheckInStats } from '../../hooks';
import { populateVenuesDatabase } from '../../utils/populateVenues';
import { TestVenueCard } from '../../components/venue';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Use custom hooks for data management
  const { venues, loading, error, refetch } = useVenues({ featured: true, limit: 10 });
  
  // Debug logging
  useEffect(() => {
    console.log('🏠 HomeScreen state:', { 
      venuesCount: venues.length, 
      loading, 
      hasError: !!error 
    });
  }, [venues.length, loading, error]);
  
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
    setRefreshing(false);
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {venues.length > 0 ? (
          <View style={styles.venueList}>
            {venues.map((venue) => {
              const venueCheckInStats = checkInStats.get(venue.id);
              
              return (
                <TestVenueCard
                  key={venue.id}
                  venue={venue}
                  checkInCount={venueCheckInStats?.active_checkins || 0}
                  onPress={() => handleVenuePress(venue)}
                  customerCountVariant="traffic"
                  engagementChipVariant="traffic"
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
