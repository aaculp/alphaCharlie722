/**
 * Tests for getSameDayOffers method
 * Feature: homescreen-flash-offers-section
 * Task: 1. Add getSameDayOffers method to FlashOfferService
 * 
 * Tests cover:
 * - Same-day filtering logic
 * - Location-based sorting
 * - Distance calculation
 * - Caching with date-based keys
 * - Venue information inclusion
 */

import { FlashOfferService, FlashOffer } from '../flashOffers';
import { supabase } from '../../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  }
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock NetworkErrorHandler
jest.mock('../../../utils/errors/NetworkErrorHandler', () => ({
  NetworkErrorHandler: {
    isNetworkError: jest.fn(() => false),
    withRetry: jest.fn((fn) => fn()), // Mock withRetry to just execute the function
  }
}));

// Helper function to create properly chained mock query
const createMockQuery = (data: any, error: any = null) => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis()
  };
  
  // The last gte call should return the data
  mockQuery.gte
    .mockReturnValueOnce(mockQuery) // First gte for start_time
    .mockResolvedValueOnce({ data, error }); // Second gte for end_time
  
  return mockQuery;
};

describe('FlashOfferService.getSameDayOffers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should fetch same-day offers without location', async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Morning Special',
          description: 'Early bird discount',
          expected_value: null,
          max_claims: 10,
          claimed_count: 2,
          start_time: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
          end_time: new Date(now.getTime() + 3600000).toISOString(), // 1 hour from now
          radius_miles: 5,
          target_favorites_only: false,
          status: 'active',
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-1',
            name: 'Test Venue 1',
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        {
          id: 'offer-2',
          venue_id: 'venue-2',
          title: 'Afternoon Deal',
          description: 'Lunch special',
          expected_value: '10.00',
          max_claims: 20,
          claimed_count: 5,
          start_time: new Date(now.getTime() + 1800000).toISOString(), // 30 min from now
          end_time: new Date(now.getTime() + 7200000).toISOString(), // 2 hours from now
          radius_miles: 3,
          target_favorites_only: false,
          status: 'active',
          push_sent: false,
          push_sent_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-2',
            name: 'Test Venue 2',
            latitude: 40.7589,
            longitude: -73.9851
          }
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis()
      };
      
      // The last gte call should return the data
      mockQuery.gte
        .mockReturnValueOnce(mockQuery) // First gte for start_time
        .mockResolvedValueOnce({ data: mockOffers, error: null }); // Second gte for end_time

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferService.getSameDayOffers();

      expect(result).toHaveLength(2);
      expect(result[0].venue_name).toBe('Test Venue 1');
      expect(result[1].venue_name).toBe('Test Venue 2');
      expect(result[0].distance_miles).toBeUndefined();
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQuery.gte).toHaveBeenCalledWith('start_time', startOfDay.toISOString());
      expect(mockQuery.lte).toHaveBeenCalledWith('start_time', endOfDay.toISOString());
    });

    it('should fetch same-day offers with location and calculate distances', async () => {
      const now = new Date();
      const userLat = 40.7128;
      const userLon = -74.0060;

      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Nearby Offer',
          description: 'Close to you',
          expected_value: null,
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
            name: 'Nearby Venue',
            latitude: 40.7138, // Very close
            longitude: -74.0070
          }
        },
        {
          id: 'offer-2',
          venue_id: 'venue-2',
          title: 'Far Offer',
          description: 'Further away',
          expected_value: '10.00',
          max_claims: 20,
          claimed_count: 5,
          start_time: new Date(now.getTime() + 1800000).toISOString(),
          end_time: new Date(now.getTime() + 7200000).toISOString(),
          radius_miles: 3,
          target_favorites_only: false,
          status: 'active',
          push_sent: false,
          push_sent_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-2',
            name: 'Far Venue',
            latitude: 40.7589, // Further away
            longitude: -73.9851
          }
        }
      ];

      const mockQuery = createMockQuery(mockOffers);

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferService.getSameDayOffers({
        latitude: userLat,
        longitude: userLon,
        radiusMiles: 10,
        prioritizeNearby: true
      });

      expect(result).toHaveLength(2);
      expect(result[0].distance_miles).toBeDefined();
      expect(result[1].distance_miles).toBeDefined();
      // Nearby venue should be first (sorted by distance)
      expect(result[0].distance_miles).toBeLessThan(result[1].distance_miles!);
    });

    it('should return empty array when no same-day offers exist', async () => {
      const mockQuery = createMockQuery([]);

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferService.getSameDayOffers();

      expect(result).toEqual([]);
    });
  });

  describe('Caching', () => {
    it('should use cached data when available and fresh', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const cachedOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Cached Offer',
          description: 'From cache',
          expected_value: null,
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
          venue_name: 'Cached Venue'
        }
      ];

      const cacheData = {
        date: dateKey,
        data: cachedOffers,
        timestamp: Date.now() - 60000, // 1 minute ago (fresh)
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 60000
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheData));

      const result = await FlashOfferService.getSameDayOffers();

      expect(result).toEqual(cachedOffers);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should fetch fresh data when cache is expired', async () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const expiredCacheData = {
        date: dateKey,
        data: [],
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (expired)
        hasLocation: false,
        accessCount: 1,
        lastAccessed: Date.now() - 10 * 60 * 1000
      };

      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Fresh Offer',
          description: 'Newly fetched',
          expected_value: null,
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
            name: 'Fresh Venue',
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ];

      const mockQuery = createMockQuery(mockOffers);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(expiredCacheData));
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferService.getSameDayOffers();

      expect(result).toHaveLength(1);
      expect(result[0].venue_name).toBe('Fresh Venue');
      expect(supabase.from).toHaveBeenCalled();
    });

    it('should cache fetched data with date-based key', async () => {
      const now = new Date();
      const dateKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
      const expectedCacheKey = `@flash_offers:same_day_${dateKey}`;

      const mockOffers = [
        {
          id: 'offer-1',
          venue_id: 'venue-1',
          title: 'Test Offer',
          description: 'Test',
          expected_value: null,
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

      const mockQuery = createMockQuery(mockOffers);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await FlashOfferService.getSameDayOffers();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expectedCacheKey,
        expect.stringContaining('"data"')
      );
    });
  });

  describe('Sorting and Prioritization', () => {
    it('should prioritize offers within radius when prioritizeNearby is true', async () => {
      const now = new Date();
      const userLat = 40.7128;
      const userLon = -74.0060;

      const mockOffers = [
        {
          id: 'offer-far',
          venue_id: 'venue-far',
          title: 'Far Offer',
          description: 'Outside radius',
          expected_value: null,
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
            id: 'venue-far',
            name: 'Far Venue',
            latitude: 41.0, // ~20 miles away
            longitude: -74.5
          }
        },
        {
          id: 'offer-near',
          venue_id: 'venue-near',
          title: 'Near Offer',
          description: 'Within radius',
          expected_value: '10.00',
          max_claims: 20,
          claimed_count: 5,
          start_time: new Date(now.getTime() + 1800000).toISOString(),
          end_time: new Date(now.getTime() + 7200000).toISOString(),
          radius_miles: 3,
          target_favorites_only: false,
          status: 'active',
          push_sent: false,
          push_sent_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-near',
            name: 'Near Venue',
            latitude: 40.7138, // ~0.1 miles away
            longitude: -74.0070
          }
        }
      ];

      const mockQuery = createMockQuery(mockOffers);

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferService.getSameDayOffers({
        latitude: userLat,
        longitude: userLon,
        radiusMiles: 10,
        prioritizeNearby: true
      });

      expect(result).toHaveLength(2);
      // Near offer should be first (within radius)
      expect(result[0].id).toBe('offer-near');
      expect(result[0].distance_miles).toBeLessThan(10);
      // Far offer should be second (outside radius)
      expect(result[1].id).toBe('offer-far');
    });

    it('should sort by start_time when no location provided', async () => {
      const now = new Date();

      const mockOffers = [
        {
          id: 'offer-later',
          venue_id: 'venue-1',
          title: 'Later Offer',
          description: 'Starts later',
          expected_value: null,
          max_claims: 10,
          claimed_count: 2,
          start_time: new Date(now.getTime() + 7200000).toISOString(), // 2 hours from now
          end_time: new Date(now.getTime() + 10800000).toISOString(),
          radius_miles: 5,
          target_favorites_only: false,
          status: 'active',
          push_sent: true,
          push_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-1',
            name: 'Venue 1',
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        {
          id: 'offer-sooner',
          venue_id: 'venue-2',
          title: 'Sooner Offer',
          description: 'Starts sooner',
          expected_value: '10.00',
          max_claims: 20,
          claimed_count: 5,
          start_time: new Date(now.getTime() + 1800000).toISOString(), // 30 min from now
          end_time: new Date(now.getTime() + 5400000).toISOString(),
          radius_miles: 3,
          target_favorites_only: false,
          status: 'active',
          push_sent: false,
          push_sent_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venues: {
            id: 'venue-2',
            name: 'Venue 2',
            latitude: 40.7589,
            longitude: -73.9851
          }
        }
      ];

      const mockQuery = createMockQuery(mockOffers);

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await FlashOfferService.getSameDayOffers();

      expect(result).toHaveLength(2);
      // Sooner offer should be first (sorted by start_time)
      expect(result[0].id).toBe('offer-sooner');
      expect(result[1].id).toBe('offer-later');
    });
  });
});

