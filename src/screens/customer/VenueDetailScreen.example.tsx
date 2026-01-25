/**
 * VenueDetailScreen Example with React Query Loading States
 * 
 * This example demonstrates how to properly implement loading states
 * for a detail screen using React Query hooks.
 * 
 * Key changes from the original:
 * 1. Use useVenueQuery instead of manual fetch
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
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { SearchStackParamList, HomeStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// React Query hooks
import { useVenueQuery } from '../../hooks/queries';
import { useCheckInMutation } from '../../hooks/mutations';

// Loading state components
import {
  QueryLoadingSkeleton,
  BackgroundRefetchIndicator,
  QueryErrorDisplay,
  QueryRefreshControl,
} from '../../components/shared';

// Other components
import { ModernVenueCards } from '../../components/venue/VenueInfoComponents';
import { VenueCustomerCountChip } from '../../components/ui';
import { CheckInButton } from '../../components/checkin';
import { AggregateRatingDisplay, ReviewCard } from '../../components/venue';
import Icon from 'react-native-vector-icons/Ionicons';

type VenueDetailRouteProp = RouteProp<SearchStackParamList, 'VenueDetail'> | RouteProp<HomeStackParamList, 'VenueDetail'>;

export const VenueDetailScreenExample: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<VenueDetailRouteProp>();
  const { venueId } = route.params;

  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // React Query hooks with proper loading states
  const {
    data: venue,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useVenueQuery({ venueId });

  const {
    mutate: checkIn,
    isLoading: isCheckingIn,
  } = useCheckInMutation();

  const handleCheckIn = () => {
    if (user && venue) {
      checkIn({
        venueId: venue.id,
        userId: user.id,
        timestamp: new Date(),
      });
    }
  };

  const handleOpenReviewModal = () => {
    setReviewModalVisible(true);
  };

  // LOADING STATE: First-time load - Show skeleton
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <QueryLoadingSkeleton variant="detail" />
      </SafeAreaView>
    );
  }

  // ERROR STATE: Error or no venue - Show error display
  if (isError || !venue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <QueryErrorDisplay
          error={error}
          onRetry={refetch}
          message="Unable to load venue details. Please try again."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* BACKGROUND REFETCH: Show subtle indicator at top */}
      <BackgroundRefetchIndicator isVisible={isFetching} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <QueryRefreshControl
            isRefetching={isFetching}
            onRefresh={refetch}
          />
        }
      >
        {/* Venue Image */}
        {venue.image_url && (
          <Image
            source={{ uri: venue.image_url }}
            style={styles.venueImage}
            resizeMode="cover"
          />
        )}

        {/* Venue Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.venueName, { color: theme.colors.text }]}>
            {venue.name}
          </Text>
          
          {venue.category && (
            <Text style={[styles.venueCategory, { color: theme.colors.textSecondary }]}>
              {venue.category}
            </Text>
          )}

          {/* Rating Display */}
          {venue.rating && (
            <View style={styles.ratingContainer}>
              <AggregateRatingDisplay
                rating={venue.rating}
                reviewCount={venue.review_count || 0}
              />
            </View>
          )}

          {/* Customer Count */}
          <VenueCustomerCountChip
            count={venue.checkInCount || 0}
            style={styles.customerCount}
          />
        </View>

        {/* Check-In Button */}
        {user && (
          <View style={styles.checkInSection}>
            <CheckInButton
              venueId={venue.id}
              onCheckIn={handleCheckIn}
              isLoading={isCheckingIn}
            />
          </View>
        )}

        {/* Venue Details */}
        <View style={styles.detailsSection}>
          {venue.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                About
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {venue.description}
              </Text>
            </View>
          )}

          {/* Contact Information */}
          {(venue.address || venue.phone || venue.website) && (
            <View style={styles.contactSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Contact
              </Text>
              
              {venue.address && (
                <View style={styles.contactItem}>
                  <Icon name="location-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                    {venue.address}
                  </Text>
                </View>
              )}

              {venue.phone && (
                <TouchableOpacity style={styles.contactItem}>
                  <Icon name="call-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                    {venue.phone}
                  </Text>
                </TouchableOpacity>
              )}

              {venue.website && (
                <TouchableOpacity style={styles.contactItem}>
                  <Icon name="globe-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                    {venue.website}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Hours */}
          {venue.hours && (
            <View style={styles.hoursSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Hours
              </Text>
              <ModernVenueCards venue={venue} />
            </View>
          )}
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Reviews
            </Text>
            <TouchableOpacity
              style={[styles.addReviewButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleOpenReviewModal}
            >
              <Icon name="add-circle-outline" size={20} color="white" />
              <Text style={styles.addReviewButtonText}>Add Review</Text>
            </TouchableOpacity>
          </View>
          
          {/* Reviews would be loaded here with their own query */}
          <Text style={[styles.noReviews, { color: theme.colors.textSecondary }]}>
            No reviews yet. Be the first to review!
          </Text>
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
  venueImage: {
    width: '100%',
    height: 250,
  },
  headerSection: {
    padding: 20,
  },
  venueName: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  venueCategory: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  ratingContainer: {
    marginBottom: 12,
  },
  customerCount: {
    alignSelf: 'flex-start',
  },
  checkInSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  detailsSection: {
    paddingHorizontal: 20,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  contactSection: {
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    flex: 1,
  },
  hoursSection: {
    marginBottom: 24,
  },
  reviewsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addReviewButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  noReviews: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 32,
  },
});
