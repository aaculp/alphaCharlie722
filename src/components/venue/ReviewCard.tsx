/**
 * ReviewCard Component
 * 
 * Displays an individual review with reviewer info, rating, text, and actions.
 * 
 * Requirements:
 * - 3.6: Show reviewer name, profile picture, rating, text, timestamp
 * - 3.7: Display helpful button with vote count
 * - 5.1, 5.5, 5.6: Helpful vote toggle with active state
 * - 6.1, 6.4: Edit/delete options for own reviews
 * - 8.2: Show verified badge if is_verified = true
 * - 6.8: Show "Edited" indicator if updated_at > created_at
 * - 9.3, 9.4, 9.8: Display venue owner response
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { ReviewWithReviewer } from '../../types';

interface ReviewCardProps {
  review: ReviewWithReviewer;
  onHelpfulToggle: (reviewId: string) => void;
  onEdit?: () => void; // Only for user's own reviews
  onDelete?: () => void; // Only for user's own reviews
  onReport?: () => void;
  onVenueResponse?: () => void; // Only for venue owners
  currentUserId?: string;
  isVenueOwner?: boolean;
  venueName?: string; // For venue response display
}

/**
 * ReviewCard Component
 * 
 * Displays a single review with all associated information and actions.
 * Supports helpful votes, edit/delete for own reviews, and venue owner responses.
 */
