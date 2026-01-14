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

/**
 * useCheckInHistory - Fetches user's check-in history with pagination
 * 
 * @example
 * ```tsx
 * const { checkIns, loading, refetch, loadMore, hasMore } = useCheckInHistory({
 *   enabled: true,
 *   daysBack: 30
 * });
 * ```
 */
export { useCheckInHistory } from './useCheckInHistory';
export type { UseCheckInHistoryOptions, UseCheckInHistoryReturn } from './useCheckInHistory';

// Social Hooks

/**
 * useFriends - Manages friends and friend requests
 * 
 * @example
 * ```tsx
 * const {
 *   friends,
 *   closeFriends,
 *   friendRequests,
 *   loading,
 *   sendFriendRequest,
 *   acceptRequest,
 *   removeFriend,
 *   addCloseFriend,
 * } = useFriends();
 * ```
 */
export { useFriends } from './useFriends';
export type { UseFriendsOptions, UseFriendsReturn } from './useFriends';

/**
 * useCollections - Manages user collections of venues
 * 
 * @example
 * ```tsx
 * const {
 *   collections,
 *   loading,
 *   createCollection,
 *   addVenue,
 *   deleteCollection,
 * } = useCollections();
 * ```
 */
export { useCollections } from './useCollections';
export type { UseCollectionsOptions, UseCollectionsReturn } from './useCollections';

/**
 * useSharedVenues - Manages venue sharing between users
 * 
 * @example
 * ```tsx
 * const {
 *   receivedShares,
 *   sentShares,
 *   loading,
 *   shareVenue,
 *   markAsViewed,
 * } = useSharedVenues();
 * ```
 */
export { useSharedVenues } from './useSharedVenues';
export type { UseSharedVenuesOptions, UseSharedVenuesReturn } from './useSharedVenues';

/**
 * useFriendActivity - Fetches and manages friend activity feed
 * 
 * @example
 * ```tsx
 * const {
 *   activities,
 *   loading,
 *   hasMore,
 *   loadMore,
 *   refetch,
 * } = useFriendActivity({
 *   limit: 20,
 *   filter: 'checkins',
 * });
 * ```
 */
export { useFriendActivity } from './useFriendActivity';
export type { UseFriendActivityOptions, UseFriendActivityReturn } from './useFriendActivity';

/**
 * useSocialNotifications - Manages social notifications
 * 
 * @example
 * ```tsx
 * const {
 *   notifications,
 *   unreadCount,
 *   loading,
 *   markAsRead,
 *   markAllAsRead,
 * } = useSocialNotifications({
 *   pollInterval: 30000,
 * });
 * ```
 */
export { useSocialNotifications } from './useSocialNotifications';
export type { UseSocialNotificationsOptions, UseSocialNotificationsReturn } from './useSocialNotifications';

/**
 * useNewVenues - Fetches new venues in the spotlight period (last 30 days)
 * 
 * @example
 * ```tsx
 * const { venues, loading, error, refetch } = useNewVenues({
 *   limit: 10
 * });
 * ```
 */
export { useNewVenues } from './useNewVenues';
export type { UseNewVenuesOptions, UseNewVenuesReturn } from './useNewVenues';