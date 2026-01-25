/**
 * HomeScreen Example with React Query Loading States
 * 
 * This example demonstrates how to properly implement loading states
 * using React Query hooks and the new loading UI components.
 * 
 * Key changes from the original:
 * 1. Use useVenuesQuery instead of useVenues
 * 2. Use QueryLoadingSkeleton for isLoading state
 * 3. Use BackgroundRefetchIndicator for isFetching state
 * 4. Use QueryErrorDisplay for isError state
 * 5. Use QueryRefreshControl for pull-to-refresh
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Venue, HomeStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// React Query hooks
import { useVenuesQuery, useFlashOffersQuery } from '../../hooks/queries';

// Loading state components
import {
  QueryLoadingSkeleton,
  BackgroundRefetchIndicator,
  QueryErrorDisplay,
  QueryRefreshControl,
  StaleDataIndicator,
} from '../../components/shared';

// Other components
import { WideVenueCard } from '../../components/ui';
import { VenuesCarouselSection } from '../../components/ui';
import { QuickPickChip } from '../../components/quickpicks';
import { FlashOfferCard } from '../../components/flashOffer';
import Icon from 'react-native-vector-icons/Ionicons';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

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
  // ... other categories
];

export const HomeScreenExample: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // React Query hooks with proper loading states
  const {
    data: venues = [],
    isLoading: venuesLoading,
    isFetching: venuesFetching,
    isError: venuesError,
    error: venuesErrorObj,
    refetch: refetchVenues,
  } = useVenuesQuery({
    filters: { featured: true },
  });

  const {
    data: flashOffers = [],
    isLoading: flashOffersLoading,
    isFetching: flashOffersFetching,
    isError: flashOffersError,
    refetch: refetchFlashOffers,
  } = useFlashOffersQuery();

  // Filter venues based on selected category
  const filteredVenues = selectedCategory
    ? quickPickCategories.find(c => c.id === selectedCategory)?.filter(venues) || venues
    : venues;

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', {
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchVenues(),
      refetchFlashOffers(),
    ]);
  };

  // LOADING STATE: First-time load - Show skeleton
  if (venuesLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Discover
          </Text>
        </View>
        <QueryLoadingSkeleton count={5} variant="list" />
      </SafeAreaView>
    );
  }

  // ERROR STATE: Error without cached data - Show error display
  if (venuesError && venues.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Discover
          </Text>
        </View>
        <QueryErrorDisplay
          error={venuesErrorObj}
          onRetry={refetchVenues}
          message="Unable to load venues. Please check your connection and try again."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* BACKGROUND REFETCH: Show subtle indicator at top */}
      <BackgroundRefetchIndicator isVisible={venuesFetching || flashOffersFetching} />

      {/* ERROR WITH CACHED DATA: Show stale data indicator */}
      {venuesError && venues.length > 0 && (
        <StaleDataIndicator
          onRefresh={refetchVenues}
          message="Unable to refresh. Showing cached data."
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <QueryRefreshControl
            isRefetching={venuesFetching}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Discover
          </Text>
        </View>

        {/* Quick Picks Section */}
        <View style={styles.quickPicksSection}>
          <View style={styles.quickPicksHeader}>
            <Text style={[styles.quickPicksTitle, { color: theme.colors.text }]}>
              Quick Picks
            </Text>
            {selectedCategory && (
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={[styles.clearFilter, { color: theme.colors.primary }]}>
                  Clear
                </Text>
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

        {/* Flash Offers Section */}
        {!flashOffersLoading && flashOffers.length > 0 && (
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
                    navigation.navigate('FlashOfferDetail', { offerId: offer.id });
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Venues List */}
        <View style={styles.venuesSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {selectedCategory ? 'Filtered Venues' : 'Featured Venues'}
          </Text>
          {filteredVenues.map((venue) => (
            <WideVenueCard
              key={venue.id}
              venue={venue}
              onPress={() => handleVenuePress(venue)}
            />
          ))}
        </View>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
  },
  quickPicksSection: {
    marginBottom: 24,
  },
  quickPicksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  quickPicksTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  clearFilter: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  quickPicksScroll: {
    paddingHorizontal: 20,
  },
  flashOffersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  flashOffersScroll: {
    paddingHorizontal: 20,
  },
  venuesSection: {
    paddingHorizontal: 20,
  },
});
