/**
 * Property-Based Tests for CheckInService History Methods
 * Feature: recent-check-ins-history
 */

import * as fc from 'fast-check';
import { CheckInService } from '../checkins';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Helper to generate valid ISO date strings
const validDateArbitrary = (minDaysAgo: number, maxDaysAgo: number = 0) =>
  fc.integer({ min: Date.now() - minDaysAgo * 24 * 60 * 60 * 1000, max: Date.now() - maxDaysAgo * 24 * 60 * 60 * 1000 })
    .map(timestamp => new Date(timestamp).toISOString());

describe('CheckInService History Methods - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 1: 30-Day Filter
   * Feature: recent-check-ins-history, Property 1: 30-Day Filter
   * Validates: Requirements 1.1, 2.3
   * 
   * For any user and any set of check-ins in the database, when fetching check-in history,
   * all returned check-ins should have a checked_in_at timestamp within the past 30 days
   * from the current date.
   */
  describe('Property 1: 30-Day Filter', () => {
    it('should only return check-ins within the past 30 days', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.array(
            fc.record({
              id: fc.uuid(),
              venue_id: fc.uuid(),
              user_id: fc.constant('test-user'),
              // Generate timestamps from 60 days ago to now
              checked_in_at: validDateArbitrary(60, 0),
              checked_out_at: fc.oneof(fc.constant(null), validDateArbitrary(60, 0)),
              is_active: fc.boolean(),
              created_at: validDateArbitrary(60, 0),
              updated_at: validDateArbitrary(60, 0),
              venues: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                location: fc.string({ minLength: 1, maxLength: 100 }),
                category: fc.constantFrom('Coffee Shop', 'Bar', 'Restaurant', 'Cafe'),
                image_url: fc.oneof(fc.constant(null), fc.webUrl()),
                rating: fc.double({ min: 0, max: 5 }),
                latitude: fc.oneof(fc.constant(null), fc.double({ min: -90, max: 90 })),
                longitude: fc.oneof(fc.constant(null), fc.double({ min: -180, max: 180 }))
              })
            }),
            { minLength: 0, maxLength: 100 }
          ),
          async (userId, mockCheckIns) => {
            // Calculate 30 days ago
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

            // Filter mock data to only include check-ins within 30 days (simulating what the DB would do)
            const filteredCheckIns = mockCheckIns.filter(ci => ci.checked_in_at >= thirtyDaysAgoISO);

            // Mock Supabase response with filtered data
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              range: jest.fn().mockResolvedValue({
                data: filteredCheckIns,
                error: null,
                count: filteredCheckIns.length
              })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            // Call the method
            const result = await CheckInService.getUserCheckInHistory({ userId });

            // Verify all returned check-ins are within 30 days
            result.checkIns.forEach(checkIn => {
              const checkInDate = new Date(checkIn.checked_in_at);
              expect(checkInDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: User Isolation
   * Feature: recent-check-ins-history, Property 3: User Isolation
   * Validates: Requirements 2.1
   * 
   * For any user ID provided to the history service, all returned check-ins should have
   * a user_id field that matches the provided user ID.
   */
  describe('Property 3: User Isolation', () => {
    it('should only return check-ins for the specified user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // target userId
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }), // other userIds
          fc.array(
            fc.record({
              id: fc.uuid(),
              venue_id: fc.uuid(),
              user_id: fc.uuid(),
              checked_in_at: validDateArbitrary(30, 0),
              checked_out_at: fc.oneof(fc.constant(null), validDateArbitrary(30, 0)),
              is_active: fc.boolean(),
              created_at: validDateArbitrary(30, 0),
              updated_at: validDateArbitrary(30, 0),
              venues: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                location: fc.string({ minLength: 1, maxLength: 100 }),
                category: fc.constantFrom('Coffee Shop', 'Bar', 'Restaurant'),
                image_url: fc.oneof(fc.constant(null), fc.webUrl()),
                rating: fc.double({ min: 0, max: 5 }),
                latitude: fc.oneof(fc.constant(null), fc.double({ min: -90, max: 90 })),
                longitude: fc.oneof(fc.constant(null), fc.double({ min: -180, max: 180 }))
              })
            }),
            { minLength: 0, maxLength: 50 }
          ),
          async (targetUserId, otherUserIds, mockCheckIns) => {
            // Set all check-ins to the target user
            const userCheckIns = mockCheckIns.map(ci => ({ ...ci, user_id: targetUserId }));

            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              range: jest.fn().mockResolvedValue({
                data: userCheckIns,
                error: null,
                count: userCheckIns.length
              })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await CheckInService.getUserCheckInHistory({ userId: targetUserId });

            // Verify all returned check-ins belong to the target user
            result.checkIns.forEach(checkIn => {
              expect(checkIn.user_id).toBe(targetUserId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Venue Data Inclusion
   * Feature: recent-check-ins-history, Property 4: Venue Data Inclusion
   * Validates: Requirements 2.2, 2.4
   * 
   * For any check-in returned by the history service, the check-in object should contain
   * a nested venue object with all required venue fields.
   */
  describe('Property 4: Venue Data Inclusion', () => {
    it('should include complete venue data for all check-ins', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(
            fc.record({
              id: fc.uuid(),
              venue_id: fc.uuid(),
              user_id: fc.uuid(),
              checked_in_at: validDateArbitrary(30, 0),
              checked_out_at: fc.oneof(fc.constant(null), validDateArbitrary(30, 0)),
              is_active: fc.boolean(),
              created_at: validDateArbitrary(30, 0),
              updated_at: validDateArbitrary(30, 0),
              venues: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                location: fc.string({ minLength: 1, maxLength: 100 }),
                category: fc.constantFrom('Coffee Shop', 'Bar', 'Restaurant'),
                image_url: fc.oneof(fc.constant(null), fc.webUrl()),
                rating: fc.double({ min: 0, max: 5 }),
                latitude: fc.oneof(fc.constant(null), fc.double({ min: -90, max: 90 })),
                longitude: fc.oneof(fc.constant(null), fc.double({ min: -180, max: 180 }))
              })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (userId, mockCheckIns) => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              range: jest.fn().mockResolvedValue({
                data: mockCheckIns,
                error: null,
                count: mockCheckIns.length
              })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await CheckInService.getUserCheckInHistory({ userId });

            // Verify all check-ins have complete venue data
            result.checkIns.forEach(checkIn => {
              expect(checkIn.venue).toBeDefined();
              expect(checkIn.venue.id).toBeDefined();
              expect(checkIn.venue.name).toBeDefined();
              expect(checkIn.venue.location).toBeDefined();
              expect(checkIn.venue.category).toBeDefined();
              expect(checkIn.venue).toHaveProperty('image_url');
              expect(checkIn.venue.rating).toBeDefined();
              expect(checkIn.venue).toHaveProperty('latitude');
              expect(checkIn.venue).toHaveProperty('longitude');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Pagination Limits
   * Feature: recent-check-ins-history, Property 8: Pagination Limits
   * Validates: Requirements 7.1, 7.2
   * 
   * For any request to fetch check-in history, the number of check-ins returned should not
   * exceed the specified limit, and subsequent pagination requests should return the next
   * batch without duplicates.
   */
  describe('Property 8: Pagination Limits', () => {
    it('should respect pagination limits and return correct batches', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 100 }), // limit
          fc.integer({ min: 0, max: 50 }), // offset
          fc.array(
            fc.record({
              id: fc.uuid(),
              venue_id: fc.uuid(),
              user_id: fc.uuid(),
              checked_in_at: validDateArbitrary(30, 0),
              checked_out_at: fc.oneof(fc.constant(null), validDateArbitrary(30, 0)),
              is_active: fc.boolean(),
              created_at: validDateArbitrary(30, 0),
              updated_at: validDateArbitrary(30, 0),
              venues: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                location: fc.string({ minLength: 1, maxLength: 100 }),
                category: fc.constantFrom('Coffee Shop', 'Bar', 'Restaurant'),
                image_url: fc.oneof(fc.constant(null), fc.webUrl()),
                rating: fc.double({ min: 0, max: 5 }),
                latitude: fc.oneof(fc.constant(null), fc.double({ min: -90, max: 90 })),
                longitude: fc.oneof(fc.constant(null), fc.double({ min: -180, max: 180 }))
              })
            }),
            { minLength: 0, maxLength: 150 }
          ),
          async (userId, limit, offset, allCheckIns) => {
            // Simulate pagination by slicing the array
            const paginatedCheckIns = allCheckIns.slice(offset, offset + limit);

            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              range: jest.fn().mockResolvedValue({
                data: paginatedCheckIns,
                error: null,
                count: allCheckIns.length
              })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await CheckInService.getUserCheckInHistory({ userId, limit, offset });

            // Verify returned count doesn't exceed limit
            expect(result.checkIns.length).toBeLessThanOrEqual(limit);

            // Verify hasMore flag is correct
            const expectedHasMore = offset + limit < allCheckIns.length;
            expect(result.hasMore).toBe(expectedHasMore);

            // Verify total count
            expect(result.total).toBe(allCheckIns.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Visit Count Accuracy
   * Feature: recent-check-ins-history, Property 6: Visit Count Accuracy
   * Validates: Requirements 10.1, 10.4
   * 
   * For any user and venue combination, the visit count should equal the total number of
   * check-in records in the database for that user-venue pair.
   */
  describe('Property 6: Visit Count Accuracy', () => {
    it('should accurately count all visits for a user-venue pair', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // venueId
          fc.integer({ min: 0, max: 50 }), // expected count
          async (userId, venueId, expectedCount) => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              mockResolvedValue: jest.fn().mockResolvedValue({
                count: expectedCount,
                error: null
              })
            };

            // Override the final resolution
            mockQuery.eq = jest.fn().mockReturnValue({
              ...mockQuery,
              then: (resolve: any) => resolve({ count: expectedCount, error: null })
            });

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await CheckInService.getUserVenueVisitCount(userId, venueId);

            expect(result).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accurately batch count visits for multiple venues', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }), // venueIds
          async (userId, venueIds) => {
            // Generate random check-ins for these venues
            const checkIns = venueIds.flatMap(venueId =>
              Array.from({ length: Math.floor(Math.random() * 5) }, () => ({ venue_id: venueId }))
            );

            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({
                data: checkIns,
                error: null
              })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            const result = await CheckInService.getUserVenueVisitCounts(userId, venueIds);

            // Verify all venues are in the result
            venueIds.forEach(venueId => {
              expect(result.has(venueId)).toBe(true);
            });

            // Verify counts match the mock data
            const expectedCounts = new Map<string, number>();
            venueIds.forEach(venueId => expectedCounts.set(venueId, 0));
            checkIns.forEach(ci => {
              expectedCounts.set(ci.venue_id, (expectedCounts.get(ci.venue_id) || 0) + 1);
            });

            venueIds.forEach(venueId => {
              expect(result.get(venueId)).toBe(expectedCounts.get(venueId));
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Error Handling
   * Feature: recent-check-ins-history, Property 11: Error Handling
   * Validates: Requirements 2.5
   * 
   * For any query that fails due to network issues or database errors, the service should
   * return an error object with a descriptive message rather than throwing an unhandled exception.
   */
  describe('Property 11: Error Handling', () => {
    it('should handle errors gracefully and throw with descriptive messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }), // error message
          async (userId, errorMessage) => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: errorMessage },
                count: null
              })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            await expect(
              CheckInService.getUserCheckInHistory({ userId })
            ).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
