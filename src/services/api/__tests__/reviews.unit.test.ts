/**
 * Unit Tests for ReviewService
 * 
 * Comprehensive unit tests for ReviewService CRUD operations,
 * helpful votes, venue owner responses, and edge cases.
 */

import { ReviewService } from '../reviews';
import { supabase } from '../../../lib/supabase';
import { ContentModerationService } from '../../compliance/ContentModerationService';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock ContentModerationService
jest.mock('../../compliance/ContentModerationService');

// Mock ReviewNotificationService
jest.mock('../reviewNotifications', () => ({
  ReviewNotificationService: {
    notifyVenueOwnerOfNewReview: jest.fn(),
    notifyReviewerOfResponse: jest.fn(),
    notifyReviewerOfMilestone: jest.fn(),
  },
}));

describe('ReviewService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitReview', () => {
    it('should submit a review with rating only', async () => {
      const params = {
        venueId: 'venue-123',
        userId: 'user-456',
        rating: 5,
      };

      // Mock rate limit check
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Mock duplicate check
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock insert
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: {
          id: 'review-789',
          venue_id: params.venueId,
          user_id: params.userId,
          rating: params.rating,
          review_text: null,
          is_verified: false,
          helpful_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          gte: mockGte,
          order: mockOrder,
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          eq: mockEq2,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
          select: mockSelect3,
          single: mockSingle2,
        });

      const result = await ReviewService.submitReview(params);

      expect(result).toBeDefined();
      expect(result.id).toBe('review-789');
      expect(result.rating).toBe(5);
      expect(result.review_text).toBeNull();
    });

    it('should submit a review with rating and text', async () => {
      const params = {
        venueId: 'venue-123',
        userId: 'user-456',
        rating: 4,
        reviewText: 'Great place!',
      };

      (ContentModerationService.validateReviewText as jest.Mock).mockReturnValue({
        valid: true,
        trimmedText: 'Great place!',
      });

      (ContentModerationService.filterProfanity as jest.Mock).mockReturnValue({
        filtered: 'Great place!',
        hadProfanity: false,
        severity: 'none',
        wasRejected: false,
      });

      // Mock rate limit check
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Mock duplicate check
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock insert
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: {
          id: 'review-789',
          venue_id: params.venueId,
          user_id: params.userId,
          rating: params.rating,
          review_text: 'Great place!',
          is_verified: false,
          helpful_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          gte: mockGte,
          order: mockOrder,
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          eq: mockEq2,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
          select: mockSelect3,
          single: mockSingle2,
        });

      const result = await ReviewService.submitReview(params);

      expect(result).toBeDefined();
      expect(result.review_text).toBe('Great place!');
      expect(ContentModerationService.validateReviewText).toHaveBeenCalledWith('Great place!');
      expect(ContentModerationService.filterProfanity).toHaveBeenCalledWith('Great place!');
    });

    it('should reject review with exactly 500 characters', async () => {
      const longText = 'a'.repeat(500);
      
      (ContentModerationService.validateReviewText as jest.Mock).mockReturnValue({
        valid: true,
        trimmedText: longText,
      });

      (ContentModerationService.filterProfanity as jest.Mock).mockReturnValue({
        filtered: longText,
        hadProfanity: false,
        severity: 'none',
        wasRejected: false,
      });

      // Mock rate limit check
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Mock duplicate check
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock insert
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: {
          id: 'review-789',
          venue_id: 'venue-123',
          user_id: 'user-456',
          rating: 5,
          review_text: longText,
          is_verified: false,
          helpful_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          gte: mockGte,
          order: mockOrder,
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          eq: mockEq2,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
          select: mockSelect3,
          single: mockSingle2,
        });

      const result = await ReviewService.submitReview({
        venueId: 'venue-123',
        userId: 'user-456',
        rating: 5,
        reviewText: longText,
      });

      expect(result).toBeDefined();
      expect(result.review_text?.length).toBe(500);
    });

    it('should prevent duplicate review submission', async () => {
      // Mock rate limit check
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Mock duplicate check - existing review found
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'existing-review' },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          gte: mockGte,
          order: mockOrder,
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          eq: mockEq2,
          single: mockSingle,
        });

      await expect(
        ReviewService.submitReview({
          venueId: 'venue-123',
          userId: 'user-456',
          rating: 5,
        })
      ).rejects.toThrow('You have already reviewed this venue');
    });
  });

  describe('updateReview', () => {
    it('should update review rating and text', async () => {
      const params = {
        reviewId: 'review-123',
        userId: 'user-456',
        rating: 3,
        reviewText: 'Updated review',
      };

      (ContentModerationService.validateReviewText as jest.Mock).mockReturnValue({
        valid: true,
        trimmedText: 'Updated review',
      });

      (ContentModerationService.filterProfanity as jest.Mock).mockReturnValue({
        filtered: 'Updated review',
        hadProfanity: false,
        severity: 'none',
        wasRejected: false,
      });

      // Mock get venue_id
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { venue_id: 'venue-123' },
        error: null,
      });

      // Mock update
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: {
          id: params.reviewId,
          venue_id: 'venue-123',
          user_id: params.userId,
          rating: params.rating,
          review_text: 'Updated review',
          is_verified: false,
          helpful_count: 0,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          update: mockUpdate,
          eq: mockEq2,
          select: mockSelect2,
          single: mockSingle2,
        });

      const result = await ReviewService.updateReview(params);

      expect(result).toBeDefined();
      expect(result.rating).toBe(3);
      expect(result.review_text).toBe('Updated review');
      expect(new Date(result.updated_at).getTime()).toBeGreaterThan(
        new Date(result.created_at).getTime()
      );
    });

    it('should reject update from non-owner', async () => {
      // Mock get venue_id - returns different user_id
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { venue_id: 'venue-123', user_id: 'different-user' },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        ReviewService.updateReview({
          reviewId: 'review-123',
          userId: 'user-456',
          rating: 3,
        })
      ).rejects.toThrow('You can only update your own reviews');
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      // Mock get venue_id
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { venue_id: 'venue-123', user_id: 'user-456' },
        error: null,
      });

      // Mock delete
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockResolvedValue({
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        })
        .mockReturnValueOnce({
          delete: mockDelete,
          eq: mockEq2,
        });

      await ReviewService.deleteReview('review-123', 'user-456');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should reject deletion from non-owner', async () => {
      // Mock get venue_id - returns different user_id
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { venue_id: 'venue-123', user_id: 'different-user' },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        ReviewService.deleteReview('review-123', 'user-456')
      ).rejects.toThrow('You can only delete your own reviews');
    });
  });

  describe('toggleHelpfulVote', () => {
    it('should add helpful vote when none exists', async () => {
      const reviewId = 'review-123';
      const userId = 'user-456';

      // Mock check for review owner
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: { user_id: 'different-user' },
        error: null,
      });

      // Mock check for existing vote
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock insert vote
      const mockInsert = jest.fn().mockResolvedValue({
        error: null,
      });

      // Mock get updated count
      const mockSelect3 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockSingle3 = jest.fn().mockResolvedValue({
        data: { helpful_count: 1 },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1,
          eq: mockEq1,
          single: mockSingle1,
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          eq: mockEq2,
          single: mockSingle2,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        })
        .mockReturnValueOnce({
          select: mockSelect3,
          eq: mockEq3,
          single: mockSingle3,
        });

      const result = await ReviewService.toggleHelpfulVote(reviewId, userId);

      expect(result.helpful).toBe(true);
      expect(result.newCount).toBe(1);
    });

    it('should remove helpful vote when one exists', async () => {
      const reviewId = 'review-123';
      const userId = 'user-456';

      // Mock check for review owner
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: { user_id: 'different-user' },
        error: null,
      });

      // Mock check for existing vote
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { id: 'vote-123' },
        error: null,
      });

      // Mock delete vote
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockResolvedValue({
        error: null,
      });

      // Mock get updated count
      const mockSelect3 = jest.fn().mockReturnThis();
      const mockEq4 = jest.fn().mockReturnThis();
      const mockSingle3 = jest.fn().mockResolvedValue({
        data: { helpful_count: 0 },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1,
          eq: mockEq1,
          single: mockSingle1,
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          eq: mockEq2,
          single: mockSingle2,
        })
        .mockReturnValueOnce({
          delete: mockDelete,
          eq: mockEq3,
        })
        .mockReturnValueOnce({
          select: mockSelect3,
          eq: mockEq4,
          single: mockSingle3,
        });

      const result = await ReviewService.toggleHelpfulVote(reviewId, userId);

      expect(result.helpful).toBe(false);
      expect(result.newCount).toBe(0);
    });

    it('should prevent voting on own review', async () => {
      const reviewId = 'review-123';
      const userId = 'user-456';

      // Mock check for review owner - same user
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { user_id: userId },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        ReviewService.toggleHelpfulVote(reviewId, userId)
      ).rejects.toThrow('You cannot vote on your own review');
    });
  });

  describe('submitVenueResponse', () => {
    it('should submit venue owner response', async () => {
      const params = {
        reviewId: 'review-123',
        venueId: 'venue-456',
        responseText: 'Thank you for your feedback!',
      };

      // Mock insert
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'response-789',
          review_id: params.reviewId,
          venue_id: params.venueId,
          response_text: params.responseText,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await ReviewService.submitVenueResponse(params);

      expect(result).toBeDefined();
      expect(result.response_text).toBe(params.responseText);
    });

    it('should reject response exceeding 300 characters', async () => {
      const longText = 'a'.repeat(301);

      await expect(
        ReviewService.submitVenueResponse({
          reviewId: 'review-123',
          venueId: 'venue-456',
          responseText: longText,
        })
      ).rejects.toThrow('Response text cannot exceed 300 characters');
    });
  });

  describe('getVenueReviews', () => {
    it('should return paginated reviews', async () => {
      const mockReviews = Array(20).fill(null).map((_, i) => ({
        id: `review-${i}`,
        venue_id: 'venue-123',
        user_id: 'user-456',
        rating: 5,
        review_text: `Review ${i}`,
        is_verified: false,
        helpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: mockReviews,
        error: null,
        count: 50,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      });

      const result = await ReviewService.getVenueReviews({
        venueId: 'venue-123',
        limit: 20,
        offset: 0,
      });

      expect(result.reviews.length).toBe(20);
      expect(result.total).toBe(50);
      expect(result.hasMore).toBe(true);
    });

    it('should return empty array for venue with no reviews', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      });

      const result = await ReviewService.getVenueReviews({
        venueId: 'venue-123',
      });

      expect(result.reviews.length).toBe(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });
});
