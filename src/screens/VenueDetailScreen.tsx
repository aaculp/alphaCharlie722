import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { SearchStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

type VenueDetailRouteProp = RouteProp<SearchStackParamList, 'VenueDetail'>;

// Mock detailed venue data
const getVenueDetails = (venueId: string) => {
  const venueDetails: { [key: string]: any } = {
    '1': {
      id: '1',
      name: 'The Coffee House',
      location: 'Downtown',
      category: 'Cafe',
      rating: 4.5,
      reviewCount: 127,
      image: 'https://via.placeholder.com/400x250',
      description: 'A cozy coffee house in the heart of downtown, perfect for meetings, studying, or just enjoying a great cup of coffee. We source our beans from local roasters and offer a variety of pastries and light meals.',
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
      amenities: ['WiFi', 'Outdoor Seating', 'Pet Friendly', 'Takeout'],
      price: '$$',
    },
    '2': {
      id: '2',
      name: 'Sunset Restaurant',
      location: 'Waterfront',
      category: 'Restaurant',
      rating: 4.8,
      reviewCount: 89,
      image: 'https://via.placeholder.com/400x250',
      description: 'Experience fine dining with breathtaking ocean views. Our menu features fresh seafood and locally sourced ingredients, creating an unforgettable culinary experience.',
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
      amenities: ['Ocean View', 'Valet Parking', 'Full Bar', 'Reservations'],
      price: '$$$',
    },
  };

  return venueDetails[venueId] || null;
};

const VenueDetailScreen: React.FC = () => {
  const route = useRoute<VenueDetailRouteProp>();
  const { venueId } = route.params;
  const { theme } = useTheme();
  
  const venue = getVenueDetails(venueId);

  if (!venue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Venue not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    Linking.openURL(`tel:${venue.phone}`);
  };

  const handleWebsite = () => {
    Linking.openURL(venue.website);
  };

  const handleDirections = () => {
    const query = encodeURIComponent(venue.address);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: venue.image }} style={styles.heroImage} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.venueName}>{venue.name}</Text>
            <Text style={styles.category}>{venue.category} • {venue.price}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {venue.rating}</Text>
              <Text style={styles.reviewCount}>({venue.reviewCount} reviews)</Text>
            </View>
          </View>

          <Text style={styles.description}>{venue.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
              <Icon name="call" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{venue.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem} onPress={handleDirections}>
              <Icon name="location" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{venue.address}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
              <Icon name="globe" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{venue.website}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hours</Text>
            {Object.entries(venue.hours).map(([day, hours]) => (
              <View key={day} style={styles.hoursItem}>
                <Text style={styles.dayText}>{day}</Text>
                <Text style={styles.hoursText}>{hours as string}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {venue.amenities.map((amenity: string, index: number) => (
                <View key={index} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  content: {
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  venueName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 16,
    color: '#666',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
});

export default VenueDetailScreen;