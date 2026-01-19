import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for AggregateRatingDisplay component
 */
interface AggregateRatingDisplayProps {
  /** Average rating (0-5, one decimal place) */
  rating: number;
  
  /** Total number of reviews */
  reviewCount: number;
  
  /** Size variant for the display */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether to show the review count */
  showCount?: boolean;
}

/**
 * AggregateRatingDisplay Component
 * 
 * Displays aggregate rating with stars, numerical value, and review count.
 * 
 * Features:
 * - Filled/half-filled/empty stars based on rating
 * - Numerical rating display (e.g., "4.5")
 * - Review count display (e.g., "(127 reviews)")
 * - Highlighted color for high ratings (>= 4.5)
 * - Multiple size variants (small, medium, large)
 * - Handles zero reviews gracefully
 * 
 * Requirements Satisfied:
 * - Requirement 3.1: Display aggregate rating on venue detail screen
 * - Requirement 3.2: Show filled stars representing average rating
 * - Requirement 7.2: Show numerical rating on venue cards
 * - Requirement 7.3: Show review count in parentheses
 * - Requirement 7.6: Highlighted color for ratings >= 4.5
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <AggregateRatingDisplay
 *   rating={4.5}
 *   reviewCount={127}
 * />
 * 
 * // Small size without count
 * <AggregateRatingDisplay
 *   rating={3.8}
 *   reviewCount={45}
 *   size="small"
 *   showCount={false}
 * />
 * 
 * // Zero reviews
 * <AggregateRatingDisplay
 *   rating={0}
 *   reviewCount={0}
 * />
 * ```
 */
const AggregateRatingDisplay: React.FC<AggregateRatingDisplayProps> = ({
  rating,
  reviewCount,
  size = 'medium',
  showCount = true,
}) => {
  const { theme } = useTheme();

  // Determine if rating is high (>= 4.5) for highlight color
  const isHighRating = rating >= 4.5;
  
  // Color for stars and rating text
  const ratingColor = isHighRating ? '#F59E0B' : theme.colors.textSecondary;

  // Size configurations
  const sizeConfig = {
    small: {
      starSize: 14,
      ratingFontSize: 13,
      countFontSize: 11,
      gap: 4,
    },
    medium: {
      starSize: 18,
      ratingFontSize: 16,
      countFontSize: 13,
      gap: 6,
    },
    large: {
      starSize: 22,
      ratingFontSize: 20,
      countFontSize: 15,
      gap: 8,
    },
  };

  const config = sizeConfig[size];

  /**
   * Render star icons based on rating
   * - Filled star for whole numbers
   * - Half-filled star for decimals >= 0.5
   * - Empty star for remaining
   */
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Filled stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon
          key={`full-${i}`}
          name="star"
          size={config.starSize}
          color={ratingColor}
        />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <Icon
          key="half"
          name="star-half"
          size={config.starSize}
          color={ratingColor}
        />
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon
          key={`empty-${i}`}
          name="star-outline"
          size={config.starSize}
          color={theme.colors.textSecondary}
        />
      );
    }

    return stars;
  };

  // Handle zero reviews case
  if (reviewCount === 0) {
    return (
      <View style={styles.container}>
        <Text
          style={[
            styles.noReviewsText,
            {
              color: theme.colors.textSecondary,
              fontSize: config.countFontSize,
            },
          ]}
        >
          No reviews yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stars */}
      <View style={[styles.starsContainer, { gap: 2 }]}>
        {renderStars()}
      </View>

      {/* Numerical Rating */}
      <Text
        style={[
          styles.ratingText,
          {
            color: ratingColor,
            fontSize: config.ratingFontSize,
            marginLeft: config.gap,
          },
        ]}
      >
        {rating.toFixed(1)}
      </Text>

      {/* Review Count */}
      {showCount && (
        <Text
          style={[
            styles.countText,
            {
              color: theme.colors.textSecondary,
              fontSize: config.countFontSize,
              marginLeft: config.gap / 2,
            },
          ]}
        >
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'Inter-SemiBold',
  },
  countText: {
    fontFamily: 'Inter-Regular',
  },
  noReviewsText: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});

export default AggregateRatingDisplay;
