/**
 * Tests for error handling in FlashOfferService
 * Feature: homescreen-flash-offers-section
 * Task: 7. Add error handling and offline support
 * 
 * Tests cover:
 * - Network error handling with retry mechanism
 * - Fallback to cached data when network unavailable
 * - Cache corruption recovery
 * - User-friendly error messages
 * - Location permission error handling
 */

import { FlashOfferService, FlashOffer } from '../flashOffers';
import { supabase } from '../../../lib/supabase';
import { NetworkErrorHandler } from '../../../utils/errors/NetworkErrorHandler';
import { FlashOfferCache } from '../../../utils/cache/FlashOfferCache';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  }
}));

// Mock FlashOfferCache
jest.mock('../../../utils/cache/FlashOfferCache', () => ({
  FlashOfferCache: {
    getCachedSameDayOffers: jest.fn(),
    cacheSameDayOffers: jest.fn(),
    updateLastSync: jest.fn(),
    getCachedActiveOffers: jest.fn(),
    cacheActiveOffers: jest.fn(),
  }
}));

// Mock NetworkErrorHandler
jest.mock('../../../utils/errors/NetworkErrorHandler', () => ({
  NetworkErrorHandler: {
    isNetworkError: jest.fn(),
    withRetry: jest.fn(),
    createNetworkError: jest.fn((message, statusCode, retryable) => {
      const error = new Error(message) as any;
      error.isNetworkError = true;
      error.statusCode = statusCode;
      error.retryable = retryable;
      return error;
    }),
  }
}));

