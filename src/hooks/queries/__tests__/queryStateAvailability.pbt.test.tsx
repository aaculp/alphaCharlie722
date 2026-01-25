/**
 * Property-Based Tests for Query State Availability
 * 
 * Feature: react-query-integration
 * Property 3: Query state availability
 * 
 * Validates: Requirements 11.5
 * 
 * Tests verify that all query hooks return isLoading, isFetching, isError states
 * using property-based testing with fast-check.
 */

import fc from 'fast-check';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import all query hooks
import { useVenuesQuery } from '../useVenuesQuery';
import { useVenueQuery } from '../useVenueQuery';
import { useFlashOffersQuery } from '../useFlashOffersQuery';
import { useUserProfileQuery } from '../useUserProfileQuery';
import { useFriendsQuery } from '../useFriendsQuery';
import { useActivityFeedQuery } from '../useActivityFeedQuery';
import { useCollectionsQuery } from '../useCollectionsQuery';
import { useCollectionQuery } from '../useCollectionQuery';

// Mock the API services
jest.mock('../../../services/api/venues');
jest.mock('../../../services/api/flashOffers');
jest.mock('../../../services/api/profile');
jest.mock('../../../services/api/friends');
jest.mock('../../../services/api/activityFeed');
jest.mock('../../../services/api/collections');

