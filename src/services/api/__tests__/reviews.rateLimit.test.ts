/**
 * ReviewService Rate Limiting Tests
 * 
 * Tests for Requirement 18.5: Rate limiting (max 5 reviews per hour per user)
 * 
 * These tests verify that:
 * - Users can submit up to 5 reviews per hour
 * - The 6th review within an hour is rejected
 * - Error message includes time until reset
 * - Rate limit resets after 1 hour from oldest review
 */

import { ReviewService } from '../reviews';
import { supabase } from '../../../lib/supabase';

// Mock supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock ContentModerationService
jest.mock('../../compliance/ContentModerationService', () => ({
  ContentModerationService: {
    validateReviewText: jest.fn((text: string) => ({
      valid: true,
      trimmedText: text.trim(),
    })),
    filterProfanity: jest.fn((text: string) => ({
      filtered: text,
      hadProfanity: false,
      severity: 'none',
      wasRejected: false,
    })),
  },
}));

// Mock ReviewNotificationService
jest.mock('../reviewNotifications', () => ({
  ReviewNotificationService: {
    notifyVenueOwnerOfNewReview: jest.fn(),
  },
}));

describe('ReviewService - Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 18.5: Rate limit check', () => {
    it('should allow submission when user has submitted fewer than 5 reviews in past hour', async () => {
      const userId = 'test-user-123';
      const venueId = 'test-venue-456';
      
      // Mock: User has submitted 4 reviews in the past hour
      const mockReviews = Array(4).fill(null).map((_, i) => ({
        created_at: new Date(Date.now() - (i * 10 * 60 * 1000)).toISOString(), // 10, 20, 30, 40 minutes ago
      }));

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockReviews,
        error: null,
        count: 4,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        order: mockOrder,
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'new-review-id',
            venue_id: venueId,
            user_id: userId,
            rating: 5,
            review_text: 'Great place!',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Should not throw
      const result = await ReviewService.submitReview({
        venueId,
        userId,
        rating: 5,
        reviewText: 'Great place!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-review-id');
    });

    it('should reject submission when user has submitted 5 reviews in past hour', async () => {
      const userId = 'test-user-123';
      const venueId = 'test-venue-456';
      
      // Mock: User has submitted 5 reviews in the past hour
      const oldestReviewTime = new Date(Date.now() - (50 * 60 * 1000)); // 50 minutes ago
      const mockReviews = Array(5).fill(null).map((_, i) => ({
        created_at: new Date(oldestReviewTime.getTime() + (i * 10 * 60 * 1000)).toISOString(),
      }));

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockReviews,
        error: null,
        count: 5,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        order: mockOrder,
      });

      // Should throw rate limit error
      await expect(
        ReviewService.submitReview({
          venueId,
          userId,
          rating: 5,
          reviewText: 'Another review',
        })
      ).rejects.toThrow(/reached the review limit/);
    });

    it('should include time until reset in error message', async () => {
      const userId = 'test-user-123';
      const venueId = 'test-venue-456';
      
      // Mock: User has submitted 5 reviews, oldest was 50 minutes ago
      const oldestReviewTime = new Date(Date.now() - (50 * 60 * 1000)); // 50 minutes ago
      const mockReviews = [
        { created_at: oldestReviewTime.toISOString() },
        { created_at: new Date(Date.now() - (40 * 60 * 1000)).toISOString() },
        { created_at: new Date(Date.now() - (30 * 60 * 1000)).toISOString() },
        { created_at: new Date(Date.now() - (20 * 60 * 1000)).toISOString() },
        { created_at: new Date(Date.now() - (10 * 60 * 1000)).toISOString() },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockReviews,
        error: null,
        count: 5,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        order: mockOrder,
      });

      // Should throw with time until reset (approximately 10 minutes)
      await expect(
        ReviewService.submitReview({
          venueId,
          userId,
          rating: 5,
          reviewText: 'Another review',
        })
      ).rejects.toThrow(/Try again in \d+ minute/);
    });

    it('should allow submission after rate limit window expires', async () => {
      const userId = 'test-user-123';
      const venueId = 'test-venue-456';
      
      // Mock: User has submitted 5 reviews, but oldest was 65 minutes ago (outside 1-hour window)
      // So only 4 reviews are within the past hour
      const mockReviews = Array(4).fill(null).map((_, i) => ({
        created_at: new Date(Date.now() - ((i + 1) * 10 * 60 * 1000)).toISOString(), // 10, 20, 30, 40 minutes ago
      }));

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockReviews,
        error: null,
        count: 4, // Only 4 reviews in the past hour
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        order: mockOrder,
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'new-review-id',
            venue_id: venueId,
            user_id: userId,
            rating: 5,
            review_text: 'Great place!',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Should not throw
      const result = await ReviewService.submitReview({
        venueId,
        userId,
        rating: 5,
        reviewText: 'Great place!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-review-id');
    });

    it('should fail open (allow submission) if rate limit check fails', async () => {
      const userId = 'test-user-123';
      const venueId = 'test-venue-456';
      
      // Mock: Rate limit check fails with database error
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        order: mockOrder,
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'new-review-id',
            venue_id: venueId,
            user_id: userId,
            rating: 5,
            review_text: 'Great place!',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Should not throw - fail open for better user experience
      const result = await ReviewService.submitReview({
        venueId,
        userId,
        rating: 5,
        reviewText: 'Great place!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-review-id');
    });
  });
});
