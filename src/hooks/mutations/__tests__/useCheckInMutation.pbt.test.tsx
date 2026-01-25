/**
 * Property-Based Tests for useCheckInMutation Hook
 * 
 * Feature: react-query-integration
 * Property 12: Optimistic UI updates
 * 
 * Validates: Requirements 3.3, 9.1, 9.2, 9.3
 * 
 * Tests verify that UI updates immediately before server confirmation
 * for check-in mutations using property-based testing with fast-check.
 * 
 * NOTE: These tests may show "Jest did not exit" warning due to React Query's
 * internal garbage collection timers. This is a known issue and doesn't affect
 * test validity. Use --forceExit flag if needed: npm test -- --forceExit
 */

import fc from 'fast-check';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCheckInMutation } from '../useCheckInMutation';
import { CheckInService } from '../../../services/api/checkins';
import { queryKeys } from '../../../lib/queryKeys';
import type { CheckIn, VenueWithStats } from '../../../types';
import React from 'react';

// Mock the CheckInService
jest.mock('../../../services/api/checkins');

const mockCheckInService = CheckInService as jest.Mocked<typeof CheckInService>;

// Helper to create a wrapper with QueryClient
function createWrapper(initialVenue?: VenueWithStats) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable garbage collection timer
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Pre-populate cache with venue data if provided
  if (initialVenue) {
    queryClient.setQueryData(
      queryKeys.venues.detail(initialVenue.id),
      initialVenue
    );
  }

  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  };
}

