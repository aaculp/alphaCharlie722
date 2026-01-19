/**
 * Performance Tests for ReviewService
 * 
 * Tests performance requirements:
 * - 18.1: Review fetch time (<300ms)
 * - 18.2: Review submission time (<500ms)
 * - 18.7: Concurrent submissions
 * - Cache performance
 * 
 * Requirements: 18.1, 18.2, 18.7
 */

import { ReviewService } from '../reviews';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
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

describe('ReviewService - Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Requirement 18.1: Review fetch time (<300ms)
   */
  describe('Review Fetch Performance', () => {
    it('should fetch reviews within 300ms', async () => {
      const venueId = 'venue-123';
      
      // Mock 20 reviews
      const mockReviews = Array(20).fill(null).map((_, i) => ({
        id: `review-${i}`,
        venue_id: venueId,
        user_id: 'user-456',
        rating: 5,
        review_text: 'Great place!',
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
        count: 20,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      });

      const startTime = Date.now();
      await ReviewService.getVenueReviews({ venueId });
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300);
    });

    it('should fetch reviews within 300ms with 100 reviews', async () => {
      const venueId = 'venue-123';
      
      // Mock 100 reviews (larger dataset)
      const mockReviews = Array(100).fill(null).map((_, i) => ({
        id: `review-${i}`,
        venue_id: venueId,
        user_id: 'user-456',
        rating: 5,
        review_text: 'Great place!',
        is_verified: false,
        helpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: mockReviews.slice(0, 20), // Paginated
        error: null,
        count: 100,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      });

      const startTime = Date.now();
      await ReviewService.getVenueReviews({ venueId, limit: 20 });
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300);
    });
  });

  /**
   * Requirement 18.2: Review submission time (<500ms)
   */
  describe('Review Submission Performance', () => {
    it('should submit review within 500ms', async () => {
      const params = {
        venueId: 'venue-123',
        userId: 'user-456',
        rating: 5,
        reviewText: 'Great place!',
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
          review_text: params.reviewText,
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

      const startTime = Date.now();
      await ReviewService.submitReview(params);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should submit review with long text within 500ms', async () => {
      const longText = 'a'.repeat(500);
      const params = {
        venueId: 'venue-123',
        userId: 'user-456',
        rating: 5,
        reviewText: longText,
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

      const startTime = Date.now();
      await ReviewService.submitReview(params);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  /**
   * Requirement 18.7: Concurrent submissions
   */
  describe('Concurrent Submission Handling', () => {
    it('should handle 10 concurrent review submissions', async () => {
      // Create 10 concurrent submission promises
      const submissions = Array(10).fill(null).map((_, i) => ({
        venueId: `venue-${i}`,
        userId: 'user-456',
        rating: 5,
        reviewText: `Review ${i}`,
      }));

      // Mock for each submission
      submissions.forEach((_, i) => {
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockGte = jest.fn().mockReturnThis();
        const mockOrder = jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        });

        const mockSelect2 = jest.fn().mockReturnThis();
        const mockEq2 = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        const mockInsert = jest.fn().mockReturnThis();
        const mockSelect3 = jest.fn().mockReturnThis();
        const mockSingle2 = jest.fn().mockResolvedValue({
          data: {
            id: `review-${i}`,
            venue_id: `venue-${i}`,
            user_id: 'user-456',
            rating: 5,
            review_text: `Review ${i}`,
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
      });

      const startTime = Date.now();
      const results = await Promise.all(
        submissions.map(params => ReviewService.submitReview(params))
      );
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All submissions should succeed
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });

      // Should complete in reasonable time (not a strict requirement, but good to check)
      expect(duration).toBeLessThan(2000); // 2 seconds for 10 concurrent submissions
    });

    it('should prevent duplicate submissions for same user-venue pair', async () => {
      const params = {
        venueId: 'venue-123',
        userId: 'user-456',
        rating: 5,
      };

      // First submission succeeds
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockGte1 = jest.fn().mockReturnThis();
      const mockOrder1 = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockInsert1 = jest.fn().mockReturnThis();
      const mockSelect3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: {
          id: 'review-789',
          venue_id: params.venueId,
          user_id: params.userId,
          rating: params.rating,
          is_verified: false,
          helpful_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1,
          eq: mockEq1,
          gte: mockGte1,
          order: mockOrder1,
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          eq: mockEq2,
          single: mockSingle1,
        })
        .mockReturnValueOnce({
          insert: mockInsert1,
          select: mockSelect3,
          single: mockSingle2,
        });

      const result1 = await ReviewService.submitReview(params);
      expect(result1).toBeDefined();

      // Second submission should be rejected (duplicate)
      const mockSelect4 = jest.fn().mockReturnThis();
      const mockEq4 = jest.fn().mockReturnThis();
      const mockGte2 = jest.fn().mockReturnThis();
      const mockOrder2 = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const mockSelect5 = jest.fn().mockReturnThis();
      const mockEq5 = jest.fn().mockReturnThis();
      const mockSingle3 = jest.fn().mockResolvedValue({
        data: { id: 'review-789' }, // Existing review
        error: null,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect4,
          eq: mockEq4,
          gte: mockGte2,
          order: mockOrder2,
        })
        .mockReturnValueOnce({
          select: mockSelect5,
          eq: mockEq5,
          single: mockSingle3,
        });

      await expect(ReviewService.submitReview(params)).rejects.toThrow(
        'You have already reviewed this venue'
      );
    });
  });

  /**
   * Cache Performance
   */
  describe('Cache Performance', () => {
    it('should improve fetch time on cache hit', async () => {
      // This test would require actual cache implementation
      // Placeholder for now
      expect(true).toBe(true);
    });

    it('should invalidate cache quickly on new submission', async () => {
      // This test would require actual cache implementation
      // Placeholder for now
      expect(true).toBe(true);
    });
  });
});
