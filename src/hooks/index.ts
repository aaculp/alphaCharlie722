/**
 * Custom Hooks for AlphaCharlie722
 * 
 * This module exports all custom React hooks used throughout the application.
 * These hooks encapsulate business logic and provide reusable functionality.
 * 
 * ## React Query Hooks
 * 
 * For data fetching and mutations, use React Query hooks:
 * - Query hooks: `src/hooks/queries/`
 * - Mutation hooks: `src/hooks/mutations/`
 * 
 * @see {@link ./queries/index.ts} for all query hooks
 * @see {@link ./mutations/index.ts} for all mutation hooks
 */

// ============================================================================
// React Query Hooks (Recommended)
// ============================================================================

/**
 * React Query Hooks - Modern data fetching with automatic caching
 * 
 * @example
 * ```tsx
 * import { useVenuesQuery } from './hooks/queries';
 * import { useCheckInMutation } from './hooks/mutations';
 * 
 * const { data: venues, isLoading } = useVenuesQuery({ filters: { featured: true } });
 * const { mutate: checkIn } = useCheckInMutation();
 * ```
 */
export * from './queries';
export * from './mutations';

// ============================================================================
// Legacy Hooks (Deprecated - Use React Query hooks instead)
// ============================================================================

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
 * @deprecated Use `useVenuesQuery` from './queries/useVenuesQuery' instead
 * 
 * useVenues - Fetches and manages venue data with search/filter support
 * 
 * This hook uses traditional state management. For better caching and performance,
 * use the React Query version: `useVenuesQuery`
 * 
 * @example
 * ```tsx
 * // Old way (deprecated)
 * const { venues, loading, error, refetch } = useVenues({
 *   featured: true,
 *   limit: 10
 * });
 * 
 * // New way (recommended)
 * import { useVenuesQuery } from './hooks/queries';
 * const { data: venues, isLoading, error, refetch } = useVenuesQuery({
 *   filters: { featured: true, limit: 10 }
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
 * @deprecated Use `useCheckInMutation` from './mutations/useCheckInMutation' instead
 * 
 * useCheckInActions - Provides check-in and check-out functionality
 * 
 * This hook uses traditional state management. For better optimistic updates and caching,
 * use the React Query version: `useCheckInMutation`
 * 
 * @example
 * ```tsx
 * // Old way (deprecated)
 * const { checkIn, checkOut, loading } = useCheckInActions({
 *   onCheckInSuccess: (checkIn) => console.log('Checked in!'),
 *   onCheckOutSuccess: () => console.log('Checked out!'),
 *   onError: (error) => Alert.alert('Error', error.message)
 * });
 * 
 * // New way (recommended)
 * import { useCheckInMutation } from './hooks/mutations';
 * const { mutate: checkIn, isPending } = useCheckInMutation({
 *   onSuccess: (checkIn) => console.log('Checked in!'),
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
 * @deprecated Use `useFriendsQuery` from './queries/useFriendsQuery' instead
 * 
 * useFriends - Manages friends and friend requests
 * 
 * This hook uses traditional state management. For better caching and performance,
 * use the React Query version: `useFriendsQuery` and `useAddFriendMutation`
 * 
 * @example
 * ```tsx
 * // Old way (deprecated)
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
 * 
 * // New way (recommended)
 * import { useFriendsQuery } from './hooks/queries';
 * import { useAddFriendMutation } from './hooks/mutations';
 * const { data: friends, isLoading } = useFriendsQuery({ userId: user.id });
 * const { mutate: addFriend } = useAddFriendMutation();
 * ```
 */
export { useFriends } from './useFriends';
export type { UseFriendsOptions, UseFriendsReturn } from './useFriends';

/**
 * @deprecated Use `useCollectionsQuery` from './queries/useCollectionsQuery' instead
 * 
 * useCollections - Manages user collections of venues
 * 
 * This hook uses traditional state management. For better caching and performance,
 * use the React Query version: `useCollectionsQuery` and collection mutation hooks
 * 
 * @example
 * ```tsx
 * // Old way (deprecated)
 * const {
 *   collections,
 *   loading,
 *   createCollection,
 *   addVenue,
 *   deleteCollection,
 * } = useCollections();
 * 
 * // New way (recommended)
 * import { useCollectionsQuery } from './hooks/queries';
 * import { useCreateCollectionMutation, useAddVenueToCollectionMutation } from './hooks/mutations';
 * const { data: collections, isLoading } = useCollectionsQuery({ userId: user.id });
 * const { mutate: createCollection } = useCreateCollectionMutation();
 * const { mutate: addVenue } = useAddVenueToCollectionMutation();
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

/**
 * useHapticFeedback - Provides haptic feedback for swipe interactions
 * 
 * @example
 * ```tsx
 * const { triggerSuccess, triggerError, triggerWarning, triggerSelection } = useHapticFeedback();
 * triggerSuccess(); // On successful check-in
 * triggerError();   // On failed action
 * ```
 */
export { useHapticFeedback } from './useHapticFeedback';
export type { UseHapticFeedbackReturn } from './useHapticFeedback';

/**
 * useSwipeGesture - Encapsulates swipe gesture logic for venue cards
 * 
 * @example
 * ```tsx
 * const { panGesture, translateX, leftActionOpacity, rightActionOpacity, animatedCardStyle } = useSwipeGesture({
 *   isCheckedIn: false,
 *   onCheckIn: async () => { ... },
 *   onCheckOut: async () => { ... },
 *   onError: (error) => { ... }
 * });
 * ```
 */
export { useSwipeGesture } from './useSwipeGesture';
export type { UseSwipeGestureOptions, UseSwipeGestureReturn } from './useSwipeGesture';

/**
 * usePhotoSelection - Handles photo selection from library or camera
 * 
 * @example
 * ```tsx
 * const { selectedPhotoUri, isSelecting, showPhotoOptions } = usePhotoSelection({
 *   onPhotoSelected: (uri) => console.log('Photo selected:', uri),
 *   onError: (error) => Alert.alert('Error', error)
 * });
 * ```
 */
export { usePhotoSelection } from './usePhotoSelection';
export type { UsePhotoSelectionOptions, UsePhotoSelectionReturn } from './usePhotoSelection';

/**
 * useProfilePhotoUpload - Handles profile photo selection and upload
 * 
 * @example
 * ```tsx
 * const { isUploading, selectAndUploadPhoto } = useProfilePhotoUpload({
 *   userId: user.id,
 *   onUploadSuccess: (url) => console.log('Uploaded:', url),
 *   onUploadError: (error) => Alert.alert('Error', error)
 * });
 * ```
 */
export { useProfilePhotoUpload } from './useProfilePhotoUpload';
export type { UseProfilePhotoUploadOptions, UseProfilePhotoUploadReturn } from './useProfilePhotoUpload';

/**
 * useAboutMe - Manages About Me section state and operations
 * 
 * @example
 * ```tsx
 * const { aboutText, isEditing, isSaving, toggleEdit, saveAboutText } = useAboutMe('Initial text');
 * ```
 */
export { useAboutMe } from './useAboutMe';

/**
 * useNotificationPreferences - Manages notification preferences for the current user
 * 
 * @example
 * ```tsx
 * const { preferences, loading, updatePreference } = useNotificationPreferences();
 * await updatePreference('friend_requests', true);
 * ```
 */
export { useNotificationPreferences } from './useNotificationPreferences';

/**
 * useFlashOffers - Fetches active flash offers near the user's current location
 * 
 * @example
 * ```tsx
 * const { offers, loading, error, refetch } = useFlashOffers({
 *   radiusMiles: 10,
 *   enabled: true
 * });
 * ```
 */
export { useFlashOffers } from './useFlashOffers';
export type {
  UseFlashOffersOptions,
  UseFlashOffersReturn,
  FlashOfferWithVenueName,
} from './useFlashOffers';

/**
 * useCountdownTimer - Creates a countdown timer that updates every second
 * 
 * @example
 * ```tsx
 * const { timeRemaining, isExpired, totalSeconds } = useCountdownTimer(offer.end_time);
 * ```
 */
export { useCountdownTimer, useClaimExpirationTimer } from './useCountdownTimer';
export type { CountdownResult } from './useCountdownTimer';

/**
 * useRealtimeOffer - Subscribes to real-time updates for a flash offer
 * 
 * @example
 * ```tsx
 * const { offer, loading, refetch } = useRealtimeOffer({
 *   offerId: 'offer-123',
 *   onOfferFull: () => Alert.alert('Offer Full'),
 *   onOfferExpired: () => Alert.alert('Offer Expired')
 * });
 * ```
 */
export { useRealtimeOffer } from './useRealtimeOffer';
export type { UseRealtimeOfferOptions, UseRealtimeOfferReturn } from './useRealtimeOffer';
