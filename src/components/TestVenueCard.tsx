import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { getActivityLevel } from '../utils/activityLevel';
import { VenueCustomerCount } from './index';
import type { Database } from '../lib/supabase';

type Venue = Database['public']['Tables']['venues']['Row'];

interface TestVenueCardProps {
  venue: Venue;
  checkInCount: number;
  isCheckedIn?: boolean;
  onPress?: () => void;
  onCheckIn?: () => void;
  onMoreOptions?: () => void;
}

const TestVenueCard: React.FC<TestVenueCardProps> = ({
  venue,
  checkInCount,
  isCheckedIn = false,
  onPress,
  onCheckIn,
  onMoreOptions,
}) => {
  const { theme } = useTheme();

  const activityLevel = venue.max_capacity 
    ? getActivityLevel(checkInCount, venue.max_capacity)
    : { level: 'Low-key', emoji: '😌', color: '#10B981' };

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
      
      {/* Transparent Overlay */}
      <View style={styles.overlay}>
        {/* First Row - Engagement Chip and Customer Count */}
        <View style={styles.topRow}>
          {/* Venue Engagement Chip */}
          <View style={[
            styles.engagementChip, 
            { 
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderColor: 'rgba(255, 255, 255, 0.4)'
            }
          ]}>
            <Text style={styles.chipEmoji}>{activityLevel.emoji}</Text>
            <Text style={styles.chipText}>{activityLevel.level}</Text>
          </View>
          
          {/* Customer Count */}
          <VenueCustomerCount 
            count={checkInCount}
            size="small"
          />
        </View>

        {/* Floating Action Panel */}
        <View style={styles.floatingPanel}>
          {/* Check-in Button */}
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isCheckedIn && styles.checkedInButton
            ]}
            onPress={onCheckIn}
          >
            <Icon 
              name={isCheckedIn ? "checkmark" : "add"} 
              size={18} 
              color="white" 
            />
          </TouchableOpacity>
          
          {/* Favorite Button */}
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="heart-outline" size={18} color="white" />
          </TouchableOpacity>
          
          {/* More Options */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onMoreOptions}
          >
            <Icon name="ellipsis-horizontal" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Venue Details */}
        <View style={styles.venueDetails}>
          <Text style={styles.venueName} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text style={styles.venueLocation} numberOfLines={1}>
            {venue.location}
          </Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {venue.rating}</Text>
            <Text style={styles.reviewCount}>({venue.review_count})</Text>
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
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  floatingPanel: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -60 }],
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  checkedInButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderColor: 'rgba(34, 197, 94, 1)',
  },
  venueDetails: {
    alignSelf: 'stretch',
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  venueLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: 'white',
    marginRight: 6,
    fontFamily: 'Inter-Medium',
  },
  reviewCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter-Regular',
  },
});

export default TestVenueCard;