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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../navigation/AppNavigator';
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
    image: 'https://via.placeholder.com/100x100',
    distance: '0.5 km',
  },
  {
    id: '2',
    name: 'Sunset Restaurant',
    location: 'Waterfront',
    category: 'Restaurant',
    rating: 4.8,
    image: 'https://via.placeholder.com/100x100',
    distance: '1.2 km',
  },
  {
    id: '3',
    name: 'Urban Gym',
    location: 'City Center',
    category: 'Fitness',
    rating: 4.2,
    image: 'https://via.placeholder.com/100x100',
    distance: '0.8 km',
  },
  {
    id: '4',
    name: 'Book Haven',
    location: 'Arts District',
    category: 'Bookstore',
    rating: 4.6,
    image: 'https://via.placeholder.com/100x100',
    distance: '2.1 km',
  },
  {
    id: '5',
    name: 'Pizza Corner',
    location: 'Main Street',
    category: 'Restaurant',
    rating: 4.3,
    image: 'https://via.placeholder.com/100x100',
    distance: '1.5 km',
  },
];

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVenues, setFilteredVenues] = useState(venuesData);
  const navigation = useNavigation<SearchScreenNavigationProp>();

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
      style={styles.venueItem}
      onPress={() => handleVenuePress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.venueImage} />
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueCategory}>{item.category}</Text>
        <Text style={styles.venueLocation}>{item.location}</Text>
        <View style={styles.venueDetails}>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
          <Text style={styles.distance}>{item.distance}</Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Venues</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search venues, categories, locations..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredVenues}
        renderItem={renderVenueItem}
        keyExtractor={item => item.id}
        style={styles.venuesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No venues found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#333',
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
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 4,
  },
  venueCategory: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  venueLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  venueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 14,
    color: '#333',
  },
  distance: {
    fontSize: 14,
    color: '#666',
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
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default SearchScreen;