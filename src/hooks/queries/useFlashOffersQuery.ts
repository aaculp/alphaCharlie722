/**
 * Flash Offers Query Hook
 * 
 * React Query hook for fetching same-day flash offers with location-based sorting.
 * Integrates with React Query cache invalidation system for real-time updates.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { FlashOfferService, FlashOffer } from '../../services/api/flashOffers';
import { queryKeys } from '../../lib/queryKeys';
import { useLocationContext } from '../../contexts/LocationContext';

export interface FlashOfferWithVenueName extends FlashOffer {
  venue_name: string;
  distance_miles?: number;
}

interface UseFlashOffersQueryOptions {
  radiusMiles?: number;
  enabled?: boolean;
  sameDayMode?: boolean;
}

interface UseFlashOffersQueryReturn extends UseQueryResult<FlashOfferWithVenueName[], Error> {
  offers: FlashOfferWithVenueName[];
  hasLocation: boolean;
  isEmpty: boolean;
}

/**
 * React Query hook for fetching same-day flash offers
 * 
 * Features:
 * - Automatic cache invalidation when claims are redeemed
 * - Location-based sorting when available
 * - Offline support with cached data
 * - Automatic refetch on window focus
 * - Stale-while-revalidate pattern
 * 
 * @param options - Query configuration options
 * @returns Query result with offers, loading state, and error
 * 
 * @example
 * ```typescript
 * const { offers, isLoading, refetch } = useFlashOffersQuery({
 *   radiusMiles: 10,
 *   sameDayMode: true,
 * });
 * ```
 */
export function useFlashOffersQuery(
  options: UseFlashOffersQueryOptions = {}
): UseFlashOffersQueryReturn {
  const { radiusMiles = 10, enabled = true, sameDayMode = false } = options;
  const { currentLocation, locationEnabled } = useLocationContext();

  const hasLocation = locationEnabled && !!currentLocation;

  const query = useQuery({
    // Query key includes location to refetch when location changes
    queryKey: queryKeys.flashOffers.sameDayOffers(
      hasLocation ? currentLocation : undefined,
      radiusMiles
    ),
    
    queryFn: async () => {
      if (sameDayMode) {
        // Fetch same-day offers with optional location
        return await FlashOfferService.getSameDayOffers(
          hasLocation
            ? {
                latitude: currentLocation!.latitude,
                longitude: currentLocation!.longitude,
                radiusMiles,
                prioritizeNearby: true,
              }
            : undefined
        );
      } else {
        // Original location-based mode (backward compatibility)
        if (!hasLocation) {
          return [];
        }
        
        return await FlashOfferService.getActiveOffers(
          currentLocation!.latitude,
          currentLocation!.longitude,
          radiusMiles
        );
      }
    },
    
    enabled,
    
    // Requirement 4.2: Cache for 2 minutes (120 seconds)
    staleTime: 2 * 60 * 1000, // 2 minutes
    
    // Requirement 4.4: Keep cached data for 5 minutes after becoming stale
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    
    // Requirement 4.5: Refetch on window focus and every 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    
    // Requirement 4.3: Show stale data while refetching
    refetchOnMount: 'always',
    
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    offers: query.data || [],
    hasLocation,
    isEmpty: (query.data?.length || 0) === 0,
  };
}
