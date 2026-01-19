/**
 * Review Types
 * 
 * Type definitions for the venue reviews and ratings system
 */

/**
 * Review record from database
 */
export interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number; // 1-5
  review_text?: string;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Reviewer statistics for quality badges
 */
export interface ReviewerStats {
  total_reviews: number;
  total_helpful_votes: number;
  helpful_ratio: number; // Percentage (0-100)
}

/**
 * Review with joined reviewer data
 */
export interface ReviewWithReviewer extends Review {
  reviewer?: {
    id: string;
    display_name: string;
    profile_picture_url?: string;
  };
  reviewer_stats?: ReviewerStats; // For quality badges
  venue_response?: VenueResponse;
  user_has_voted_helpful?: boolean; // For current user
}

/**
 * Venue owner response to a review
 */
export interface VenueResponse {
  id: string;
  review_id: string;
  venue_id: string;
  response_text: string;
  created_at: string;
  updated_at: string;
}

/**
 * Helpful vote record
 */
export interface HelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Review report record
 */
export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_user_id: string;
  reason: 'spam' | 'offensive' | 'fake' | 'other';
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

/**
 * Parameters for submitting a review
 */
export interface SubmitReviewParams {
  venueId: string;
  userId: string;
  rating: number;
  reviewText?: string;
}

/**
 * Parameters for updating a review
 */
export interface UpdateReviewParams {
  reviewId: string;
  userId: string;
  rating: number;
  reviewText?: string;
}

/**
 * Sort options for reviews
 */
export type ReviewSortBy = 'recent' | 'highest' | 'lowest' | 'helpful';

/**
 * Parameters for fetching venue reviews
 */
export interface GetVenueReviewsParams {
  venueId: string;
  limit?: number;
  offset?: number;
  sortBy?: ReviewSortBy;
  filterRating?: 1 | 2 | 3 | 4 | 5;
  verifiedOnly?: boolean;
}

/**
 * Response from fetching venue reviews
 */
export interface GetVenueReviewsResponse {
  reviews: ReviewWithReviewer[];
  total: number;
  hasMore: boolean;
}

/**
 * Aggregate rating for a venue
 */
export interface AggregateRating {
  rating: number; // 0-5, one decimal place
  reviewCount: number;
}

/**
 * Parameters for submitting a venue response
 */
export interface SubmitVenueResponseParams {
  reviewId: string;
  venueId: string;
  responseText: string;
}

/**
 * Parameters for updating a venue response
 */
export interface UpdateVenueResponseParams {
  responseId: string;
  venueId: string;
  responseText: string;
}

/**
 * Parameters for reporting a review
 */
export interface ReportReviewParams {
  reviewId: string;
  userId: string;
  reason: 'spam' | 'offensive' | 'fake' | 'other';
  details?: string;
}

/**
 * Result of toggling a helpful vote
 */
export interface ToggleHelpfulVoteResult {
  helpful: boolean;
  newCount: number;
}
