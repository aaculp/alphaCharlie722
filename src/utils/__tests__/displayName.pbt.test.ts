/**
 * Property-Based Tests for Display Name Utility
 * Feature: at-search-feature
 */

import * as fc from 'fast-check';
import { getDisplayName, UserDisplayInfo } from '../displayName';

describe('getDisplayName - Property-Based Tests', () => {
  describe('Property 18: Display Name Priority and Fallback', () => {
    /**
     * Feature: at-search-feature, Property 18: Display Name Priority and Fallback
     * Validates: Requirements 10.1, 10.4
     *
     * For any user profile display, if display_name is present, it should be shown as the primary identifier;
     * if display_name is null but username exists, username should be shown;
     * if both are null, the name field should be used.
     */

    it('should prioritize display_name when present', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // display_name (non-empty)
          fc.option(fc.string(), { nil: null }), // username (optional)
          fc.option(fc.string(), { nil: null }), // name (optional)
          (display_name, username, name) => {
            const user: UserDisplayInfo = {
              display_name: display_name.trim() ? display_name : null,
              username,
              name,
            };

            const result = getDisplayName(user);

            // If display_name has content after trimming, it should be returned
            if (display_name.trim()) {
              expect(result).toBe(display_name.trim());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use username when display_name is null or empty', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // username (non-empty)
          fc.option(fc.string(), { nil: null }), // name (optional)
          (username, name) => {
            const user: UserDisplayInfo = {
              display_name: null,
              username: username.trim() ? username : null,
              name,
            };

            const result = getDisplayName(user);

            // If username has content after trimming and display_name is null, username should be returned
            if (username.trim()) {
              expect(result).toBe(username.trim());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use name when both display_name and username are null', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // name (non-empty)
          (name) => {
            const user: UserDisplayInfo = {
              display_name: null,
              username: null,
              name: name.trim() ? name : null,
            };

            const result = getDisplayName(user);

            // If name has content after trimming and both display_name and username are null, name should be returned
            if (name.trim()) {
              expect(result).toBe(name.trim());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "Anonymous" when all fields are null or empty', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, '', '   ', '\t', '\n'), // Various empty/null values for display_name
          fc.constantFrom(null, '', '   ', '\t', '\n'), // Various empty/null values for username
          fc.constantFrom(null, '', '   ', '\t', '\n'), // Various empty/null values for name
          (display_name, username, name) => {
            const user: UserDisplayInfo = {
              display_name,
              username,
              name,
            };

            const result = getDisplayName(user);

            expect(result).toBe('Anonymous');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null or undefined user object', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          (user) => {
            const result = getDisplayName(user);
            expect(result).toBe('Anonymous');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a non-empty string', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string(), { nil: null }), // display_name
          fc.option(fc.string(), { nil: null }), // username
          fc.option(fc.string(), { nil: null }), // name
          (display_name, username, name) => {
            const user: UserDisplayInfo = {
              display_name,
              username,
              name,
            };

            const result = getDisplayName(user);

            // Result should never be empty
            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trim whitespace from all fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Core string content (non-empty after trim)
          fc.constantFrom('', ' ', '  ', '\t', '\n', ' \t\n '), // Leading whitespace
          fc.constantFrom('', ' ', '  ', '\t', '\n', ' \t\n '), // Trailing whitespace
          (content, leading, trailing) => {
            const paddedString = leading + content + trailing;
            
            // Test with display_name
            const user1: UserDisplayInfo = {
              display_name: paddedString,
              username: null,
              name: null,
            };
            const result1 = getDisplayName(user1);
            expect(result1).toBe(paddedString.trim());

            // Test with username
            const user2: UserDisplayInfo = {
              display_name: null,
              username: paddedString,
              name: null,
            };
            const result2 = getDisplayName(user2);
            expect(result2).toBe(paddedString.trim());

            // Test with name
            const user3: UserDisplayInfo = {
              display_name: null,
              username: null,
              name: paddedString,
            };
            const result3 = getDisplayName(user3);
            expect(result3).toBe(paddedString.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain strict priority order regardless of field values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // display_name
          fc.string({ minLength: 1 }), // username
          fc.string({ minLength: 1 }), // name
          (display_name, username, name) => {
            // All fields present - should use display_name
            const user1: UserDisplayInfo = {
              display_name: display_name.trim() || 'display',
              username: username.trim() || 'user',
              name: name.trim() || 'name',
            };
            const result1 = getDisplayName(user1);
            expect(result1).toBe((display_name.trim() || 'display'));

            // Only username and name - should use username
            const user2: UserDisplayInfo = {
              display_name: null,
              username: username.trim() || 'user',
              name: name.trim() || 'name',
            };
            const result2 = getDisplayName(user2);
            expect(result2).toBe((username.trim() || 'user'));

            // Only name - should use name
            const user3: UserDisplayInfo = {
              display_name: null,
              username: null,
              name: name.trim() || 'name',
            };
            const result3 = getDisplayName(user3);
            expect(result3).toBe((name.trim() || 'name'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic for the same input', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string(), { nil: null }), // display_name
          fc.option(fc.string(), { nil: null }), // username
          fc.option(fc.string(), { nil: null }), // name
          (display_name, username, name) => {
            const user: UserDisplayInfo = {
              display_name,
              username,
              name,
            };

            // Call multiple times with same input
            const result1 = getDisplayName(user);
            const result2 = getDisplayName(user);
            const result3 = getDisplayName(user);

            // All results should be identical
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // String with various characters
          (str) => {
            const user: UserDisplayInfo = {
              display_name: str.trim() ? str : null,
              username: null,
              name: null,
            };

            const result = getDisplayName(user);

            // Should handle special characters properly
            if (str.trim()) {
              expect(result).toBe(str.trim());
            } else {
              expect(result).toBe('Anonymous');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Property: Fallback Chain Completeness', () => {
    /**
     * Ensures that the fallback chain is complete and handles all possible combinations
     */
    it('should never return null or undefined', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string(), { nil: null }),
          fc.option(fc.string(), { nil: null }),
          fc.option(fc.string(), { nil: null }),
          (display_name, username, name) => {
            const user: UserDisplayInfo = {
              display_name,
              username,
              name,
            };

            const result = getDisplayName(user);

            expect(result).not.toBeNull();
            expect(result).not.toBeUndefined();
            expect(typeof result).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle partial objects correctly', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string(), { nil: null }),
          fc.option(fc.string(), { nil: null }),
          fc.option(fc.string(), { nil: null }),
          (display_name, username, name) => {
            // Test with various partial objects
            const partialUser1 = { display_name } as UserDisplayInfo;
            const partialUser2 = { username } as UserDisplayInfo;
            const partialUser3 = { name } as UserDisplayInfo;
            const partialUser4 = { display_name, username } as UserDisplayInfo;

            // All should return valid strings
            expect(typeof getDisplayName(partialUser1)).toBe('string');
            expect(typeof getDisplayName(partialUser2)).toBe('string');
            expect(typeof getDisplayName(partialUser3)).toBe('string');
            expect(typeof getDisplayName(partialUser4)).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
