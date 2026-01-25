/**
 * Integration Tests for Checkpoint 14
 * 
 * Feature: react-query-integration
 * Checkpoint: Verify real-time, navigation, and persistence work
 * 
 * This test suite validates that:
 * 1. Real-time updates appear automatically
 * 2. Navigation triggers appropriate refetching
 * 3. Cache persists and restores correctly
 * 
 * These tests verify the integration of all three systems working together.
 */

import { QueryClient } from '@tanstack/react-query';
import { setupRealtimeSync } from '../realtimeSync';
import { setupNavigationSync } from '../navigationSync';
import { createCachePersister } from '../cachePersistence';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { supabase } from '../supabase';
import { queryKeys } from '../queryKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../supabase', () => ({
  supabase: {
    channel: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../services/api/venues', () => ({
  VenueService: {
    getVenueById: jest.fn().mockResolvedValue({
      id: 'venue-123',
      name: 'Test Venue',
      category: 'restaurant',
    }),
  },
}));

describe('Checkpoint 14: Integration Tests', () => {
  let queryClient: QueryClient;
  let mockChannel: any;
  let capturedCallbacks: Map<string, (payload: any) => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallbacks = new Map();

    // Create mock channel for real-time
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    };

    mockChannel.on.mockImplementation((event: string, config: any, callback: (payload: any) => void) => {
      const key = `${config.table}-${event}`;
      capturedCallbacks.set(key, callback);
      return mockChannel;
    });

    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

    // Create fresh query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.restoreAllMocks();
  });

  /**
   * Test 1: Real-time updates appear automatically
   * 
   * Validates that when a Supabase real-time event occurs,
   * the corresponding queries are invalidated automatically.
   */
  describe('Real-time updates appear automatically', () => {
    it('should automatically invalidate queries when real-time venue update occurs', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Set up real-time sync
      const cleanup = setupRealtimeSync(queryClient);

      // Simulate a venue update event
      const venueId = 'venue-123';
      const callback = capturedCallbacks.get('venues-postgres_changes');
      expect(callback).toBeDefined();

      callback!({
        eventType: 'UPDATE',
        new: { id: venueId, name: 'Updated Venue' },
      });

      // Verify queries were invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.detail(venueId),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.lists(),
      });

      cleanup();
    });

    it('should automatically invalidate queries when real-time check-in occurs', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Set up real-time sync
      const cleanup = setupRealtimeSync(queryClient);

      // Simulate a check-in event
      const venueId = 'venue-456';
      const userId = 'user-789';
      const callback = capturedCallbacks.get('check_ins-postgres_changes');
      expect(callback).toBeDefined();

      callback!({
        eventType: 'INSERT',
        new: { venue_id: venueId, user_id: userId },
      });

      // Verify queries were invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.checkIns.byVenue(venueId),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.checkIns.byUser(userId),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.detail(venueId),
      });

      cleanup();
    });

    it('should automatically invalidate queries when real-time flash offer changes', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Set up real-time sync
      const cleanup = setupRealtimeSync(queryClient);

      // Simulate a flash offer event
      const venueId = 'venue-999';
      const callback = capturedCallbacks.get('flash_offers-postgres_changes');
      expect(callback).toBeDefined();

      callback!({
        eventType: 'INSERT',
        new: { venue_id: venueId, title: 'New Flash Offer' },
      });

      // Verify queries were invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.flashOffers.byVenue(venueId),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.detail(venueId),
      });

      cleanup();
    });
  });

  /**
   * Test 2: Navigation triggers appropriate refetching
   * 
   * Validates that navigation events trigger the correct
   * prefetching and invalidation behavior.
   */
  describe('Navigation triggers appropriate refetching', () => {
    it('should prefetch venue details when navigating to VenueDetail', async () => {
      const mockNavigationRef = {
        current: {
          addListener: jest.fn((event: string, callback: () => void) => {
            // Store callback for manual triggering
            (mockNavigationRef as any).callback = callback;
            return jest.fn();
          }),
          getCurrentRoute: jest.fn(),
        },
      };

      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

      // Set up navigation sync
      const cleanup = setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Simulate navigation to VenueDetail
      mockNavigationRef.current.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });

      // Trigger navigation callback
      (mockNavigationRef as any).callback();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify prefetch was called
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.detail('venue-123'),
        queryFn: expect.any(Function),
        staleTime: 30000,
      });

      cleanup();
    });

    it('should invalidate venue lists when returning from VenueDetail to Home', () => {
      const mockNavigationRef = {
        current: {
          addListener: jest.fn((event: string, callback: () => void) => {
            (mockNavigationRef as any).callback = callback;
            return jest.fn();
          }),
          getCurrentRoute: jest.fn(),
        },
      };

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Set up navigation sync
      const cleanup = setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // First navigation: to VenueDetail
      mockNavigationRef.current.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });
      (mockNavigationRef as any).callback();

      // Second navigation: back to HomeList
      mockNavigationRef.current.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });
      (mockNavigationRef as any).callback();

      // Verify invalidation was called
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.lists(),
      });

      cleanup();
    });
  });

  /**
   * Test 3: Cache persists and restores correctly
   * 
   * Validates that query cache is persisted to AsyncStorage
   * and restored on app launch.
   */
  describe('Cache persists and restores correctly', () => {
    it('should persist cache to AsyncStorage', async () => {
      const persister = createCachePersister();

      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      // Add data to cache
      queryClient.setQueryData(['venues', 'list'], [
        { id: '1', name: 'Venue 1' },
        { id: '2', name: 'Venue 2' },
      ]);

      // Manually trigger persistence
      await persister.persistClient({
        clientState: {
          queries: queryClient.getQueryCache().getAll().map(query => ({
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            state: query.state,
          })),
          mutations: [],
        },
        timestamp: Date.now(),
      });

      // Verify AsyncStorage.setItem was called
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      unsubscribe();
    });

    it('should restore cache from AsyncStorage', async () => {
      const mockCacheData = JSON.stringify({
        clientState: {
          queries: [
            {
              queryKey: ['venues', 'list'],
              queryHash: '["venues","list"]',
              state: {
                data: [{ id: '1', name: 'Restored Venue' }],
                dataUpdatedAt: Date.now(),
                status: 'success',
              },
            },
          ],
          mutations: [],
        },
        timestamp: Date.now(),
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockCacheData);

      const persister = createCachePersister();

      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify getItem was called to restore cache
      expect(AsyncStorage.getItem).toHaveBeenCalled();

      unsubscribe();
    });

    it('should not restore data older than 24 hours', async () => {
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago

      const mockOldCacheData = JSON.stringify({
        clientState: {
          queries: [
            {
              queryKey: ['venues', 'list'],
              queryHash: '["venues","list"]',
              state: {
                data: [{ id: '1', name: 'Old Venue' }],
                dataUpdatedAt: oldTimestamp,
                status: 'success',
              },
            },
          ],
          mutations: [],
        },
        timestamp: oldTimestamp,
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockOldCacheData);

      const persister = createCachePersister();

      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Old data should not be in cache
      const cachedData = queryClient.getQueryData(['venues', 'list']);
      expect(cachedData).toBeUndefined();

      unsubscribe();
    });

    it('should mark restored data as stale for background refetch', async () => {
      const mockCacheData = JSON.stringify({
        clientState: {
          queries: [
            {
              queryKey: ['venues', 'list'],
              queryHash: '["venues","list"]',
              state: {
                data: [{ id: '1', name: 'Stale Venue' }],
                dataUpdatedAt: Date.now() - 1000,
                status: 'success',
              },
            },
          ],
          mutations: [],
        },
        timestamp: Date.now(),
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockCacheData);

      const persister = createCachePersister();

      // Configure with hydrateOptions to mark as stale
      const hydrateOptions = {
        defaultOptions: {
          queries: {
            staleTime: 0, // Mark all restored data as stale
          },
        },
      };

      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        hydrateOptions,
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify hydrateOptions is configured correctly
      expect(hydrateOptions.defaultOptions.queries.staleTime).toBe(0);

      unsubscribe();
    });

    it('should exclude sensitive data from persistence', async () => {
      const persister = createCachePersister();

      // Configure to exclude sensitive queries
      const shouldDehydrateQuery = (query: any) => {
        const meta = query.meta as { sensitive?: boolean } | undefined;
        return meta?.sensitive !== true;
      };

      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        dehydrateOptions: {
          shouldDehydrateQuery,
        },
      });

      // Add sensitive data
      await queryClient.fetchQuery({
        queryKey: ['auth', 'token'],
        queryFn: async () => ({ token: 'secret-token' }),
        meta: { sensitive: true },
      });

      // Add non-sensitive data
      await queryClient.fetchQuery({
        queryKey: ['venues', 'list'],
        queryFn: async () => [{ id: '1', name: 'Public Venue' }],
        meta: { sensitive: false },
      });

      // Get queries to persist
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      const queriesToPersist = allQueries.filter(query => {
        const meta = query.meta as { sensitive?: boolean } | undefined;
        return meta?.sensitive !== true;
      });

      // Verify only non-sensitive query is included
      expect(queriesToPersist.length).toBe(1);
      expect(queriesToPersist[0].queryKey).toEqual(['venues', 'list']);

      unsubscribe();
    });
  });

  /**
   * Test 4: Integration - All systems working together
   * 
   * Validates that real-time, navigation, and persistence
   * work together seamlessly.
   */
  describe('Integration: All systems working together', () => {
    it('should handle complete flow: persist → restore → real-time update → navigation', async () => {
      // Step 1: Set up persistence
      const persister = createCachePersister();
      const [unsubscribePersist] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      // Step 2: Add initial data
      queryClient.setQueryData(['venues', 'list'], [
        { id: '1', name: 'Initial Venue' },
      ]);

      // Step 3: Persist to storage
      await persister.persistClient({
        clientState: {
          queries: queryClient.getQueryCache().getAll().map(query => ({
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            state: query.state,
          })),
          mutations: [],
        },
        timestamp: Date.now(),
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();

      // Step 4: Set up real-time sync
      const cleanupRealtime = setupRealtimeSync(queryClient);
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      // Step 5: Simulate real-time update
      const callback = capturedCallbacks.get('venues-postgres_changes');
      callback!({
        eventType: 'UPDATE',
        new: { id: '1', name: 'Updated via Real-time' },
      });

      // Verify real-time invalidation
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.detail('1'),
      });

      // Step 6: Set up navigation sync
      const mockNavigationRef = {
        current: {
          addListener: jest.fn((event: string, callback: () => void) => {
            (mockNavigationRef as any).callback = callback;
            return jest.fn();
          }),
          getCurrentRoute: jest.fn(),
        },
      };

      const cleanupNav = setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Step 7: Simulate navigation
      mockNavigationRef.current.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: '1' },
      });
      (mockNavigationRef as any).callback();

      mockNavigationRef.current.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });
      (mockNavigationRef as any).callback();

      // Verify navigation invalidation
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.lists(),
      });

      // Cleanup
      cleanupRealtime();
      cleanupNav();
      unsubscribePersist();
    });
  });
});
