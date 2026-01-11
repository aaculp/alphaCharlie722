import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VenueService } from '../../services/api/venues';
import { FavoriteService } from '../../services/api/favorites';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Venue } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';

type QuickPicksScreenNavigationProp = NativeStackNavigationProp<any>;

interface QuickPickCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  filter: (venues: Venue[]) => Venue[];
}

const quickPickCategories: QuickPickCategory[] = [
  {
    id: 'best_burgers',
    title: 'Best Burgers',
    description: 'Top-rated burger joints and fast food',
    icon: 'fast-food',
    color: '#FF6B35',
    filter: (venues) => venues.filter(v => 
      v.category === 'Fast Food' && 
      (v.name.toLowerCase().includes('burger') || 
       v.description?.toLowerCase().includes('burger')) &&
      (v.rating || 0) >= 4.0
    ).slice(0, 5)
  },
  {
    id: 'date_night',
    title: 'Date Night Spots',
    description: 'Romantic fine dining and cozy atmospheres',
    icon: 'heart',
    color: '#E91E63',
    filter: (venues) => venues.filter(v => 
      v.category === 'Fine Dining' && 
      (v.rating || 0) >= 4.5 &&
      (v.amenities?.includes('Reservations') || v.amenities?.includes('Outdoor Seating'))
    ).slice(0, 5)
  },
  {
    id: 'study_cafes',
    title: 'Study-Friendly Cafes',
    description: 'Quiet coffee shops perfect for work',
    icon: 'library',
    color: '#4CAF50',
    filter: (venues) => venues.filter(v => 
      v.category === 'Coffee Shops' && 
      (v.amenities?.includes('WiFi') || v.amenities?.includes('Study Areas')) &&
      (v.rating || 0) >= 4.3
    ).slice(0, 5)
  },
  {
    id: 'game_day',
    title: 'Game Day Central',
    description: 'Sports bars with the best viewing experience',
    icon: 'tv',
    color: '#FF9800',
    filter: (venues) => venues.filter(v => 
      v.category === 'Sports Bars' && 
      (v.amenities?.includes('Multiple TVs') || v.amenities?.includes('Sports Packages')) &&
      (v.rating || 0) >= 4.0
    ).slice(0, 5)
  },
  {
    id: 'craft_beer',
    title: 'Craft Beer Scene',
    description: 'Local breweries and beer gardens',
    icon: 'wine',
    color: '#795548',
    filter: (venues) => venues.filter(v => 
      v.category === 'Breweries' && 
      (v.rating || 0) >= 4.2
    ).slice(0, 5)
  },
  {
    id: 'budget_eats',
    title: 'Budget-Friendly Eats',
    description: 'Great food that won\'t break the bank',
    icon: 'cash',
    color: '#2196F3',
    filter: (venues) => venues.filter(v => 
      v.price_range === '$' && 
      (v.rating || 0) >= 4.0
    ).slice(0, 8)
  },
];

const QuickPicksScreen: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<QuickPickCategory | null>(null);
  const [categoryVenues, setCategoryVenues] = useState<Venue[]>([]);
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<QuickPicksScreenNavigationProp>();

  useEffect(() => {
    loadVenues();
    if (user) {
      loadUserFavorites();
    }
  }, [user]);

  const loadVenues = async () => {
    try {
      const allVenues = await VenueService.getVenues({ limit: 100 });
      setVenues(allVenues);
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

  const handleCategoryPress = (category: QuickPickCategory) => {
    const filteredVenues = category.filter(venues);
    setCategoryVenues(filteredVenues);
    setSelectedCategory(category);
  };

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', {
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  const renderCategoryCard = ({ item }: { item: QuickPickCategory }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={32} color={item.color} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderVenueItem = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={[styles.venueItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleVenuePress(item)}
    >
      <View style={styles.venueImageContainer}>
        <Image 
          source={{ uri: item.image_url || 'https://via.placeholder.com/100x100' }} 
          style={styles.venueImage} 
        />
        <TouchableOpacity 
          style={[styles.favoriteButtonSmall, { backgroundColor: theme.colors.surface + 'E6' }]}
          onPress={() => toggleFavorite(item.id)}
        >
          <Icon 
            name={favorites.has(item.id) ? 'heart' : 'heart-outline'} 
            size={16} 
            color={favorites.has(item.id) ? '#FF3B30' : theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.venueInfo}>
        <Text style={[styles.venueName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.venueCategory, { color: theme.colors.primary }]}>{item.category}</Text>
        <Text style={[styles.venueLocation, { color: theme.colors.textSecondary }]}>{item.location}</Text>
        <View style={styles.venueDetails}>
          <Text style={[styles.rating, { color: theme.colors.text }]}>⭐ {item.rating}</Text>
          <Text style={[styles.priceRange, { color: theme.colors.textSecondary }]}>{item.price_range}</Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading quick picks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedCategory) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{selectedCategory.title}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {categoryVenues.length} venues found
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          data={categoryVenues}
          renderItem={renderVenueItem}
          keyExtractor={item => item.id}
          style={styles.venuesList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No venues found</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Try a different category
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Quick Picks</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Curated lists to help you decide
          </Text>
        </View>
      </View>

      <FlatList
        data={quickPickCategories}
        renderItem={renderCategoryCard}
        keyExtractor={item => item.id}
        style={styles.categoriesList}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  categoriesList: {
    flex: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 20,
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
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  venuesList: {
    flex: 1,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  venueImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  venueImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  favoriteButtonSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  venueCategory: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'Inter-Medium',
  },
  venueLocation: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  venueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  priceRange: {
    fontSize: 14,
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
    marginTop: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  listContent: {
    paddingBottom: 100, // Space for floating tab bar
  },
});

export default QuickPicksScreen;