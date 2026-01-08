import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VenueService } from '../services/venueService';
import { FavoriteService } from '../services/favoriteService';
import { CheckInService, VenueCheckInStats } from '../services/checkInService';
import { useTheme } from '../contexts/ThemeContext';
import { useGridLayout } from '../contexts/GridLayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { populateVenuesDatabase } from '../utils/populateVenues';
import { getActivityLevel } from '../utils/activityLevel';
import CheckInButton from '../components/CheckInButton';
import { VenueCustomerCount } from '../components';
import type { Database } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;
type Venue = Database['public']['Tables']['venues']['Row'];

const HomeScreen: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [checkInStats, setCheckInStats] = useState<Map<string, VenueCheckInStats>>(new Map());
  const { theme } = useTheme();
  const { gridLayout } = useGridLayout();
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const loadFeaturedVenues = async () => {
    try {
      let featuredVenues = await VenueService.getFeaturedVenues(10);

      // If no venues found, populate the database with sample data
      if (featuredVenues.length === 0) {
        console.log('📝 No venues found, populating database...');
        await populateVenuesDatabase();
        featuredVenues = await VenueService.getFeaturedVenues(10);
      }

      setVenues(featuredVenues);

      // Load user's favorites if logged in
      if (user) {
        await loadUserFavorites();
      }

      // Load check-in stats for all venues
      await loadCheckInStats(featuredVenues.map(v => v.id));
    } catch (error) {
      Alert.alert('Error', 'Failed to load venues. Please try again.');
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserFavorites = async () => {
    if (!user) return;

    try {
      const userFavorites = await FavoriteService.getUserFavorites(user.id);
      const favoriteIds = new Set(userFavorites.map(fav => fav.venue_id));
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadCheckInStats = async (venueIds: string[]) => {
    try {
      const stats = await CheckInService.getMultipleVenueStats(venueIds, user?.id);
      setCheckInStats(stats);
    } catch (error) {
      console.error('Error loading check-in stats:', error);
    }
  };

  const handleCheckInChange = (venueId: string, isCheckedIn: boolean, newCount: number) => {
    setCheckInStats(prev => {
      const newStats = new Map(prev);
      const currentStats = newStats.get(venueId);
      if (currentStats) {
        newStats.set(venueId, {
          ...currentStats,
          user_is_checked_in: isCheckedIn,
          active_checkins: newCount
        });
      }
      return newStats;
    });
  };

  const toggleFavorite = async (venueId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to save favorites.');
      return;
    }

    try {
      const newFavoriteStatus = await FavoriteService.toggleFavorite(user.id, venueId);

      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newFavoriteStatus) {
          newFavorites.add(venueId);
        } else {
          newFavorites.delete(venueId);
        }
        return newFavorites;
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite. Please try again.');
      console.error('Error toggling favorite:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeaturedVenues();
    setRefreshing(false);
  };

  useEffect(() => {
    loadFeaturedVenues();
  }, []);

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', {
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  const renderFeedItem = (item: Venue, index: number) => {
    const venueCheckInStats = checkInStats.get(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.feedItem,
          { backgroundColor: theme.colors.surface },
          gridLayout === '1-column' && styles.singleColumnItem
        ]}
        onPress={() => handleVenuePress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.imageContainer,
          gridLayout === '1-column' && styles.singleColumnImageContainer
        ]}>
          <Image
            source={{
              uri: item.image_url || 'https://via.placeholder.com/300x200'
            }}
            style={[
              styles.feedImage,
              gridLayout === '1-column' && styles.singleColumnImage
            ]}
          />
          <TouchableOpacity
            style={[styles.favoriteButton, { backgroundColor: theme.colors.surface + 'E6' }]}
            onPress={() => toggleFavorite(item.id)}
          >
            <Icon
              name={favorites.has(item.id) ? 'heart' : 'heart-outline'}
              size={18}
              color={favorites.has(item.id) ? '#FF3B30' : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <View style={[
          styles.feedContent,
          gridLayout === '1-column' && styles.singleColumnContent
        ]}>
          <Text style={[styles.venueName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.location, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.location}
          </Text>

          {/* Activity Level Chip - Between location and rating */}
          {item.max_capacity && venueCheckInStats ? (
            <View style={styles.activityContainer}>
              {(() => {
                const activityLevel = getActivityLevel(venueCheckInStats.active_checkins, item.max_capacity);
                return (
                  <View style={[styles.activityChip, { backgroundColor: activityLevel.color + '20', borderColor: activityLevel.color + '40' }]}>
                    <Text style={styles.activityEmoji}>{activityLevel.emoji}</Text>
                    <Text style={[styles.activityText, { color: activityLevel.color }]}>
                      {activityLevel.level}
                    </Text>
                  </View>
                );
              })()}
            </View>
          ) : (
            <View style={styles.activityContainer}>
              <View style={[styles.activityChip, { backgroundColor: '#10B981' + '20', borderColor: '#10B981' + '40' }]}>
                <Text style={styles.activityEmoji}>😌</Text>
                <Text style={[styles.activityText, { color: '#10B981' }]}>
                  Low-key
                </Text>
              </View>
            </View>
          )}

          <View style={styles.ratingContainer}>
            <Text style={[styles.rating, { color: theme.colors.text }]}>⭐ {item.rating}</Text>
            <Text style={[styles.reviewCount, { color: theme.colors.textSecondary }]}>({item.review_count})</Text>
          </View>

          {/* Check-in Button Row */}
          {venueCheckInStats && (
            <View style={styles.checkInContainer}>
              <CheckInButton
                venueId={item.id}
                venueName={item.name}
                venueImage={item.image_url || undefined}
                isCheckedIn={venueCheckInStats.user_is_checked_in}
                checkInId={venueCheckInStats.user_checkin_id}
                checkInTime={venueCheckInStats.user_checkin_time}
                activeCheckIns={venueCheckInStats.active_checkins}
                maxCapacity={item.max_capacity || undefined}
                onCheckInChange={(isCheckedIn, newCount) => handleCheckInChange(item.id, isCheckedIn, newCount)}
                size="small"
                showModalForCheckout={true}
              />
              <VenueCustomerCount
                count={venueCheckInStats.active_checkins}
                size="small"
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
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
          <View style={[
            styles.venueGrid,
            gridLayout === '1-column' && styles.singleColumnGrid
          ]}>
            {venues.map((venue, index) => renderFeedItem(venue, index))}
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
  venueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 5,
    justifyContent: 'space-between',
  },
  singleColumnGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  feedItem: {
    width: '48%', // Slightly less than 50% to account for gap
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  singleColumnItem: {
    width: '100%',
    flexDirection: 'column',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  singleColumnImageContainer: {
    position: 'relative',
  },
  feedImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  singleColumnImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  feedContent: {
    padding: 12,
  },
  singleColumnContent: {
    padding: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  location: {
    fontSize: 12,
    marginBottom: 6,
    fontFamily: 'Inter-Regular',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
    marginRight: 4,
    fontFamily: 'Inter-Medium',
  },
  reviewCount: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  activityText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  checkInContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular', // Secondary font for body text
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
    fontFamily: 'Poppins-SemiBold', // Primary font for headings
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
});

export default HomeScreen;