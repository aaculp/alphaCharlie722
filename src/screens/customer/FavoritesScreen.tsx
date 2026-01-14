import React, { useState, useEffect, useCallback } from 'react';
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
import { FavoriteService } from '../../services/api/favorites';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FriendVenueCarousel } from '../../components/social';
import Icon from 'react-native-vector-icons/Ionicons';

type FavoritesScreenNavigationProp = NativeStackNavigationProp<any>;

interface FavoriteVenue {
  id: string;
  venue_id: string;
  created_at: string;
  venues: {
    id: string;
    name: string;
    description: string;
    category: string;
    location: string;
    address: string;
    rating: number;
    review_count: number;
    image_url: string;
    price_range: string;
  };
}

const FavoritesScreen: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<FavoritesScreenNavigationProp>();

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userFavorites = await FavoriteService.getUserFavorites(user.id, 50);
      setFavorites(userFavorites);
    } catch (error) {
      Alert.alert('Error', 'Failed to load favorites. Please try again.');
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user, loadFavorites]);

  const removeFavorite = async (venueId: string) => {
    if (!user) return;

    try {
      await FavoriteService.removeFromFavorites(user.id, venueId);
      setFavorites(prev => prev.filter(fav => fav.venue_id !== venueId));
    } catch (error) {
      Alert.alert('Error', 'Failed to remove favorite. Please try again.');
      console.error('Error removing favorite:', error);
    }
  };

  const handleVenuePress = (venue: FavoriteVenue['venues']) => {
    navigation.navigate('VenueDetail', {
      venueId: venue.id,
      venueName: venue.name,
    });
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteVenue }) => (
    <TouchableOpacity
      style={[styles.favoriteItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleVenuePress(item.venues)}
    >
      <Image 
        source={{ uri: item.venues.image_url || 'https://via.placeholder.com/100x100' }} 
        style={styles.venueImage} 
      />
      <View style={styles.venueInfo}>
        <Text style={[styles.venueName, { color: theme.colors.text }]}>{item.venues.name}</Text>
        <Text style={[styles.venueCategory, { color: theme.colors.primary }]}>{item.venues.category}</Text>
        <Text style={[styles.venueLocation, { color: theme.colors.textSecondary }]}>{item.venues.location}</Text>
        <View style={styles.venueDetails}>
          <Text style={[styles.rating, { color: theme.colors.text }]}>⭐ {item.venues.rating}</Text>
          <Text style={[styles.priceRange, { color: theme.colors.textSecondary }]}>{item.venues.price_range}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFavorite(item.venue_id)}
      >
        <Icon name="heart" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Favorites</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item.id}
        style={styles.favoritesList}
        contentContainerStyle={favorites.length === 0 ? styles.emptyListContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          user && favorites.length > 0 ? (
            <View style={styles.sharedFavoritesSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Shared with Friends</Text>
              <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
                See venues you and your friends both love - coming soon!
              </Text>
              <Text style={[styles.myFavoritesTitle, { color: theme.colors.text }]}>My Favorites</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="heart-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No favorites yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Start exploring and save your favorite venues
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
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
  favoritesList: {
    flex: 1,
  },
  favoriteItem: {
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
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: 'Inter-Regular',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  sharedFavoritesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 12,
  },
  myFavoritesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 15,
    marginBottom: 16,
    fontStyle: 'italic',
  },
});

export default FavoritesScreen;