describe('Feature: react-query-integration, Property 12: Optimistic UI updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 3.3, 9.1, 9.2, 9.3**
   * 
   * Property: For any check-in mutation, the UI SHALL update immediately
   * upon mutation initiation, before receiving server confirmation.
   * 
   * This property verifies that:
   * 1. The optimistic update happens synchronously (before async server call completes)
   * 2. The check-in count increments by exactly 1
   * 3. The user_is_checked_in flag is set to true
   * 4. The update occurs regardless of the initial venue state
   */
  it('should optimistically update UI immediately for any venue state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random venue IDs
        fc.uuid(),
        fc.uuid(),
        // Generate random initial check-in counts
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        // Generate random initial checked-in state
        fc.boolean(),
        // Generate server response delay (to ensure we can observe optimistic update)
        fc.integer({ min: 100, max: 300 }),
        async (venueId, userId, initialActiveCheckins, initialRecentCheckins, initialCheckedIn, serverDelay) => {
          // Create mock venue with generated properties
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: 'Test Venue',
            category: 'restaurant',
            location: 'Test Location',
            rating: 4.5,
            review_count: 100,
            description: 'Test description',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip_code: '12345',
            country: 'USA',
            phone: '555-0000',
            email: 'test@venue.com',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$',
            cuisine_type: 'Test',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: 4.5,
            image_url: 'https://test.com/image.jpg',
            latitude: 40.7128,
            longitude: -74.0060,
            is_active: true,
            is_featured: false,
            tags: [],
            stats: {
              active_checkins: initialActiveCheckins,
              recent_checkins: initialRecentCheckins,
              user_is_checked_in: initialCheckedIn,
            },
          };

          // Mock server response with delay
          const mockCheckIn: CheckIn = {
            id: 'checkin-123',
            venue_id: venueId,
            user_id: userId,
            checked_in_at: new Date().toISOString(),
            checked_out_at: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockCheckInService.checkIn.mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => resolve(mockCheckIn), serverDelay);
              })
          );

          const { queryClient, wrapper } = createWrapper(mockVenue);

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Capture the time before mutation
          const beforeMutation = Date.now();

          // Execute mutation
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Wait for optimistic update to be applied
          // This should happen before server responds
          await waitFor(
            () => {
              const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
                queryKeys.venues.detail(venueId)
              );

              // Property 1: Active check-in count should increment by exactly 1
              expect(optimisticVenue?.stats?.active_checkins).toBe(
                initialActiveCheckins + 1
              );

              // Property 2: Recent check-in count should increment by exactly 1
              expect(optimisticVenue?.stats?.recent_checkins).toBe(
                initialRecentCheckins + 1
              );

              // Property 3: User should be marked as checked in
              expect(optimisticVenue?.stats?.user_is_checked_in).toBe(true);

              // Property 4: User check-in time should be set
              expect(optimisticVenue?.stats?.user_checkin_time).toBeDefined();
            },
            { timeout: 500 }
          );

          // Property 5: Optimistic update should happen before server responds
          const timeSinceStart = Date.now() - beforeMutation;
          expect(timeSinceStart).toBeLessThan(serverDelay);

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100, timeout: 30000 } // 100 iterations with timeout
    );
  }, 35000); // Jest timeout for this test

  /**
   * Property: Optimistic updates should be idempotent for the same mutation
   * 
   * This verifies that the optimistic update logic produces consistent results
   * regardless of when it's called during the mutation lifecycle.
   */
  it('should produce consistent optimistic updates for same initial state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 0, max: 100 }),
        async (venueId, userId, initialCount) => {
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: 'Test Venue',
            category: 'restaurant',
            location: 'Test Location',
            rating: 4.5,
            review_count: 100,
            description: 'Test description',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip_code: '12345',
            country: 'USA',
            phone: '555-0000',
            email: 'test@venue.com',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$',
            cuisine_type: 'Test',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: 4.5,
            image_url: 'https://test.com/image.jpg',
            latitude: 40.7128,
            longitude: -74.0060,
            is_active: true,
            is_featured: false,
            tags: [],
            stats: {
              active_checkins: initialCount,
              recent_checkins: initialCount,
              user_is_checked_in: false,
            },
          };

          const mockCheckIn: CheckIn = {
            id: 'checkin-123',
            venue_id: venueId,
            user_id: userId,
            checked_in_at: new Date().toISOString(),
            checked_out_at: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockCheckInService.checkIn.mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => resolve(mockCheckIn), 100);
              })
          );

          const { queryClient, wrapper } = createWrapper(mockVenue);

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Capture optimistic state
          await waitFor(() => {
            const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
              queryKeys.venues.detail(venueId)
            );
            expect(optimisticVenue?.stats?.user_is_checked_in).toBe(true);
          });

          const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Property: The optimistic update should always produce the same result
          // for the same initial state
          expect(optimisticVenue?.stats?.active_checkins).toBe(initialCount + 1);
          expect(optimisticVenue?.stats?.recent_checkins).toBe(initialCount + 1);
          expect(optimisticVenue?.stats?.user_is_checked_in).toBe(true);

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 } // Reduced runs with timeout
    );
  }, 35000); // Jest timeout

  /**
   * Property: Optimistic updates should preserve other venue properties
   * 
   * This verifies that the optimistic update only modifies the stats
   * and doesn't accidentally change other venue properties.
   */
  it('should preserve all non-stats venue properties during optimistic update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('restaurant', 'bar', 'cafe', 'club'),
        fc.float({ min: 0, max: 5, noNaN: true }),
        fc.integer({ min: 0, max: 10000 }),
        async (venueId, userId, venueName, category, rating, reviewCount) => {
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: venueName,
            category,
            location: 'Test Location',
            rating,
            review_count: reviewCount,
            description: 'Test description',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip_code: '12345',
            country: 'USA',
            phone: '555-0000',
            email: 'test@venue.com',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$',
            cuisine_type: 'Test',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: rating,
            image_url: 'https://test.com/image.jpg',
            latitude: 40.7128,
            longitude: -74.0060,
            is_active: true,
            is_featured: false,
            tags: [],
            stats: {
              active_checkins: 5,
              recent_checkins: 10,
              user_is_checked_in: false,
            },
          };

          const mockCheckIn: CheckIn = {
            id: 'checkin-123',
            venue_id: venueId,
            user_id: userId,
            checked_in_at: new Date().toISOString(),
            checked_out_at: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockCheckInService.checkIn.mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => resolve(mockCheckIn), 100);
              })
          );

          const { queryClient, wrapper } = createWrapper(mockVenue);

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Check optimistic update
          await waitFor(() => {
            const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
              queryKeys.venues.detail(venueId)
            );
            expect(optimisticVenue?.stats?.user_is_checked_in).toBe(true);
          });

          const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Property: All non-stats properties should remain unchanged
          expect(optimisticVenue?.id).toBe(venueId);
          expect(optimisticVenue?.name).toBe(venueName);
          expect(optimisticVenue?.category).toBe(category);
          expect(optimisticVenue?.rating).toBe(rating);
          expect(optimisticVenue?.review_count).toBe(reviewCount);
          expect(optimisticVenue?.address).toBe(mockVenue.address);
          expect(optimisticVenue?.city).toBe(mockVenue.city);
          expect(optimisticVenue?.latitude).toBe(mockVenue.latitude);
          expect(optimisticVenue?.longitude).toBe(mockVenue.longitude);

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 } // Reduced runs with timeout
    );
  }, 35000); // Jest timeout

  /**
   * Property: Optimistic updates should handle edge cases gracefully
   * 
   * This verifies that optimistic updates work correctly even with
   * edge case values like 0 check-ins or maximum check-ins.
   */
  it('should handle edge case check-in counts correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.constantFrom(0, 1, 999, 1000, 9999, 10000), // Edge case values
        async (venueId, userId, edgeCaseCount) => {
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: 'Test Venue',
            category: 'restaurant',
            location: 'Test Location',
            rating: 4.5,
            review_count: 100,
            description: 'Test description',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip_code: '12345',
            country: 'USA',
            phone: '555-0000',
            email: 'test@venue.com',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$',
            cuisine_type: 'Test',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: 4.5,
            image_url: 'https://test.com/image.jpg',
            latitude: 40.7128,
            longitude: -74.0060,
            is_active: true,
            is_featured: false,
            tags: [],
            stats: {
              active_checkins: edgeCaseCount,
              recent_checkins: edgeCaseCount,
              user_is_checked_in: false,
            },
          };

          const mockCheckIn: CheckIn = {
            id: 'checkin-123',
            venue_id: venueId,
            user_id: userId,
            checked_in_at: new Date().toISOString(),
            checked_out_at: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockCheckInService.checkIn.mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => resolve(mockCheckIn), 100);
              })
          );

          const { queryClient, wrapper } = createWrapper(mockVenue);

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Check optimistic update
          await waitFor(() => {
            const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
              queryKeys.venues.detail(venueId)
            );
            expect(optimisticVenue?.stats?.user_is_checked_in).toBe(true);
          });

          const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Property: Edge case counts should increment correctly
          expect(optimisticVenue?.stats?.active_checkins).toBe(edgeCaseCount + 1);
          expect(optimisticVenue?.stats?.recent_checkins).toBe(edgeCaseCount + 1);
          expect(optimisticVenue?.stats?.user_is_checked_in).toBe(true);

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 30, timeout: 30000 } // Fewer runs with timeout
    );
  }, 35000); // Jest timeout
});

