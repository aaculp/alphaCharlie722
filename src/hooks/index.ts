/**
 * Custom Hooks for AlphaCharlie722
 * 
 * This module exports all custom React hooks used throughout the application.
 * These hooks encapsulate business logic and provide reusable functionality.
 */

// Utility Hooks
export { useEngagementColor } from './useEngagementColor';
export type { EngagementColorResult } from './useEngagementColor';

/**
 * useDebounce - Debounces a value to prevent excessive updates
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebounce(searchQuery, 300);
 * ```
 */
export { useDebounce } from './useDebounce';

/**
 * useVenues - Fetches and manages venue data with search/filter support
 * 
 * @example
 * ```tsx
 * const { venues, loading, error, refetch } = useVenues({
 *   featured: true,
 *   limit: 10
 * });
 * ```
 */
export { useVenues } from './useVenues';
export type { UseVenuesOptions, UseVenuesReturn } from './useVenues';

/**
 * useFavorites - Manages user favorites with optimistic updates
 * 
 * @example
 * ```tsx
 * const { favorites, toggleFavorite, isFavorite, loading } = useFavorites();
 * const isVenueFavorited = isFavorite('venue-123');
 * await toggleFavorite('venue-123');
 * ```
 */
export { useFavorites } from './useFavorites';
export type { UseFavoritesReturn } from './useFavorites';

/**
 * useCheckInStats - Fetches check-in statistics for venues
 * 
 * @example
 * ```tsx
 * const { stats, loading, error } = useCheckInStats({
 *   venueIds: ['venue-1', 'venue-2'],
 *   enabled: true
 * });
 * ```
 */
export { useCheckInStats } from './useCheckInStats';
export type { UseCheckInStatsOptions, UseCheckInStatsReturn } from './useCheckInStats';

/**
 * useCheckInActions - Provides check-in and check-out functionality
 * 
 * @example
 * ```tsx
 * const { checkIn, checkOut, loading } = useCheckInActions({
 *   onCheckInSuccess: (checkIn) => console.log('Checked in!'),
 *   onCheckOutSuccess: () => console.log('Checked out!'),
 *   onError: (error) => Alert.alert('Error', error.message)
 * });
 * ```
 */
export { useCheckInActions } from './useCheckInActions';
export type { UseCheckInActionsOptions, UseCheckInActionsReturn } from './useCheckInActions';