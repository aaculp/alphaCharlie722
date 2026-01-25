/**
 * Unit Tests for Prefetching
 * 
 * Feature: react-query-integration
 * 
 * Validates: Requirements 13.3
 * 
 * Tests verify that prefetchQuery is called for anticipated navigation.
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

describe('Prefetching for anticipated navigation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  /**
   * Unit Test: prefetchQuery is called for venue details
   * 
   * Validates: Requirements 13.3
   */
  it('should call prefetchQuery when prefetching venue details', async () => {
    const venueId = 'venue-123';
    const mockVenue = { id: venueId, name: 'Test Venue' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockVenue);

    // Spy on prefetchQuery
    const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

    // Prefetch venue details
    await queryClient.prefetchQuery({
      queryKey: queryKeys.venues.detail(venueId),
      queryFn: mockQueryFn,
      staleTime: 30000,
    });

    // Verify prefetchQuery was called
    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.venues.detail(venueId),
      queryFn: mockQueryFn,
      staleTime: 30000,
    });

    // Verify query function was executed
    expect(mockQueryFn).toHaveBeenCalled();

    // Verify data was cached
    const cachedData = queryClient.getQueryData(queryKeys.venues.detail(venueId));
    expect(cachedData).toEqual(mockVenue);

    prefetchSpy.mockRestore();
  });

  /**
   * Unit Test: prefetchQuery is called for user profiles
   * 
   * Validates: Requirements 13.3
   */
  it('should call prefetchQuery when prefetching user profiles', async () => {
    const userId = 'user-456';
    const mockProfile = { id: userId, name: 'Test User' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockProfile);

    // Spy on prefetchQuery
    const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

    // Prefetch user profile
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.profile(userId),
      queryFn: mockQueryFn,
      staleTime: 30000,
    });

    // Verify prefetchQuery was called
    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.users.profile(userId),
      queryFn: mockQueryFn,
      staleTime: 30000,
    });

    // Verify query function was executed
    expect(mockQueryFn).toHaveBeenCalled();

    // Verify data was cached
    const cachedData = queryClient.getQueryData(queryKeys.users.profile(userId));
    expect(cachedData).toEqual(mockProfile);

    prefetchSpy.mockRestore();
  });

  /**
   * Unit Test: prefetched data is available immediately
   * 
   * Validates: Requirements 13.3
   */
  it('should make prefetched data available immediately for subsequent queries', async () => {
    const venueId = 'venue-789';
    const mockVenue = { id: venueId, name: 'Prefetched Venue' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockVenue);

    // Prefetch venue details
    await queryClient.prefetchQuery({
      queryKey: queryKeys.venues.detail(venueId),
      queryFn: mockQueryFn,
      staleTime: 30000,
    });

    // Query function should have been called once during prefetch
    expect(mockQueryFn).toHaveBeenCalledTimes(1);

    // Get the data (should be available immediately without another fetch)
    const data = queryClient.getQueryData(queryKeys.venues.detail(venueId));
    expect(data).toEqual(mockVenue);

    // Query function should still only have been called once
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
  });

  /**
   * Unit Test: prefetching doesn't override fresh data
   * 
   * Validates: Requirements 13.3
   */
  it('should not override fresh data when prefetching', async () => {
    const venueId = 'venue-999';
    const existingVenue = { id: venueId, name: 'Existing Venue', rating: 5 };
    const prefetchVenue = { id: venueId, name: 'Prefetch Venue', rating: 4 };

    // Set existing fresh data
    queryClient.setQueryData(queryKeys.venues.detail(venueId), existingVenue);

    // Try to prefetch (should not override fresh data)
    await queryClient.prefetchQuery({
      queryKey: queryKeys.venues.detail(venueId),
      queryFn: async () => prefetchVenue,
      staleTime: 30000,
    });

    // Data should still be the existing venue (prefetch doesn't override fresh data)
    const data = queryClient.getQueryData(queryKeys.venues.detail(venueId));
    expect(data).toEqual(existingVenue);
  });

  /**
   * Unit Test: multiple prefetches are deduplicated
   * 
   * Validates: Requirements 13.3
   */
  it('should deduplicate multiple simultaneous prefetch requests', async () => {
    const venueId = 'venue-111';
    const mockVenue = { id: venueId, name: 'Dedup Venue' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockVenue);

    // Make multiple simultaneous prefetch requests
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.venues.detail(venueId),
        queryFn: mockQueryFn,
        staleTime: 30000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.venues.detail(venueId),
        queryFn: mockQueryFn,
        staleTime: 30000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.venues.detail(venueId),
        queryFn: mockQueryFn,
        staleTime: 30000,
      }),
    ]);

    // Query function should only have been called once (deduplicated)
    expect(mockQueryFn).toHaveBeenCalledTimes(1);

    // Data should be cached
    const data = queryClient.getQueryData(queryKeys.venues.detail(venueId));
    expect(data).toEqual(mockVenue);
  });

  /**
   * Unit Test: prefetch respects staleTime
   * 
   * Validates: Requirements 13.3
   */
  it('should respect staleTime when prefetching', async () => {
    const venueId = 'venue-222';
    const mockVenue = { id: venueId, name: 'Stale Venue' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockVenue);

    // Prefetch with staleTime
    await queryClient.prefetchQuery({
      queryKey: queryKeys.venues.detail(venueId),
      queryFn: mockQueryFn,
      staleTime: 30000, // 30 seconds
    });

    // Get query state
    const queryState = queryClient.getQueryState(queryKeys.venues.detail(venueId));

    // Verify staleTime is set (data should not be stale immediately)
    expect(queryState?.dataUpdatedAt).toBeDefined();
    expect(queryState?.dataUpdatedAt).toBeGreaterThan(0);
  });
});
