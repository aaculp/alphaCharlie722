/**
 * ReviewService
 * 
 * API service for managing venue reviews and ratings
 * 
 * Requirements:
 * - 1.7, 1.8: Review submission with authentication and rating validation
 * - 1.11, 1.12: One review per user per venue
 * - 3.9, 4.3, 4.5: Review fetching with sorting and filtering
 * - 6.3, 6.5, 6.6, 6.7: Review editing and deletion
 * - 13.1, 13.2, 13.6, 13.7: Review text validation
 * - 14.7: Pagination support
 */

import { supabase } from '../../lib/supabase';
import { ContentModerationService } from '../compliance/ContentModerationService';
import { ReviewNotificationService } from './reviewNotifications';
import { cacheManager, CACHE_TTL } from '../../utils/cache/CacheManager';
import type {
  Review,
  ReviewWithReviewer,
  SubmitReviewParams,
  UpdateReviewParams,
  GetVenueReviewsParams,
  GetVenueReviewsResponse,
  SubmitVenueResponseParams,
  UpdateVenueResponseParams,
  VenueResponse,
  ReportReviewParams,
  ToggleHelpfulVoteResult,
} from '../../types';

export class ReviewService {
  /**
   * Generate cache key for venue reviews
   * 
   * @param params - Query parameters
   * @returns Cache key string
   */
  private static generateReviewsCacheKey(params: GetVenueReviewsParams): string {
    const {
      venueId,
      limit = 20,
      offset = 0,
      sortBy = 'recent',
      filterRating,
      verifiedOnly = false,
    } = params;

    return `reviews:venue:${venueId}:limit:${limit}:offset:${offset}:sort:${sortBy}:filter:${filterRating || 'all'}:verified:${verifiedOnly}`;
  }

  /**
   * Invalidate all cached reviews for a venue
   * 
   * Requirements:
   * - 14.6: Invalidate cache on new review submission
   * 
   * @param venueId - Venue ID
   */
  private static invalidateVenueReviewsCache(venueId: string): void {
    // Invalidate all cache entries for this venue (all pagination/filter combinations)
    cacheManager.invalidatePattern(`reviews:venue:${venueId}:*`);
    console.log(`🗑️ Invalidated review cache for venue: ${venueId}`);
  }

  /**
   * Submit a new review
   * 
   * Requirements:
   * - 1.7: Require at least a star rating
   * - 1.8: Validate user is authenticated
   * - 13.1: Validate rating (1-5)
   * - 13.2: Max 500 characters
   * - 13.6: Trim leading/trailing whitespace
   * - 13.7: Prevent submission of only whitespace
   * - 18.5: Rate limiting (max 5 reviews per hour)
   * 
   * @param params - Review submission parameters
   * @returns Created review
   */
  static async submitReview(params: SubmitReviewParams): Promise<Review> {
    try {
      const { venueId, userId, rating, reviewText } = params;

      // Requirement 1.8: Validate authentication
      if (!userId) {
        throw new Error('Authentication required to submit a review');
      }

      // Requirement 18.5: Check rate limit (max 5 reviews per hour)
      const rateLimitCheck = await this.checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.message);
      }

      // Requirement 13.1: Validate rating (1-5)
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Validate and filter review text if provided
      let processedText: string | undefined;
      if (reviewText) {
        // Requirement 13.6, 13.7: Validate review text
        const validation = ContentModerationService.validateReviewText(reviewText);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Apply content moderation
        const moderation = ContentModerationService.filterProfanity(validation.trimmedText!);
        
        // Reject severe content
        if (moderation.wasRejected) {
          throw new Error(moderation.message || 'Content violates community guidelines');
        }

        processedText = moderation.filtered;
      }

