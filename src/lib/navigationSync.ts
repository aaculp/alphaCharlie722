/**
 * Navigation Sync for React Query
 * 
 * Integrates React Navigation with React Query to:
 * - Invalidate queries when navigating back from detail screens
 * - Prefetch data when navigating to detail screens
 * - Track navigation events for intelligent cache management
 * 
 * This ensures users always see fresh data when returning to list screens
 * and experience instant loading when navigating to detail screens.
 */

import type { QueryClient } from '@tanstack/react-query';
import type { NavigationContainerRef } from '@react-navigation/native';
import { queryKeys } from './queryKeys';
import { VenueService } from '../services/api/venues';

/**
 * Configuration for navigation sync
 */
export interface NavigationSyncConfig {
  queryClient: QueryClient;
  navigationRef: React.RefObject<NavigationContainerRef<any>>;
}

/**
 * Track the previous route for navigation detection
 */
let previousRoute: { name: string; params?: any } | null = null;

/**
 * Get the current route from navigation state
 */
function getCurrentRoute(navigationRef: React.RefObject<NavigationContainerRef<any>>) {
  if (!navigationRef.current) {
    return null;
  }

  const route = navigationRef.current.getCurrentRoute();
  return route ? { name: route.name, params: route.params } : null;
}

/**
 * Set up navigation sync with React Query
 * 
 * Listens to navigation state changes and:
 * 1. Invalidates venue list queries when returning from VenueDetail to Home
 * 2. Prefetches venue details when navigating to VenueDetail
 * 3. Tracks navigation events for cache management
 * 
 * @param config - Configuration object with queryClient and navigationRef
 * @returns Cleanup function to remove navigation listener
 */
export function setupNavigationSync(config: NavigationSyncConfig): () => void {
  const { queryClient, navigationRef } = config;

  console.log('🧭 Setting up navigation sync with React Query');

  // Navigation state change listener
  const unsubscribe = navigationRef.current?.addListener('state', () => {
    const currentRoute = getCurrentRoute(navigationRef);

    if (!currentRoute) {
      return;
    }

    console.log('🧭 Navigation state changed:', {
      from: previousRoute?.name,
      to: currentRoute.name,
      params: currentRoute.params,
    });

    // Handle navigation from VenueDetail back to Home
    if (
      previousRoute?.name === 'VenueDetail' &&
      (currentRoute.name === 'HomeList' || currentRoute.name === 'SearchList')
    ) {
      console.log('🔄 Invalidating venue list queries (returned from VenueDetail)');
      
      // Invalidate venue list queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.venues.lists(),
      });
    }

    // Handle navigation to VenueDetail - prefetch venue data
    if (currentRoute.name === 'VenueDetail' && currentRoute.params?.venueId) {
      const venueId = currentRoute.params.venueId as string;
      
      console.log('⚡ Prefetching venue details:', venueId);
      
      // Prefetch venue details for instant loading
      queryClient.prefetchQuery({
        queryKey: queryKeys.venues.detail(venueId),
        queryFn: () => VenueService.getVenueById(venueId),
        staleTime: 30000, // Consider fresh for 30 seconds
      });
    }

    // Update previous route for next comparison
    previousRoute = currentRoute;
  });

  // Return cleanup function
  return () => {
    console.log('🧭 Cleaning up navigation sync');
    if (unsubscribe) {
      unsubscribe();
    }
    previousRoute = null;
  };
}