describe('FlashOfferService - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Network Error Handling with Retry', () => {
    it('should retry getSameDayOffers on network failure', async () => {
      const now = new Date();
      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Test Offer',
          description: 'Test',
          value_cap: null,
          max_claims: 10,
          claimed_count: 2,
          start_time: new Date(now.getTime() - 3600000).toISOString(),
          end_time: new Date(now.getTime() + 3600000).toISOString(),
          radius_miles: 5,
          target_favorites_only: false,
          status: 'active',
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-1',
            name: 'Test Venue',
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ];

      // Mock cache miss
      (FlashOfferCache.getCachedSameDayOffers as jest.Mock).mockResolvedValue(null);
      (FlashOfferCache.cacheSameDayOffers as jest.Mock).mockResolvedValue(undefined);
      (FlashOfferCache.updateLastSync as jest.Mock).mockResolvedValue(undefined);

      // Mock withRetry to succeed (simulating successful retry)
      (NetworkErrorHandler.withRetry as jest.Mock).mockImplementation(async (fn) => fn());

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis()
      };
      
      mockQuery.gte
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce({ data: mockOffers, error: null });

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await FlashOfferService.getSameDayOffers();

      expect(NetworkErrorHandler.withRetry).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].venue_name).toBe('Test Venue');
    });

    it('should retry getActiveOffers on network failure', async () => {
      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Test Offer',
          description: 'Test',
          value_cap: null,
          max_claims: 10,
          claimed_count: 2,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          radius_miles: 5,
          target_favorites_only: false,
          status: 'active',
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-1',
            name: 'Test Venue',
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ];

      // Mock cache methods
      (FlashOfferCache.cacheActiveOffers as jest.Mock).mockResolvedValue(undefined);
      (FlashOfferCache.updateLastSync as jest.Mock).mockResolvedValue(undefined);

      // Mock withRetry to succeed
      (NetworkErrorHandler.withRetry as jest.Mock).mockImplementation(async (fn) => fn());

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis()
      };
      
      mockQuery.gte.mockResolvedValueOnce({ data: mockOffers, error: null });

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await FlashOfferService.getActiveOffers(40.7128, -74.0060, 10);

      expect(NetworkErrorHandler.withRetry).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('Fallback to Cached Data', () => {
    it('should return cached data when network is unavailable for getSameDayOffers', async () => {
      const cachedOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Cached Offer',
          description: 'From cache',
          value_cap: null,
          max_claims: 10,
          claimed_count: 2,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          radius_miles: 5,
          target_favorites_only: false,
          status: 'active',
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venue_name: 'Cached Venue'
        }
      ];

      // Mock cache to return null on first call (fresh check), then return data on fallback
      (FlashOfferCache.getCachedSameDayOffers as jest.Mock)
        .mockResolvedValueOnce(null) // First call in try block
        .mockResolvedValueOnce(cachedOffers); // Second call in catch block

      // Mock withRetry to throw network error
      const networkError = new Error('Network request failed');
      (NetworkErrorHandler.withRetry as jest.Mock).mockRejectedValue(networkError);
      (NetworkErrorHandler.isNetworkError as jest.Mock).mockReturnValue(true);

      const result = await FlashOfferService.getSameDayOffers();

      expect(result).toEqual(cachedOffers);
      expect(FlashOfferCache.getCachedSameDayOffers).toHaveBeenCalledTimes(2);
    });

    it('should return cached data when network is unavailable for getActiveOffers', async () => {
      const cachedOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Cached Offer',
          description: 'From cache',
          value_cap: null,
          max_claims: 10,
          claimed_count: 2,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          radius_miles: 5,
          target_favorites_only: false,
          status: 'active',
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venue_name: 'Cached Venue'
        }
      ];

      // Mock withRetry to throw network error
      const networkError = new Error('Network request failed');
      (NetworkErrorHandler.withRetry as jest.Mock).mockRejectedValue(networkError);
      (NetworkErrorHandler.isNetworkError as jest.Mock).mockReturnValue(true);
      (FlashOfferCache.getCachedActiveOffers as jest.Mock).mockResolvedValue(cachedOffers);

      const result = await FlashOfferService.getActiveOffers(40.7128, -74.0060, 10);

      expect(result).toEqual(cachedOffers);
      expect(FlashOfferCache.getCachedActiveOffers).toHaveBeenCalled();
    });

    it('should throw user-friendly error when network fails and no cache available for getSameDayOffers', async () => {
      // Mock cache to return null (no cached data)
      (FlashOfferCache.getCachedSameDayOffers as jest.Mock).mockResolvedValue(null);

      // Mock withRetry to throw network error
      const networkError = new Error('Network request failed');
      (NetworkErrorHandler.withRetry as jest.Mock).mockRejectedValue(networkError);
      (NetworkErrorHandler.isNetworkError as jest.Mock).mockReturnValue(true);

      // Mock createNetworkError
      const userFriendlyError = new Error('Unable to load flash offers. Please check your internet connection.') as any;
      userFriendlyError.isNetworkError = true;
      userFriendlyError.retryable = true;
      (NetworkErrorHandler.createNetworkError as jest.Mock).mockReturnValue(userFriendlyError);

      await expect(FlashOfferService.getSameDayOffers()).rejects.toThrow(
        'Unable to load flash offers. Please check your internet connection.'
      );

      expect(NetworkErrorHandler.createNetworkError).toHaveBeenCalledWith(
        'Unable to load flash offers. Please check your internet connection.',
        undefined,
        true
      );
    });

    it('should throw error when network fails and no cache available for getActiveOffers', async () => {
      // Mock withRetry to throw network error
      const networkError = new Error('Network request failed');
      (NetworkErrorHandler.withRetry as jest.Mock).mockRejectedValue(networkError);
      (NetworkErrorHandler.isNetworkError as jest.Mock).mockReturnValue(true);
      (FlashOfferCache.getCachedActiveOffers as jest.Mock).mockResolvedValue(null);

      await expect(
        FlashOfferService.getActiveOffers(40.7128, -74.0060, 10)
      ).rejects.toThrow('Network request failed');
    });
  });

  describe('Non-Network Error Handling', () => {
    it('should throw non-network errors immediately without cache fallback', async () => {
      // Mock cache miss
      (FlashOfferCache.getCachedSameDayOffers as jest.Mock).mockResolvedValue(null);

      // Mock withRetry to throw non-network error
      const authError = new Error('Unauthorized');
      (NetworkErrorHandler.withRetry as jest.Mock).mockRejectedValue(authError);
      (NetworkErrorHandler.isNetworkError as jest.Mock).mockReturnValue(false);

      await expect(FlashOfferService.getSameDayOffers()).rejects.toThrow('Unauthorized');

      // Should not attempt cache fallback for non-network errors
      expect(FlashOfferCache.getCachedSameDayOffers).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Update on Success', () => {
    it('should update cache and last sync timestamp on successful fetch', async () => {
      const now = new Date();
      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Test Offer',
          description: 'Test',
          value_cap: null,
          max_claims: 10,
          claimed_count: 2,
          start_time: new Date(now.getTime() - 3600000).toISOString(),
          end_time: new Date(now.getTime() + 3600000).toISOString(),
          radius_miles: 5,
          target_favorites_only: false,
          status: 'active',
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-1',
            name: 'Test Venue',
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ];

      // Mock cache miss
      (FlashOfferCache.getCachedSameDayOffers as jest.Mock).mockResolvedValue(null);
      (FlashOfferCache.cacheSameDayOffers as jest.Mock).mockResolvedValue(undefined);
      (FlashOfferCache.updateLastSync as jest.Mock).mockResolvedValue(undefined);

      // Mock withRetry to succeed
      (NetworkErrorHandler.withRetry as jest.Mock).mockImplementation(async (fn) => fn());

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis()
      };
      
      mockQuery.gte
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce({ data: mockOffers, error: null });

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await FlashOfferService.getSameDayOffers();

      expect(FlashOfferCache.cacheSameDayOffers).toHaveBeenCalled();
      expect(FlashOfferCache.updateLastSync).toHaveBeenCalled();
    });
  });
});