/**
 * Property-Based Tests for Optimistic Rollback
 * 
 * Feature: react-query-integration
 * Property 13: Optimistic update rollback
 * 
 * **Validates: Requirements 3.4, 9.4**
 * 
 * Tests verify that previous state is restored on mutation failure
 * using property-based testing with fast-check.
 */
describe('Feature: react-query-integration, Property 13: Optimistic update rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 3.4, 9.4**
   * 
   * Property: For any mutation with optimistic updates, if the mutation fails,
   * the system SHALL restore the previous state that was captured before the
   * optimistic update was applied.
   * 
   * This property verifies that:
   * 1. The rollback restores the exact previous state
   * 2. All stats fields are restored to their original values
   * 3. The rollback happens regardless of the error type
   * 4. The rollback is complete and doesn't leave partial updates
   */
  it('should restore exact previous state on mutation failure for any venue state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random venue IDs
        fc.uuid(),
        fc.uuid(),
        // Generate random initial check-in counts
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        // Generate random initial checked-in state
        fc.boolean(),
        // Generate random error messages
        fc.oneof(
          fc.constant('Network error'),
          fc.constant('Server error'),
          fc.constant('Unauthorized'),
          fc.constant('Venue not found'),
          fc.constant('Already checked in'),
          fc.constant('Database error')
        ),
        async (venueId, userId, initialActiveCheckins, initialRecentCheckins, initialCheckedIn, errorMessage) => {
          // Create mock venue with generated properties
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: 'Test Venue',
            category: 'restaurant',
            location: 'Test Location',
            rating: 4.5,
            review_count: 100,
            description: 'Test description',
            address: '123 Test St',
            phone: '555-0000',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$$',
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: 4.5,
            image_url: 'https://test.com/image.jpg',
            wait_times: null,
            popular_items: null,
            atmosphere_tags: null,
            parking_info: null,
            max_capacity: null,
            stats: {
              active_checkins: initialActiveCheckins,
              recent_checkins: initialRecentCheckins,
              user_is_checked_in: initialCheckedIn,
              user_checkin_id: initialCheckedIn ? 'existing-checkin-id' : undefined,
              user_checkin_time: initialCheckedIn ? '2024-01-01T10:00:00Z' : undefined,
            },
          };

          // Mock server to reject with error
          mockCheckInService.checkIn.mockRejectedValue(new Error(errorMessage));

          const { queryClient, wrapper } = createWrapper(mockVenue);

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Capture the exact initial state before mutation
          const initialVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Deep clone to ensure we have a snapshot
          const initialSnapshot = JSON.parse(JSON.stringify(initialVenue));

          // Execute mutation (which will fail)
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Wait for mutation to fail
          await waitFor(() => {
            expect(result.current.isError).toBe(true);
          });

          // Get the rolled-back venue state
          const rolledBackVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Property 1: Active check-in count should be restored exactly
          expect(rolledBackVenue?.stats?.active_checkins).toBe(initialActiveCheckins);

          // Property 2: Recent check-in count should be restored exactly
          expect(rolledBackVenue?.stats?.recent_checkins).toBe(initialRecentCheckins);

          // Property 3: User checked-in state should be restored exactly
          expect(rolledBackVenue?.stats?.user_is_checked_in).toBe(initialCheckedIn);

          // Property 4: User check-in ID should be restored exactly
          expect(rolledBackVenue?.stats?.user_checkin_id).toBe(
            initialCheckedIn ? 'existing-checkin-id' : undefined
          );

          // Property 5: User check-in time should be restored exactly
          expect(rolledBackVenue?.stats?.user_checkin_time).toBe(
            initialCheckedIn ? '2024-01-01T10:00:00Z' : undefined
          );

          // Property 6: The entire venue object should match the initial snapshot
          expect(JSON.stringify(rolledBackVenue)).toBe(JSON.stringify(initialSnapshot));

          // Property 7: Error should be captured in mutation state
          expect(result.current.error?.message).toBe(errorMessage);

          return true;
        }
      ),
      { numRuns: 100, timeout: 30000 } // 100 iterations with timeout
    );
  }, 35000); // Jest timeout for this test

  /**
   * Property: Rollback should work even when venue has no stats initially
   * 
   * This verifies that rollback handles edge cases where the venue
   * might not have stats populated initially.
   */
  it('should handle rollback when venue has undefined or null stats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.constantFrom(undefined, null, {}), // Edge case stats values
        async (venueId, userId, initialStats) => {
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: 'Test Venue',
            category: 'restaurant',
            location: 'Test Location',
            rating: 4.5,
            review_count: 100,
            description: 'Test description',
            address: '123 Test St',
            phone: '555-0000',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$$',
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: 4.5,
            image_url: 'https://test.com/image.jpg',
            wait_times: null,
            popular_items: null,
            atmosphere_tags: null,
            parking_info: null,
            max_capacity: null,
            stats: initialStats as any,
          };

          mockCheckInService.checkIn.mockRejectedValue(new Error('Test error'));

          const { queryClient, wrapper } = createWrapper(mockVenue);

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Capture initial state
          const initialVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Execute mutation (which will fail)
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Wait for mutation to fail
          await waitFor(() => {
            expect(result.current.isError).toBe(true);
          });

          // Get the rolled-back venue state
          const rolledBackVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Property: The stats should be restored to initial state (undefined, null, or {})
          expect(rolledBackVenue?.stats).toEqual(initialVenue?.stats);

          return true;
        }
      ),
      { numRuns: 30, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Rollback should preserve all non-stats venue properties
   * 
   * This verifies that the rollback doesn't accidentally modify
   * other venue properties during the restoration process.
   */
  it('should preserve all non-stats properties during rollback', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('restaurant', 'bar', 'cafe', 'club'),
        fc.float({ min: 0, max: 5, noNaN: true }),
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 100 }),
        async (venueId, userId, venueName, category, rating, reviewCount, initialCheckins) => {
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: venueName,
            category,
            location: 'Test Location',
            rating,
            review_count: reviewCount,
            description: 'Test description',
            address: '123 Test St',
            phone: '555-0000',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$$',
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: rating,
            image_url: 'https://test.com/image.jpg',
            wait_times: null,
            popular_items: null,
            atmosphere_tags: null,
            parking_info: null,
            max_capacity: null,
            stats: {
              active_checkins: initialCheckins,
              recent_checkins: initialCheckins,
              user_is_checked_in: false,
            },
          };

          mockCheckInService.checkIn.mockRejectedValue(new Error('Test error'));

          const { queryClient, wrapper } = createWrapper(mockVenue);

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Execute mutation (which will fail)
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Wait for mutation to fail
          await waitFor(() => {
            expect(result.current.isError).toBe(true);
          });

          const rolledBackVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Property: All non-stats properties should remain unchanged after rollback
          expect(rolledBackVenue?.id).toBe(venueId);
          expect(rolledBackVenue?.name).toBe(venueName);
          expect(rolledBackVenue?.category).toBe(category);
          expect(rolledBackVenue?.rating).toBe(rating);
          expect(rolledBackVenue?.review_count).toBe(reviewCount);
          expect(rolledBackVenue?.address).toBe(mockVenue.address);
          expect(rolledBackVenue?.latitude).toBe(mockVenue.latitude);
          expect(rolledBackVenue?.longitude).toBe(mockVenue.longitude);

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Multiple failed mutations should not corrupt state
   * 
   * This verifies that if multiple mutations fail in sequence,
   * each rollback correctly restores the state without accumulating errors.
   */
  it('should handle multiple consecutive failed mutations correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 2, max: 5 }), // Number of failed mutations to attempt
        async (venueId, userId, initialCount, numAttempts) => {
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: 'Test Venue',
            category: 'restaurant',
            location: 'Test Location',
            rating: 4.5,
            review_count: 100,
            description: 'Test description',
            address: '123 Test St',
            phone: '555-0000',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$$',
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: 4.5,
            image_url: 'https://test.com/image.jpg',
            wait_times: null,
            popular_items: null,
            atmosphere_tags: null,
            parking_info: null,
            max_capacity: null,
            stats: {
              active_checkins: initialCount,
              recent_checkins: initialCount,
              user_is_checked_in: false,
            },
          };

          mockCheckInService.checkIn.mockRejectedValue(new Error('Test error'));

          const { queryClient, wrapper } = createWrapper(mockVenue);

          // Attempt multiple failed mutations
          for (let i = 0; i < numAttempts; i++) {
            const { result } = renderHook(() => useCheckInMutation(), {
              wrapper,
            });

            // Execute mutation (which will fail)
            act(() => {
              result.current.mutate({
                venueId,
                userId,
              });
            });

            // Wait for mutation to fail
            await waitFor(() => {
              expect(result.current.isError).toBe(true);
            });

            // After each failed mutation, state should be restored
            const currentVenue = queryClient.getQueryData<VenueWithStats>(
              queryKeys.venues.detail(venueId)
            );

            // Property: State should always be restored to initial values
            expect(currentVenue?.stats?.active_checkins).toBe(initialCount);
            expect(currentVenue?.stats?.recent_checkins).toBe(initialCount);
            expect(currentVenue?.stats?.user_is_checked_in).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 30, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Rollback should work with different error types
   * 
   * This verifies that rollback works correctly regardless of
   * the type of error that caused the mutation to fail.
   */
  it('should rollback correctly for different error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 0, max: 100 }),
        fc.oneof(
          fc.record({ type: fc.constant('Error'), message: fc.string() }),
          fc.record({ type: fc.constant('TypeError'), message: fc.string() }),
          fc.record({ type: fc.constant('NetworkError'), message: fc.string() }),
          fc.record({ 
            type: fc.constant('HTTPError'), 
            message: fc.string(),
            status: fc.constantFrom(400, 401, 403, 404, 500, 503)
          })
        ),
        async (venueId, userId, initialCount, errorConfig) => {
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: 'Test Venue',
            category: 'restaurant',
            location: 'Test Location',
            rating: 4.5,
            review_count: 100,
            description: 'Test description',
            address: '123 Test St',
            phone: '555-0000',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$$',
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: 4.5,
            image_url: 'https://test.com/image.jpg',
            wait_times: null,
            popular_items: null,
            atmosphere_tags: null,
            parking_info: null,
            max_capacity: null,
            stats: {
              active_checkins: initialCount,
              recent_checkins: initialCount,
              user_is_checked_in: false,
            },
          };

          // Create error based on type
          let error: Error;
          if (errorConfig.type === 'TypeError') {
            error = new TypeError(errorConfig.message);
          } else {
            error = new Error(errorConfig.message);
            if ('status' in errorConfig) {
              (error as any).status = errorConfig.status;
            }
          }

          mockCheckInService.checkIn.mockRejectedValue(error);

          const { queryClient, wrapper } = createWrapper(mockVenue);

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Execute mutation (which will fail)
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Wait for mutation to fail
          await waitFor(() => {
            expect(result.current.isError).toBe(true);
          });

          const rolledBackVenue = queryClient.getQueryData<VenueWithStats>(
            queryKeys.venues.detail(venueId)
          );

          // Property: Rollback should work regardless of error type
          expect(rolledBackVenue?.stats?.active_checkins).toBe(initialCount);
          expect(rolledBackVenue?.stats?.recent_checkins).toBe(initialCount);
          expect(rolledBackVenue?.stats?.user_is_checked_in).toBe(false);

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);
});

