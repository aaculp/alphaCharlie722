/**
 * Query Key Factory
 * 
 * Centralized, type-safe query key generation for React Query.
 * Provides hierarchical key structure for efficient cache invalidation.
 * 
 * Key Structure:
 * - First element: Entity type (e.g., 'venues', 'users')
 * - Subsequent elements: Specific identifiers, filters, or subtypes
 * 
 * Examples:
 * - ['venues'] - All venue queries
 * - ['venues', 'list'] - All venue list queries
 * - ['venues', 'list', { category: 'restaurant' }] - Filtered venue list
 * - ['venues', 'detail', 'venue-123'] - Specific venue detail
 * - ['users', 'user-456', 'profile'] - User profile
 * 
 * Usage:
 * - Use const assertions (as const) for type safety
 * - Invalidate hierarchically (e.g., invalidate all venue queries)
 * - Keep keys consistent across the application
 */

import type { VenueQueryOptions } from '../types/venue.types';
import type { FlashOfferQueryOptions } from '../types/flashOffer.types';

/**
 * Venue query keys
 * Supports venue lists with filters and individual venue details
 */
export const venueKeys = {
  all: ['venues'] as const,
  lists: () => [...venueKeys.all, 'list'] as const,
  list: (filters?: VenueQueryOptions) => [...venueKeys.lists(), filters] as const,
  details: () => [...venueKeys.all, 'detail'] as const,
  detail: (id: string) => [...venueKeys.details(), id] as const,
} as const;

/**
 * Check-in query keys
 * Supports check-ins by user and by venue
 */
export const checkInKeys = {
  all: ['check-ins'] as const,
  byUser: (userId: string) => [...checkInKeys.all, 'user', userId] as const,
  byVenue: (venueId: string) => [...checkInKeys.all, 'venue', venueId] as const,
} as const;

/**
 * Flash offer query keys
 * Supports flash offers by venue with optional filters
 */
export const flashOfferKeys = {
  all: ['flash-offers'] as const,
  byVenue: (venueId: string, filters?: FlashOfferQueryOptions) => 
    [...flashOfferKeys.all, 'venue', venueId, filters] as const,
} as const;

/**
 * User query keys
 * Supports user profiles, friends lists, user search, and other user-related data
 */
export const userKeys = {
  all: ['users'] as const,
  profile: (userId: string) => [...userKeys.all, userId, 'profile'] as const,
  friends: (userId: string) => [...userKeys.all, userId, 'friends'] as const,
  search: (searchQuery: string) => [...userKeys.all, 'search', searchQuery] as const,
} as const;

/**
 * Collection query keys
 * Supports user collections and individual collection details
 */
export const collectionKeys = {
  all: ['collections'] as const,
  byUser: (userId: string) => [...collectionKeys.all, 'user', userId] as const,
  detail: (collectionId: string) => [...collectionKeys.all, collectionId] as const,
} as const;

/**
 * Activity feed query keys
 * Supports activity feeds by user
 */
export const activityFeedKeys = {
  byUser: (userId: string) => ['activity-feed', userId] as const,
} as const;

/**
 * Centralized query keys object
 * Export all query key factories in a single object for convenience
 */
export const queryKeys = {
  venues: venueKeys,
  checkIns: checkInKeys,
  flashOffers: flashOfferKeys,
  users: userKeys,
  collections: collectionKeys,
  activityFeed: activityFeedKeys,
} as const;
