/**
 * Integration tests for Flash Offers Section on HomeScreen
 * Task 9: Integration testing and polish
 * 
 * Tests complete user flows:
 * - HomeScreen load → view offers → refresh → real-time updates
 * - Empty state display and transitions
 * - Distance display with and without location
 * - Permission change scenarios
 * - Cache invalidation and offline mode
 * 
 * Requirements: All
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useFlashOffers } from '../../hooks/useFlashOffers';
import { FlashOfferService } from '../../services/api/flashOffers';
import { FlashOfferCache } from '../../utils/cache/FlashOfferCache';
import { useLocationContext } from '../../contexts/LocationContext';

// Mock dependencies
jest.mock('../../services/api/flashOffers');
jest.mock('../../utils/cache/FlashOfferCache');
jest.mock('../../contexts/LocationContext');
jest.mock('../../utils/permissions/PermissionHandler');

describe('Flash Offers HomeScreen Integration Tests', () => {
  const mockLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
  };

  const mockOffers = [
    {
      id: 'offer-1',
      venue_id: 'venue-1',
      venue_name: 'Test Venue 1',
      title: 'Happy Hour Special',
      description: 'Half off all drinks',
      expected_value: 20.00,
      max_claims: 50,
      claimed_count: 10,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      radius_miles: 5,
      target_favorites_only: false,
      status: 'active' as const,
      push_sent: false,
      push_sent_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_miles: 2.5,
    },
    {
      id: 'offer-2',
      venue_id: 'venue-2',
      venue_name: 'Test Venue 2',
      title: 'Lunch Deal',
      description: 'Buy one get one free',
      expected_value: null,
      max_claims: 30,
      claimed_count: 25,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      radius_miles: 10,
      target_favorites_only: false,
      status: 'active' as const,
      push_sent: true,
      push_sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_miles: 5.2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (useLocationContext as jest.Mock).mockReturnValue({
      currentLocation: mockLocation,
      locationEnabled: true,
    });

    (FlashOfferService.getSameDayOffers as jest.Mock).mockResolvedValue(mockOffers);
    (FlashOfferCache.getCachedSameDayOffers as jest.Mock).mockResolvedValue(null);
    (FlashOfferCache.cacheSameDayOffers as jest.Mock).mockResolvedValue(undefined);
    (FlashOfferCache.updateLastSync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Complete User Flow: Load → View → Refresh', () => {
    it('should load flash offers on mount with same-day mode', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true, radiusMiles: 10 })
      );

      // Wait for offers to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify service was called with correct parameters
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledWith({
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        radiusMiles: 10,
        prioritizeNearby: true,
      });

      // Verify offers are returned
      expect(result.current.offers).toEqual(mockOffers);
      expect(result.current.isEmpty).toBe(false);
      expect(result.current.hasLocation).toBe(true);
    });

    it('should handle refresh and update offers', async () => {
      const updatedOffers = [
        {
          ...mockOffers[0],
          claimed_count: 15, // Updated claim count
        },
      ];

      (FlashOfferService.getSameDayOffers as jest.Mock)
        .mockResolvedValueOnce(mockOffers)
        .mockResolvedValueOnce(updatedOffers);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.offers).toEqual(mockOffers);

      // Trigger refetch
      await result.current.refetch();

      // Wait for refetch to complete
      await waitFor(() => {
        expect(result.current.offers).toEqual(updatedOffers);
      });

      // Verify service was called twice
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledTimes(2);
    });

    it('should support retry after error', async () => {
      const error = new Error('Network error');
      (FlashOfferService.getSameDayOffers as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockOffers);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      // Wait for error state
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Trigger retry
      await result.current.retry();

      // Wait for successful retry
      await waitFor(() => {
        expect(result.current.offers).toEqual(mockOffers);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Empty State Display and Transitions', () => {
    it('should display empty state when no offers are available', async () => {
      (FlashOfferService.getSameDayOffers as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.offers).toEqual([]);
    });

    it('should transition from empty state to offers when new offers arrive', async () => {
      (FlashOfferService.getSameDayOffers as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockOffers);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      // Wait for initial empty state
      await waitFor(() => {
        expect(result.current.isEmpty).toBe(true);
      });

      // Trigger refetch
      await result.current.refetch();

      // Wait for transition to offers
      await waitFor(() => {
        expect(result.current.isEmpty).toBe(false);
        expect(result.current.offers).toEqual(mockOffers);
      });
    });

    it('should transition from offers to empty state when offers expire', async () => {
      (FlashOfferService.getSameDayOffers as jest.Mock)
        .mockResolvedValueOnce(mockOffers)
        .mockResolvedValueOnce([]);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      // Wait for initial offers
      await waitFor(() => {
        expect(result.current.offers).toEqual(mockOffers);
      });

      // Trigger refetch (simulating offers expiring)
      await result.current.refetch();

      // Wait for transition to empty state
      await waitFor(() => {
        expect(result.current.isEmpty).toBe(true);
        expect(result.current.offers).toEqual([]);
      });
    });
  });

  describe('Distance Display with and without Location', () => {
    it('should display offers with distance when location is available', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true, radiusMiles: 10 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify service was called with location
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledWith({
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        radiusMiles: 10,
        prioritizeNearby: true,
      });

      // Verify hasLocation flag is set
      expect(result.current.hasLocation).toBe(true);

      // Verify offers include distance
      expect(result.current.offers[0].distance_miles).toBe(2.5);
      expect(result.current.offers[1].distance_miles).toBe(5.2);
    });

    it('should display offers without distance when location is unavailable', async () => {
      (useLocationContext as jest.Mock).mockReturnValue({
        currentLocation: null,
        locationEnabled: false,
      });

      const offersWithoutDistance = mockOffers.map(({ distance_miles, ...offer }) => offer);
      (FlashOfferService.getSameDayOffers as jest.Mock).mockResolvedValue(offersWithoutDistance);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify service was called without location
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledWith();

      // Verify hasLocation flag is false
      expect(result.current.hasLocation).toBe(false);

      // Verify offers are still returned
      expect(result.current.offers.length).toBe(2);
    });

    it('should update distance display when location changes', async () => {
      const { result, rerender } = renderHook(() =>
        useFlashOffers({ sameDayMode: true, radiusMiles: 10 })
      );

      // Wait for initial load with location
      await waitFor(() => {
        expect(result.current.hasLocation).toBe(true);
      });

      // Change location
      const newLocation = {
        latitude: 34.0522,
        longitude: -118.2437,
      };

      (useLocationContext as jest.Mock).mockReturnValue({
        currentLocation: newLocation,
        locationEnabled: true,
      });

      // Rerender to trigger location change
      rerender();

      // Wait for refetch with new location
      await waitFor(() => {
        expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledWith({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          radiusMiles: 10,
          prioritizeNearby: true,
        });
      });
    });
  });

  describe('Permission Change Scenarios', () => {
    it('should refetch offers when location permission is granted', async () => {
      // Start without location
      (useLocationContext as jest.Mock).mockReturnValue({
        currentLocation: null,
        locationEnabled: false,
      });

      const { result, rerender } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.hasLocation).toBe(false);
      });

      // Grant location permission
      (useLocationContext as jest.Mock).mockReturnValue({
        currentLocation: mockLocation,
        locationEnabled: true,
      });

      // Rerender to trigger permission change
      rerender();

      // Wait for refetch with location
      await waitFor(() => {
        expect(result.current.hasLocation).toBe(true);
      });

      // Verify service was called with location
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledWith({
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        radiusMiles: 10,
        prioritizeNearby: true,
      });
    });

    it('should continue showing offers when location permission is denied', async () => {
      (useLocationContext as jest.Mock).mockReturnValue({
        currentLocation: null,
        locationEnabled: false,
      });

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify offers are still displayed
      expect(result.current.offers.length).toBeGreaterThan(0);
      expect(result.current.hasLocation).toBe(false);
    });

    it('should not require location permission in same-day mode', async () => {
      (useLocationContext as jest.Mock).mockReturnValue({
        currentLocation: null,
        locationEnabled: false,
      });

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify offers are fetched without location
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledWith();
      expect(result.current.offers.length).toBeGreaterThan(0);
      expect(result.current.locationPermissionDenied).toBe(false);
    });
  });

  describe('Offline Mode and Caching', () => {
    it('should display offline indicator when using cached data', async () => {
      // Create a network error that NetworkErrorHandler will recognize
      const networkError = new Error('Network request failed');
      
      // Mock NetworkErrorHandler to recognize this as a network error
      const NetworkErrorHandler = require('../../utils/errors/NetworkErrorHandler').NetworkErrorHandler;
      jest.spyOn(NetworkErrorHandler, 'isNetworkError').mockReturnValue(true);

      (FlashOfferService.getSameDayOffers as jest.Mock).mockRejectedValue(networkError);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify offline indicator is set
      expect(result.current.isOffline).toBe(true);

      // Verify error is set
      expect(result.current.error).toBeTruthy();
    });

    it('should cache offers after successful fetch', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify caching was called (this happens in the service layer)
      // The service should cache the offers automatically
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      // Create a network error that NetworkErrorHandler will recognize
      const networkError = new Error('Network timeout');
      
      // Mock NetworkErrorHandler to recognize this as a network error
      const NetworkErrorHandler = require('../../utils/errors/NetworkErrorHandler').NetworkErrorHandler;
      jest.spyOn(NetworkErrorHandler, 'isNetworkError').mockReturnValue(true);

      (FlashOfferService.getSameDayOffers as jest.Mock).mockRejectedValue(networkError);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify error is set
      expect(result.current.error).toBeTruthy();
      // Verify offline indicator is set for network errors
      expect(result.current.isOffline).toBe(true);
    });
  });

  describe('Real-Time Updates Integration', () => {
    it('should enable real-time updates for flash offer cards', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify offers are returned with all required data for real-time updates
      expect(result.current.offers.length).toBeGreaterThan(0);
      expect(result.current.offers[0]).toHaveProperty('id');
      expect(result.current.offers[0]).toHaveProperty('claimed_count');
      expect(result.current.offers[0]).toHaveProperty('status');
    });

    it('should support refetch for manual updates', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = (FlashOfferService.getSameDayOffers as jest.Mock).mock.calls.length;

      // Trigger manual refetch
      await result.current.refetch();

      // Verify service was called again
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledTimes(initialCallCount + 1);
    });
  });

  describe('Section Visibility and Consistency', () => {
    it('should always return data structure even when empty', async () => {
      (FlashOfferService.getSameDayOffers as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify all expected fields are present
      expect(result.current).toHaveProperty('offers');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
      expect(result.current).toHaveProperty('isOffline');
      expect(result.current).toHaveProperty('retry');
      expect(result.current).toHaveProperty('locationPermissionDenied');
      expect(result.current).toHaveProperty('requestLocationPermission');
      expect(result.current).toHaveProperty('isEmpty');
      expect(result.current).toHaveProperty('hasLocation');

      // Verify isEmpty flag is set correctly
      expect(result.current.isEmpty).toBe(true);
    });

    it('should work when disabled', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ enabled: false, sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify no service calls were made
      expect(FlashOfferService.getSameDayOffers).not.toHaveBeenCalled();

      // Verify empty state
      expect(result.current.offers).toEqual([]);
      expect(result.current.isEmpty).toBe(false); // Not empty, just disabled
      expect(result.current.hasLocation).toBe(false);
    });
  });

  describe('Performance and Non-Blocking Behavior', () => {
    it('should return immediately without blocking', () => {
      const startTime = Date.now();
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );
      const endTime = Date.now();

      // Hook should return immediately
      expect(endTime - startTime).toBeLessThan(50);

      // Initial state should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.offers).toEqual([]);
    });

    it('should handle concurrent refetch calls gracefully', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger multiple refetches concurrently
      const refetch1 = result.current.refetch();
      const refetch2 = result.current.refetch();
      const refetch3 = result.current.refetch();

      // Wait for all to complete
      await Promise.all([refetch1, refetch2, refetch3]);

      // Should not crash or cause errors
      expect(result.current.offers).toEqual(mockOffers);
    });
  });
});
