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
import { useEngagementColor } from '../../hooks/useEngagementColor';
import VenueCustomerCount from './VenueCustomerCount';
import type { Venue } from '../../types';

// Partial venue type for compact display
type CompactVenue = Pick<Venue, 'id' | 'name' | 'category' | 'image_url'> & {
  max_capacity?: number | null;
};

interface CompactVenueCardProps {
  venue: CompactVenue;
  onPress: () => void;
  
  // Optional badge configuration
  badge?: {
    icon?: string;
    text: string;
    color?: string;
  };
  
  // Optional subtitle (e.g., "Opened 2 days ago", "Visited 3 days ago")
  subtitle?: string;
  
  // Optional engagement stats
  checkInCount?: number;
  maxCapacity?: number;
  
  // Optional border color override
  borderColor?: string;
}

/**
 * CompactVenueCard Component
 * 
 * A reusable compact venue card for horizontal scrolling lists.
 * Used in Recently Visited, New Venues Spotlight, and other carousels.
 * 
 * Features:
 * - Compact 140px width design
 * - Optional badge (NEW, FAVORITE, etc.)
 * - Optional subtitle text
 * - Optional engagement stats
 * - Customizable border color
 */
const CompactVenueCard: React.FC<CompactVenueCardProps> = ({
  venue,
  onPress,
  badge,
  subtitle,
  checkInCount,
  maxCapacity,
  borderColor: customBorderColor,
}) => {
  const { theme } = useTheme();

  // Calculate engagement color if stats are provided
  const engagementColor = useEngagementColor(
    checkInCount || 0,
    maxCapacity || 100
  );

  // Use custom border color or engagement color or default
  const borderColor = customBorderColor || 
    (checkInCount !== undefined ? engagementColor.borderColor : theme.colors.border);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: borderColor,
          borderWidth: 2,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${venue.name}, ${venue.category}`}
    >
      {/* Venue Image */}
      <Image
        source={{
          uri: venue.image_url || 'https://via.placeholder.com/120x120'
        }}
        style={styles.image}
      />

      {/* Optional Badge (NEW, FAVORITE, etc.) */}
      {badge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badge.color || theme.colors.primary,
            }
          ]}
        >
          {badge.icon && (
            <Icon name={badge.icon} size={12} color="white" />
          )}
          <Text style={styles.badgeText}>{badge.text}</Text>
        </View>
      )}

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Optional Subtitle (e.g., "Opened 2 days ago") */}
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: theme.colors.primary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}

        {/* Venue Name */}
        <Text
          style={[styles.venueName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {venue.name}
        </Text>

        {/* Category */}
        <View style={styles.categoryBadge}>
          <Text
            style={[styles.categoryText, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {venue.category}
          </Text>
        </View>

        {/* Optional Engagement Stats */}
        {checkInCount !== undefined && maxCapacity !== undefined && (
          <View style={styles.statsRow}>
            <VenueCustomerCount
              count={checkInCount}
              maxCapacity={maxCapacity}
              size="small"
              variant="traffic"
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 100,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 10,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    marginBottom: 2,
  },
  venueName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  categoryBadge: {
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  statsRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 6,
  },
});

export default CompactVenueCard;
