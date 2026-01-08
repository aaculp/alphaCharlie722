import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  Animated,
  Dimensions,
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>(['all_prices']);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Animation for drawer
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width * 0.4)).current;

  // Load all venues on component mount
  useEffect(() => {
    loadVenues();
    if (user) {
      loadUserFavorites();
    }
  }, [user]);

  // Filter venues when search query, categories, filters, or price ranges change
  useEffect(() => {
    filterVenues();
  }, [searchQuery, selectedCategories, selectedFilters, selectedPriceRanges, venues]);

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
      selectedCategories,
      selectedFilters,
      selectedPriceRanges,
      searchQuery,
      totalVenues: venues.length
    });

    let filtered = [...venues]; // Create a copy to avoid mutations

    // Filter by categories (if not 'All')
    if (!selectedCategories.includes('All') && selectedCategories.length > 0) {
      filtered = filtered.filter(venue => selectedCategories.includes(venue.category));
      console.log(`📂 After category filter (${selectedCategories.join(', ')}):`, filtered.length);
    }

    // Filter by price ranges (if not 'all_prices')
    if (!selectedPriceRanges.includes('all_prices') && selectedPriceRanges.length > 0) {
      const priceValues = selectedPriceRanges
        .map(id => priceRanges.find(p => p.id === id)?.value)
        .filter(Boolean);
      
      if (priceValues.length > 0) {
        filtered = filtered.filter(venue => priceValues.includes(venue.price_range));
        console.log(`💰 After price filter (${priceValues.join(', ')}):`, filtered.length);
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
  }, [venues, selectedCategories, selectedFilters, selectedPriceRanges, searchQuery]);

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

  // Clear functions for each filter section
  const clearCategoryFilter = () => {
    setSelectedCategories(['All']);
  };

  const clearPriceFilter = () => {
    setSelectedPriceRanges(['all_prices']);
  };

  const clearTrendingFilters = () => {
    setSelectedFilters(['all']);
  };

  // Toggle functions for multiselect
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (category === 'All') {
        return ['All'];
      }

      // Remove 'All' when selecting specific categories
      const currentCategories = prev.filter(c => c !== 'All');
      
      if (currentCategories.includes(category)) {
        // Remove the category
        const updated = currentCategories.filter(c => c !== category);
        return updated.length === 0 ? ['All'] : updated;
      } else {
        // Add the category
        return [...currentCategories, category];
      }
    });
  };

  const togglePriceRange = (priceId: string) => {
    setSelectedPriceRanges(prev => {
      if (priceId === 'all_prices') {
        return ['all_prices'];
      }

      // Remove 'all_prices' when selecting specific ranges
      const currentRanges = prev.filter(p => p !== 'all_prices');
      
      if (currentRanges.includes(priceId)) {
        // Remove the price range
        const updated = currentRanges.filter(p => p !== priceId);
        return updated.length === 0 ? ['all_prices'] : updated;
      } else {
        // Add the price range
        return [...currentRanges, priceId];
      }
    });
  };

  // Drawer animation functions
  const openFilterDrawer = () => {
    setIsFilterDrawerOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').width * 0.4,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsFilterDrawerOpen(false);
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

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetail', {
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  const renderPriceRangeFilter = useCallback(() => (
    <View style={styles.priceContainer}>
      <View style={styles.filterSectionHeader}>
        <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>Price Range</Text>
        {selectedPriceRanges.length > 1 || !selectedPriceRanges.includes('all_prices') ? (
          <TouchableOpacity onPress={clearPriceFilter} style={styles.clearSectionButton}>
            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <FlatList
        data={priceRanges}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedPriceRanges.includes(item.id);
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
              onPress={() => togglePriceRange(item.id)}
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
  ), [selectedPriceRanges, theme]);

  const renderFilterDrawer = () => (
    <Modal
      visible={isFilterDrawerOpen}
      transparent={true}
      animationType="none"
      onRequestClose={closeFilterDrawer}
    >
      <View style={styles.drawerOverlay}>
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={closeFilterDrawer}
        />
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          {/* Drawer Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>Filters</Text>
            <TouchableOpacity onPress={closeFilterDrawer} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Drawer Content */}
          <View style={styles.drawerContent}>
            {/* Categories */}
            <View style={styles.drawerSection}>
              {renderCategoryFilter()}
            </View>

            {/* Price Range */}
            <View style={styles.drawerSection}>
              {renderPriceRangeFilter()}
            </View>

            {/* Hot Filters */}
            <View style={styles.drawerSection}>
              {renderFilterButtons()}
            </View>

            {/* Results Counter */}
            <View style={styles.drawerResultsContainer}>
              <Text style={[styles.drawerResultsText, { color: theme.colors.textSecondary }]}>
                {loading ? 'Loading...' : `${filteredVenues.length} venues found`}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderFilterButtons = useCallback(() => (
    <View style={styles.filterContainer}>
      <View style={styles.filterSectionHeader}>
        <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>Trending</Text>
        {selectedFilters.length > 1 ? (
          <TouchableOpacity onPress={clearTrendingFilters} style={styles.clearSectionButton}>
            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
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
      <View style={styles.filterSectionHeader}>
        <Text style={[styles.filterSectionTitle, { color: theme.colors.text }]}>Categories</Text>
        {selectedCategories.length > 1 || !selectedCategories.includes('All') ? (
          <TouchableOpacity onPress={clearCategoryFilter} style={styles.clearSectionButton}>
            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
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
                backgroundColor: selectedCategories.includes(item)
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => toggleCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: selectedCategories.includes(item)
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
      {/* Search Bar with Filter Button */}
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

        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.filterActionButton, { backgroundColor: theme.colors.primary }]}
          onPress={openFilterDrawer}
        >
          <Icon name="options" size={20} color="#FFFFFF" />
          {(selectedCategories.length > 1 || !selectedCategories.includes('All') || 
            selectedFilters.length > 1 || 
            selectedPriceRanges.length > 1 || !selectedPriceRanges.includes('all_prices')) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>•</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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

      {/* Filter Drawer */}
      {renderFilterDrawer()}
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
    paddingRight: 10,
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
    marginRight: 10,
  },
  filterActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  categoryContainer: {
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  clearSectionButton: {
    padding: 4,
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
    paddingHorizontal: 15,
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
    paddingBottom: 100, // Space for floating tab bar
  },
  // Drawer Styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: '50%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  drawerContent: {
    flex: 1,
    paddingVertical: 10,
  },
  drawerSection: {
    marginBottom: 20,
  },
  drawerSectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  drawerResultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 'auto',
  },
  drawerResultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default SearchScreen;