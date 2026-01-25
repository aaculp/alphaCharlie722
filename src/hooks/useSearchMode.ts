/**
 * useSearchMode Hook
 * 
 * Detects search mode based on @ prefix and cleans the query for API calls.
 * This hook is the core of the dual-mode search functionality, enabling
 * seamless switching between venue and user search.
 * 
 * Search Mode Detection Logic:
 * - If query starts with '@' → User search mode
 * - Otherwise → Venue search mode (default)
 * 
 * Query Cleaning:
 * - User mode: Removes the '@' prefix before API call
 * - Venue mode: Returns query unchanged
 * 
 * @param searchQuery - The raw search query from user input
 * @returns Object containing the detected mode and cleaned query
 * 
 * Requirements:
 * - 3.1: Detect user search mode when query starts with @
 * - 3.2: Use venue search mode when query doesn't start with @
 * - 3.3: Remove @ prefix before sending query to API
 * 
 * @example
 * ```typescript
 * // User search
 * const { mode, cleanQuery } = useSearchMode('@john_doe');
 * console.log(mode);        // 'user'
 * console.log(cleanQuery);  // 'john_doe'
 * 
 * // Venue search
 * const { mode, cleanQuery } = useSearchMode('coffee shop');
 * console.log(mode);        // 'venue'
 * console.log(cleanQuery);  // 'coffee shop'
 * ```
 */

import { useMemo } from 'react';
import type { SearchMode } from '../types/search.types';

interface UseSearchModeResult {
  mode: SearchMode;
  cleanQuery: string;
}

export const useSearchMode = (searchQuery: string): UseSearchModeResult => {
  return useMemo(() => {
    // Check if query starts with @ to determine search mode (Requirement 3.1, 3.2)
    const isUserSearch = searchQuery.startsWith('@');
    return {
      mode: isUserSearch ? 'user' : 'venue',
      // Remove @ prefix for API calls in user mode (Requirement 3.3)
      cleanQuery: isUserSearch ? searchQuery.slice(1) : searchQuery,
    };
  }, [searchQuery]); // Memoized to prevent unnecessary recalculations
};