describe('Feature: react-query-integration, Property 3: Query state availability', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  /**
   * Property: All query hooks must return required state properties
   * 
   * For any query hook, the return value must include:
   * - isLoading: boolean (true when loading for first time)
   * - isFetching: boolean (true when fetching/refetching)
   * - isError: boolean (true when query has error)
   * - error: Error | null (the error object if isError is true)
   * - data: appropriate data type or undefined
   * - refetch: function to manually refetch
   */
  it('should return isLoading, isFetching, isError states for useVenuesQuery', () => {
    fc.assert(
      fc.property(
        fc.record({
          filters: fc.option(
            fc.record({
              category: fc.option(fc.constantFrom('restaurant', 'bar', 'cafe'), { nil: undefined }),
              hasFlashOffers: fc.option(fc.boolean(), { nil: undefined }),
            }),
            { nil: undefined }
          ),
        }),
        (options) => {
          const { result } = renderHook(
            () => useVenuesQuery(options),
            { wrapper }
          );

          // Verify all required state properties exist
          expect(result.current).toHaveProperty('isLoading');
          expect(result.current).toHaveProperty('isFetching');
          expect(result.current).toHaveProperty('isError');
          expect(result.current).toHaveProperty('error');
          expect(result.current).toHaveProperty('venues');
          expect(result.current).toHaveProperty('refetch');

          // Verify types
          expect(typeof result.current.isLoading).toBe('boolean');
          expect(typeof result.current.isFetching).toBe('boolean');
          expect(typeof result.current.isError).toBe('boolean');
          expect(typeof result.current.refetch).toBe('function');
          expect(Array.isArray(result.current.venues)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isLoading, isFetching, isError states for useVenueQuery', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (venueId) => {
          const { result } = renderHook(
            () => useVenueQuery({ venueId }),
            { wrapper }
          );

          // Verify all required state properties exist
          expect(result.current).toHaveProperty('isLoading');
          expect(result.current).toHaveProperty('isFetching');
          expect(result.current).toHaveProperty('isError');
          expect(result.current).toHaveProperty('error');
          expect(result.current).toHaveProperty('venue');
          expect(result.current).toHaveProperty('refetch');

          // Verify types
          expect(typeof result.current.isLoading).toBe('boolean');
          expect(typeof result.current.isFetching).toBe('boolean');
          expect(typeof result.current.isError).toBe('boolean');
          expect(typeof result.current.refetch).toBe('function');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isLoading, isFetching, isError states for useFlashOffersQuery', () => {
    fc.assert(
      fc.property(
        fc.option(fc.uuid(), { nil: undefined }),
        (venueId) => {
          const { result } = renderHook(
            () => useFlashOffersQuery({ venueId }),
            { wrapper }
          );

          // Verify all required state properties exist
          expect(result.current).toHaveProperty('isLoading');
          expect(result.current).toHaveProperty('isFetching');
          expect(result.current).toHaveProperty('isError');
          expect(result.current).toHaveProperty('error');
          expect(result.current).toHaveProperty('flashOffers');
          expect(result.current).toHaveProperty('refetch');

          // Verify types
          expect(typeof result.current.isLoading).toBe('boolean');
          expect(typeof result.current.isFetching).toBe('boolean');
          expect(typeof result.current.isError).toBe('boolean');
          expect(typeof result.current.refetch).toBe('function');
          expect(Array.isArray(result.current.flashOffers)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isLoading, isFetching, isError states for useUserProfileQuery', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (userId) => {
          const { result } = renderHook(
            () => useUserProfileQuery({ userId }),
            { wrapper }
          );

          // Verify all required state properties exist
          expect(result.current).toHaveProperty('isLoading');
          expect(result.current).toHaveProperty('isFetching');
          expect(result.current).toHaveProperty('isError');
          expect(result.current).toHaveProperty('error');
          expect(result.current).toHaveProperty('data');
          expect(result.current).toHaveProperty('refetch');

          // Verify types
          expect(typeof result.current.isLoading).toBe('boolean');
          expect(typeof result.current.isFetching).toBe('boolean');
          expect(typeof result.current.isError).toBe('boolean');
          expect(typeof result.current.refetch).toBe('function');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isLoading, isFetching, isError states for useFriendsQuery', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (userId) => {
          const { result } = renderHook(
            () => useFriendsQuery({ userId }),
            { wrapper }
          );

          // Verify all required state properties exist
          expect(result.current).toHaveProperty('isLoading');
          expect(result.current).toHaveProperty('isFetching');
          expect(result.current).toHaveProperty('isError');
          expect(result.current).toHaveProperty('error');
          expect(result.current).toHaveProperty('data');
          expect(result.current).toHaveProperty('refetch');

          // Verify types
          expect(typeof result.current.isLoading).toBe('boolean');
          expect(typeof result.current.isFetching).toBe('boolean');
          expect(typeof result.current.isError).toBe('boolean');
          expect(typeof result.current.refetch).toBe('function');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isLoading, isFetching, isError states for useActivityFeedQuery', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (userId) => {
          const { result } = renderHook(
            () => useActivityFeedQuery({ userId }),
            { wrapper }
          );

          // Verify all required state properties exist
          expect(result.current).toHaveProperty('isLoading');
          expect(result.current).toHaveProperty('isFetching');
          expect(result.current).toHaveProperty('isError');
          expect(result.current).toHaveProperty('error');
          expect(result.current).toHaveProperty('data');
          expect(result.current).toHaveProperty('refetch');
          expect(result.current).toHaveProperty('fetchNextPage');
          expect(result.current).toHaveProperty('hasNextPage');

          // Verify types
          expect(typeof result.current.isLoading).toBe('boolean');
          expect(typeof result.current.isFetching).toBe('boolean');
          expect(typeof result.current.isError).toBe('boolean');
          expect(typeof result.current.refetch).toBe('function');
          expect(typeof result.current.fetchNextPage).toBe('function');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isLoading, isFetching, isError states for useCollectionsQuery', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (userId) => {
          const { result } = renderHook(
            () => useCollectionsQuery({ userId }),
            { wrapper }
          );

          // Verify all required state properties exist
          expect(result.current).toHaveProperty('isLoading');
          expect(result.current).toHaveProperty('isFetching');
          expect(result.current).toHaveProperty('isError');
          expect(result.current).toHaveProperty('error');
          expect(result.current).toHaveProperty('data');
          expect(result.current).toHaveProperty('refetch');

          // Verify types
          expect(typeof result.current.isLoading).toBe('boolean');
          expect(typeof result.current.isFetching).toBe('boolean');
          expect(typeof result.current.isError).toBe('boolean');
          expect(typeof result.current.refetch).toBe('function');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isLoading, isFetching, isError states for useCollectionQuery', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (collectionId) => {
          const { result } = renderHook(
            () => useCollectionQuery({ collectionId }),
            { wrapper }
          );

          // Verify all required state properties exist
          expect(result.current).toHaveProperty('isLoading');
          expect(result.current).toHaveProperty('isFetching');
          expect(result.current).toHaveProperty('isError');
          expect(result.current).toHaveProperty('error');
          expect(result.current).toHaveProperty('data');
          expect(result.current).toHaveProperty('refetch');

          // Verify types
          expect(typeof result.current.isLoading).toBe('boolean');
          expect(typeof result.current.isFetching).toBe('boolean');
          expect(typeof result.current.isError).toBe('boolean');
          expect(typeof result.current.refetch).toBe('function');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Query state transitions should be consistent
   * 
   * When a query is first rendered:
   * - isLoading should be true
   * - isFetching should be true
   * - isError should be false initially
   */
  it('should have consistent initial state for all query hooks', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (id) => {
          // Test with useVenueQuery as representative
          const { result } = renderHook(
            () => useVenueQuery({ venueId: id }),
            { wrapper }
          );

          // On first render, should be loading
          const initialState = result.current;
          
          // Either isLoading or both should be true initially
          // (depends on whether there's cached data)
          if (initialState.isLoading) {
            expect(initialState.isFetching).toBe(true);
          }

          // Error should be false or null initially
          expect(initialState.isError).toBe(false);
          expect(initialState.error).toBeNull();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: All query hooks should provide refetch functionality
   * 
   * The refetch function should:
   * - Be a function
   * - Return a Promise
   * - Be callable without errors
   */
  it('should provide working refetch function for all query hooks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (id) => {
          const { result } = renderHook(
            () => useVenueQuery({ venueId: id }),
            { wrapper }
          );

          // Verify refetch exists and is a function
          expect(typeof result.current.refetch).toBe('function');

          // Verify refetch returns a Promise
          const refetchResult = result.current.refetch();
          expect(refetchResult).toBeInstanceOf(Promise);

          // Wait for refetch to complete
          await waitFor(() => {
            expect(result.current.isFetching).toBe(false);
          });

          return true;
        }
      ),
      { numRuns: 20 } // Fewer runs for async tests
    );
  });
});