      // Insert review into database
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          venue_id: venueId,
          user_id: userId,
          rating,
          review_text: processedText,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate review error
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('You have already reviewed this venue. Please edit your existing review instead.');
        }
        throw new Error(`Failed to submit review: ${error.message}`);
      }

      console.log('✅ Review submitted successfully:', data);

      // Requirement 14.6: Invalidate cache on new review submission
      this.invalidateVenueReviewsCache(venueId);

      // Requirement 12.5, 12.6: Send notification to venue owner (with batching)
      try {
        await ReviewNotificationService.notifyVenueOwnerOfNewReview(
          venueId,
          data.id,
          rating,
          processedText
        );
      } catch (notificationError) {
        // Log but don't fail the review submission if notification fails
        console.warn('⚠️ Failed to notify venue owner:', notificationError);
      }

      return data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  /**
   * Update an existing review
   * 
   * Requirements:
   * - 6.3: Update rating and/or text
   * - 6.7: Update timestamp
   * 
   * @param params - Review update parameters
   * @returns Updated review
   */
  static async updateReview(params: UpdateReviewParams): Promise<Review> {
    try {
      const { reviewId, userId, rating, reviewText } = params;

      // Validate ownership
      const { data: existingReview, error: fetchError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch review: ${fetchError.message}`);
      }

      if (existingReview.user_id !== userId) {
        throw new Error('You can only edit your own reviews');
      }

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Validate and filter review text if provided
      let processedText: string | undefined;
      if (reviewText !== undefined) {
        if (reviewText) {
          const validation = ContentModerationService.validateReviewText(reviewText);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          const moderation = ContentModerationService.filterProfanity(validation.trimmedText!);
          if (moderation.wasRejected) {
            throw new Error(moderation.message || 'Content violates community guidelines');
          }

          processedText = moderation.filtered;
        } else {
          processedText = undefined; // Allow clearing review text
        }
      }

      // Update review
      const updateData: any = {
        rating,
        updated_at: new Date().toISOString(),
      };

      if (reviewText !== undefined) {
        updateData.review_text = processedText;
      }

      const { data, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update review: ${error.message}`);
      }

      console.log('✅ Review updated successfully:', data);

      // Requirement 14.6: Invalidate cache on review update
      this.invalidateVenueReviewsCache(data.venue_id);

      return data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  /**
   * Delete a review
   * 
   * Requirements:
   * - 6.5: Delete review
   * - 6.6: Trigger aggregate rating recalculation (handled by database trigger)
   * 
   * @param reviewId - Review ID to delete
   * @param userId - User ID (for ownership validation)
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      // Validate ownership and get venue_id for cache invalidation
      const { data: existingReview, error: fetchError } = await supabase
        .from('reviews')
        .select('user_id, venue_id')
        .eq('id', reviewId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch review: ${fetchError.message}`);
      }

      if (existingReview.user_id !== userId) {
        throw new Error('You can only delete your own reviews');
      }

      // Delete review
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete review: ${error.message}`);
      }

      console.log('✅ Review deleted successfully');

      // Requirement 14.6: Invalidate cache on review deletion
      this.invalidateVenueReviewsCache(existingReview.venue_id);
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a venue
   * 
   * Requirements:
   * - 3.9: Display reviews in reverse chronological order
   * - 4.3: Support sorting (recent, highest, lowest, helpful)
   * - 4.5: Support filtering by rating
   * - 14.5: Cache review lists with 5-minute TTL
   * - 14.6: Invalidate cache on new review submission
   * - 14.7: Implement pagination (20 per page)
   * - 16.3, 16.4: Fetch reviewer statistics for quality badges
   * 
   * @param params - Query parameters
   * @returns Reviews with pagination info
   */
  static async getVenueReviews(params: GetVenueReviewsParams): Promise<GetVenueReviewsResponse> {
    try {
      // Requirement 14.5: Check cache first
      const cacheKey = this.generateReviewsCacheKey(params);
      const cachedData = cacheManager.get<GetVenueReviewsResponse>(cacheKey);

      if (cachedData) {
        console.log('✅ Returning cached reviews for venue:', params.venueId);
        return cachedData;
      }

      const {
        venueId,
        limit = 20,
        offset = 0,
        sortBy = 'recent',
        filterRating,
        verifiedOnly = false,
      } = params;

      // Build query
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            profile_picture_url
          )
        `, { count: 'exact' })
        .eq('venue_id', venueId);

      // Apply rating filter
      if (filterRating) {
        query = query.eq('rating', filterRating);
      }

      // Apply verified filter
      if (verifiedOnly) {
        query = query.eq('is_verified', true);
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'highest':
          query = query.order('rating', { ascending: false });
          break;
        case 'lowest':
          query = query.order('rating', { ascending: true });
          break;
        case 'helpful':
          query = query.order('helpful_count', { ascending: false });
          break;
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch reviews: ${error.message}`);
      }

      // Fetch reviewer statistics for quality badges (Requirements 16.3, 16.4)
      const userIds = (data || []).map((item: any) => item.user_id);
      const reviewerStats = await this.getReviewerStatistics(userIds);

      // Transform data to include reviewer info and stats
      const reviews: ReviewWithReviewer[] = (data || []).map((item: any) => ({
        id: item.id,
        venue_id: item.venue_id,
        user_id: item.user_id,
        rating: item.rating,
        review_text: item.review_text,
        is_verified: item.is_verified,
        helpful_count: item.helpful_count,
        created_at: item.created_at,
        updated_at: item.updated_at,
        reviewer: item.profiles ? {
          id: item.profiles.id,
          display_name: item.profiles.display_name,
          profile_picture_url: item.profiles.profile_picture_url,
        } : undefined,
        reviewer_stats: reviewerStats[item.user_id],
      }));

      const total = count || 0;
      const hasMore = offset + limit < total;

      const response: GetVenueReviewsResponse = {
        reviews,
        total,
        hasMore,
      };

      // Requirement 14.5: Cache the response with 5-minute TTL
      cacheManager.set(cacheKey, response, CACHE_TTL.VENUE_REVIEWS);
      console.log('✅ Cached reviews for venue:', venueId);

      return response;
    } catch (error) {
      console.error('Error fetching venue reviews:', error);
      throw error;
    }
  }

  /**
   * Get reviewer statistics for quality badges
   * 
   * Requirements:
   * - 16.3: Frequent Reviewer badge (10+ reviews)
   * - 16.4: Trusted Reviewer badge (>70% helpful ratio)
   * 
   * @param userIds - Array of user IDs
   * @returns Map of user ID to reviewer statistics
   */
  private static async getReviewerStatistics(
    userIds: string[]
  ): Promise<Record<string, { total_reviews: number; total_helpful_votes: number; helpful_ratio: number }>> {
    if (userIds.length === 0) {
      return {};
    }

    try {
      // Get total reviews per user
      const { data: reviewCounts, error: reviewError } = await supabase
        .from('reviews')
        .select('user_id')
        .in('user_id', userIds);

      if (reviewError) {
        console.warn('Warning: Could not fetch reviewer statistics:', reviewError.message);
        return {};
      }

      // Get total helpful votes per user
      const { data: helpfulVotes, error: votesError } = await supabase
        .from('reviews')
        .select('user_id, helpful_count')
        .in('user_id', userIds);

      if (votesError) {
        console.warn('Warning: Could not fetch helpful vote statistics:', votesError.message);
        return {};
      }

      // Calculate statistics for each user
      const stats: Record<string, { total_reviews: number; total_helpful_votes: number; helpful_ratio: number }> = {};

      userIds.forEach((userId) => {
        const userReviews = reviewCounts?.filter((r: any) => r.user_id === userId) || [];
        const userHelpfulVotes = helpfulVotes?.filter((r: any) => r.user_id === userId) || [];
        
        const totalReviews = userReviews.length;
        const totalHelpfulVotes = userHelpfulVotes.reduce((sum: number, r: any) => sum + (r.helpful_count || 0), 0);
        
        // Calculate helpful ratio (percentage of reviews that received at least 1 helpful vote)
        const reviewsWithVotes = userHelpfulVotes.filter((r: any) => r.helpful_count > 0).length;
        const helpfulRatio = totalReviews > 0 ? (reviewsWithVotes / totalReviews) * 100 : 0;

        stats[userId] = {
          total_reviews: totalReviews,
          total_helpful_votes: totalHelpfulVotes,
          helpful_ratio: Math.round(helpfulRatio),
        };
      });

      return stats;
    } catch (error) {
      console.warn('Warning: Error fetching reviewer statistics:', error);
      return {};
    }
  }

  /**
   * Get user's review for a venue
   * 
   * Requirements:
   * - 1.11: Check if user has already reviewed venue
   * - 1.12: Enable edit flow for existing reviews
   * 
   * @param userId - User ID
   * @param venueId - Venue ID
   * @returns User's review or null
   */
  static async getUserReviewForVenue(userId: string, venueId: string): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No review found
          return null;
        }
        throw new Error(`Failed to fetch user review: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching user review:', error);
      return null;
    }
  }

  /**
   * Toggle helpful vote on a review
   * 
   * Requirements:
   * - 5.2: Increment helpful count when voted
   * - 5.3: Decrement helpful count when toggled off
   * - 5.4: Track which reviews each user has marked helpful
   * - 5.6: Prevent users from marking their own reviews as helpful
   * 
   * @param reviewId - Review ID
   * @param userId - User ID
   * @returns Vote status and new count
   */
  static async toggleHelpfulVote(reviewId: string, userId: string): Promise<ToggleHelpfulVoteResult> {
    try {
      // Check if user is the review author (prevent self-voting)
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single();

      if (reviewError) {
        throw new Error(`Failed to fetch review: ${reviewError.message}`);
      }

      if (review.user_id === userId) {
        throw new Error('You cannot mark your own review as helpful');
      }

      // Check if user has already voted
      const { data: existingVote, error: voteError } = await supabase
        .from('helpful_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      let helpful: boolean;

      if (voteError && voteError.code !== 'PGRST116') {
        throw new Error(`Failed to check vote status: ${voteError.message}`);
      }

      if (existingVote) {
        // Remove vote
        const { error: deleteError } = await supabase
          .from('helpful_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId);

        if (deleteError) {
          throw new Error(`Failed to remove helpful vote: ${deleteError.message}`);
        }

        helpful = false;
      } else {
        // Add vote
        const { error: insertError } = await supabase
          .from('helpful_votes')
          .insert({
            review_id: reviewId,
            user_id: userId,
          });

        if (insertError) {
          throw new Error(`Failed to add helpful vote: ${insertError.message}`);
        }

        helpful = true;
      }

      // Get updated helpful count (trigger should have updated it)
      const { data: updatedReview, error: countError } = await supabase
        .from('reviews')
        .select('helpful_count, user_id, venue_id')
        .eq('id', reviewId)
        .single();

      if (countError) {
        throw new Error(`Failed to fetch updated count: ${countError.message}`);
      }

      // Requirement 12.2: Send notification for helpful vote milestones
      if (helpful) {
        const milestones = [5, 10, 25, 50];
        const newCount = updatedReview.helpful_count;
        
        if (milestones.includes(newCount)) {
          try {
            // Get venue name for notification
            const { data: venue } = await supabase
              .from('venues')
              .select('name')
              .eq('id', updatedReview.venue_id)
              .single();

            const venueName = venue?.name || 'a venue';
            
            await ReviewNotificationService.notifyReviewerOfMilestone(
              updatedReview.user_id,
              reviewId,
              updatedReview.venue_id,
              venueName,
              newCount
            );
          } catch (notificationError) {
            // Log but don't fail the vote toggle if notification fails
            console.warn('⚠️ Failed to send milestone notification:', notificationError);
          }
        }
      }

      return {
        helpful,
        newCount: updatedReview.helpful_count,
      };
    } catch (error) {
      console.error('Error toggling helpful vote:', error);
      throw error;
    }
  }

  /**
   * Submit a venue owner response to a review
   * 
   * Requirements:
   * - 9.3: Save response and display below review
   * - 9.6: Notify reviewer
   * - 9.7: Limit to 300 characters
   * 
   * @param params - Response parameters
   * @returns Created response
   */
  static async submitVenueResponse(params: SubmitVenueResponseParams): Promise<VenueResponse> {
    try {
      const { reviewId, venueId, responseText } = params;

      // Validate response text length
      const trimmed = responseText.trim();
      if (trimmed.length === 0) {
        throw new Error('Response text cannot be empty');
      }
      if (trimmed.length > 300) {
        throw new Error('Response text cannot exceed 300 characters');
      }

      // Get review details to fetch reviewer ID and venue name
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('user_id, venue_id')
        .eq('id', reviewId)
        .single();

      if (reviewError) {
        throw new Error(`Failed to fetch review: ${reviewError.message}`);
      }

      // Get venue name for notification
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('name')
        .eq('id', venueId)
        .single();

      if (venueError) {
        throw new Error(`Failed to fetch venue: ${venueError.message}`);
      }

      // Insert response
      const { data, error } = await supabase
        .from('venue_responses')
        .insert({
          review_id: reviewId,
          venue_id: venueId,
          response_text: trimmed,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already responded to this review');
        }
        throw new Error(`Failed to submit response: ${error.message}`);
      }

      console.log('✅ Venue response submitted successfully:', data);

      // Requirement 9.6, 12.1, 12.7: Send notification to reviewer
      try {
        await ReviewNotificationService.notifyReviewerOfResponse(
          review.user_id,
          reviewId,
          venueId,
          venue.name,
          trimmed
        );
      } catch (notificationError) {
        // Log but don't fail the response submission if notification fails
        console.warn('⚠️ Failed to send notification to reviewer:', notificationError);
      }

      return data;
    } catch (error) {
      console.error('Error submitting venue response:', error);
      throw error;
    }
  }

  /**
   * Update a venue owner response
   * 
   * Requirements:
   * - 9.5: Allow venue owners to edit responses
   * 
   * @param params - Update parameters
   * @returns Updated response
   */
  static async updateVenueResponse(params: UpdateVenueResponseParams): Promise<VenueResponse> {
    try {
      const { responseId, venueId, responseText } = params;

      // Validate response text length
      const trimmed = responseText.trim();
      if (trimmed.length === 0) {
        throw new Error('Response text cannot be empty');
      }
      if (trimmed.length > 300) {
        throw new Error('Response text cannot exceed 300 characters');
      }

      // Update response
      const { data, error } = await supabase
        .from('venue_responses')
        .update({
          response_text: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', responseId)
        .eq('venue_id', venueId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update response: ${error.message}`);
      }

      console.log('✅ Venue response updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating venue response:', error);
      throw error;
    }
  }

  /**
   * Delete a venue owner response
   * 
   * Requirements:
   * - 9.5: Allow venue owners to delete responses
   * 
   * @param responseId - Response ID
   * @param venueId - Venue ID (for ownership validation)
   */
  static async deleteVenueResponse(responseId: string, venueId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('venue_responses')
        .delete()
        .eq('id', responseId)
        .eq('venue_id', venueId);

      if (error) {
        throw new Error(`Failed to delete response: ${error.message}`);
      }

      console.log('✅ Venue response deleted successfully');
    } catch (error) {
      console.error('Error deleting venue response:', error);
      throw error;
    }
  }

  /**
   * Report a review
   * 
   * Requirements:
   * - 10.4: Create moderation ticket
   * - 10.6: Prevent duplicate reports
   * 
   * @param params - Report parameters
   */
  static async reportReview(params: ReportReviewParams): Promise<void> {
    try {
      const { reviewId, userId, reason, details } = params;

      // Insert report
      const { error } = await supabase
        .from('review_reports')
        .insert({
          review_id: reviewId,
          reporter_user_id: userId,
          reason,
          details,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already reported this review');
        }
        throw new Error(`Failed to report review: ${error.message}`);
      }

      console.log('✅ Review reported successfully');
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }

  /**
   * Check if user has checked in to venue (for verified badge)
   * 
   * Requirements:
   * - 8.1: Mark review as verified if user checked in
   * 
   * @param userId - User ID
   * @param venueId - Venue ID
   * @returns True if user has checked in
   */
  static async hasUserCheckedIn(userId: string, venueId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Warning: Could not check user check-in status:', error.message);
        return false;
      }

      return !!data;
    } catch (error) {
      console.warn('Warning: Error checking user check-in status:', error);
      return false;
    }
  }

  /**
   * Check rate limit for review submissions
   * 
   * Requirements:
   * - 18.5: Max 5 reviews per hour per user
   * 
   * @param userId - User ID
   * @returns Rate limit check result with allowed status and message
   */
  private static async checkRateLimit(userId: string): Promise<{
    allowed: boolean;
    message?: string;
    minutesUntilReset?: number;
  }> {
    try {
      // Calculate timestamp for 1 hour ago
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Count reviews submitted by user in the past hour
      const { data, error, count } = await supabase
        .from('reviews')
        .select('created_at', { count: 'exact', head: false })
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Warning: Could not check rate limit:', error.message);
        // Allow submission if rate limit check fails (fail open)
        return { allowed: true };
      }

      const reviewCount = count || 0;

      // Check if user has reached the limit (5 reviews per hour)
      if (reviewCount >= 5) {
        // Calculate time until the oldest review in the window expires
        const oldestReview = data?.[0];
        if (oldestReview) {
          const oldestReviewTime = new Date(oldestReview.created_at);
          const resetTime = new Date(oldestReviewTime);
          resetTime.setHours(resetTime.getHours() + 1);
          
          const now = new Date();
          const minutesUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60));

          return {
            allowed: false,
            message: `You've reached the review limit. Try again in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}.`,
            minutesUntilReset,
          };
        }

        // Fallback if we can't calculate reset time
        return {
          allowed: false,
          message: "You've reached the review limit. Please try again later.",
        };
      }

      return { allowed: true };
    } catch (error) {
      console.warn('Warning: Error checking rate limit:', error);
      // Allow submission if rate limit check fails (fail open)
      return { allowed: true };
    }
  }
}