const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpfulToggle,
  onEdit,
  onDelete,
  onReport,
  onVenueResponse,
  currentUserId,
  isVenueOwner = false,
  venueName,
}) => {
  const { theme } = useTheme();
  const [showFullText, setShowFullText] = useState(false);
  const [helpfulLoading, setHelpfulLoading] = useState(false);

  const isOwnReview = currentUserId === review.user_id;
  const isEdited = new Date(review.updated_at) > new Date(review.created_at);
  const hasResponse = !!review.venue_response;

  /**
   * Determine which quality badges to display
   * 
   * Requirements:
   * - 16.1: "Detailed Review" badge for 200+ chars
   * - 16.2: "Top Review" badge for 10+ helpful votes
   * - 16.3: "Frequent Reviewer" badge for 10+ reviews
   * - 16.4: "Trusted Reviewer" badge for >70% helpful ratio
   */
  const getQualityBadges = (): Array<{ label: string; icon: string; color: string }> => {
    const badges: Array<{ label: string; icon: string; color: string }> = [];

    // Requirement 16.1: Detailed Review badge (200+ characters)
    if (review.review_text && review.review_text.length >= 200) {
      badges.push({
        label: 'Detailed Review',
        icon: 'document-text',
        color: '#3B82F6', // Blue
      });
    }

    // Requirement 16.2: Top Review badge (10+ helpful votes)
    if (review.helpful_count >= 10) {
      badges.push({
        label: 'Top Review',
        icon: 'trophy',
        color: '#F59E0B', // Amber
      });
    }

    // Requirement 16.3: Frequent Reviewer badge (10+ reviews)
    if (review.reviewer_stats && review.reviewer_stats.total_reviews >= 10) {
      badges.push({
        label: 'Frequent Reviewer',
        icon: 'star',
        color: '#8B5CF6', // Purple
      });
    }

    // Requirement 16.4: Trusted Reviewer badge (>70% helpful ratio)
    if (review.reviewer_stats && review.reviewer_stats.helpful_ratio > 70) {
      badges.push({
        label: 'Trusted Reviewer',
        icon: 'shield-checkmark',
        color: '#10B981', // Green
      });
    }

    return badges;
  };

  /**
   * Render quality badges
   * 
   * Requirements:
   * - 16.1, 16.2, 16.3, 16.4: Display quality indicators
   */
  const renderQualityBadges = () => {
    const badges = getQualityBadges();

    if (badges.length === 0) return null;

    return (
      <View style={styles.badgesContainer}>
        {badges.map((badge, index) => (
          <View
            key={index}
            style={[
              styles.qualityBadge,
              { backgroundColor: badge.color + '20', borderColor: badge.color },
            ]}
          >
            <Icon name={badge.icon} size={12} color={badge.color} />
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  /**
   * Format timestamp for display
   * Requirement 3.6: Show timestamp
   */
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  /**
   * Handle helpful vote toggle
   * Requirements:
   * - 5.1: Display helpful count
   * - 5.5: Toggle active state
   * - 5.6: Disable for user's own reviews
   */
  const handleHelpfulToggle = async () => {
    if (isOwnReview) {
      Alert.alert('Not Allowed', 'You cannot mark your own review as helpful.');
      return;
    }

    try {
      setHelpfulLoading(true);
      await onHelpfulToggle(review.id);
    } catch (error: any) {
      console.error('Error toggling helpful vote:', error);
      Alert.alert('Error', error.message || 'Failed to update helpful vote.');
    } finally {
      setHelpfulLoading(false);
    }
  };

  /**
   * Handle delete with confirmation
   * Requirement 6.4: Confirmation dialog for delete
   */
  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  /**
   * Render star rating display
   * Requirement 3.6: Show rating
   */
  const renderStars = () => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name={star <= review.rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= review.rating ? '#FFD700' : theme.colors.textSecondary}
          />
        ))}
      </View>
    );
  };

  /**
   * Render reviewer info section
   * Requirements:
   * - 3.6: Show reviewer name, profile picture
   * - 8.2: Show verified badge if is_verified = true
   */
  const renderReviewerInfo = () => {
    return (
      <View style={styles.reviewerSection}>
        {/* Avatar */}
        {review.reviewer?.profile_picture_url ? (
          <Image
            source={{ uri: review.reviewer.profile_picture_url }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: theme.colors.primary + '30' },
            ]}
          >
            <Icon name="person" size={20} color={theme.colors.primary} />
          </View>
        )}

        {/* Reviewer Details */}
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerNameRow}>
            <Text
              style={[styles.reviewerName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {review.reviewer?.display_name || 'Anonymous'}
            </Text>

            {/* Requirement 8.2: Verified badge */}
            {review.is_verified && (
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <Icon name="checkmark-circle" size={14} color={theme.colors.primary} />
                <Text
                  style={[styles.verifiedText, { color: theme.colors.primary }]}
                >
                  Verified
                </Text>
              </View>
            )}
          </View>

          {/* Rating and Timestamp */}
          <View style={styles.ratingRow}>
            {renderStars()}
            <Text style={[styles.dot, { color: theme.colors.textSecondary }]}>•</Text>
            <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
              {formatTimestamp(review.created_at)}
            </Text>

            {/* Requirement 6.8: Show "Edited" indicator */}
            {isEdited && (
              <>
                <Text style={[styles.dot, { color: theme.colors.textSecondary }]}>•</Text>
                <Text style={[styles.editedText, { color: theme.colors.textSecondary }]}>
                  Edited
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Actions Menu (Edit/Delete/Report) */}
        {(isOwnReview || onReport) && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              Alert.alert(
                'Review Options',
                undefined,
                [
                  ...(isOwnReview && onEdit
                    ? [
                      {
                        text: 'Edit Review',
                        onPress: onEdit,
                      },
                    ]
                    : []),
                  ...(isOwnReview && onDelete
                    ? [
                      {
                        text: 'Delete Review',
                        onPress: handleDelete,
                        style: 'destructive' as const,
                      },
                    ]
                    : []),
                  ...(!isOwnReview && onReport
                    ? [
                      {
                        text: 'Report Review',
                        onPress: onReport,
                      },
                    ]
                    : []),
                  {
                    text: 'Cancel',
                    style: 'cancel' as const,
                  },
                ]
              );
            }}
          >
            <Icon name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Render review text
   * Requirement 3.6: Show review text
   */
  const renderReviewText = () => {
    if (!review.review_text) return null;

    const isLongText = review.review_text.length > 200;
    const displayText = showFullText || !isLongText
      ? review.review_text
      : `${review.review_text.substring(0, 200)}...`;

    return (
      <View style={styles.textSection}>
        <Text style={[styles.reviewText, { color: theme.colors.text }]}>
          {displayText}
        </Text>
        {isLongText && (
          <TouchableOpacity onPress={() => setShowFullText(!showFullText)}>
            <Text style={[styles.readMoreText, { color: theme.colors.primary }]}>
              {showFullText ? 'Show less' : 'Read more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Render helpful button
   * Requirements:
   * - 3.7: Display helpful button with vote count
   * - 5.1: Display helpful count
   * - 5.5: Toggle active state based on user vote
   * - 5.6: Disable for user's own reviews
   */
  const renderHelpfulButton = () => {
    const isActive = review.user_has_voted_helpful;
    const isDisabled = isOwnReview || helpfulLoading;

    return (
      <TouchableOpacity
        style={[
          styles.helpfulButton,
          {
            backgroundColor: isActive
              ? theme.colors.primary + '20'
              : theme.colors.background,
            borderColor: isActive ? theme.colors.primary : theme.colors.border,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
        onPress={handleHelpfulToggle}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {helpfulLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Icon
              name={isActive ? 'thumbs-up' : 'thumbs-up-outline'}
              size={16}
              color={isActive ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.helpfulText,
                {
                  color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                  fontFamily: isActive ? 'Inter-SemiBold' : 'Inter-Medium',
                },
              ]}
            >
              Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render venue owner response
   * Requirements:
   * - 9.3: Show response below review
   * - 9.4: Display "Response from [Venue Name]" label
   * - 9.8: Show "Responded" indicator on card
   */
  const renderVenueResponse = () => {
    if (!hasResponse || !review.venue_response) return null;

    return (
      <View
        style={[
          styles.responseSection,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.responseHeader}>
          <Icon name="business" size={16} color={theme.colors.primary} />
          <Text style={[styles.responseLabel, { color: theme.colors.primary }]}>
            Response from {venueName || 'Venue'}
          </Text>
        </View>
        <Text style={[styles.responseText, { color: theme.colors.text }]}>
          {review.venue_response.response_text}
        </Text>
        <Text style={[styles.responseTime, { color: theme.colors.textSecondary }]}>
          {formatTimestamp(review.venue_response.created_at)}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Reviewer Info */}
      {renderReviewerInfo()}

      {/* Quality Badges */}
      {renderQualityBadges()}

      {/* Review Text */}
      {renderReviewText()}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        {/* Helpful Button */}
        {renderHelpfulButton()}

        {/* Responded Indicator (Requirement 9.8) */}
        {hasResponse && (
          <View style={styles.respondedIndicator}>
            <Icon name="chatbubble" size={14} color={theme.colors.primary} />
            <Text style={[styles.respondedText, { color: theme.colors.primary }]}>
              Responded
            </Text>
          </View>
        )}

        {/* Venue Owner Response Button */}
        {isVenueOwner && !hasResponse && onVenueResponse && (
          <TouchableOpacity
            style={[
              styles.respondButton,
              {
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={onVenueResponse}
            activeOpacity={0.7}
          >
            <Icon name="chatbubble-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.respondButtonText, { color: theme.colors.primary }]}>
              Respond
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Venue Response */}
      {renderVenueResponse()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  reviewerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  editedText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    fontStyle: 'italic',
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  helpfulText: {
    fontSize: 14,
  },
  respondedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  respondedText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginLeft: 'auto',
  },
  respondButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  responseSection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  responseLabel: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  responseText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
  },
  responseTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
});

export default ReviewCard;
