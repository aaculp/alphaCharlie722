import { useState, useEffect, useCallback } from 'react';
import { FlashOfferService, FlashOffer } from '../services/api/flashOffers';
import { useLocationContext } from '../contexts/LocationContext';
import { NetworkErrorHandler } from '../utils/errors/NetworkErrorHandler';
import { PermissionHandler } from '../utils/permissions/PermissionHandler';

interface UseFlashOffersOptions {
  radiusMiles?: number;
  enabled?: boolean;
  sameDayMode?: boolean;
}

export interface FlashOfferWithVenueName extends FlashOffer {
  venue_name: string;
  distance_miles?: number;
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
  isEmpty: boolean;
  hasLocation: boolean;
}

/**
 * Hook to fetch active flash offers near the user's current location
 * 
 * @param options - Configuration options
 * @param options.radiusMiles - Search radius in miles (default: 10)
 * @param options.enabled - Whether to fetch offers (default: true)
 * @param options.sameDayMode - Enable same-day filtering regardless of location (default: false)
 * 
 * @returns Object containing offers, loading state, error, refetch function, offline status, retry function, permission status, isEmpty flag, and hasLocation flag
 */
export const useFlashOffers = (options: UseFlashOffersOptions = {}): UseFlashOffersReturn => {
  const { radiusMiles = 10, enabled = true, sameDayMode = false } = options;
  const { currentLocation, locationEnabled } = useLocationContext();
  
  const [offers, setOffers] = useState<FlashOfferWithVenueName[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [hasLocation, setHasLocation] = useState<boolean>(false);

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
    }
    // Note: fetchOffers will be called by the useEffect when location changes
  }, []);

  const fetchOffers = useCallback(async () => {
    // Don't fetch if disabled
    if (!enabled) {
      setOffers([]);
      setLoading(false);
      setError(null);
      setIsOffline(false);
      setIsEmpty(false);
      setHasLocation(false);
      return;
    }

    // In same-day mode, location permission is optional
    if (sameDayMode) {
      setLoading(true);
      setError(null);

      try {
        // Check if location is available (but don't require it)
        const locationAvailable = locationEnabled && currentLocation;
        setHasLocation(!!locationAvailable);

        // Fetch same-day offers with optional location
        const fetchedOffers = locationAvailable
          ? await FlashOfferService.getSameDayOffers({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              radiusMiles,
              prioritizeNearby: true,
            })
          : await FlashOfferService.getSameDayOffers();
        
        setOffers(fetchedOffers);
        setIsEmpty(fetchedOffers.length === 0);
        setIsOffline(false);
        console.log(`✅ Fetched ${fetchedOffers.length} same-day flash offers`);
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
      return;
    }

    // Original location-based mode (backward compatibility)
    // Check location permission first
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      setOffers([]);
      setLoading(false);
      setError(new Error('Location permission is required'));
      setIsOffline(false);
      setIsEmpty(false);
      setHasLocation(false);
      return;
    }

    // Check if location is available
    if (!locationEnabled || !currentLocation) {
      setOffers([]);
      setLoading(false);
      setError(null);
      setIsOffline(false);
      setIsEmpty(false);
      setHasLocation(false);
      return;
    }

    setHasLocation(true);
    setLoading(true);
    setError(null);

    try {
      const fetchedOffers = await FlashOfferService.getActiveOffers(
        currentLocation.latitude,
        currentLocation.longitude,
        radiusMiles
      );
      
      setOffers(fetchedOffers);
      setIsEmpty(fetchedOffers.length === 0);
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
  }, [currentLocation, locationEnabled, radiusMiles, enabled, sameDayMode, checkLocationPermission]);

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
    isEmpty,
    hasLocation,
  };
};
