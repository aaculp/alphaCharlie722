import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Venue } from '../../types';

interface VenueSearchCardProps {
  venue: Venue;
  onPress: () => void;
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}

/**
 * VenueSearchCard Component
 * 
 * Reusable venue card component for search results and lists.
 * Displays venue image, name, category, location, rating, and price range.
 * 
 * Features:
 * - Venue image with fallback
 * - Category badge
 * - Location with icon
 * - Rating and price range
 * - Optional favorite button
 * - Chevron for navigation
 */
const VenueSearchCard: React.FC<VenueSearchCardProps> = ({
  venue,
  onPress,
  showFavoriteButton = false,
  isFavorite = false,
  onFavoritePress,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Venue Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: venue.image_url || 'https://via.placeholder.com/80x80'
          }}
          style={styles.venueImage}
        />
        
        {/* Optional Favorite Button */}
        {showFavoriteButton && onFavoritePress && (
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              { backgroundColor: theme.colors.surface + 'E6' }
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onFavoritePress();
            }}
            activeOpacity={0.7}
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={16}
              color={isFavorite ? '#FF3B30' : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Venue Name and Category */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.venueName,
              { color: theme.colors.text }
            ]}
            numberOfLines={1}
          >
            {venue.name || 'Unknown Venue'}
          </Text>
          
          {/* Category Badge */}
          {venue.category && (
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: theme.colors.primary + '20',
                  borderColor: theme.colors.primary + '40',
                }
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: theme.colors.primary }
                ]}
              >
                {venue.category}
              </Text>
            </View>
          )}
        </View>

        {/* Location */}
        {venue.location && (
          <View style={styles.locationRow}>
            <Icon
              name="location-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.locationText,
                { color: theme.colors.textSecondary }
              ]}
              numberOfLines={1}
            >
              {venue.location}
            </Text>
          </View>
        )}

        {/* Rating and Price Range */}
        <View style={styles.metadataRow}>
          {/* Rating */}
          {venue.rating != null && venue.rating > 0 && (
            <View style={styles.metadataItem}>
              <Icon
                name="star"
                size={14}
                color="#FFB800"
                style={styles.metadataIcon}
              />
              <Text
                style={[
                  styles.metadataText,
                  { color: theme.colors.text }
                ]}
              >
                {venue.rating.toFixed(1)}
              </Text>
            </View>
          )}

          {/* Price Range */}
          {venue.price_range != null && venue.price_range !== '' && (
            <View style={styles.metadataItem}>
              <Text
                style={[
                  styles.priceText,
                  { color: theme.colors.textSecondary }
                ]}
              >
                {venue.price_range}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron Icon */}
      <Icon
        name="chevron-forward"
        size={20}
        color={theme.colors.textSecondary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  venueImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  favoriteButton: {
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
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
    flex: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metadataIcon: {
    marginRight: 4,
  },
  metadataText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  priceText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  chevron: {
    marginLeft: 8,
  },
});

export default VenueSearchCard;
