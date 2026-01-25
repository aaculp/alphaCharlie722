/**
 * Search type definitions for the @ Search Feature
 * 
 * This module defines types for:
 * - Search modes (venue vs user search)
 * - User search results
 * - Search state management
 */

import type { Venue } from './venue.types';

/**
 * Search mode type
 * - 'venue': Default search mode for finding venues
 * - 'user': User search mode triggered by @ prefix
 */
export type SearchMode = 'venue' | 'user';

/**
 * User search result type
 * Contains minimal user profile information for search results
 */
export type UserSearchResult = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

/**
 * Search state type
 * Manages the complete search state including mode, queries, and results
 */
export type SearchState = {
  mode: SearchMode;
  query: string;
  debouncedQuery: string;
  isLoading: boolean;
  venueResults: Venue[];
  userResults: UserSearchResult[];
};
