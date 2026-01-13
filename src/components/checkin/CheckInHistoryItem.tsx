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
import { formatCheckInTime, formatDuration, formatVisitCount } from '../../utils/formatting/time';
import type { CheckInWithVenue } from '../../types/checkin.types';

interface CheckInHistoryItemProps {
  checkIn: CheckInWithVenue;
  visitCount: number;
  onPress: () => void;
}

/**
 * CheckInHistoryItem Component
 * 
 * Displays a single check-in history item with venue information,
 * check-in timestamp, duration, and visit count.
 * 
 * Requirements: 1.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 9.1, 10.2, 10.3
 */
const CheckInHistoryItem: React.FC<CheckInHistoryItemProps> = ({
  checkIn,
  visitCount,
  onPress,
}) => {
  const { theme, isDark } = useTheme();

  // Format the check-in time
  const formattedTime = formatCheckInTime(checkIn.checked_in_at);
  
  // Format the duration
  const formattedDuration = formatDuration(
    checkIn.checked_in_at,
    checkIn.checked_out_at
  );
  
  // Format the visit count
  const formattedVisitCount = formatVisitCount(visitCount);

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
      <Image
        source={{
          uri: checkIn.venue.image_url || 'https://via.placeholder.com/80x80'
        }}
        style={styles.venueImage}
      />

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
            {checkIn.venue.name}
          </Text>
          
          {/* Category Badge */}
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
              {checkIn.venue.category}
            </Text>
          </View>
        </View>

        {/* Location */}
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
            {checkIn.venue.location}
          </Text>
        </View>

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          {/* Check-in Time */}
          <View style={styles.metadataItem}>
            <Icon
              name="time-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.metadataText,
                { color: theme.colors.textSecondary }
              ]}
            >
              {formattedTime}
            </Text>
          </View>

          {/* Duration */}
          <View style={styles.metadataItem}>
            <Icon
              name="hourglass-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.metadataText,
                { color: theme.colors.textSecondary }
              ]}
            >
              {formattedDuration}
            </Text>
          </View>
        </View>

        {/* Visit Count Badge */}
        <View
          style={[
            styles.visitBadge,
            {
              backgroundColor: theme.colors.success + '20',
              borderColor: theme.colors.success + '40',
            }
          ]}
        >
          <Icon
            name="checkmark-circle-outline"
            size={14}
            color={theme.colors.success}
          />
          <Text
            style={[
              styles.visitText,
              { color: theme.colors.success }
            ]}
          >
            {formattedVisitCount}
          </Text>
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
  venueImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
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
    marginBottom: 8,
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  visitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  visitText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  chevron: {
    marginLeft: 8,
  },
});

export default CheckInHistoryItem;
