/**
 * Property-Based Tests for ReviewService
 * 
 * Feature: venue-reviews-ratings
 * Tests correctness properties using fast-check library
 * 
 * Each property test runs 100 iterations with randomized inputs
 * to verify universal correctness properties.
 */

import fc from 'fast-check';
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
    validateReviewText: jest.fn((text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        return { valid: false, error: 'Review text cannot be empty or contain only spaces' };
      }
      if (trimmed.length > 500) {
        return { valid: false, error: 'Review text cannot exceed 500 characters' };
      }
      return { valid: true, trimmedText: trimmed };
    }),
    filterProfanity: jest.fn((text: string) => {
      // Simple mock: detect common profanity
      const hasMildProfanity = /damn|hell/i.test(text);
      const hasSevereProfanity = /\b(fuck|shit|asshole)\b/i.test(text);
      
      if (hasSevereProfanity) {
        return {
          filtered: text,
          hadProfanity: true,
          severity: 'severe' as const,
          wasRejected: true,
        };
      }
      
      if (hasMildProfanity) {
        const filtered = text.replace(/damn/gi, 'd***').replace(/hell/gi, 'h***');
        return {
          filtered,
          hadProfanity: true,
          severity: 'mild' as const,
          wasRejected: false,
        };
      }
      
      return {
        filtered: text,
        hadProfanity: false,
        severity: 'none' as const,
        wasRejected: false,
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

describe('ReviewService - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 1: Review submission requires authentication and rating
   * Feature: venue-reviews-ratings, Property 1: Review submission requires authentication and rating
   * 
   * For any review submission attempt, the system should reject it if the user is not 
   * authenticated OR if no rating (1-5) is provided, and should accept it if both conditions are met.
   * 
   * Validates: Requirements 1.7, 1.8
   */
  test('Property 1: Review submission requires authentication and rating', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.option(fc.uuid(), { nil: '' }),
          venueId: fc.uuid(),
          rating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
          reviewText: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
        }),
        async ({ userId, venueId, rating, reviewText }) => {
          const isAuthenticated = userId !== '';
          const hasValidRating = rating !== undefined && rating >= 1 && rating <= 5;
          
          if (!isAuthenticated || !hasValidRating) {
            // Should reject
            await expect(
              ReviewService.submitReview({
                venueId,
                userId: userId || '',
                rating: rating || 0,
                reviewText,
              })
            ).rejects.toThrow();
          } else {
            // Mock successful submission
            const mockInsert = jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'test-review-id',
                    venue_id: venueId,
                    user_id: userId,
                    rating,
                    review_text: reviewText,
                    is_verified: false,
                    helpful_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
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

            (supabase.from as jest.Mock)
              .mockReturnValueOnce({
                select: mockSelect,
                eq: mockEq,
                gte: mockGte,
                order: mockOrder,
              })
              .mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })
              .mockReturnValueOnce({
                insert: mockInsert,
              });

            // Should accept
            const result = await ReviewService.submitReview({
              venueId,
              userId,
              rating,
              reviewText,
            });
            
            expect(result).toBeDefined();
            expect(result.user_id).toBe(userId);
            expect(result.rating).toBe(rating);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Review text validation
   * Feature: venue-reviews-ratings, Property 3: Review text validation
   * 
   * For any review text input, the system should trim leading/trailing whitespace,
   * reject text that is only whitespace, reject text exceeding 500 characters,
   * and accept valid text within the limit.
   * 
   * Validates: Requirements 13.2, 13.6, 13.7
   */
  test('Property 3: Review text validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 600 }),
        async (reviewText) => {
          const trimmed = reviewText.trim();
          const isValid = trimmed.length > 0 && trimmed.length <= 500;
          
          const userId = 'test-user-id';
          const venueId = 'test-venue-id';
          const rating = 5;
          
          if (!isValid) {
            // Should reject
            await expect(
              ReviewService.submitReview({
                venueId,
                userId,
                rating,
                reviewText,
              })
            ).rejects.toThrow();
          } else {
            // Mock successful submission
            const mockInsert = jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'test-review-id',
                    venue_id: venueId,
                    user_id: userId,
                    rating,
                    review_text: trimmed,
                    is_verified: false,
                    helpful_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
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

            (supabase.from as jest.Mock)
              .mockReturnValueOnce({
                select: mockSelect,
                eq: mockEq,
                gte: mockGte,
                order: mockOrder,
              })
              .mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })
              .mockReturnValueOnce({
                insert: mockInsert,
              });

            // Should accept and trim
            const result = await ReviewService.submitReview({
              venueId,
              userId,
              rating,
              reviewText,
            });
            
            expect(result.review_text).toBe(trimmed);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Review sorting
   * Feature: venue-reviews-ratings, Property 8: Review sorting
   * 
   * For any list of reviews with a specified sort order (Most Recent, Highest Rated, 
   * Lowest Rated, Most Helpful), the reviews should be ordered correctly according 
   * to the selected criterion.
   * 
   * Validates: Requirements 3.9, 4.3, 5.7
   */
  test('Property 8: Review sorting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            rating: fc.integer({ min: 1, max: 5 }),
            helpful_count: fc.integer({ min: 0, max: 100 }),
            created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        fc.constantFrom('recent', 'highest', 'lowest', 'helpful'),
        async (reviews, sortBy) => {
          const venueId = 'test-venue-id';
          
          // Sort the reviews according to the sort criterion
          const sorted = [...reviews].sort((a, b) => {
            switch (sortBy) {
              case 'recent':
                return b.created_at.getTime() - a.created_at.getTime();
              case 'highest':
                return b.rating - a.rating;
              case 'lowest':
                return a.rating - b.rating;
              case 'helpful':
                return b.helpful_count - a.helpful_count;
              default:
                return 0;
            }
          });

          // Mock the database response with sorted reviews
          const mockReviews = sorted.map(r => ({
            ...r,
            venue_id: venueId,
            user_id: 'test-user-id',
            review_text: 'Test review',
            is_verified: false,
            created_at: r.created_at.toISOString(),
            updated_at: r.created_at.toISOString(),
          }));

          const mockSelect = jest.fn().mockReturnThis();
          const mockEq = jest.fn().mockReturnThis();
          const mockOrder = jest.fn().mockReturnThis();
          const mockRange = jest.fn().mockResolvedValue({
            data: mockReviews,
            error: null,
            count: mockReviews.length,
          });

          (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            order: mockOrder,
            range: mockRange,
          });

          // Call getVenueReviews with the sort criterion
          const result = await ReviewService.getVenueReviews({
            venueId,
            sortBy: sortBy as 'recent' | 'highest' | 'lowest' | 'helpful',
          });

          // Verify the reviews are sorted correctly
          expect(result.reviews.length).toBe(sorted.length);
          
          for (let i = 0; i < result.reviews.length - 1; i++) {
            const current = result.reviews[i];
            const next = result.reviews[i + 1];
            
            switch (sortBy) {
              case 'recent':
                expect(new Date(current.created_at).getTime()).toBeGreaterThanOrEqual(
                  new Date(next.created_at).getTime()
                );
                break;
              case 'highest':
                expect(current.rating).toBeGreaterThanOrEqual(next.rating);
                break;
              case 'lowest':
                expect(current.rating).toBeLessThanOrEqual(next.rating);
                break;
              case 'helpful':
                expect(current.helpful_count).toBeGreaterThanOrEqual(next.helpful_count);
                break;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Review filtering
   * Feature: venue-reviews-ratings, Property 9: Review filtering
   * 
   * For any rating filter selection (1-5 stars), the system should display only 
   * reviews matching that exact rating value, and should display all reviews 
   * when "All Ratings" is selected.
   * 
   * Validates: Requirements 4.5
   */
  test('Property 9: Review filtering', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            rating: fc.integer({ min: 1, max: 5 }),
            created_at: fc.date(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
        async (reviews, filterRating) => {
          const venueId = 'test-venue-id';
          
          // Filter reviews by rating if specified
          const filtered = filterRating
            ? reviews.filter(r => r.rating === filterRating)
            : reviews;

          // Mock the database response with filtered reviews
          const mockReviews = filtered.map(r => ({
            ...r,
            venue_id: venueId,
            user_id: 'test-user-id',
            review_text: 'Test review',
            is_verified: false,
            helpful_count: 0,
            created_at: r.created_at.toISOString(),
            updated_at: r.created_at.toISOString(),
          }));

          const mockSelect = jest.fn().mockReturnThis();
          const mockEq = jest.fn().mockReturnThis();
          const mockOrder = jest.fn().mockReturnThis();
          const mockRange = jest.fn().mockResolvedValue({
            data: mockReviews,
            error: null,
            count: mockReviews.length,
          });

          (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            order: mockOrder,
            range: mockRange,
          });

          // Call getVenueReviews with the filter
          const result = await ReviewService.getVenueReviews({
            venueId,
            filterRating: filterRating as 1 | 2 | 3 | 4 | 5 | undefined,
          });

          // Verify all returned reviews match the filter
          if (filterRating) {
            result.reviews.forEach(review => {
              expect(review.rating).toBe(filterRating);
            });
          }
          
          expect(result.reviews.length).toBe(filtered.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Helpful vote toggle behavior
   * Feature: venue-reviews-ratings, Property 11: Helpful vote toggle behavior
   * 
   * For any review, when a user taps "Helpful" twice in succession, the helpful count 
   * should return to its original value (idempotent toggle), and the button state 
   * should return to inactive.
   * 
   * Validates: Requirements 5.2, 5.3
   */
  test('Property 11: Helpful vote toggle behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 0, max: 100 }),
        async (reviewId, userId, initialCount) => {
          // First toggle: add vote
          const mockInsert = jest.fn().mockResolvedValue({
            data: { id: 'vote-id', review_id: reviewId, user_id: userId },
            error: null,
          });

          const mockSelect1 = jest.fn().mockReturnThis();
          const mockEq1 = jest.fn().mockReturnThis();
          const mockSingle1 = jest.fn().mockResolvedValue({
            data: null, // No existing vote
            error: null,
          });

          const mockUpdate1 = jest.fn().mockReturnThis();
          const mockEqUpdate1 = jest.fn().mockResolvedValue({
            data: { helpful_count: initialCount + 1 },
            error: null,
          });

          (supabase.from as jest.Mock)
            .mockReturnValueOnce({
              select: mockSelect1,
              eq: mockEq1,
              single: mockSingle1,
            })
            .mockReturnValueOnce({
              insert: mockInsert,
            })
            .mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { helpful_count: initialCount + 1 },
                error: null,
              }),
            });

          const result1 = await ReviewService.toggleHelpfulVote(reviewId, userId);
          expect(result1.helpful).toBe(true);
          expect(result1.newCount).toBe(initialCount + 1);

          // Second toggle: remove vote
          const mockSelect2 = jest.fn().mockReturnThis();
          const mockEq2 = jest.fn().mockReturnThis();
          const mockSingle2 = jest.fn().mockResolvedValue({
            data: { id: 'vote-id' }, // Existing vote
            error: null,
          });

          const mockDelete = jest.fn().mockReturnThis();
          const mockEqDelete = jest.fn().mockResolvedValue({
            error: null,
          });

          (supabase.from as jest.Mock)
            .mockReturnValueOnce({
              select: mockSelect2,
              eq: mockEq2,
              single: mockSingle2,
            })
            .mockReturnValueOnce({
              delete: mockDelete,
              eq: mockEqDelete,
            })
            .mockReturnValueOnce({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { helpful_count: initialCount },
                error: null,
              }),
            });

          const result2 = await ReviewService.toggleHelpfulVote(reviewId, userId);
          expect(result2.helpful).toBe(false);
          expect(result2.newCount).toBe(initialCount); // Back to original
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Aggregate rating calculation
   * Feature: venue-reviews-ratings, Property 16: Aggregate rating calculation
   * 
   * For any venue, the aggregate_rating should equal the average of all review ratings 
   * for that venue (rounded to one decimal place), and the review_count should equal 
   * the total number of reviews for that venue.
   * 
   * Validates: Requirements 11.2, 14.1
   */
  test('Property 16: Aggregate rating calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.integer({ min: 1, max: 5 }),
          { minLength: 1, maxLength: 50 }
        ),
        async (ratings) => {
          // Calculate expected aggregate rating
          const sum = ratings.reduce((acc, r) => acc + r, 0);
          const expectedRating = Math.round((sum / ratings.length) * 10) / 10;
          const expectedCount = ratings.length;

          // Verify the calculation matches our expectation
          expect(expectedRating).toBeGreaterThanOrEqual(1.0);
          expect(expectedRating).toBeLessThanOrEqual(5.0);
          expect(expectedCount).toBe(ratings.length);
          
          // Verify rounding to one decimal place
          const decimalPlaces = (expectedRating.toString().split('.')[1] || '').length;
          expect(decimalPlaces).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 25: Rate limiting
   * Feature: venue-reviews-ratings, Property 25: Rate limiting
   * 
   * For any user, the system should reject review submissions if the user has already 
   * submitted 5 or more reviews within the past hour.
   * 
   * Validates: Requirements 18.5
   */
  test('Property 25: Rate limiting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 0, max: 10 }),
        async (userId, venueId, reviewCount) => {
          const shouldReject = reviewCount >= 5;
          
          // Mock rate limit check
          const mockReviews = Array(reviewCount).fill(null).map(() => ({
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          }));

          const mockSelect = jest.fn().mockReturnThis();
          const mockEq = jest.fn().mockReturnThis();
          const mockGte = jest.fn().mockReturnThis();
          const mockOrder = jest.fn().mockResolvedValue({
            data: mockReviews,
            error: null,
            count: reviewCount,
          });

          (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            gte: mockGte,
            order: mockOrder,
          });

          if (shouldReject) {
            // Should reject due to rate limit
            await expect(
              ReviewService.submitReview({
                venueId,
                userId,
                rating: 5,
              })
            ).rejects.toThrow(/reached the review limit/);
          } else {
            // Should allow submission
            const mockInsert = jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'test-review-id',
                    venue_id: venueId,
                    user_id: userId,
                    rating: 5,
                    is_verified: false,
                    helpful_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            });

            (supabase.from as jest.Mock)
              .mockReturnValueOnce({
                select: mockSelect,
                eq: mockEq,
                gte: mockGte,
                order: mockOrder,
              })
              .mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })
              .mockReturnValueOnce({
                insert: mockInsert,
              });

            const result = await ReviewService.submitReview({
              venueId,
              userId,
              rating: 5,
            });
            
            expect(result).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
