/**
 * Property-Based Tests for Request Deduplication
 * 
 * Feature: react-query-integration
 * Property 2: Request deduplication
 * 
 * Validates: Requirements 13.1
 * 
 * Tests verify that when multiple components request the same data simultaneously,
 * only one network request is made and the result is shared across all requesters.
 * This is a critical performance optimization that React Query provides automatically.
 */

import fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVenuesQuery } from '../useVenuesQuery';
import { useVenueQuery } from '../useVenueQuery';
import { VenueService } from '../../../services/api/venues';
import type { Venue } from '../../../types/venue.types';
import React from 'react';

// Mock the VenueService
jest.mock('../../../services/api/venues');

const mockVenueService = VenueService as jest.Mocked<typeof VenueService>;

// Sample venue data for testing
const createMockVenue = (id: string): Venue => ({
  id,
  name: `Test Venue ${id}`,
  category: 'restaurant',
  location: 'Test Location',
  rating: 4.5,
  review_count: 100,
  description: 'A test venue',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zip_code: '12345',
  country: 'USA',
  phone: '555-0000',
  email: 'test@venue.com',
  website: 'https://venue.com',
  hours: {},
  amenities: [],
  price_range: '$',
  cuisine_type: 'Test',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
} as Venue);

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        staleTime: 30000, // 30 seconds
        gcTime: 300000, // 5 minutes
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Feature: react-query-integration, Property 2: Request deduplication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property: Simultaneous requests for the same query key result in single network call
   * 
   * For any query key, when multiple components request the same data simultaneously,
   * React Query should:
   * 1. Make only one network request
   * 2. Share the result across all requesters
   * 3. Update all components with the same data
   */
  it(
    'should deduplicate simultaneous requests for the same venue list query',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of simultaneous requests (2-5 to keep tests fast)
          fc.integer({ min: 2, max: 5 }),
          // Generate optional filters
          fc.option(
            fc.record({
              category: fc.option(fc.constantFrom('restaurant', 'bar', 'cafe'), { nil: undefined }),
              limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
            }),
            { nil: undefined }
          ),
          async (numRequests, filters) => {
            // Clear mocks before each test
            jest.clearAllMocks();

            // Setup mock data
            const mockVenues = [createMockVenue('venue-1'), createMockVenue('venue-2')];
            mockVenueService.getVenues.mockResolvedValue(mockVenues);

            // Create a shared QueryClient for all hooks
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  staleTime: 30000,
                  gcTime: 300000,
                },
              },
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            );

            // Render multiple hooks simultaneously with the same filters
            const results = Array.from({ length: numRequests }, () =>
              renderHook(() => useVenuesQuery({ filters }), { wrapper })
            );

            // Wait for all queries to complete
            await Promise.all(
              results.map(({ result }) =>
                waitFor(
                  () => {
                    expect(result.current.isLoading).toBe(false);
                  },
                  { timeout: 2000 }
                )
              )
            );

            // Verify only one network request was made
            expect(mockVenueService.getVenues).toHaveBeenCalledTimes(1);

            // Verify all hooks received the same data
            results.forEach(({ result }) => {
              expect(result.current.venues).toEqual(mockVenues);
              expect(result.current.isError).toBe(false);
            });

            // Cleanup
            queryClient.clear();
          }
        ),
        { numRuns: 50 } // Reduced from 100 to keep tests faster
      );
    },
    30000 // 30 second timeout for property test
  );

  /**
   * Property: Simultaneous requests for the same venue detail query result in single network call
   * 
   * When multiple components request the same venue by ID simultaneously,
   * only one network request should be made.
   */
  it(
    'should deduplicate simultaneous requests for the same venue detail query',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of simultaneous requests (2-5)
          fc.integer({ min: 2, max: 5 }),
          // Generate a venue ID
          fc.uuid(),
          async (numRequests, venueId) => {
            // Clear mocks before each test
            jest.clearAllMocks();

            // Setup mock data
            const mockVenue = createMockVenue(venueId);
            mockVenueService.getVenueById.mockResolvedValue(mockVenue);

            // Create a shared QueryClient for all hooks
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  staleTime: 30000,
                  gcTime: 300000,
                },
              },
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            );

            // Render multiple hooks simultaneously with the same venue ID
            const results = Array.from({ length: numRequests }, () =>
              renderHook(() => useVenueQuery({ venueId }), { wrapper })
            );

            // Wait for all queries to complete
            await Promise.all(
              results.map(({ result }) =>
                waitFor(
                  () => {
                    expect(result.current.isLoading).toBe(false);
                  },
                  { timeout: 2000 }
                )
              )
            );

            // Verify only one network request was made
            expect(mockVenueService.getVenueById).toHaveBeenCalledTimes(1);
            expect(mockVenueService.getVenueById).toHaveBeenCalledWith(venueId);

            // Verify all hooks received the same data
            results.forEach(({ result }) => {
              expect(result.current.venue).toEqual(mockVenue);
              expect(result.current.isError).toBe(false);
            });

            // Cleanup
            queryClient.clear();
          }
        ),
        { numRuns: 50 }
      );
    },
    30000
  );

  /**
   * Property: Different query keys result in separate network calls
   * 
   * When components request different data (different query keys),
   * each unique query key should trigger its own network request.
   */
  it(
    'should NOT deduplicate requests with different query keys',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different venue IDs
          fc.tuple(fc.uuid(), fc.uuid()).filter(([id1, id2]) => id1 !== id2),
          async ([venueId1, venueId2]) => {
            // Clear mocks before each test
            jest.clearAllMocks();

            // Setup mock data for both venues
            const mockVenue1 = createMockVenue(venueId1);
            const mockVenue2 = createMockVenue(venueId2);
            
            mockVenueService.getVenueById.mockImplementation(async (id: string) => {
              if (id === venueId1) return mockVenue1;
              if (id === venueId2) return mockVenue2;
              throw new Error('Unexpected venue ID');
            });

            // Create a shared QueryClient
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  staleTime: 30000,
                  gcTime: 300000,
                },
              },
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            );

            // Render hooks with different venue IDs simultaneously
            const result1 = renderHook(() => useVenueQuery({ venueId: venueId1 }), { wrapper });
            const result2 = renderHook(() => useVenueQuery({ venueId: venueId2 }), { wrapper });

            // Wait for both queries to complete
            await waitFor(
              () => {
                expect(result1.result.current.isLoading).toBe(false);
              },
              { timeout: 2000 }
            );
            await waitFor(
              () => {
                expect(result2.result.current.isLoading).toBe(false);
              },
              { timeout: 2000 }
            );

            // Verify two separate network requests were made
            expect(mockVenueService.getVenueById).toHaveBeenCalledTimes(2);
            expect(mockVenueService.getVenueById).toHaveBeenCalledWith(venueId1);
            expect(mockVenueService.getVenueById).toHaveBeenCalledWith(venueId2);

            // Verify each hook received its own data
            expect(result1.result.current.venue).toEqual(mockVenue1);
            expect(result2.result.current.venue).toEqual(mockVenue2);

            // Cleanup
            queryClient.clear();
          }
        ),
        { numRuns: 50 }
      );
    },
    30000
  );

  /**
   * Property: Sequential requests use cached data without additional network calls
   * 
   * When a query is made, then another component requests the same data shortly after,
   * the second request should use cached data without making a new network call
   * (within the staleTime window).
   */
  it('should use cached data for sequential requests within staleTime', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a venue ID
        fc.uuid(),
        async (venueId) => {
          // Clear mocks before each test
          jest.clearAllMocks();

          // Setup mock data
          const mockVenue = createMockVenue(venueId);
          mockVenueService.getVenueById.mockResolvedValue(mockVenue);

          // Create a shared QueryClient
          const queryClient = new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
                staleTime: 30000,
                gcTime: 300000,
              },
            },
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          );

          // First request
          const result1 = renderHook(() => useVenueQuery({ venueId }), { wrapper });

          // Wait for first query to complete
          await waitFor(() => {
            expect(result1.result.current.isLoading).toBe(false);
          });

          // Verify first request made a network call
          expect(mockVenueService.getVenueById).toHaveBeenCalledTimes(1);

          // Clear the mock to track subsequent calls
          mockVenueService.getVenueById.mockClear();

          // Second request (should use cache)
          const result2 = renderHook(() => useVenueQuery({ venueId }), { wrapper });

          // Wait for second query to "complete" (should be instant from cache)
          await waitFor(() => {
            expect(result2.result.current.isLoading).toBe(false);
          });

          // Verify no additional network call was made (data served from cache)
          expect(mockVenueService.getVenueById).not.toHaveBeenCalled();

          // Verify both hooks have the same data
          expect(result1.result.current.venue).toEqual(mockVenue);
          expect(result2.result.current.venue).toEqual(mockVenue);

          // Cleanup
          queryClient.clear();
        }
      ),
      { numRuns: 50 }
    );
  },
  30000
);

  /**
   * Property: Deduplication works with different filter combinations
   * 
   * When multiple components request venue lists with the same filters,
   * only one network request should be made, regardless of filter complexity.
   */
  it(
    'should deduplicate requests with identical filter objects',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of simultaneous requests
          fc.integer({ min: 2, max: 5 }),
          // Generate complex filters
          fc.record({
            category: fc.constantFrom('restaurant', 'bar', 'cafe'),
            limit: fc.integer({ min: 1, max: 100 }),
            search: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
          }),
          async (numRequests, filters) => {
            // Clear mocks before each test
            jest.clearAllMocks();

            // Setup mock data
            const mockVenues = [createMockVenue('venue-1')];
            mockVenueService.getVenues.mockResolvedValue(mockVenues);

            // Create a shared QueryClient
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  staleTime: 30000,
                  gcTime: 300000,
                },
              },
            });

            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            );

            // Render multiple hooks with identical filter objects
            const results = Array.from({ length: numRequests }, () =>
              renderHook(() => useVenuesQuery({ filters }), { wrapper })
            );

            // Wait for all queries to complete
            await Promise.all(
              results.map(({ result }) =>
                waitFor(
                  () => {
                    expect(result.current.isLoading).toBe(false);
                  },
                  { timeout: 2000 }
                )
              )
            );

            // Verify only one network request was made
            expect(mockVenueService.getVenues).toHaveBeenCalledTimes(1);
            expect(mockVenueService.getVenues).toHaveBeenCalledWith(filters);

            // Verify all hooks received the same data
            results.forEach(({ result }) => {
              expect(result.current.venues).toEqual(mockVenues);
            });

            // Cleanup
            queryClient.clear();
          }
        ),
        { numRuns: 50 }
      );
    },
    30000
  );
});
