/**
 * Tests for FlashOfferCache same-day offers functionality
 * 
 * Tests the date-based caching, cache invalidation on day change,
 * and location metadata handling for same-day offers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashOfferCache } from '../FlashOfferCache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('FlashOfferCache - Same-Day Offers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cacheSameDayOffers', () => {
    it('should cache same-day offers with date-based key', async () => {
      const offers = [
        { id: 'offer-1', title: 'Test Offer 1' },
        { id: 'offer-2', title: 'Test Offer 2' },
      ];

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await FlashOfferCache.cacheSameDayOffers(offers);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const cacheKey = setItemCall[0];
      const cachedData = JSON.parse(setItemCall[1]);

      // Verify cache key format
      expect(cacheKey).toMatch(/@flash_offers:same_day_\d{4}-\d{2}-\d{2}$/);

      // Verify cached data structure
      expect(cachedData).toHaveProperty('date');
      expect(cachedData).toHaveProperty('data');
      expect(cachedData).toHaveProperty('timestamp');
      expect(cachedData).toHaveProperty('hasLocation');
      expect(cachedData).toHaveProperty('accessCount');
      expect(cachedData).toHaveProperty('lastAccessed');
      expect(cachedData.data).toEqual(offers);
      expect(cachedData.hasLocation).toBe(false);
    });

    it('should cache same-day offers with location metadata', async () => {
      const offers = [{ id: 'offer-1', title: 'Test Offer' }];
      const options = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await FlashOfferCache.cacheSameDayOffers(offers, options);

      const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const cacheKey = setItemCall[0];
      const cachedData = JSON.parse(setItemCall[1]);

      // Verify cache key includes location
      expect(cacheKey).toMatch(/@flash_offers:same_day_\d{4}-\d{2}-\d{2}_40\.7128_-74\.0060$/);

      // Verify location metadata
      expect(cachedData.hasLocation).toBe(true);
      expect(cachedData.userLocation).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
      });
    });
  });

  describe('getCachedSameDayOffers', () => {
    it('should return cached offers when cache is fresh and date is valid', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const cachedOffers = [
        { id: 'offer-1', title: 'Cached Offer 1' },
        { id: 'offer-2', title: 'Cached Offer 2' },
      ];

      const cacheData = {
        date: dateKey,
        data: cachedOffers,
        timestamp: Date.now() - 60000, // 1 minute ago
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 60000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toEqual(cachedOffers);
      expect(AsyncStorage.getItem).toHaveBeenCalled();
      // Should update access metadata
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return null when cache is expired', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const cacheData = {
        date: dateKey,
        data: [{ id: 'offer-1' }],
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (expired)
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 10 * 60 * 1000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should return null and invalidate cache when date has changed', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      const cacheData = {
        date: yesterdayKey,
        data: [{ id: 'offer-1' }],
        timestamp: Date.now() - 60000, // 1 minute ago (fresh, but wrong date)
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 60000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should return null when no cache exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
    });

    it('should handle location-specific cache keys', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const cachedOffers = [{ id: 'offer-1', distance_miles: 2.5 }];
      const options = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const cacheData = {
        date: dateKey,
        data: cachedOffers,
        timestamp: Date.now() - 60000,
        hasLocation: true,
        userLocation: options,
        accessCount: 1,
        lastAccessed: Date.now() - 60000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferCache.getCachedSameDayOffers(options);

      expect(result).toEqual(cachedOffers);
      const getItemCall = (AsyncStorage.getItem as jest.Mock).mock.calls[0];
      expect(getItemCall[0]).toMatch(/_40\.7128_-74\.0060$/);
    });
  });

  describe('invalidateSameDayOffers', () => {
    it('should remove all same-day offer cache entries', async () => {
      const allKeys = [
        '@flash_offers:same_day_2026-01-26',
        '@flash_offers:same_day_2026-01-26_40.7128_-74.0060',
        '@flash_offers:same_day_2026-01-25',
        '@flash_offers:active_offers',
        '@flash_offers:user_claims',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(allKeys);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await FlashOfferCache.invalidateSameDayOffers();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@flash_offers:same_day_2026-01-26',
        '@flash_offers:same_day_2026-01-26_40.7128_-74.0060',
        '@flash_offers:same_day_2026-01-25',
      ]);
    });

    it('should not call multiRemove when no same-day caches exist', async () => {
      const allKeys = [
        '@flash_offers:active_offers',
        '@flash_offers:user_claims',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(allKeys);

      await FlashOfferCache.invalidateSameDayOffers();

      expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
    });
  });

  describe('invalidateOldSameDayOffers', () => {
    it('should remove same-day offers from previous dates', async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const allKeys = [
        `@flash_offers:same_day_${today}`,
        `@flash_offers:same_day_${yesterdayKey}`,
      ];

      const todayCache = {
        date: today,
        data: [{ id: 'offer-today' }],
        timestamp: Date.now(),
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now(),
      };

      const yesterdayCache = {
        date: yesterdayKey,
        data: [{ id: 'offer-yesterday' }],
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 24 * 60 * 60 * 1000,
      };

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(allKeys);
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(todayCache))
        .mockResolvedValueOnce(JSON.stringify(yesterdayCache));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await FlashOfferCache.invalidateOldSameDayOffers();

      // Should only remove yesterday's cache
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`@flash_offers:same_day_${yesterdayKey}`);
    });

    it('should remove corrupted cache entries', async () => {
      const allKeys = ['@flash_offers:same_day_2026-01-26'];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(allKeys);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await FlashOfferCache.invalidateOldSameDayOffers();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@flash_offers:same_day_2026-01-26');
    });
  });

  describe('cleanupExpiredCache', () => {
    it('should remove expired same-day offer caches', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const allKeys = [
        `@flash_offers:same_day_${dateKey}`,
        '@flash_offers:cache_metadata',
      ];

      const expiredCache = {
        date: dateKey,
        data: [{ id: 'offer-1' }],
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (expired)
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 10 * 60 * 1000,
      };

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(allKeys);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(expiredCache));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await FlashOfferCache.cleanupExpiredCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`@flash_offers:same_day_${dateKey}`);
    });

    it('should remove same-day caches with invalid dates during cleanup', async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const allKeys = [`@flash_offers:same_day_${yesterdayKey}`];

      const yesterdayCache = {
        date: yesterdayKey,
        data: [{ id: 'offer-1' }],
        timestamp: Date.now() - 60000, // Fresh timestamp but wrong date
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 60000,
      };

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(allKeys);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(yesterdayCache));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await FlashOfferCache.cleanupExpiredCache();

      // Should remove because date doesn't match current date
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`@flash_offers:same_day_${yesterdayKey}`);
    });
  });
});
