/**
 * ReviewList Component
 * 
 * Displays a paginated list of reviews with filtering and sorting capabilities.
 * 
 * Requirements:
 * - 3.4, 3.8: Show reviews in cards with pagination
 * - 14.7: Implement pagination (20 per page)
 * - 4.2, 4.3: Sort options (Most Recent, Highest Rated, Lowest Rated, Most Helpful)
 * - 4.4, 4.5, 4.6, 4.7: Filter by rating and verified status
 * - 8.4: Verified-only filter
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { ReviewService } from '../../services/api/reviews';
import ReviewCard from './ReviewCard';
import type { ReviewWithReviewer, ReviewSortBy } from '../../types';

interface ReviewListProps {
  venueId: string;
  venueName?: string;
  currentUserId?: string;
  isVenueOwner?: boolean;
  onEditReview?: (review: ReviewWithReviewer) => void;
  onDeleteReview?: (reviewId: string) => void;
  onVenueResponse?: (reviewId: string) => void;
}

/**
 * ReviewList Component
 * 
 * Displays a filterable, sortable, paginated list of reviews for a venue.
 */
const ReviewList: React.FC<ReviewListProps> = ({
  venueId,
  venueName,
  currentUserId,
  isVenueOwner = false,
  onEditReview,
  onDeleteReview,
  onVenueResponse,
}) => {
  const { theme } = useTheme();

  // State
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter and sort state
  const [sortBy, setSortBy] = useState<ReviewSortBy>('recent');
  const [filterRating, setFilterRating] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Pagination
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  /**
   * Fetch reviews from API
   * Requirement 14.7: Implement pagination (20 per page)
   */
  const fetchReviews = useCallback(async (reset: boolean = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await ReviewService.getVenueReviews({
        venueId,
        limit: LIMIT,
        offset: currentOffset,
        sortBy,
        filterRating,
        verifiedOnly,
      });

      // Fetch helpful vote status for current user
      const reviewsWithVoteStatus = await Promise.all(
        response.reviews.map(async (review) => {
          if (!currentUserId) {
            return { ...review, user_has_voted_helpful: false };
          }

          // Check if user has voted helpful
          try {
            const { data } = await import('../../lib/supabase').then(m => m.supabase
              .from('helpful_votes')
              .select('id')
              .eq('review_id', review.id)
              .eq('user_id', currentUserId)
              .single()
            );
            return { ...review, user_has_voted_helpful: !!data };
          } catch {
            return { ...review, user_has_voted_helpful: false };
          }
        })
      );

      // Fetch venue responses
      const reviewsWithResponses = await Promise.all(
        reviewsWithVoteStatus.map(async (review) => {
          try {
            const { data } = await import('../../lib/supabase').then(m => m.supabase
              .from('venue_responses')
              .select('*')
              .eq('review_id', review.id)
              .single()
            );
            return { ...review, venue_response: data || undefined };
          } catch {
            return review;
          }
        })
      );

      if (reset) {
        setReviews(reviewsWithResponses);
        setOffset(LIMIT);
      } else {
        setReviews((prev) => [...prev, ...reviewsWithResponses]);
        setOffset((prev) => prev + LIMIT);
      }

      setHasMore(response.hasMore);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [venueId, sortBy, filterRating, verifiedOnly, offset, currentUserId]);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchReviews(true);
  }, [venueId, sortBy, filterRating, verifiedOnly]);

  /**
   * Handle pull-to-refresh
   * Requirement 3.8: Pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    fetchReviews(true);
  }, [fetchReviews]);

  /**
   * Handle load more (pagination)
   * Requirement 14.7: Pagination support
   */
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchReviews(false);
    }
  }, [loadingMore, hasMore, fetchReviews]);

  /**
   * Handle helpful vote toggle
   */
  const handleHelpfulToggle = async (reviewId: string) => {
    if (!currentUserId) return;

    try {
      const result = await ReviewService.toggleHelpfulVote(reviewId, currentUserId);

      // Update local state
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpful_count: result.newCount,
                user_has_voted_helpful: result.helpful,
              }
            : review
        )
      );
    } catch (error: any) {
      console.error('Error toggling helpful vote:', error);
      throw error;
    }
  };

  /**
   * Handle sort change
   * Requirement 4.3: Apply sort to review list
   */
  const handleSortChange = (newSortBy: ReviewSortBy) => {
    setSortBy(newSortBy);
    setShowSortModal(false);
    setOffset(0);
  };

  /**
   * Handle filter change
   * Requirement 4.5: Apply rating filter
   */
  const handleFilterRatingChange = (rating: 1 | 2 | 3 | 4 | 5 | undefined) => {
    setFilterRating(rating);
    setOffset(0);
  };

  /**
   * Handle verified filter toggle
   * Requirement 8.4: Verified-only filter
   */
  const handleVerifiedToggle = () => {
    setVerifiedOnly((prev) => !prev);
    setOffset(0);
  };

  /**
   * Clear all filters
   * Requirement 4.7: Clear filters button
   */
  const handleClearFilters = () => {
    setFilterRating(undefined);
    setVerifiedOnly(false);
    setSortBy('recent');
    setShowFilterModal(false);
    setOffset(0);
  };

  /**
   * Calculate active filter count
   * Requirement 4.6: Display active filter count
   */
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filterRating) count++;
    if (verifiedOnly) count++;
    return count;
  };

  /**
   * Render sort modal
   * Requirement 4.2: Sort options
   */
  const renderSortModal = () => {
    const sortOptions: { value: ReviewSortBy; label: string; icon: string }[] = [
      { value: 'recent', label: 'Most Recent', icon: 'time-outline' },
      { value: 'highest', label: 'Highest Rated', icon: 'star' },
      { value: 'lowest', label: 'Lowest Rated', icon: 'star-outline' },
      { value: 'helpful', label: 'Most Helpful', icon: 'thumbs-up-outline' },
    ];

    return (
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Sort Reviews
            </Text>

            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  sortBy === option.value && {
                    backgroundColor: theme.colors.primary + '10',
                  },
                ]}
                onPress={() => handleSortChange(option.value)}
              >
                <Icon
                  name={option.icon}
                  size={20}
                  color={
                    sortBy === option.value
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    {
                      color:
                        sortBy === option.value
                          ? theme.colors.primary
                          : theme.colors.text,
                      fontFamily:
                        sortBy === option.value
                          ? 'Inter-SemiBold'
                          : 'Inter-Regular',
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Icon
                    name="checkmark"
                    size={20}
                    color={theme.colors.primary}
                    style={styles.checkmark}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  /**
   * Render filter modal
   * Requirements:
   * - 4.4: Filter by rating
   * - 8.4: Verified-only filter
   */
  const renderFilterModal = () => {
    const ratingOptions = [
      { value: undefined, label: 'All Ratings' },
      { value: 5 as const, label: '5 Stars' },
      { value: 4 as const, label: '4 Stars' },
      { value: 3 as const, label: '3 Stars' },
      { value: 2 as const, label: '2 Stars' },
      { value: 1 as const, label: '1 Star' },
    ];

    return (
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Filter Reviews
            </Text>

            {/* Rating Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textSecondary }]}>
              By Rating
            </Text>
            {ratingOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.modalOption,
                  filterRating === option.value && {
                    backgroundColor: theme.colors.primary + '10',
                  },
                ]}
                onPress={() => handleFilterRatingChange(option.value)}
              >
                <Icon
                  name="star"
                  size={20}
                  color={
                    filterRating === option.value
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    {
                      color:
                        filterRating === option.value
                          ? theme.colors.primary
                          : theme.colors.text,
                      fontFamily:
                        filterRating === option.value
                          ? 'Inter-SemiBold'
                          : 'Inter-Regular',
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {filterRating === option.value && (
                  <Icon
                    name="checkmark"
                    size={20}
                    color={theme.colors.primary}
                    style={styles.checkmark}
                  />
                )}
              </TouchableOpacity>
            ))}

            {/* Verified Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textSecondary }]}>
              Other Filters
            </Text>
            <TouchableOpacity
              style={[
                styles.modalOption,
                verifiedOnly && {
                  backgroundColor: theme.colors.primary + '10',
                },
              ]}
              onPress={handleVerifiedToggle}
            >
              <Icon
                name="checkmark-circle"
                size={20}
                color={
                  verifiedOnly
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.modalOptionText,
                  {
                    color: verifiedOnly
                      ? theme.colors.primary
                      : theme.colors.text,
                    fontFamily: verifiedOnly
                      ? 'Inter-SemiBold'
                      : 'Inter-Regular',
                  },
                ]}
              >
                Verified Only
              </Text>
              {verifiedOnly && (
                <Icon
                  name="checkmark"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.checkmark}
                />
              )}
            </TouchableOpacity>

            {/* Clear Filters Button */}
            {getActiveFilterCount() > 0 && (
              <TouchableOpacity
                style={[
                  styles.clearFiltersButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  /**
   * Render filter/sort bar
   */
  const renderFilterBar = () => {
    const activeFilterCount = getActiveFilterCount();

    return (
      <View style={[styles.filterBar, { backgroundColor: theme.colors.background }]}>
        {/* Sort Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => setShowSortModal(true)}
        >
          <Icon name="swap-vertical" size={18} color={theme.colors.text} />
          <Text style={[styles.filterButtonText, { color: theme.colors.text }]}>
            Sort
          </Text>
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: activeFilterCount > 0
                ? theme.colors.primary + '20'
                : theme.colors.surface,
              borderColor: activeFilterCount > 0
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Icon
            name="filter"
            size={18}
            color={activeFilterCount > 0 ? theme.colors.primary : theme.colors.text}
          />
          <Text
            style={[
              styles.filterButtonText,
              {
                color: activeFilterCount > 0 ? theme.colors.primary : theme.colors.text,
                fontFamily: activeFilterCount > 0 ? 'Inter-SemiBold' : 'Inter-Regular',
              },
            ]}
          >
            Filter
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Text>
        </TouchableOpacity>

        {/* Results Count */}
        <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
          {total} {total === 1 ? 'review' : 'reviews'}
        </Text>
      </View>
    );
  };

  /**
   * Render empty state
   * Requirement 3.8: Empty state message
   */
  const renderEmptyState = () => {
    if (loading) return null;

    const hasFilters = getActiveFilterCount() > 0 || sortBy !== 'recent';

    return (
      <View style={styles.emptyState}>
        <Icon name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
          {hasFilters ? 'No reviews match your filters' : 'No reviews yet'}
        </Text>
        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
          {hasFilters
            ? 'Try adjusting your filters to see more reviews'
            : 'Be the first to review this venue!'}
        </Text>
        {hasFilters && (
          <TouchableOpacity
            style={[styles.clearFiltersButtonEmpty, { backgroundColor: theme.colors.primary }]}
            onPress={handleClearFilters}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Render loading footer for pagination
   */
  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  /**
   * Render review item
   */
  const renderReviewItem = ({ item }: { item: ReviewWithReviewer }) => (
    <ReviewCard
      review={item}
      onHelpfulToggle={handleHelpfulToggle}
      onEdit={
        item.user_id === currentUserId && onEditReview
          ? () => onEditReview(item)
          : undefined
      }
      onDelete={
        item.user_id === currentUserId && onDeleteReview
          ? () => onDeleteReview(item.id)
          : undefined
      }
      onReport={
        item.user_id !== currentUserId
          ? () => {
              // TODO: Implement report functionality
              console.log('Report review:', item.id);
            }
          : undefined
      }
      onVenueResponse={
        isVenueOwner && !item.venue_response && onVenueResponse
          ? () => onVenueResponse(item.id)
          : undefined
      }
      currentUserId={currentUserId}
      isVenueOwner={isVenueOwner}
      venueName={venueName}
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Filter/Sort Bar */}
      {renderFilterBar()}

      {/* Reviews List */}
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

      {/* Modals */}
      {renderSortModal()}
      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
  },
  resultsCount: {
    fontSize: 13,
    marginLeft: 'auto',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  clearFiltersButtonEmpty: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default ReviewList;
