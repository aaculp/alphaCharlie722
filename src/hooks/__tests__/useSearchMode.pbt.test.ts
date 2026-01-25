/**
 * Property-Based Tests for useSearchMode Hook
 * Feature: at-search-feature
 */

import * as fc from 'fast-check';
import { renderHook } from '@testing-library/react-native';
import { useSearchMode } from '../useSearchMode';

describe('useSearchMode - Property-Based Tests', () => {
  describe('Property 8: Search Mode Detection', () => {
    /**
     * Feature: at-search-feature, Property 8: Search Mode Detection
     * Validates: Requirements 3.1, 3.2
     *
     * For any search query string, the search mode should be 'user' if and only if
     * the string starts with @, otherwise it should be 'venue'.
     */
    it('should return user mode for any query starting with @', () => {
      fc.assert(
        fc.property(
          fc.string(), // Any string to append after @
          (suffix) => {
            const searchQuery = '@' + suffix;
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            expect(result.current.mode).toBe('user');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return venue mode for any query not starting with @', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !s.startsWith('@')), // Any string not starting with @
          (searchQuery) => {
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            expect(result.current.mode).toBe('venue');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return venue mode for empty string', () => {
      const { result } = renderHook(() => useSearchMode(''));
      expect(result.current.mode).toBe('venue');
    });

    it('should consistently detect mode regardless of query content after @', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // Any non-empty string
          (suffix) => {
            const userQuery = '@' + suffix;
            const venueQuery = suffix.startsWith('@') ? suffix.slice(1) : suffix;
            
            const { result: userResult } = renderHook(() => useSearchMode(userQuery));
            const { result: venueResult } = renderHook(() => useSearchMode(venueQuery));
            
            // User query should always be 'user' mode
            expect(userResult.current.mode).toBe('user');
            // Venue query (without @) should always be 'venue' mode
            if (!venueQuery.startsWith('@')) {
              expect(venueResult.current.mode).toBe('venue');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple @ symbols (only first matters)', () => {
      fc.assert(
        fc.property(
          fc.string(), // Any string
          (suffix) => {
            const searchQuery = '@@' + suffix; // Multiple @ symbols
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            // Should still be user mode because it starts with @
            expect(result.current.mode).toBe('user');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Query Prefix Removal', () => {
    /**
     * Feature: at-search-feature, Property 9: Query Prefix Removal
     * Validates: Requirements 3.3
     *
     * For any search query starting with @, the cleaned query passed to the API
     * should be identical to the original query with the @ character removed from the beginning.
     */
    it('should remove @ prefix from queries starting with @', () => {
      fc.assert(
        fc.property(
          fc.string(), // Any string to append after @
          (suffix) => {
            const searchQuery = '@' + suffix;
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            // Clean query should be the original without the @ prefix
            expect(result.current.cleanQuery).toBe(suffix);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify queries not starting with @', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !s.startsWith('@')), // Any string not starting with @
          (searchQuery) => {
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            // Clean query should be identical to original
            expect(result.current.cleanQuery).toBe(searchQuery);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty string correctly', () => {
      const { result } = renderHook(() => useSearchMode(''));
      expect(result.current.cleanQuery).toBe('');
    });

    it('should handle single @ character', () => {
      const { result } = renderHook(() => useSearchMode('@'));
      expect(result.current.cleanQuery).toBe('');
      expect(result.current.mode).toBe('user');
    });

    it('should preserve all characters after @ prefix', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // Any non-empty string
          (suffix) => {
            const searchQuery = '@' + suffix;
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            // Every character after @ should be preserved
            expect(result.current.cleanQuery).toBe(suffix);
            expect(result.current.cleanQuery.length).toBe(suffix.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in suffix correctly', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.length > 0), // Any non-empty string
          (suffix) => {
            const searchQuery = '@' + suffix;
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            // Should preserve special characters, spaces, etc.
            expect(result.current.cleanQuery).toBe(suffix);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple @ symbols by removing only the first', () => {
      fc.assert(
        fc.property(
          fc.string(), // Any string
          (suffix) => {
            const searchQuery = '@@' + suffix;
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            // Should remove only the first @, leaving the second @ and suffix
            expect(result.current.cleanQuery).toBe('@' + suffix);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Property: Mode and Query Consistency', () => {
    /**
     * Additional property test to ensure mode and cleanQuery are always consistent
     */
    it('should maintain consistency between mode and cleanQuery', () => {
      fc.assert(
        fc.property(
          fc.string(), // Any string
          (searchQuery) => {
            const { result } = renderHook(() => useSearchMode(searchQuery));
            
            const startsWithAt = searchQuery.startsWith('@');
            
            // Mode should match the @ prefix presence
            expect(result.current.mode).toBe(startsWithAt ? 'user' : 'venue');
            
            // Clean query should match the expected transformation
            if (startsWithAt) {
              expect(result.current.cleanQuery).toBe(searchQuery.slice(1));
            } else {
              expect(result.current.cleanQuery).toBe(searchQuery);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return the same result for the same input (deterministic)', () => {
      fc.assert(
        fc.property(
          fc.string(), // Any string
          (searchQuery) => {
            const { result: result1 } = renderHook(() => useSearchMode(searchQuery));
            const { result: result2 } = renderHook(() => useSearchMode(searchQuery));
            const { result: result3 } = renderHook(() => useSearchMode(searchQuery));
            
            // All results should be identical
            expect(result1.current.mode).toBe(result2.current.mode);
            expect(result1.current.mode).toBe(result3.current.mode);
            expect(result1.current.cleanQuery).toBe(result2.current.cleanQuery);
            expect(result1.current.cleanQuery).toBe(result3.current.cleanQuery);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Property: Idempotency of Clean Query', () => {
    /**
     * Ensures that applying the cleaning logic multiple times doesn't change the result
     */
    it('should produce idempotent clean queries for venue mode', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !s.startsWith('@')), // Venue mode queries
          (searchQuery) => {
            const { result: result1 } = renderHook(() => useSearchMode(searchQuery));
            // Apply the hook again to the clean query
            const { result: result2 } = renderHook(() => useSearchMode(result1.current.cleanQuery));
            
            // Clean query should remain the same
            expect(result1.current.cleanQuery).toBe(result2.current.cleanQuery);
            // Mode should remain venue
            expect(result2.current.mode).toBe('venue');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
