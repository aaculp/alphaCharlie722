import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { VenueCustomerCount, VenueEngagementChip } from './index';
import type { Venue } from '../../types';

interface TestVenueCardProps {
  venue: Venue;
  checkInCount: number;
  onPress?: () => void;
  // Optional props to customize the engagement chip colors
  customerCountVariant?: 'themed' | 'traffic' | 'primary' | 'success' | 'warning' | 'error';
  engagementChipVariant?: 'themed' | 'colored' | 'traffic' | 'primary' | 'success' | 'warning' | 'error';
  distance?: string; // Optional distance display (e.g., "1.2 km")
}

const TestVenueCard: React.FC<TestVenueCardProps> = ({
  venue,
  checkInCount,
  onPress,
  customerCountVariant = 'traffic',
  engagementChipVariant = 'traffic',
  distance,
}) => {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Background Image */}
      <Image
        source={{
          uri: venue.image_url || 'https://via.placeholder.com/400x300'
        }}
        style={styles.backgroundImage}
      />

      {/* Glassmorphism Content Wrapper at Bottom */}
      <View style={[
        styles.contentWrapper,
        {
          backgroundColor: isDark
            ? 'rgba(20, 20, 20, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        <View style={styles.contentRow}>
          {/* Left Side - Venue Info */}
          <View style={styles.leftContent}>
            <Text style={[styles.venueName, { color: isDark ? 'white' : '#000000' }]} numberOfLines={1}>
              {venue.name}
            </Text>
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={14} color={isDark ? 'rgba(255, 255, 255, 0.7)' : '#666666'} />
              <Text style={[styles.venueLocation, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#666666' }]} numberOfLines={1}>
                {venue.location}
              </Text>
              {distance && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{distance}</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingRow}>
              <Text style={[styles.rating, { color: isDark ? 'white' : '#000000' }]}>⭐ {venue.rating}</Text>
              <Text style={[styles.reviewCount, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#666666' }]}>({venue.review_count})</Text>
            </View>
          </View>

          {/* Right Side - Engagement Elements */}
          <View style={styles.rightContent}>
            <VenueCustomerCount
              count={checkInCount}
              maxCapacity={venue.max_capacity || 100}
              size="small"
              variant={customerCountVariant}
            />
            
            <VenueEngagementChip
              currentCheckIns={checkInCount}
              maxCapacity={venue.max_capacity || 100}
              size="small"
              variant={engagementChipVariant}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  contentWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  rightContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    height: '100%',
    gap: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  venueLocation: {
    fontSize: 13,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  distanceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    marginRight: 6,
    fontFamily: 'Inter-Medium',
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});

export default TestVenueCard;