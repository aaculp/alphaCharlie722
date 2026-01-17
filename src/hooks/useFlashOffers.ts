import { useState, useEffect, useCallback } from 'react';
import { FlashOfferService, FlashOffer } from '../services/api/flashOffers';
import { useLocationContext } from '../contexts/LocationContext';
import { NetworkErrorHandler } from '../utils/errors/NetworkErrorHandler';
import { PermissionHandler } from '../utils/permissions/PermissionHandler';

interface UseFlashOffersOptions {
  radiusMiles?: number;
  enabled?: boolean;
}

export interface FlashOfferWithVenueName extends FlashOffer {
  venue_name: string;
}

export interface UseFlashOffersReturn {
  offers: FlashOfferWithVenueName[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isOffline: boolean;
  retry: () => Promise<void>;
  locationPermissionDenied: boolean;
  requestLocationPermission: () => Promise<void>;
}

/**
 * Hook to fetch active flash offers near the user's current location
 * 
 * @param options - Configuration options
 * @param options.radiusMiles - Search radius in miles (default: 10)
 * @param options.enabled - Whether to fetch offers (default: true)
 * 
 * @returns Object containing offers, loading state, error, refetch function, offline status, retry function, and permission status
 */
export const useFlashOffers = (options: UseFlashOffersOptions = {}): UseFlashOffersReturn => {
  const { radiusMiles = 10, enabled = true } = options;
  const { currentLocation, locationEnabled } = useLocationContext();
  
  const [offers, setOffers] = useState<FlashOfferWithVenueName[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);

  const checkLocationPermission = useCallback(async () => {
    const result = await PermissionHandler.checkPermission('location');
    setLocationPermissionDenied(!result.granted);
    return result.granted;
  }, []);

  const requestLocationPermission = useCallback(async () => {
    const result = await PermissionHandler.requestPermission('location');
    setLocationPermissionDenied(!result.granted);
    
    if (!result.granted) {
      PermissionHandler.showPermissionAlert('location', result);
    } else {
      // Permission granted, refetch offers
      await fetchOffers();
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    // Don't fetch if disabled
    if (!enabled) {
      setOffers([]);
      setLoading(false);
      setError(null);
      setIsOffline(false);
      return;
    }

    // Check location permission first
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      setOffers([]);
      setLoading(false);
      setError(new Error('Location permission is required'));
      setIsOffline(false);
      return;
    }

    // Check if location is available
    if (!locationEnabled || !currentLocation) {
      setOffers([]);
      setLoading(false);
      setError(null);
      setIsOffline(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedOffers = await FlashOfferService.getActiveOffers(
        currentLocation.latitude,
        currentLocation.longitude,
        radiusMiles
      );
      
      setOffers(fetchedOffers);
      setIsOffline(false);
      console.log(`✅ Fetched ${fetchedOffers.length} flash offers within ${radiusMiles} miles`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch flash offers');
      setError(error);
      
      // Check if it's a network error
      const isNetworkErr = NetworkErrorHandler.isNetworkError(err);
      setIsOffline(isNetworkErr);
      
      if (isNetworkErr) {
        console.log('📡 Offline mode: Using cached data if available');
      } else {
        console.error('Error fetching flash offers:', error);
      }
      
      // Don't clear offers if we have cached data
      // The service will return cached data on network errors
    } finally {
      setLoading(false);
    }
  }, [currentLocation, locationEnabled, radiusMiles, enabled, checkLocationPermission]);

  const retry = useCallback(async () => {
    setError(null);
    setIsOffline(false);
    await fetchOffers();
  }, [fetchOffers]);

  // Fetch offers when location changes or when enabled
  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return {
    offers,
    loading,
    error,
    refetch: fetchOffers,
    isOffline,
    retry,
    locationPermissionDenied,
    requestLocationPermission,
  };
};
