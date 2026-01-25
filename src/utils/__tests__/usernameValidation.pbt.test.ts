/**
 * Property-Based Tests for Username Validation
 * Feature: at-search-feature
 */

import * as fc from 'fast-check';
import {
  validateUsername,
  normalizeUsername,
  UsernameValidationError,
} from '../usernameValidation';

describe('Username Validation - Property-Based Tests', () => {
  describe('Property 1: Username Character Validation', () => {
    /**
     * Feature: at-search-feature, Property 1: Username Character Validation
     * Validates: Requirements 1.3
     *
     * For any username input string, if it contains characters other than lowercase
     * letters, numbers, or underscores, the validation function should reject it with an error.
     */
    it('should reject usernames with invalid characters (uppercase letters)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => {
              const trimmed = s.trim();
              // Must have uppercase AND be non-empty after trim
              // AND the trimmed version must still have uppercase
              return trimmed.length > 0 && /[A-Z]/.test(trimmed);
            }), // Contains uppercase letters in the trimmed version
          (username) => {
            const result = validateUsername(username);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject usernames with invalid characters (special characters)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => {
              const trimmed = s.trim();
              // Must have invalid characters AND be non-empty after trim
              // AND the trimmed version must still have invalid characters
              return trimmed.length > 0 && /[^a-z0-9_]/.test(trimmed);
            }), // Contains invalid characters in the trimmed version
          (username) => {
            const result = validateUsername(username);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept usernames with only valid characters', () => {
      fc.assert(
        fc.property(
          fc
            .stringMatching(/^[a-z0-9_]{3,30}$/), // Only valid characters
          (username) => {
            const result = validateUsername(username);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Username Length Validation', () => {
    /**
     * Feature: at-search-feature, Property 2: Username Length Validation
     * Validates: Requirements 1.4
     *
     * For any username input string, the validation function should accept it if and only if
     * its length is between 3 and 30 characters (inclusive).
     */
    it('should reject usernames shorter than 3 characters', () => {
      fc.assert(
        fc.property(
          fc
            .stringMatching(/^[a-z0-9_]{1,2}$/), // Valid characters but too short
          (username) => {
            const result = validateUsername(username);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe(UsernameValidationError.TOO_SHORT);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject usernames longer than 30 characters', () => {
      fc.assert(
        fc.property(
          fc
            .stringMatching(/^[a-z0-9_]{31,50}$/), // Valid characters but too long
          (username) => {
            const result = validateUsername(username);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe(UsernameValidationError.TOO_LONG);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept usernames with length between 3 and 30 characters (inclusive)', () => {
      fc.assert(
        fc.property(
          fc
            .stringMatching(/^[a-z0-9_]{3,30}$/), // Valid length and characters
          (username) => {
            const result = validateUsername(username);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
            expect(username.length).toBeGreaterThanOrEqual(3);
            expect(username.length).toBeLessThanOrEqual(30);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept usernames at boundary lengths (3 and 30 characters)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(3, 30),
          (length) => {
            // Generate a username with exactly the specified length
            const username = 'a'.repeat(length);
            const result = validateUsername(username);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Username Lowercase Transformation', () => {
    /**
     * Feature: at-search-feature, Property 3: Username Lowercase Transformation
     * Validates: Requirements 1.5
     *
     * For any username input string containing uppercase letters, the system should store it
     * in all lowercase form, such that retrieving the username returns only lowercase characters.
     */
    it('should normalize usernames to lowercase', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 3, maxLength: 30 })
            .filter((s) => /[A-Z]/.test(s)), // Contains uppercase letters
          (username) => {
            const normalized = normalizeUsername(username);
            // Normalized version should be all lowercase
            expect(normalized).toBe(username.toLowerCase().trim());
            // Should not contain any uppercase letters
            expect(/[A-Z]/.test(normalized)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve lowercase usernames during normalization', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9_]{3,30}$/), // Already lowercase and valid
          (username) => {
            const normalized = normalizeUsername(username);
            // Should remain unchanged (except for trimming)
            expect(normalized).toBe(username.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trim whitespace during normalization', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9_]{3,30}$/), // Valid username
          fc.integer({ min: 0, max: 5 }), // Leading spaces
          fc.integer({ min: 0, max: 5 }), // Trailing spaces
          (username, leadingSpaces, trailingSpaces) => {
            const paddedUsername = ' '.repeat(leadingSpaces) + username + ' '.repeat(trailingSpaces);
            const normalized = normalizeUsername(paddedUsername);
            // Should remove leading and trailing whitespace
            expect(normalized).toBe(username.toLowerCase());
            expect(normalized.startsWith(' ')).toBe(false);
            expect(normalized.endsWith(' ')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed case strings consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 30 }), // Any string
          (username) => {
            const normalized1 = normalizeUsername(username);
            const normalized2 = normalizeUsername(username.toUpperCase());
            const normalized3 = normalizeUsername(username.toLowerCase());
            
            // All normalizations should produce the same result
            expect(normalized1).toBe(normalized2);
            expect(normalized1).toBe(normalized3);
            expect(normalized2).toBe(normalized3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Property: Empty and Null Handling', () => {
    /**
     * Additional property test to ensure robust handling of edge cases
     */
    it('should reject null, undefined, and empty strings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, '', '   ', '\t', '\n'),
          (username) => {
            const result = validateUsername(username as any);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe(UsernameValidationError.REQUIRED);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Property: Validation Consistency', () => {
    /**
     * Ensures that validation is deterministic and consistent
     */
    it('should return consistent results for the same input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }), // Any string
          (username) => {
            const result1 = validateUsername(username);
            const result2 = validateUsername(username);
            const result3 = validateUsername(username);
            
            // All validations should produce identical results
            expect(result1.isValid).toBe(result2.isValid);
            expect(result1.isValid).toBe(result3.isValid);
            expect(result1.error).toBe(result2.error);
            expect(result1.error).toBe(result3.error);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
