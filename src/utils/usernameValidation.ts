/**
 * Username validation utilities for the @ Search Feature
 * 
 * This module provides validation functions for usernames with the following rules:
 * - Length: 3-30 characters
 * - Characters: Lowercase letters (a-z), numbers (0-9), underscore (_)
 * - Format: Regex pattern: ^[a-z0-9_]{3,30}$
 * - Storage: Always stored in lowercase
 * 
 * Requirements: 1.3, 1.4, 6.1, 6.2, 6.4
 */

/**
 * Username validation error types
 */
export enum UsernameValidationError {
  TOO_SHORT = 'Username must be at least 3 characters',
  TOO_LONG = 'Username must be at most 30 characters',
  INVALID_CHARACTERS = 'Username can only contain lowercase letters, numbers, and underscores',
  ALREADY_TAKEN = 'This username is already taken',
  REQUIRED = 'Username is required',
}

/**
 * Username validation result type
 */
export type UsernameValidationResult = {
  isValid: boolean;
  error?: UsernameValidationError;
};

/**
 * Username format regex pattern
 * Matches: lowercase letters, numbers, and underscores only
 * Length: 3-30 characters
 */
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

/**
 * Validates a username according to the application rules
 * 
 * Validation Rules (Requirements 1.3, 1.4, 6.1, 6.2, 6.4):
 * 1. Required: Username cannot be null, undefined, or empty
 * 2. Characters: Only lowercase letters (a-z), numbers (0-9), and underscores (_)
 * 3. Length: Must be between 3 and 30 characters (inclusive)
 * 
 * Note: Character validation is performed before length validation to provide
 * better user feedback. Users should learn the format rules before length constraints.
 * 
 * @param username - The username string to validate
 * @returns UsernameValidationResult with isValid flag and optional error
 * 
 * @example
 * ```typescript
 * // Valid username
 * const result1 = validateUsername('john_doe');
 * console.log(result1.isValid); // true
 * 
 * // Invalid - too short (but valid characters)
 * const result2 = validateUsername('ab');
 * console.log(result2.error); // UsernameValidationError.TOO_SHORT
 * 
 * // Invalid - uppercase letters (checked before length)
 * const result3 = validateUsername('A');
 * console.log(result3.error); // UsernameValidationError.INVALID_CHARACTERS
 * ```
 */
export function validateUsername(username: string | null | undefined): UsernameValidationResult {
  // Check if username is provided (Requirement 6.2)
  if (!username || username.trim() === '') {
    return {
      isValid: false,
      error: UsernameValidationError.REQUIRED,
    };
  }

  const trimmedUsername = username.trim();

  // Check character format FIRST: lowercase letters, numbers, underscore only (Requirement 1.3)
  // This provides better UX - users learn the format rules before length constraints
  // Check if contains only valid characters (not using full regex to allow any length for now)
  if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
    return {
      isValid: false,
      error: UsernameValidationError.INVALID_CHARACTERS,
    };
  }

  // Check minimum length: 3 characters (Requirement 1.4)
  if (trimmedUsername.length < 3) {
    return {
      isValid: false,
      error: UsernameValidationError.TOO_SHORT,
    };
  }

  // Check maximum length: 30 characters (Requirement 1.4)
  if (trimmedUsername.length > 30) {
    return {
      isValid: false,
      error: UsernameValidationError.TOO_LONG,
    };
  }

  // All validations passed
  return {
    isValid: true,
  };
}

/**
 * Normalizes a username to lowercase for storage
 * 
 * This function ensures consistent username storage by converting to lowercase
 * and removing leading/trailing whitespace. The database trigger also enforces
 * lowercase, but this provides client-side normalization (Requirement 1.5).
 * 
 * @param username - The username string to normalize
 * @returns Lowercase version of the username with whitespace trimmed
 * 
 * @example
 * ```typescript
 * const normalized = normalizeUsername('JohnDoe');
 * console.log(normalized); // 'johndoe'
 * 
 * const normalized2 = normalizeUsername('  user_123  ');
 * console.log(normalized2); // 'user_123'
 * ```
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}
