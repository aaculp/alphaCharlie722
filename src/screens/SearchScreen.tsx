import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

type SearchScreenNavigationProp = NativeStackNavigationProp<
  SearchStackParamList,
  'SearchList'
>;

// Mock venue data
const venuesData = [
  {
    id: '1',
    name: 'The Coffee House',
    location: 'Downtown',
    category: 'Cafe',
    rating: 4.5,
    image: 'https://picsum.photos/100/100?random=1',
    distance: '0.5 km',
  },
  {
    id: '2',
    name: 'Sunset Restaurant',
    location: 'Waterfront',
    category: 'Restaurant',
    rating: 4.8,
    image: 'https://picsum.photos/100/100?random=2',
    distance: '1.2 km',
  },
  {
    id: '3',
    name: 'Urban Gym',
    location: 'City Center',
    category: 'Fitness',
    rating: 4.2,
    image: 'https://picsum.photos/100/100?random=3',
    distance: '0.8 km',
  },
  {
    id: '4',
    name: 'Book Haven',
    location: 'Arts District',
    category: 'Bookstore',
    rating: 4.6,
    image: 'https://picsum.photos/100/100?random=4',
    distance: '2.1 km',
  },
  {
    id: '5',
    name: 'Pizza Corner',
    location: 'Main Street',
    category: 'Restaurant',
    rating: 4.3,
    image: 'https://picsum.photos/100/100?random=5',
    distance: '1.5 km',
  },
];

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVenues, setFilteredVenues] = useState(venuesData);
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { theme } = useTheme();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredVenues(venuesData);
    } else {
      const filtered = venuesData.filter(
        venue =>
          venue.name.toLowerCase().includes(query.toLowerCase()) ||
          venue.category.toLowerCase().includes(query.toLowerCase()) ||
          venue.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredVenues(filtered);
    }
  };

  const handleVenuePress = (venue: typeof venuesData[0]) => {
    navigation.navigate('VenueDetail', {
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  const renderVenueItem = ({ item }: { item: typeof venuesData[0] }) => (
    <TouchableOpacity
      style={[styles.venueItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleVenuePress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.venueImage} />
      <View style={styles.venueInfo}>
        <Text style={[styles.venueName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.venueCategory, { color: theme.colors.primary }]}>{item.category}</Text>
        <Text style={[styles.venueLocation, { color: theme.colors.textSecondary }]}>{item.location}</Text>
        <View style={styles.venueDetails}>
          <Text style={[styles.rating, { color: theme.colors.text }]}>⭐ {item.rating}</Text>
          <Text style={[styles.distance, { color: theme.colors.textSecondary }]}>{item.distance}</Text>
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
          onChangeText={handleSearch}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredVenues}
        renderItem={renderVenueItem}
        keyExtractor={item => item.id}
        style={styles.venuesList}
        contentContainerStyle={filteredVenues.length === 0 ? styles.emptyListContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No venues found</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Try adjusting your search</Text>
          </View>
        }
      />
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
  venueImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
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
  distance: {
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
    fontFamily: 'Poppins-SemiBold', // Primary font for headings
  },
  emptySubtext: {
    fontSize: 14,
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