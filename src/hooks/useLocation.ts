import { useState, useEffect, useCallback } from 'react';
import { LocationService, LocationCoordinates } from '../services/locationService';

export interface UseLocationReturn {
  location: LocationCoordinates | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasPermission: boolean | null;
}

/**
 * Custom hook for accessing user's location
 * 
 * @param autoFetch - Whether to automatically fetch location on mount (default: false)
 * @returns Location data, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const { location, loading, error, refetch } = useLocation();
 * 
 * if (loading) return <Text>Getting location...</Text>;
 * if (error) return <Text>Error: {error.message}</Text>;
 * if (location) return <Text>Lat: {location.latitude}, Lon: {location.longitude}</Text>;
 * ```
 */
export function useLocation(autoFetch: boolean = false): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const fetchLocation = useCallback(async () => {
    try {
      console.log('📍 Fetching user location...');
      setLoading(true);
      setError(null);

      const coords = await LocationService.getCurrentLocation();
      
      console.log('✅ Location fetched:', coords);
      setLocation(coords);
      setHasPermission(true);
    } catch (err) {
      const locationError = err instanceof Error ? err : new Error('Failed to get location');
      setError(locationError);
      setHasPermission(false);
      console.error('❌ Location fetch failed:', locationError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch, fetchLocation]);

  return {
    location,
    loading,
    error,
    refetch: fetchLocation,
    hasPermission,
  };
}
