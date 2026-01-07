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
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { populateVenuesDatabase } from '../utils/populateVenues';
import { CompactAtmosphere, CompactWaitTimes } from '../components';
import type { Database } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;
type Venue = Database['public']['Tables']['venues']['Row'];

const HomeScreen: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { theme } = useTheme();
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

  const renderFeedItem = (item: Venue) => (
    <TouchableOpacity 
      key={item.id} 
      style={[styles.feedItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleVenuePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ 
            uri: item.image_url || 'https://via.placeholder.com/300x200' 
          }} 
          style={styles.feedImage} 
        />
        <TouchableOpacity 
          style={[styles.favoriteButton, { backgroundColor: theme.colors.surface + 'E6' }]}
          onPress={() => toggleFavorite(item.id)}
        >
          <Icon 
            name={favorites.has(item.id) ? 'heart' : 'heart-outline'} 
            size={20} 
            color={favorites.has(item.id) ? '#FF3B30' : theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.feedContent}>
        <Text style={[styles.venueName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.location, { color: theme.colors.textSecondary }]}>{item.location}</Text>
        <View style={styles.ratingContainer}>
          <Text style={[styles.rating, { color: theme.colors.text }]}>⭐ {item.rating}</Text>
          <Text style={[styles.reviewCount, { color: theme.colors.textSecondary }]}>({item.review_count} reviews)</Text>
        </View>
        
        {/* Enhanced Information Preview */}
        <CompactAtmosphere venue={item} maxTags={2} />
        
        <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.categoryContainer}>
          <Text style={[styles.category, { color: theme.colors.primary, backgroundColor: theme.colors.primary + '20' }]}>{item.category}</Text>
          <Text style={[styles.priceRange, { color: theme.colors.text }]}>{item.price_range}</Text>
          <CompactWaitTimes venue={item} />
        </View>
      </View>
    </TouchableOpacity>
  );

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {venues.length > 0 ? (
          venues.map(renderFeedItem)
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
  feedItem: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  feedImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
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
    padding: 15,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold', // Primary font for headings
  },
  location: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'Inter-Medium', // Secondary font for UI elements
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '500',
    fontFamily: 'Inter-Medium', // Secondary font for UI elements
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold', // Secondary font for emphasis
  },
  
  // Enhanced Information Styles
  atmospherePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  atmosphereTagSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  atmosphereTagTextSmall: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  moreTagsText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  waitTimePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  waitTimeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
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