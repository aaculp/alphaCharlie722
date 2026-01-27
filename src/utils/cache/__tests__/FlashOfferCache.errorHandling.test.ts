/**
 * Tests for error handling in FlashOfferCache
 * Feature: homescreen-flash-offers-section
 * Task: 7. Add error handling and offline support
 * 
 * Tests cover:
 * - Cache corruption recovery
 * - Invalid cache structure handling
 * - Graceful degradation when cache fails
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

describe('FlashOfferCache - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Corruption Recovery', () => {
    it('should handle corrupted JSON in getCachedSameDayOffers', async () => {
      // Mock corrupted cache data (invalid JSON)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{ invalid json }');

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle corrupted JSON in getCachedActiveOffers', async () => {
      // Mock corrupted cache data (invalid JSON)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{ invalid json }');

      const result = await FlashOfferCache.getCachedActiveOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle corrupted JSON in getCachedOfferDetails', async () => {
      // Mock corrupted cache data (invalid JSON)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{ invalid json }');

      const result = await FlashOfferCache.getCachedOfferDetails('offer-123');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Invalid Cache Structure Handling', () => {
    it('should handle invalid structure in getCachedSameDayOffers (missing date)', async () => {
      const invalidCache = JSON.stringify({
        // Missing date field
        data: [],
        timestamp: Date.now(),
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now()
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidCache);

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle invalid structure in getCachedSameDayOffers (data not array)', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const invalidCache = JSON.stringify({
        date: dateKey,
        data: 'not an array', // Invalid: should be array
        timestamp: Date.now(),
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now()
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidCache);

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle invalid structure in getCachedSameDayOffers (timestamp not number)', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const invalidCache = JSON.stringify({
        date: dateKey,
        data: [],
        timestamp: 'not a number', // Invalid: should be number
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now()
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidCache);

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle invalid structure in getCachedActiveOffers (data not array)', async () => {
      const invalidCache = JSON.stringify({
        data: 'not an array', // Invalid: should be array
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now()
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidCache);

      const result = await FlashOfferCache.getCachedActiveOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle invalid structure in getCachedActiveOffers (timestamp not number)', async () => {
      const invalidCache = JSON.stringify({
        data: [],
        timestamp: 'not a number', // Invalid: should be number
        accessCount: 1,
        lastAccessed: Date.now()
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidCache);

      const result = await FlashOfferCache.getCachedActiveOffers();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle invalid structure in getCachedOfferDetails (missing data)', async () => {
      const invalidCache = JSON.stringify({
        // Missing data field
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now()
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidCache);

      const result = await FlashOfferCache.getCachedOfferDetails('offer-123');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle invalid structure in getCachedOfferDetails (timestamp not number)', async () => {
      const invalidCache = JSON.stringify({
        data: { id: 'offer-123' },
        timestamp: 'not a number', // Invalid: should be number
        accessCount: 1,
        lastAccessed: Date.now()
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidCache);

      const result = await FlashOfferCache.getCachedOfferDetails('offer-123');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Graceful Degradation', () => {
    it('should return null when AsyncStorage.getItem throws error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
    });

    it('should not throw when AsyncStorage.removeItem fails during corruption cleanup', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{ invalid json }');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Remove failed'));

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toBeNull();
      // Should not throw, just log error
    });

    it('should not throw when AsyncStorage.setItem fails during access count update', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const validCache = JSON.stringify({
        date: dateKey,
        data: [{ id: 'offer-1', venue_name: 'Test' }],
        timestamp: Date.now() - 60000, // 1 minute ago (fresh)
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 60000
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(validCache);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Set failed'));

      // Should not throw even if access count update fails
      await expect(FlashOfferCache.getCachedSameDayOffers()).resolves.not.toThrow();
      
      // The function will catch the error and return null due to the outer try-catch
      const result = await FlashOfferCache.getCachedSameDayOffers();
      expect(result).toBeNull();
    });
  });

  describe('Valid Cache Handling', () => {
    it('should return valid cached data for getCachedSameDayOffers', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const validCache = JSON.stringify({
        date: dateKey,
        data: [
          { id: 'offer-1', venue_name: 'Test Venue 1' },
          { id: 'offer-2', venue_name: 'Test Venue 2' }
        ],
        timestamp: Date.now() - 60000, // 1 minute ago (fresh)
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 60000
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(validCache);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferCache.getCachedSameDayOffers();

      expect(result).toHaveLength(2);
      expect(result![0].id).toBe('offer-1');
      expect(result![1].id).toBe('offer-2');
    });

    it('should return valid cached data for getCachedActiveOffers', async () => {
      const validCache = JSON.stringify({
        data: [
          { id: 'offer-1', venue_name: 'Test Venue 1' },
          { id: 'offer-2', venue_name: 'Test Venue 2' }
        ],
        timestamp: Date.now() - 60000, // 1 minute ago (fresh)
        accessCount: 1,
        lastAccessed: Date.now() - 60000
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(validCache);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferCache.getCachedActiveOffers();

      expect(result).toHaveLength(2);
      expect(result![0].id).toBe('offer-1');
      expect(result![1].id).toBe('offer-2');
    });

    it('should return valid cached data for getCachedOfferDetails', async () => {
      const validCache = JSON.stringify({
        data: {
          id: 'offer-123',
          title: 'Test Offer',
          venue_name: 'Test Venue'
        },
        timestamp: Date.now() - 60000, // 1 minute ago (fresh)
        accessCount: 1,
        lastAccessed: Date.now() - 60000
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(validCache);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferCache.getCachedOfferDetails('offer-123');

      expect(result).toEqual({
        id: 'offer-123',
        title: 'Test Offer',
        venue_name: 'Test Venue'
      });
    });
  });
});
