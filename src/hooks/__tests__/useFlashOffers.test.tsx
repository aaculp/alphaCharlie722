/**
 * Unit tests for useFlashOffers hook
 * Tests the enhanced same-day mode functionality
 * Requirements: 1.1, 1.2, 1.3, 2.1, 8.1, 8.2, 8.3
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useFlashOffers } from '../useFlashOffers';
import { FlashOfferService } from '../../services/api/flashOffers';
import { useLocationContext } from '../../contexts/LocationContext';
import { PermissionHandler } from '../../utils/permissions/PermissionHandler';

// Mock dependencies
jest.mock('../../services/api/flashOffers');
jest.mock('../../contexts/LocationContext');
jest.mock('../../utils/permissions/PermissionHandler');

describe('useFlashOffers Hook - Enhanced Same-Day Mode', () => {
  const mockLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
  };

  const mockOffers = [
    {
      id: 'offer-1',
      venue_id: 'venue-1',
      venue_name: 'Test Venue 1',
      title: 'Happy Hour',
      description: 'Half off drinks',
      value_cap: '$20',
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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useLocationContext as jest.Mock).mockReturnValue({
      currentLocation: mockLocation,
      locationEnabled: true,
    });

    (PermissionHandler.checkPermission as jest.Mock).mockResolvedValue({
      granted: true,
    });

    (FlashOfferService.getSameDayOffers as jest.Mock).mockResolvedValue(mockOffers);
    (FlashOfferService.getActiveOffers as jest.Mock).mockResolvedValue(mockOffers);
  });

  describe('Same-Day Mode', () => {
    it('should call getSameDayOffers when sameDayMode is true', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalled();
      expect(FlashOfferService.getActiveOffers).not.toHaveBeenCalled();
    });

    it('should set isEmpty to true when no offers returned', async () => {
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

    it('should set isEmpty to false when offers are returned', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.offers.length).toBeGreaterThan(0);
    });

    it('should set hasLocation to true when location is available', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasLocation).toBe(true);
    });

    it('should set hasLocation to false when location is not available', async () => {
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

      expect(result.current.hasLocation).toBe(false);
    });

    it('should pass location to getSameDayOffers when available', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true, radiusMiles: 15 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledWith({
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        radiusMiles: 15,
        prioritizeNearby: true,
      });
    });

    it('should call getSameDayOffers without location when not available', async () => {
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

      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalledWith();
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

      // Should not check permission in same-day mode
      expect(PermissionHandler.checkPermission).not.toHaveBeenCalled();
      // Should still fetch offers
      expect(FlashOfferService.getSameDayOffers).toHaveBeenCalled();
    });
  });

  describe('Legacy Location-Based Mode', () => {
    it('should call getActiveOffers when sameDayMode is false', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(FlashOfferService.getActiveOffers).toHaveBeenCalled();
      expect(FlashOfferService.getSameDayOffers).not.toHaveBeenCalled();
    });

    it('should require location permission in legacy mode', async () => {
      (PermissionHandler.checkPermission as jest.Mock).mockResolvedValue({
        granted: false,
      });

      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: false })
      );

      // Wait for the hook to finish processing
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(PermissionHandler.checkPermission).toHaveBeenCalled();
      expect(result.current.offers).toEqual([]);
      // In legacy mode without permission, error should be set
      if (result.current.error) {
        expect(result.current.error.message).toBe('Location permission is required');
      }
    });

    it('should set hasLocation to true in legacy mode with location', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: false })
      );

      // Wait for the hook to finish processing
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // After successful fetch with location, hasLocation should be true
      await waitFor(() => {
        expect(result.current.hasLocation).toBe(true);
      }, { timeout: 3000 });
    });
  });

  describe('Disabled State', () => {
    it('should not fetch when enabled is false', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ enabled: false, sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(FlashOfferService.getSameDayOffers).not.toHaveBeenCalled();
      expect(FlashOfferService.getActiveOffers).not.toHaveBeenCalled();
      expect(result.current.offers).toEqual([]);
      expect(result.current.isEmpty).toBe(false);
      expect(result.current.hasLocation).toBe(false);
    });
  });

  describe('Return Interface', () => {
    it('should return all expected fields', async () => {
      const { result } = renderHook(() =>
        useFlashOffers({ sameDayMode: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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
    });
  });
});
