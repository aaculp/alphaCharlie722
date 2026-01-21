import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { SearchStackParamList, HomeStackParamList, Venue } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { VenueService } from '../../services/api/venues';
import { useCheckInStats } from '../../hooks';
import { ModernVenueCards } from '../../components/venue/VenueInfoComponents';
import { VenueCustomerCountChip } from '../../components/ui';
import { UserFeedback } from '../../components/checkin';
import { CheckInButton } from '../../components/checkin';
import { MutualFavoritesIndicator } from '../../components/social';
import { AggregateRatingDisplay, ReviewSubmissionModal, ReviewCard } from '../../components/venue';
import { ReviewService } from '../../services/api/reviews';
import { getActivityLevel } from '../../utils/formatting';
import Icon from 'react-native-vector-icons/Ionicons';
import type { Review, ReviewWithReviewer } from '../../types';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type VenueDetailRouteProp = RouteProp<SearchStackParamList, 'VenueDetail'> | RouteProp<HomeStackParamList, 'VenueDetail'>;

// Mock detailed venue data (fallback for search screen)
const getMockVenueDetails = (venueId: string) => {
  const venueDetails: { [key: string]: any } = {
    '1': {
      id: '1',
      name: 'The Coffee House',
      location: 'Downtown',
      category: 'Cafe',
      rating: 4.5,
      review_count: 127,
      image_url: 'https://picsum.photos/400/250?random=1',
      description: 'A cozy coffee house in the heart of downtown, perfect for meetings, studying, or just enjoying a great cup of coffee. We source our beans from local roasters and offer a variety of pastries and light meals. Free WiFi and comfortable seating make this the ideal spot for remote work.',
      address: '123 Main Street, Downtown',
      phone: '+1 (555) 123-4567',
      website: 'https://thecoffeehouse.com',
      hours: {
        'Monday': '7:00 AM - 9:00 PM',
        'Tuesday': '7:00 AM - 9:00 PM',
        'Wednesday': '7:00 AM - 9:00 PM',
        'Thursday': '7:00 AM - 9:00 PM',
        'Friday': '7:00 AM - 10:00 PM',
        'Saturday': '8:00 AM - 10:00 PM',
        'Sunday': '8:00 AM - 8:00 PM',
      },
      amenities: ['WiFi', 'Outdoor Seating', 'Pet Friendly', 'Takeout', 'Study Area'],
      price_range: '$',
    },
    '2': {
      id: '2',
      name: 'Sunset Restaurant',
      location: 'Waterfront',
      category: 'Restaurant',
      rating: 4.8,
      review_count: 89,
      image_url: 'https://picsum.photos/400/250?random=2',
      description: 'Experience fine dining with breathtaking ocean views. Our menu features fresh seafood and locally sourced ingredients, creating an unforgettable culinary experience. Perfect for romantic dinners and special occasions.',
      address: '456 Ocean Drive, Waterfront',
      phone: '+1 (555) 987-6543',
      website: 'https://sunsetrestaurant.com',
      hours: {
        'Monday': 'Closed',
        'Tuesday': '5:00 PM - 10:00 PM',
        'Wednesday': '5:00 PM - 10:00 PM',
        'Thursday': '5:00 PM - 10:00 PM',
        'Friday': '5:00 PM - 11:00 PM',
        'Saturday': '4:00 PM - 11:00 PM',
        'Sunday': '4:00 PM - 9:00 PM',
      },
      amenities: ['Ocean View', 'Valet Parking', 'Full Bar', 'Reservations', 'Private Dining'],
      price_range: '$$$',
    },
    '3': {
      id: '3',
      name: 'Urban Gym',
      location: 'City Center',
      category: 'Fitness',
      rating: 4.2,
      review_count: 156,
      image_url: 'https://picsum.photos/400/250?random=3',
      description: 'State-of-the-art fitness facility in the heart of the city. Featuring modern equipment, group classes, personal training, and a rooftop pool. Open 24/7 for your convenience with flexible membership options.',
      address: '789 Fitness Boulevard, City Center',
      phone: '+1 (555) 456-7890',
      website: 'https://urbangym.com',
      hours: {
        'Monday': '24 Hours',
        'Tuesday': '24 Hours',
        'Wednesday': '24 Hours',
        'Thursday': '24 Hours',
        'Friday': '24 Hours',
        'Saturday': '24 Hours',
        'Sunday': '24 Hours',
      },
      amenities: ['24/7 Access', 'Pool', 'Group Classes', 'Personal Training', 'Locker Rooms', 'Parking'],
      price_range: '$$',
    },
    '4': {
      id: '4',
      name: 'Book Haven',
      location: 'Arts District',
      category: 'Bookstore',
      rating: 4.6,
      review_count: 73,
      image_url: 'https://picsum.photos/400/250?random=4',
      description: 'An independent bookstore specializing in rare finds, local authors, and cozy reading nooks. Browse our curated selection while enjoying artisanal coffee and homemade pastries. Regular author events and book clubs.',
      address: '321 Literary Lane, Arts District',
      phone: '+1 (555) 234-5678',
      website: 'https://bookhaven.com',
      hours: {
        'Monday': '9:00 AM - 8:00 PM',
        'Tuesday': '9:00 AM - 8:00 PM',
        'Wednesday': '9:00 AM - 8:00 PM',
        'Thursday': '9:00 AM - 9:00 PM',
        'Friday': '9:00 AM - 9:00 PM',
        'Saturday': '8:00 AM - 10:00 PM',
        'Sunday': '10:00 AM - 6:00 PM',
      },
      amenities: ['Reading Nooks', 'Coffee Bar', 'Author Events', 'Book Club', 'Gift Wrapping', 'Special Orders'],
      price_range: '$$',
    },
    '5': {
      id: '5',
      name: 'Pizza Corner',
      location: 'Main Street',
      category: 'Restaurant',
      rating: 4.3,
      review_count: 201,
      image_url: 'https://picsum.photos/400/250?random=5',
      description: 'Authentic wood-fired pizza made with fresh ingredients and traditional recipes. Family-owned since 1985, we pride ourselves on creating the perfect crust and using only the finest toppings. Dine-in, takeout, and delivery available.',
      address: '654 Main Street, Downtown',
      phone: '+1 (555) 345-6789',
      website: 'https://pizzacorner.com',
      hours: {
        'Monday': '11:00 AM - 10:00 PM',
        'Tuesday': '11:00 AM - 10:00 PM',
        'Wednesday': '11:00 AM - 10:00 PM',
        'Thursday': '11:00 AM - 10:00 PM',
        'Friday': '11:00 AM - 11:00 PM',
        'Saturday': '11:00 AM - 11:00 PM',
        'Sunday': '12:00 PM - 9:00 PM',
      },
      amenities: ['Wood-Fired Oven', 'Takeout', 'Delivery', 'Family Friendly', 'Outdoor Seating', 'Catering'],
      price_range: '$$',
    },
  };

  return venueDetails[venueId] || null;
};

