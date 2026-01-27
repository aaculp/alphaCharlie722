/**
 * StateCache Unit Tests
 * 
 * Tests for the StateCache class that manages claim state caching
 * with timestamp validation and AsyncStorage persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateCache, CachedClaim } from '../StateCache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('StateCache', () => {
  let cache: StateCache;

  // Helper to create a mock claim
  const createMockClaim = (overrides?: Partial<CachedClaim>): CachedClaim => ({
    claimId: 'claim-123',
    userId: 'user-456',
    status: 'active',
    claimToken: '123456',
    promotionId: 'promo-789',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastSyncedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    cache = new StateCache();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize cache from AsyncStorage', async () => {
      const mockClaims = {
        'claim-1': createMockClaim({ claimId: 'claim-1' }),
        'claim-2': createMockClaim({ claimId: 'claim-2' }),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockClaims));

      await cache.initialize();

      expect(cache.isInitialized()).toBe(true);
      expect(cache.getSize()).toBe(2);
      expect(cache.getClaim('claim-1')).toEqual(mockClaims['claim-1']);
      expect(cache.getClaim('claim-2')).toEqual(mockClaims['claim-2']);
    });

    it('should handle empty cache on initialization', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await cache.initialize();

      expect(cache.isInitialized()).toBe(true);
      expect(cache.getSize()).toBe(0);
    });

    it('should handle corrupted cache data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      await cache.initialize();

      expect(cache.isInitialized()).toBe(true);
      expect(cache.getSize()).toBe(0);
    });

    it('should not reinitialize if already initialized', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await cache.initialize();
      await cache.initialize();

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('getClaim', () => {
    it('should return cached claim by ID', async () => {
      const mockClaim = createMockClaim();
      cache.updateClaim(mockClaim.claimId, mockClaim);

      const result = cache.getClaim(mockClaim.claimId);

      expect(result).toEqual(expect.objectContaining({
        claimId: mockClaim.claimId,
        userId: mockClaim.userId,
        status: mockClaim.status,
      }));
    });

    it('should return null for non-existent claim', () => {
      const result = cache.getClaim('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateClaim', () => {
    it('should create new claim if it does not exist', () => {
      const mockClaim = createMockClaim();

      const result = cache.updateClaim(mockClaim.claimId, mockClaim);

      expect(result).toBe(true);
      expect(cache.getClaim(mockClaim.claimId)).toEqual(
        expect.objectContaining({
          claimId: mockClaim.claimId,
          status: mockClaim.status,
        })
      );
    });

    it('should update existing claim', () => {
      const mockClaim = createMockClaim();
      cache.updateClaim(mockClaim.claimId, mockClaim);

      const result = cache.updateClaim(mockClaim.claimId, {
        status: 'redeemed',
        updatedAt: '2024-01-02T00:00:00Z',
      });

      expect(result).toBe(true);
      const updated = cache.getClaim(mockClaim.claimId);
      expect(updated?.status).toBe('redeemed');
      expect(updated?.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    it('should reject stale updates based on timestamp', () => {
      const mockClaim = createMockClaim({
        updatedAt: '2024-01-02T00:00:00Z',
      });
      cache.updateClaim(mockClaim.claimId, mockClaim);

      // Try to update with older timestamp
      const result = cache.updateClaim(mockClaim.claimId, {
        status: 'redeemed',
        updatedAt: '2024-01-01T00:00:00Z', // Older than existing
      });

      expect(result).toBe(false);
      const claim = cache.getClaim(mockClaim.claimId);
      expect(claim?.status).toBe('active'); // Should remain unchanged
      expect(claim?.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    it('should accept updates with newer timestamp', () => {
      const mockClaim = createMockClaim({
        updatedAt: '2024-01-01T00:00:00Z',
      });
      cache.updateClaim(mockClaim.claimId, mockClaim);

      // Update with newer timestamp
      const result = cache.updateClaim(mockClaim.claimId, {
        status: 'redeemed',
        updatedAt: '2024-01-02T00:00:00Z', // Newer than existing
      });

      expect(result).toBe(true);
      const claim = cache.getClaim(mockClaim.claimId);
      expect(claim?.status).toBe('redeemed');
      expect(claim?.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    it('should accept updates without timestamp', () => {
      const mockClaim = createMockClaim();
      cache.updateClaim(mockClaim.claimId, mockClaim);

      // Update without timestamp (should not trigger validation)
      const result = cache.updateClaim(mockClaim.claimId, {
        rejectionReason: 'Invalid code',
      });

      expect(result).toBe(true);
      const claim = cache.getClaim(mockClaim.claimId);
      expect(claim?.rejectionReason).toBe('Invalid code');
    });

    it('should persist cache to AsyncStorage after update', () => {
      const mockClaim = createMockClaim();

      cache.updateClaim(mockClaim.claimId, mockClaim);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@state_cache:claims',
        expect.any(String)
      );
    });

    it('should not create claim with missing required fields', () => {
      const result = cache.updateClaim('claim-123', {
        status: 'active',
        // Missing other required fields
      });

      expect(result).toBe(false);
      expect(cache.getClaim('claim-123')).toBeNull();
    });
  });

  describe('getUserClaims', () => {
    it('should return all claims for a specific user', () => {
      const user1Claims = [
        createMockClaim({ claimId: 'claim-1', userId: 'user-1' }),
        createMockClaim({ claimId: 'claim-2', userId: 'user-1' }),
      ];
      const user2Claims = [
        createMockClaim({ claimId: 'claim-3', userId: 'user-2' }),
      ];

      user1Claims.forEach(claim => cache.updateClaim(claim.claimId, claim));
      user2Claims.forEach(claim => cache.updateClaim(claim.claimId, claim));

      const result = cache.getUserClaims('user-1');

      expect(result).toHaveLength(2);
      expect(result.every(claim => claim.userId === 'user-1')).toBe(true);
    });

    it('should return empty array for user with no claims', () => {
      const result = cache.getUserClaims('non-existent-user');

      expect(result).toEqual([]);
    });

    it('should sort claims by creation date (newest first)', () => {
      const claims = [
        createMockClaim({ claimId: 'claim-1', createdAt: '2024-01-01T00:00:00Z' }),
        createMockClaim({ claimId: 'claim-2', createdAt: '2024-01-03T00:00:00Z' }),
        createMockClaim({ claimId: 'claim-3', createdAt: '2024-01-02T00:00:00Z' }),
      ];

      claims.forEach(claim => cache.updateClaim(claim.claimId, claim));

      const result = cache.getUserClaims('user-456');

      expect(result[0].claimId).toBe('claim-2'); // Newest
      expect(result[1].claimId).toBe('claim-3');
      expect(result[2].claimId).toBe('claim-1'); // Oldest
    });
  });

  describe('clear', () => {
    it('should clear all cached claims', async () => {
      const mockClaim = createMockClaim();
      cache.updateClaim(mockClaim.claimId, mockClaim);

      await cache.clear();

      expect(cache.getSize()).toBe(0);
      expect(cache.getClaim(mockClaim.claimId)).toBeNull();
    });

    it('should remove data from AsyncStorage', async () => {
      await cache.clear();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@state_cache:claims');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@state_cache:last_sync');
    });
  });

  describe('syncWithServer', () => {
    it('should fetch claims from server and update cache', async () => {
      const serverClaims = [
        createMockClaim({ claimId: 'claim-1', status: 'active' }),
        createMockClaim({ claimId: 'claim-2', status: 'redeemed' }),
      ];

      const mockFetchFn = jest.fn().mockResolvedValue(serverClaims);

      await cache.syncWithServer('user-456', mockFetchFn);

      expect(mockFetchFn).toHaveBeenCalledWith('user-456');
      expect(cache.getSize()).toBe(2);
      expect(cache.getClaim('claim-1')?.status).toBe('active');
      expect(cache.getClaim('claim-2')?.status).toBe('redeemed');
    });

    it('should update last sync timestamp', async () => {
      const mockFetchFn = jest.fn().mockResolvedValue([]);

      await cache.syncWithServer('user-456', mockFetchFn);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@state_cache:last_sync',
        expect.any(String)
      );
    });

    it('should throw error if fetch fails', async () => {
      const mockFetchFn = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(cache.syncWithServer('user-456', mockFetchFn)).rejects.toThrow('Network error');
    });

    it('should merge server data with existing cache', async () => {
      // Add existing claim
      const existingClaim = createMockClaim({
        claimId: 'claim-1',
        status: 'active',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      cache.updateClaim(existingClaim.claimId, existingClaim);

      // Server returns updated version
      const serverClaims = [
        createMockClaim({
          claimId: 'claim-1',
          status: 'redeemed',
          updatedAt: '2024-01-02T00:00:00Z',
        }),
      ];

      const mockFetchFn = jest.fn().mockResolvedValue(serverClaims);

      await cache.syncWithServer('user-456', mockFetchFn);

      const updated = cache.getClaim('claim-1');
      expect(updated?.status).toBe('redeemed');
      expect(updated?.updatedAt).toBe('2024-01-02T00:00:00Z');
    });
  });

  describe('getLastSync', () => {
    it('should return last sync timestamp', async () => {
      const timestamp = '2024-01-01T00:00:00Z';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(timestamp);

      const result = await cache.getLastSync();

      expect(result).toBe(timestamp);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@state_cache:last_sync');
    });

    it('should return null if never synced', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await cache.getLastSync();

      expect(result).toBeNull();
    });
  });

  describe('getSize', () => {
    it('should return number of cached claims', () => {
      expect(cache.getSize()).toBe(0);

      cache.updateClaim('claim-1', createMockClaim({ claimId: 'claim-1' }));
      expect(cache.getSize()).toBe(1);

      cache.updateClaim('claim-2', createMockClaim({ claimId: 'claim-2' }));
      expect(cache.getSize()).toBe(2);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(cache.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await cache.initialize();

      expect(cache.isInitialized()).toBe(true);
    });
  });
});
