import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../navigation/AppNavigator';
import { VenueService } from '../services/venueService';
import { FavoriteService } from '../services/favoriteService';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

type SearchScreenNavigationProp = NativeStackNavigationProp<
  SearchStackParamList,
  'SearchList'
>;

type Venue = Database['public']['Tables']['venues']['Row'];

// Categories for filtering
const categories = [
  'All',
  'Restaurant',
  'Cafe',
  'Bar',
  'Fitness',
  'Entertainment',
  'Wellness',
  'Bookstore',
];

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Load all venues on component mount
  useEffect(() => {
    loadVenues();
    if (user) {
      loadUserFavorites();
    }
  }, [user]);

  // Filter venues when search query or category changes
  useEffect(() => {
    filterVenues();
  }, [searchQuery, selectedCategory, venues]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const allVenues = await VenueService.getVenues({ limit: 50 });
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

  const filterVenues = () => {
    let filtered = venues;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(venue => venue.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(query) ||
        venue.category.toLowerCase().includes(query) ||
        venue.location.toLowerCase().includes(query) ||
        venue.description?.toLowerCase().includes(query)
      );
    }

    // Sort by rating (highest first)
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    setFilteredVenues(filtered);
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

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', {
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === item 
                  ? theme.colors.primary 
                  : theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: selectedCategory === item 
                    ? '#FFFFFF' 
                    : theme.colors.text,
                }
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoryList}
      />
    </View>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Icon name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search venues, categories, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {renderCategoryFilter()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading venues...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVenues}
          renderItem={renderVenueItem}
          keyExtractor={item => item.id}
          style={styles.venuesList}
          contentContainerStyle={filteredVenues.length === 0 ? styles.emptyListContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No venues found</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search' : 'Start typing to search venues'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular', // Secondary font for UI elements
  },
  clearButton: {
    padding: 5,
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryList: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium', // Secondary font for UI elements
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular', // Secondary font for body text
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
    fontFamily: 'Poppins-SemiBold', // Primary font for headings
  },
  venueCategory: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'Inter-Medium', // Secondary font for UI elements
  },
  venueLocation: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
  venueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
  priceRange: {
    fontSize: 14,
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
    marginTop: 16,
    fontFamily: 'Poppins-SemiBold', // Primary font for headings
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default SearchScreen;