/**
 * Property-Based Tests for Mutation Invalidation
 * 
 * Feature: react-query-integration
 * Property 6: Check-in mutation invalidation
 * 
 * **Validates: Requirements 3.2**
 * 
 * Tests verify that correct queries are invalidated after successful check-in
 * using property-based testing with fast-check.
 */
describe('Feature: react-query-integration, Property 6: Check-in mutation invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 3.2**
   * 
   * Property: For any successful check-in mutation, the system SHALL invalidate
   * queries with keys ["venues"], ["venue", venueId], ["check-ins", "user", userId],
   * and ["check-ins", "venue", venueId].
   * 
   * This property verifies that:
   * 1. Venue detail query is invalidated
   * 2. Venue list queries are invalidated
   * 3. User's check-in queries are invalidated
   * 4. Venue's check-in queries are invalidated
   * 5. Invalidation happens for any venue/user combination
   * 6. Only the correct queries are invalidated (selective invalidation)
   */
  it('should invalidate correct queries after successful check-in for any venue/user', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random venue IDs
        fc.uuid(),
        fc.uuid(),
        // Generate random initial check-in counts
        fc.integer({ min: 0, max: 1000 }),
        async (venueId, userId, initialCheckins) => {
          // Create mock venue
          const mockVenue: VenueWithStats = {
            id: venueId,
            name: 'Test Venue',
            category: 'restaurant',
            location: 'Test Location',
            rating: 4.5,
            review_count: 100,
            description: 'Test description',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip_code: '12345',
            country: 'USA',
            phone: '555-0000',
            email: 'test@venue.com',
            website: 'https://test.com',
            hours: {},
            amenities: [],
            price_range: '$$',
            cuisine_type: 'Test',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            aggregate_rating: 4.5,
            image_url: 'https://test.com/image.jpg',
            latitude: 40.7128,
            longitude: -74.0060,
            is_active: true,
            is_featured: false,
            tags: [],
            stats: {
              active_checkins: initialCheckins,
              recent_checkins: initialCheckins,
              user_is_checked_in: false,
            },
          };

          // Mock successful check-in
          const mockCheckIn: CheckIn = {
            id: 'checkin-123',
            venue_id: venueId,
            user_id: userId,
            checked_in_at: new Date().toISOString(),
            checked_out_at: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

          const { queryClient, wrapper } = createWrapper(mockVenue);

          // Pre-populate cache with various queries to test selective invalidation
          // These should be invalidated
          queryClient.setQueryData(queryKeys.venues.detail(venueId), mockVenue);
          queryClient.setQueryData(queryKeys.venues.lists(), [mockVenue]);
          queryClient.setQueryData(queryKeys.checkIns.byUser(userId), []);
          queryClient.setQueryData(queryKeys.checkIns.byVenue(venueId), []);

          // These should NOT be invalidated (different venue/user)
          const otherVenueId = 'other-venue-id';
          const otherUserId = 'other-user-id';
          queryClient.setQueryData(queryKeys.venues.detail(otherVenueId), { ...mockVenue, id: otherVenueId });
          queryClient.setQueryData(queryKeys.checkIns.byUser(otherUserId), []);
          queryClient.setQueryData(queryKeys.checkIns.byVenue(otherVenueId), []);

          // Track which queries get invalidated
          const invalidatedQueries: string[] = [];
          
          // Spy on invalidateQueries to track what gets invalidated
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters: any) => {
            // Track the query key pattern that was invalidated
            if (filters?.queryKey) {
              invalidatedQueries.push(JSON.stringify(filters.queryKey));
            }
            return originalInvalidate(filters);
          });

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Wait for mutation to succeed
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: Venue detail query should be invalidated
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.detail(venueId))
          );

          // Property 2: Venue list queries should be invalidated
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.lists())
          );

          // Property 3: User's check-in queries should be invalidated
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.checkIns.byUser(userId))
          );

          // Property 4: Venue's check-in queries should be invalidated
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.checkIns.byVenue(venueId))
          );

          // Property 5: Exactly 4 query patterns should be invalidated
          expect(invalidatedQueries).toHaveLength(4);

          // Property 6: Other venue's queries should NOT be invalidated
          expect(invalidatedQueries).not.toContainEqual(
            JSON.stringify(queryKeys.venues.detail(otherVenueId))
          );

          // Property 7: Other user's queries should NOT be invalidated
          expect(invalidatedQueries).not.toContainEqual(
            JSON.stringify(queryKeys.checkIns.byUser(otherUserId))
          );

          // Property 8: Other venue's check-in queries should NOT be invalidated
          expect(invalidatedQueries).not.toContainEqual(
            JSON.stringify(queryKeys.checkIns.byVenue(otherVenueId))
          );

          return true;
        }
      ),
      { numRuns: 100, timeout: 30000 } // 100 iterations with timeout
    );
  }, 35000); // Jest timeout for this test

  /**
   * Property: Invalidation should happen even with minimal venue data
   * 
   * This verifies that invalidation works correctly even when the venue
   * has minimal or missing data fields.
   */
  it('should invalidate queries even with minimal venue data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (venueId, userId) => {
          // Create minimal mock venue (only required fields)
          const mockVenue: Partial<VenueWithStats> = {
            id: venueId,
            name: 'Test Venue',
          };

          const mockCheckIn: CheckIn = {
            id: 'checkin-123',
            venue_id: venueId,
            user_id: userId,
            checked_in_at: new Date().toISOString(),
            checked_out_at: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

          const { queryClient, wrapper } = createWrapper(mockVenue as VenueWithStats);

          // Track invalidations
          const invalidatedQueries: string[] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters: any) => {
            if (filters?.queryKey) {
              invalidatedQueries.push(JSON.stringify(filters.queryKey));
            }
            return originalInvalidate(filters);
          });

          const { result } = renderHook(() => useCheckInMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              venueId,
              userId,
            });
          });

          // Wait for mutation to succeed
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property: All 4 query patterns should still be invalidated
          expect(invalidatedQueries).toHaveLength(4);
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.detail(venueId))
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.lists())
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.checkIns.byUser(userId))
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.checkIns.byVenue(venueId))
          );

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Invalidation should be idempotent
   * 
   * This verifies that multiple successful check-ins trigger the same
   * invalidation pattern each time.
   */
  it('should invalidate same queries for multiple successful check-ins', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 2, max: 3 }), // Number of check-ins to perform (reduced to avoid timeout)
        async (venueId, userId, numCheckIns) => {
          // Perform multiple check-ins and verify consistent invalidation
          for (let i = 0; i < numCheckIns; i++) {
            const mockVenue: VenueWithStats = {
              id: venueId,
              name: 'Test Venue',
              category: 'restaurant',
              location: 'Test Location',
              rating: 4.5,
              review_count: 100,
              description: 'Test description',
              address: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zip_code: '12345',
              country: 'USA',
              phone: '555-0000',
              email: 'test@venue.com',
              website: 'https://test.com',
              hours: {},
              amenities: [],
              price_range: '$$',
              cuisine_type: 'Test',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              aggregate_rating: 4.5,
              image_url: 'https://test.com/image.jpg',
              latitude: 40.7128,
              longitude: -74.0060,
              is_active: true,
              is_featured: false,
              tags: [],
              stats: {
                active_checkins: i,
                recent_checkins: i,
                user_is_checked_in: false,
              },
            };

            const mockCheckIn: CheckIn = {
              id: `checkin-${i}`,
              venue_id: venueId,
              user_id: userId,
              checked_in_at: new Date().toISOString(),
              checked_out_at: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

            // Create fresh query client for each iteration
            const { queryClient, wrapper } = createWrapper(mockVenue);

            const invalidatedQueries: string[] = [];
            const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
            const spy = jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters: any) => {
              if (filters?.queryKey) {
                invalidatedQueries.push(JSON.stringify(filters.queryKey));
              }
              return originalInvalidate(filters);
            });

            const { result } = renderHook(() => useCheckInMutation(), {
              wrapper,
            });

            // Execute mutation
            act(() => {
              result.current.mutate({
                venueId,
                userId,
              });
            });

            // Wait for mutation to succeed
            await waitFor(() => {
              expect(result.current.isSuccess).toBe(true);
            }, { timeout: 3000 });

            // Property: Each check-in should invalidate the same 4 query patterns
            expect(invalidatedQueries).toHaveLength(4);
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.venues.detail(venueId))
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.venues.lists())
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.checkIns.byUser(userId))
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.checkIns.byVenue(venueId))
            );

            // Restore spy
            spy.mockRestore();
          }

          return true;
        }
      ),
      { numRuns: 20, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Invalidation should work with different venue/user combinations
   * 
   * This verifies that the invalidation logic correctly uses the specific
   * venueId and userId from the mutation, not hardcoded values.
   */
  it('should invalidate queries with correct IDs for different venue/user combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple venue/user pairs
        fc.array(
          fc.record({
            venueId: fc.uuid(),
            userId: fc.uuid(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (pairs) => {
          // For each pair, verify correct invalidation
          for (const { venueId, userId } of pairs) {
            const mockVenue: VenueWithStats = {
              id: venueId,
              name: 'Test Venue',
              category: 'restaurant',
              location: 'Test Location',
              rating: 4.5,
              review_count: 100,
              description: 'Test description',
              address: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zip_code: '12345',
              country: 'USA',
              phone: '555-0000',
              email: 'test@venue.com',
              website: 'https://test.com',
              hours: {},
              amenities: [],
              price_range: '$$',
              cuisine_type: 'Test',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              aggregate_rating: 4.5,
              image_url: 'https://test.com/image.jpg',
              latitude: 40.7128,
              longitude: -74.0060,
              is_active: true,
              is_featured: false,
              tags: [],
              stats: {
                active_checkins: 0,
                recent_checkins: 0,
                user_is_checked_in: false,
              },
            };

            const mockCheckIn: CheckIn = {
              id: `checkin-${venueId}-${userId}`,
              venue_id: venueId,
              user_id: userId,
              checked_in_at: new Date().toISOString(),
              checked_out_at: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

            const { queryClient, wrapper } = createWrapper(mockVenue);

            const invalidatedQueries: string[] = [];
            const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
            jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters: any) => {
              if (filters?.queryKey) {
                invalidatedQueries.push(JSON.stringify(filters.queryKey));
              }
              return originalInvalidate(filters);
            });

            const { result } = renderHook(() => useCheckInMutation(), {
              wrapper,
            });

            // Execute mutation
            act(() => {
              result.current.mutate({
                venueId,
                userId,
              });
            });

            // Wait for mutation to succeed
            await waitFor(() => {
              expect(result.current.isSuccess).toBe(true);
            });

            // Property: Invalidated queries should use the correct venueId and userId
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.venues.detail(venueId))
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.checkIns.byUser(userId))
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.checkIns.byVenue(venueId))
            );

            // Verify no other venue/user IDs are invalidated
            for (const otherPair of pairs) {
              if (otherPair.venueId !== venueId) {
                expect(invalidatedQueries).not.toContainEqual(
                  JSON.stringify(queryKeys.venues.detail(otherPair.venueId))
                );
                expect(invalidatedQueries).not.toContainEqual(
                  JSON.stringify(queryKeys.checkIns.byVenue(otherPair.venueId))
                );
              }
              if (otherPair.userId !== userId) {
                expect(invalidatedQueries).not.toContainEqual(
                  JSON.stringify(queryKeys.checkIns.byUser(otherPair.userId))
                );
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 30, timeout: 30000 }
    );
  }, 35000);
});
