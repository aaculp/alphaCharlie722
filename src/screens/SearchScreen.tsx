import React, { useState, useEffect, useCallback } from 'react';
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
  'Fast Food',
  'Fine Dining',
  'Coffee Shops',
  'Sports Bars',
  'Breweries',
];

// Filter options
const filterOptions = [
  { id: 'all', label: 'All', icon: 'list' },
  { id: 'open_now', label: 'Open Now', icon: 'time' },
  { id: 'highly_rated', label: 'Highly Rated (4.5+)', icon: 'star' },
  { id: 'budget_friendly', label: 'Budget Friendly ($)', icon: 'cash' },
];

// Price range options
const priceRanges = [
  { id: 'all_prices', label: 'All Prices', value: null },
  { id: 'budget', label: '$', value: '$' },
  { id: 'moderate', label: '$$', value: '$$' },
  { id: 'expensive', label: '$$$', value: '$$$' },
  { id: 'luxury', label: '$$$$', value: '$$$$' },
];

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all_prices');
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

  // Filter venues when search query, category, filters, or price range changes
  useEffect(() => {
    filterVenues();
  }, [searchQuery, selectedCategory, selectedFilters, selectedPriceRange, venues]);

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

  const filterVenues = useCallback(() => {
    console.log('🔍 Filtering venues:', { 
      selectedCategory, 
      selectedFilters, 
      selectedPriceRange,
      searchQuery,
      totalVenues: venues.length 
    });
    
    let filtered = [...venues]; // Create a copy to avoid mutations

    // Filter by category first
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(venue => venue.category === selectedCategory);
      console.log(`📂 After category filter (${selectedCategory}):`, filtered.length);
    }

    // Filter by price range
    if (selectedPriceRange !== 'all_prices') {
      const priceRange = priceRanges.find(p => p.id === selectedPriceRange);
      if (priceRange?.value) {
        filtered = filtered.filter(venue => venue.price_range === priceRange.value);
        console.log(`💰 After price filter (${priceRange.value}):`, filtered.length);
      }
    }

    // Apply additional filters (skip 'all' filter)
    const activeFilters = selectedFilters.filter(f => f !== 'all');
    activeFilters.forEach(filter => {
      const beforeCount = filtered.length;
      switch (filter) {
        case 'open_now':
          filtered = filtered.filter(venue => isVenueOpenNow(venue));
          break;
        case 'highly_rated':
          filtered = filtered.filter(venue => (venue.rating || 0) >= 4.5);
          break;
        case 'budget_friendly':
          filtered = filtered.filter(venue => venue.price_range === '$');
          break;
      }
      console.log(`🎯 After ${filter} filter:`, filtered.length, `(was ${beforeCount})`);
    });

    // Filter by search query last
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(query) ||
        venue.category.toLowerCase().includes(query) ||
        venue.location.toLowerCase().includes(query) ||
        venue.description?.toLowerCase().includes(query)
      );
      console.log(`🔎 After search filter (${searchQuery}):`, filtered.length);
    }

    // Sort by rating (highest first)
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    console.log('✅ Final filtered venues:', filtered.length);
    setFilteredVenues(filtered);
  }, [venues, selectedCategory, selectedFilters, selectedPriceRange, searchQuery]);

  // Helper function to check if venue is open now
  const isVenueOpenNow = (venue: Venue) => {
    if (!venue.hours) return false;
    
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes(); // 1430 for 2:30 PM
    
    const todayHours = venue.hours[currentDay as keyof typeof venue.hours];
    if (!todayHours || todayHours === 'Closed') return false;
    if (todayHours === '24 Hours') return true;
    
    // Parse hours like "11:00 AM - 10:00 PM"
    const timeMatch = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
    if (!timeMatch) return false;
    
    const [, openHour, openMin, openPeriod, closeHour, closeMin, closePeriod] = timeMatch;
    
    let openTime = parseInt(openHour) * 100 + parseInt(openMin);
    let closeTime = parseInt(closeHour) * 100 + parseInt(closeMin);
    
    // Convert to 24-hour format
    if (openPeriod === 'PM' && parseInt(openHour) !== 12) openTime += 1200;
    if (closePeriod === 'PM' && parseInt(closeHour) !== 12) closeTime += 1200;
    if (openPeriod === 'AM' && parseInt(openHour) === 12) openTime -= 1200;
    if (closePeriod === 'AM' && parseInt(closeHour) === 12) closeTime -= 1200;
    
    // Handle overnight hours (close time is next day)
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const toggleFilter = useCallback((filterId: string) => {
    setSelectedFilters(prev => {
      if (filterId === 'all') {
        return ['all'];
      }

      // Remove 'all' from filters when selecting specific filters
      const currentFilters = prev.filter(f => f !== 'all');
      
      if (currentFilters.includes(filterId)) {
        // Remove the filter
        const updated = currentFilters.filter(f => f !== filterId);
        return updated.length === 0 ? ['all'] : updated;
      } else {
        // Add the filter
        return [...currentFilters, filterId];
      }
    });
  }, []);

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

  const renderPriceRangeFilter = useCallback(() => (
    <View style={styles.priceContainer}>
      <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>Price Range</Text>
      <FlatList
        data={priceRanges}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedPriceRange === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.priceButton,
                {
                  backgroundColor: isSelected 
                    ? theme.colors.primary 
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={() => setSelectedPriceRange(item.id)}
            >
              <Text
                style={[
                  styles.priceText,
                  {
                    color: isSelected 
                      ? '#FFFFFF' 
                      : theme.colors.text,
                    fontWeight: isSelected ? 'bold' : 'normal',
                  }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.priceList}
      />
    </View>
  ), [selectedPriceRange, theme]);

  const renderFilterButtons = useCallback(() => (
    <View style={styles.filterContainer}>
      <FlatList
        data={filterOptions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedFilters.includes(item.id);
          return (
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: isSelected 
                    ? theme.colors.primary 
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={() => toggleFilter(item.id)}
            >
              <Icon 
                name={item.icon} 
                size={16} 
                color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
                style={styles.filterIcon}
              />
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isSelected 
                      ? '#FFFFFF' 
                      : theme.colors.text,
                  }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.filterList}
      />
    </View>
  ), [selectedFilters, theme, toggleFilter]);

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
      {renderPriceRangeFilter()}
      {renderFilterButtons()}

      {/* Results Counter */}
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsText, { color: theme.colors.textSecondary }]}>
          {loading ? 'Loading...' : `${filteredVenues.length} venues found`}
        </Text>
      </View>

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
  priceContainer: {
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  priceList: {
    paddingRight: 15,
  },
  priceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterList: {
    paddingHorizontal: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  resultsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
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