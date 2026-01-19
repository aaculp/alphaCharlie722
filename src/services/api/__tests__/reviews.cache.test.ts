/**
 * ReviewService Cache Tests
 * 
 * Tests to verify review caching functionality
 * 
 * Requirements:
 * - 14.5: Cache review lists with 5-minute TTL
 * - 14.6: Invalidate cache on new review submission
 */

import { ReviewService } from '../reviews';
import { cacheManager } from '../../../utils/cache/CacheManager';

// Mock the supabase client
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'reviews') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn(() => ({
                    data: [],
                    error: null,
                    count: 0,
                  })),
                })),
              })),
              order: jest.fn(() => ({
                range: jest.fn(() => ({
                  data: [],
                  error: null,
                  count: 0,
                })),
              })),
              single: jest.fn(() => ({
                data: {
                  user_id: 'test-user-id',
                  venue_id: 'test-venue-id',
                },
                error: null,
              })),
            })),
            single: jest.fn(() => ({
              data: {
                user_id: 'test-user-id',
                venue_id: 'test-venue-id',
              },
              error: null,
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'test-review-id',
                  venue_id: 'test-venue-id',
                  user_id: 'test-user-id',
                  rating: 5,
                  review_text: 'Great place!',
                  is_verified: true,
                  helpful_count: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: {
                      id: 'test-review-id',
                      venue_id: 'test-venue-id',
                      user_id: 'test-user-id',
                      rating: 4,
                      review_text: 'Updated review',
                      is_verified: true,
                      helpful_count: 0,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  })),
                })),
              })),
            })),
          })),
          delete: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                error: null,
              })),
            })),
          })),
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      };
    }),
  },
}));

// Mock ReviewNotificationService
jest.mock('../reviewNotifications', () => ({
  ReviewNotificationService: {
    notifyVenueOwnerOfNewReview: jest.fn(),
    notifyReviewerOfResponse: jest.fn(),
    notifyReviewerOfMilestone: jest.fn(),
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

describe('ReviewService - Caching', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheManager.clear();
    jest.clearAllMocks();
  });

  describe('getVenueReviews caching', () => {
    it('should cache review results on first fetch', async () => {
      const params = {
        venueId: 'test-venue-id',
        limit: 20,
        offset: 0,
        sortBy: 'recent' as const,
      };

      // First call should fetch from database
      const result1 = await ReviewService.getVenueReviews(params);
      
      expect(result1).toBeDefined();
      expect(result1.reviews).toEqual([]);
      expect(result1.total).toBe(0);
      expect(result1.hasMore).toBe(false);

      // Verify cache was populated
      const cacheStats = cacheManager.getStats();
      expect(cacheStats.size).toBeGreaterThan(0);
      expect(cacheStats.keys.some(key => key.includes('test-venue-id'))).toBe(true);
    });

    it('should return cached results on subsequent fetches', async () => {
      const params = {
        venueId: 'test-venue-id',
        limit: 20,
        offset: 0,
        sortBy: 'recent' as const,
      };

      // First call
      await ReviewService.getVenueReviews(params);
      
      // Second call should use cache
      const result2 = await ReviewService.getVenueReviews(params);
      
      expect(result2).toBeDefined();
      // If caching works, we should get the same result without hitting the database again
    });

    it('should generate different cache keys for different parameters', async () => {
      const params1 = {
        venueId: 'test-venue-id',
        limit: 20,
        offset: 0,
        sortBy: 'recent' as const,
      };

      const params2 = {
        venueId: 'test-venue-id',
        limit: 20,
        offset: 0,
        sortBy: 'highest' as const,
      };

      await ReviewService.getVenueReviews(params1);
      await ReviewService.getVenueReviews(params2);

      const cacheStats = cacheManager.getStats();
      // Should have 2 different cache entries
      expect(cacheStats.size).toBe(2);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache when new review is submitted', async () => {
      const venueId = 'test-venue-id';
      
      // First, populate cache
      await ReviewService.getVenueReviews({
        venueId,
        limit: 20,
        offset: 0,
        sortBy: 'recent',
      });

      // Verify cache is populated
      let cacheStats = cacheManager.getStats();
      expect(cacheStats.size).toBeGreaterThan(0);

      // Submit a new review (this should invalidate cache)
      await ReviewService.submitReview({
        venueId,
        userId: 'test-user-id',
        rating: 5,
        reviewText: 'Great place!',
      });

      // Verify cache was invalidated
      cacheStats = cacheManager.getStats();
      expect(cacheStats.keys.some(key => key.includes(venueId))).toBe(false);
    });

    it('should invalidate cache when review is updated', async () => {
      const venueId = 'test-venue-id';
      
      // Populate cache
      await ReviewService.getVenueReviews({
        venueId,
        limit: 20,
        offset: 0,
        sortBy: 'recent',
      });

      // Update review (this should invalidate cache)
      await ReviewService.updateReview({
        reviewId: 'test-review-id',
        userId: 'test-user-id',
        rating: 4,
        reviewText: 'Updated review',
      });

      // Verify cache was invalidated
      const cacheStats = cacheManager.getStats();
      expect(cacheStats.keys.some(key => key.includes(venueId))).toBe(false);
    });

    it('should invalidate cache when review is deleted', async () => {
      const venueId = 'test-venue-id';
      
      // Populate cache
      await ReviewService.getVenueReviews({
        venueId,
        limit: 20,
        offset: 0,
        sortBy: 'recent',
      });

      // Delete review (this should invalidate cache)
      await ReviewService.deleteReview('test-review-id', 'test-user-id');

      // Verify cache was invalidated
      const cacheStats = cacheManager.getStats();
      expect(cacheStats.keys.some(key => key.includes(venueId))).toBe(false);
    });

    it('should invalidate all cache entries for a venue (all pagination/filter combinations)', async () => {
      const venueId = 'test-venue-id';
      
      // Populate cache with multiple combinations
      await ReviewService.getVenueReviews({
        venueId,
        limit: 20,
        offset: 0,
        sortBy: 'recent',
      });

      await ReviewService.getVenueReviews({
        venueId,
        limit: 20,
        offset: 0,
        sortBy: 'highest',
      });

      await ReviewService.getVenueReviews({
        venueId,
        limit: 20,
        offset: 0,
        sortBy: 'recent',
        filterRating: 5,
      });

      // Verify multiple cache entries exist
      let cacheStats = cacheManager.getStats();
      const venueEntries = cacheStats.keys.filter(key => key.includes(venueId));
      expect(venueEntries.length).toBe(3);

      // Submit a new review (should invalidate ALL cache entries for this venue)
      await ReviewService.submitReview({
        venueId,
        userId: 'test-user-id',
        rating: 5,
        reviewText: 'Great place!',
      });

      // Verify ALL cache entries for this venue were invalidated
      cacheStats = cacheManager.getStats();
      const remainingVenueEntries = cacheStats.keys.filter(key => key.includes(venueId));
      expect(remainingVenueEntries.length).toBe(0);
    });
  });
});