const VenueDetailScreen: React.FC = () => {
  const route = useRoute<VenueDetailRouteProp>();
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { venueId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [loadingUserReview, setLoadingUserReview] = useState(false);
  const [recentReviews, setRecentReviews] = useState<ReviewWithReviewer[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Use useCheckInStats hook for check-in statistics
  const { stats } = useCheckInStats({
    venueIds: venueId,
    enabled: !!venueId
  });

  const checkInStats = stats.get(venueId) || null;

  // Fetch venue details (try Supabase first, fallback to mock data)
  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        setLoading(true);

        // Try to fetch from Supabase first
        const supabaseVenue = await VenueService.getVenueById(venueId);

        if (supabaseVenue) {
          setVenue(supabaseVenue);
        } else {
          // Fallback to mock data for search screen
          const mockVenue = getMockVenueDetails(venueId);
          setVenue(mockVenue);
        }
      } catch (error) {
        console.error('Error fetching venue details:', error);
        // Fallback to mock data on error
        const mockVenue = getMockVenueDetails(venueId);
        setVenue(mockVenue);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [venueId]);

  // Fetch user's existing review for this venue
  useEffect(() => {
    const fetchUserReview = async () => {
      if (!user?.id || !venueId) return;

      try {
        setLoadingUserReview(true);
        const review = await ReviewService.getUserReviewForVenue(user.id, venueId);
        setUserReview(review);
      } catch (error) {
        console.error('Error fetching user review:', error);
      } finally {
        setLoadingUserReview(false);
      }
    };

    fetchUserReview();
  }, [user?.id, venueId]);

  // Fetch most recent 3 reviews for preview
  useEffect(() => {
    const fetchRecentReviews = async () => {
      if (!venueId) return;

      try {
        setLoadingReviews(true);
        const response = await ReviewService.getVenueReviews({
          venueId,
          limit: 3,
          offset: 0,
          sortBy: 'recent',
        });
        setRecentReviews(response.reviews);
      } catch (error) {
        console.error('Error fetching recent reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchRecentReviews();
  }, [venueId]);

  // Review handlers
  const handleOpenReviewModal = () => {
    setReviewModalVisible(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalVisible(false);
  };

  const handleReviewSubmitSuccess = async () => {
    console.log('📝 Review submitted, refreshing data...');

    // Refresh user's review
    if (user?.id) {
      try {
        const review = await ReviewService.getUserReviewForVenue(user.id, venueId);
        setUserReview(review);
        console.log('✅ User review refreshed:', review);
      } catch (error) {
        console.error('Error refreshing user review:', error);
      }
    }

    // Refresh venue details to get updated aggregate rating and review_count
    try {
      const supabaseVenue = await VenueService.getVenueById(venueId);
      if (supabaseVenue) {
        console.log('✅ Venue refreshed - review_count:', supabaseVenue.review_count, 'aggregate_rating:', supabaseVenue.aggregate_rating);
        setVenue(supabaseVenue);
      }
    } catch (error) {
      console.error('Error refreshing venue details:', error);
    }

    // Refresh recent reviews
    try {
      const response = await ReviewService.getVenueReviews({
        venueId,
        limit: 3,
        offset: 0,
        sortBy: 'recent',
      });
      console.log('✅ Recent reviews refreshed - count:', response.reviews.length, 'total:', response.total);
      setRecentReviews(response.reviews);
    } catch (error) {
      console.error('Error refreshing recent reviews:', error);
    }
  };

  const handleSeeAllReviews = () => {
    if (venue) {
      navigation.navigate('VenueReviews', {
        venueId: venue.id,
        venueName: venue.name,
      });
    }
  };

  // Scroll to top when screen loads
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [venueId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading venue details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!venue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Venue not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    if (venue.phone) {
      Linking.openURL(`tel:${venue.phone}`);
    }
  };

  const handleWebsite = () => {
    if (venue.website) {
      Linking.openURL(venue.website);
    }
  };

  const handleDirections = () => {
    const query = encodeURIComponent(venue.address);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{
            uri: venue.image_url || 'https://via.placeholder.com/400x250'
          }}
          style={styles.heroImage}
        />

        <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={[styles.venueName, { color: theme.colors.text }]}>{venue.name}</Text>
                {/* Aggregate Rating Display - Moved here */}
                {venue.aggregate_rating !== undefined && venue.review_count !== undefined && (
                  <View style={styles.aggregateRatingContainer}>
                    <AggregateRatingDisplay
                      rating={venue.aggregate_rating}
                      reviewCount={venue.review_count}
                      size="medium"
                      showCount={true}
                    />
                  </View>
                )}
                <Text style={[styles.category, { color: theme.colors.textSecondary }]}>{venue.category} • {venue.price_range}</Text>
                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{venue.description}</Text>
              </View>

              {/* Check-In Button - Inline with venue name */}
              {user && (
                <CheckInButton
                  venueId={venue.id}
                  venueName={venue.name}
                  venueImage={venue.image_url}
                  isCheckedIn={checkInStats?.user_is_checked_in || false}
                  checkInId={checkInStats?.user_checkin_id}
                  checkInTime={checkInStats?.user_checkin_time}
                  activeCheckIns={checkInStats?.active_checkins || 0}
                  maxCapacity={venue.max_capacity}
                  size="medium"
                  showModalForCheckout={true}
                  onCheckInChange={async (isCheckedIn) => {
                    // Refetch check-in stats after check-in/out
                    // This will update the customer count chip
                    console.log('Check-in status changed:', isCheckedIn);
                  }}
                />
              )}
            </View>

            {/* Mutual Favorites Indicator */}
            {user && (
              <MutualFavoritesIndicator
                friends={[]}
                onFriendPress={(friendId) => {
                  console.log('Show friend profile:', friendId);
                }}
              />
            )}

            {/* Engagement Row - Activity Level and Customer Count */}
            <View style={styles.engagementRow}>
              {/* Activity Level Chip */}
              {venue.max_capacity && checkInStats ? (
                (() => {
                  const activityLevel = getActivityLevel(checkInStats.active_checkins, venue.max_capacity);
                  return (
                    <View style={[styles.activityChip, { backgroundColor: activityLevel.color + '20', borderColor: activityLevel.color + '40' }]}>
                      <Text style={styles.activityEmoji}>{activityLevel.emoji}</Text>
                      <Text style={[styles.activityText, { color: activityLevel.color }]}>
                        {activityLevel.level}
                      </Text>
                    </View>
                  );
                })()
              ) : (
                <View style={[styles.activityChip, { backgroundColor: '#10B981' + '20', borderColor: '#10B981' + '40' }]}>
                  <Text style={styles.activityEmoji}>😌</Text>
                  <Text style={[styles.activityText, { color: '#10B981' }]}>
                    Low-key
                  </Text>
                </View>
              )}

              {/* Customer Count */}
              {checkInStats && (
                <VenueCustomerCountChip
                  count={checkInStats.active_checkins}
                  size="medium"
                />
              )}
            </View>
          </View>
        </View>

        {/* Pulse Section - TOP PRIORITY */}
        <UserFeedback venue={venue} />

        {/* Modern Square Cards */}
        <ModernVenueCards venue={venue} />

        {/* Contact Information, Hours, and Amenities */}
        <View style={[styles.modernContentContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact Information</Text>
            {venue.phone && (
              <TouchableOpacity style={[styles.contactItem, { borderBottomColor: theme.colors.border }]} onPress={handleCall}>
                <Icon name="call" size={20} color={theme.colors.primary} />
                <Text style={[styles.contactText, { color: theme.colors.text }]}>{venue.phone}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.contactItem, { borderBottomColor: theme.colors.border }]} onPress={handleDirections}>
              <Icon name="location" size={20} color={theme.colors.primary} />
              <Text style={[styles.contactText, { color: theme.colors.text }]}>{venue.address}</Text>
            </TouchableOpacity>
            {venue.website && (
              <TouchableOpacity style={[styles.contactItem, { borderBottomColor: theme.colors.border }]} onPress={handleWebsite}>
                <Icon name="globe" size={20} color={theme.colors.primary} />
                <Text style={[styles.contactText, { color: theme.colors.text }]}>{venue.website}</Text>
              </TouchableOpacity>
            )}
          </View>

          {venue.hours && Object.keys(venue.hours).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Hours</Text>
              {Object.entries(venue.hours).map(([day, hours]) => (
                <View key={day} style={[styles.hoursItem, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.dayText, { color: theme.colors.text }]}>{day}</Text>
                  <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>{hours as string}</Text>
                </View>
              ))}
            </View>
          )}
        </View>


        {/* Reviews Section */}
        {((venue.review_count !== undefined && venue.review_count > 0) || recentReviews.length > 0) && (
          <View style={[styles.reviewsSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.reviewsSectionHeader}>
              <Text style={[styles.reviewsSectionTitle, { color: theme.colors.text }]}>
                Reviews
              </Text>
              {venue.review_count > 3 && (
                <TouchableOpacity onPress={handleSeeAllReviews}>
                  <Text style={[styles.seeAllButton, { color: theme.colors.primary }]}>
                    See All ({venue.review_count})
                  </Text>
                </TouchableOpacity>
              )}
              {/* Write/Edit Review Button */}
              {user && (
                <TouchableOpacity
                  style={[styles.reviewButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleOpenReviewModal}
                  disabled={loadingUserReview}
                >
                  <Icon name={userReview ? "create-outline" : "star-outline"} size={20} color="white" />
                  <Text style={styles.reviewButtonText}>
                    {loadingUserReview ? 'Loading...' : userReview ? 'Edit Review' : 'Leave Review'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingReviews ? (
              <View style={styles.reviewsLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : recentReviews.length > 0 ? (
              <>
                {recentReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onHelpfulToggle={async (reviewId) => {
                      if (user?.id) {
                        try {
                          await ReviewService.toggleHelpfulVote(reviewId, user.id);
                          // Refresh reviews to show updated helpful count
                          const response = await ReviewService.getVenueReviews({
                            venueId,
                            limit: 3,
                            offset: 0,
                            sortBy: 'recent',
                          });
                          setRecentReviews(response.reviews);
                        } catch (error) {
                          console.error('Error toggling helpful vote:', error);
                        }
                      }
                    }}
                    onEdit={
                      user?.id && review.user_id === user.id
                        ? () => {
                          setUserReview(review);
                          setReviewModalVisible(true);
                        }
                        : undefined
                    }
                    onDelete={
                      user?.id && review.user_id === user.id
                        ? async () => {
                          try {
                            await ReviewService.deleteReview(review.id, user.id);
                            handleReviewSubmitSuccess();
                          } catch (error) {
                            console.error('Error deleting review:', error);
                          }
                        }
                        : undefined
                    }
                    currentUserId={user?.id}
                  />
                ))}

                {venue.review_count > 3 && (
                  <TouchableOpacity
                    style={[styles.seeAllReviewsButton, { borderColor: theme.colors.border }]}
                    onPress={handleSeeAllReviews}
                  >
                    <Text style={[styles.seeAllReviewsButtonText, { color: theme.colors.primary }]}>
                      See All {venue.review_count} Reviews
                    </Text>
                    <Icon name="chevron-forward" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.noReviews}>
                <Text style={[styles.noReviewsText, { color: theme.colors.textSecondary }]}>
                  No reviews yet. Be the first to review!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom spacing for floating tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Review Submission Modal */}
      {user && venue && (
        <ReviewSubmissionModal
          visible={reviewModalVisible}
          onClose={handleCloseReviewModal}
          venueId={venue.id}
          venueName={venue.name}
          existingReview={userReview || undefined}
          onSubmitSuccess={handleReviewSubmitSuccess}
        />
      )}
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
  heroImage: {
    width: '100%',
    height: 250,
  },
  content: {
    marginTop: -20,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modernContentContainer: {
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  activityEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  activityText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  aggregateRatingContainer: {
    marginTop: 4,
  },
  venueName: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginBottom: 5,
  },
  category: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 20,
    width: '100%',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 5,
    marginTop: 10,
    marginBottom: 20,
  },
  reviewButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  reviewsSection: {
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 20,
    paddingHorizontal: 20,
    // paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsSectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  seeAllButton: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  reviewsLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noReviews: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  seeAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
  },
  seeAllReviewsButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 15,
    flex: 1,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  hoursText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
  },
});

export default VenueDetailScreen;