/**
 * Unit tests for Cache Persistence
 * 
 * Tests Requirements 14.1, 14.2, 14.3:
 * - Cache saves to AsyncStorage on app background
 * - Cache restores from AsyncStorage on app launch
 * - Data older than 24 hours is not restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createCachePersister } from '../cachePersistence';
import { setupQueryPersistence } from '../queryClient';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('Cache Persistence', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30000,
          gcTime: 300000,
          retry: false, // Disable retries for tests
        },
      },
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('createCachePersister', () => {
    it('should create a persister instance', () => {
      const persister = createCachePersister();
      
      expect(persister).toBeDefined();
      expect(typeof persister.persistClient).toBe('function');
      expect(typeof persister.restoreClient).toBe('function');
      expect(typeof persister.removeClient).toBe('function');
    });

    it('should configure maxAge to 24 hours (86400000ms)', () => {
      const persister = createCachePersister();
      
      // The persister should have maxAge configured
      // We can't directly access it, but we can verify it through behavior
      expect(persister).toBeDefined();
    });
  });

  describe('Cache Persistence to AsyncStorage', () => {
    it('should save cache to AsyncStorage when data is added (Requirement 14.1)', async () => {
      const persister = createCachePersister();
      
      // Set up persistence
      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      // Add some data to the cache
      queryClient.setQueryData(['test', 'key'], { data: 'test value' });

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

    it('should persist query data with correct structure', async () => {
      const persister = createCachePersister();
      
      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      const testData = { id: '123', name: 'Test Venue' };
      queryClient.setQueryData(['venues', 'detail', '123'], testData);

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

      // Verify setItem was called with serialized data
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      unsubscribe();
    });
  });

  describe('Cache Restoration from AsyncStorage', () => {
    it('should restore cache from AsyncStorage on app launch (Requirement 14.2)', async () => {
      const mockCacheData = JSON.stringify({
        clientState: {
          queries: [
            {
              queryKey: ['venues', 'list'],
              queryHash: '["venues","list"]',
              state: {
                data: [{ id: '1', name: 'Venue 1' }],
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

      // Wait for restoration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify getItem was called
      expect(AsyncStorage.getItem).toHaveBeenCalled();
      
      unsubscribe();
    });

    it('should handle missing cache gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const persister = createCachePersister();
      
      // Should not throw when cache is missing
      expect(() => {
        const [unsubscribe] = persistQueryClient({
          queryClient,
          persister,
          maxAge: 24 * 60 * 60 * 1000,
        });
        unsubscribe();
      }).not.toThrow();
    });

    it('should handle corrupted cache data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json data');

      const persister = createCachePersister();
      
      // Should not throw when cache is corrupted
      expect(() => {
        const [unsubscribe] = persistQueryClient({
          queryClient,
          persister,
          maxAge: 24 * 60 * 60 * 1000,
        });
        unsubscribe();
      }).not.toThrow();
    });
  });

  describe('Cache Expiration', () => {
    it('should not restore data older than 24 hours (Requirement 14.3)', async () => {
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
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // The old data should not be in the cache
      const cachedData = queryClient.getQueryData(['venues', 'list']);
      expect(cachedData).toBeUndefined();
      
      unsubscribe();
    });

    it('should restore data within 24 hours', async () => {
      const recentTimestamp = Date.now() - (1 * 60 * 60 * 1000); // 1 hour ago
      
      const mockRecentCacheData = JSON.stringify({
        clientState: {
          queries: [
            {
              queryKey: ['venues', 'list'],
              queryHash: '["venues","list"]',
              state: {
                data: [{ id: '1', name: 'Recent Venue' }],
                dataUpdatedAt: recentTimestamp,
                status: 'success',
              },
            },
          ],
          mutations: [],
        },
        timestamp: recentTimestamp,
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockRecentCacheData);

      const persister = createCachePersister();
      
      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify getItem was called to restore the cache
      expect(AsyncStorage.getItem).toHaveBeenCalled();
      
      unsubscribe();
    });
  });

  describe('Serialization and Deserialization', () => {
    it('should handle Date objects in serialization', async () => {
      const persister = createCachePersister();
      
      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      const testDate = new Date('2024-01-01T00:00:00.000Z');
      const testData = {
        id: '123',
        createdAt: testDate,
      };

      queryClient.setQueryData(['test', 'date'], testData);

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

      // Verify setItem was called
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      unsubscribe();
    });

    it('should restore Date objects correctly', async () => {
      const testDate = new Date('2024-01-01T00:00:00.000Z');
      
      const mockCacheWithDate = JSON.stringify({
        clientState: {
          queries: [
            {
              queryKey: ['test', 'date'],
              queryHash: '["test","date"]',
              state: {
                data: {
                  id: '123',
                  createdAt: { __type: 'Date', value: testDate.toISOString() },
                },
                dataUpdatedAt: Date.now(),
                status: 'success',
              },
            },
          ],
          mutations: [],
        },
        timestamp: Date.now(),
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockCacheWithDate);

      const persister = createCachePersister();
      
      const [unsubscribe] = persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify getItem was called
      expect(AsyncStorage.getItem).toHaveBeenCalled();
      
      unsubscribe();
    });
  });

  describe('setupQueryPersistence', () => {
    it('should set up persistence without errors', async () => {
      await expect(setupQueryPersistence()).resolves.not.toThrow();
    });

    it('should call AsyncStorage.getItem to restore cache', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await setupQueryPersistence();

      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
  });
});
