/**
 * Unit Tests for Username Validation
 * Feature: at-search-feature
 * 
 * These tests verify specific examples and edge cases for username validation.
 * Requirements: 1.3, 1.4, 6.2
 */

import {
  validateUsername,
  normalizeUsername,
  UsernameValidationError,
} from '../usernameValidation';

describe('Username Validation - Unit Tests', () => {
  describe('Valid Username Examples', () => {
    it('should accept valid lowercase username', () => {
      const result = validateUsername('john_doe');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid username with numbers', () => {
      const result = validateUsername('user123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid username with underscores', () => {
      const result = validateUsername('user_name_123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept username at minimum length (3 characters)', () => {
      const result = validateUsername('abc');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept username at maximum length (30 characters)', () => {
      const result = validateUsername('a'.repeat(30));
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept username with only numbers', () => {
      const result = validateUsername('123456');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept username with only underscores and letters', () => {
      const result = validateUsername('user_name');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Invalid Username Examples - Special Characters', () => {
    it('should reject username with uppercase letters', () => {
      const result = validateUsername('JohnDoe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });

    it('should reject username with spaces', () => {
      const result = validateUsername('john doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });

    it('should reject username with hyphens', () => {
      const result = validateUsername('john-doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });

    it('should reject username with dots', () => {
      const result = validateUsername('john.doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });

    it('should reject username with special characters (@)', () => {
      const result = validateUsername('john@doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });

    it('should reject username with special characters (#)', () => {
      const result = validateUsername('john#doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });

    it('should reject username with special characters ($)', () => {
      const result = validateUsername('john$doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });

    it('should reject username with exclamation mark', () => {
      const result = validateUsername('john!');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });
  });

  describe('Invalid Username Examples - Too Short', () => {
    it('should reject username with 2 characters', () => {
      const result = validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.TOO_SHORT);
    });

    it('should reject username with 1 character', () => {
      const result = validateUsername('a');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.TOO_SHORT);
    });

    it('should reject empty string', () => {
      const result = validateUsername('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.REQUIRED);
    });
  });

  describe('Invalid Username Examples - Too Long', () => {
    it('should reject username with 31 characters', () => {
      const result = validateUsername('a'.repeat(31));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.TOO_LONG);
    });

    it('should reject username with 50 characters', () => {
      const result = validateUsername('a'.repeat(50));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.TOO_LONG);
    });

    it('should reject username with 100 characters', () => {
      const result = validateUsername('a'.repeat(100));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.TOO_LONG);
    });
  });

  describe('Error Message Content', () => {
    it('should return correct error message for too short username', () => {
      const result = validateUsername('ab');
      expect(result.error).toBe(UsernameValidationError.TOO_SHORT);
      expect(result.error).toBe('Username must be at least 3 characters');
    });

    it('should return correct error message for too long username', () => {
      const result = validateUsername('a'.repeat(31));
      expect(result.error).toBe(UsernameValidationError.TOO_LONG);
      expect(result.error).toBe('Username must be at most 30 characters');
    });

    it('should return correct error message for invalid characters', () => {
      const result = validateUsername('John@Doe');
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
      expect(result.error).toBe('Username can only contain lowercase letters, numbers, and underscores');
    });

    it('should return correct error message for required field', () => {
      const result = validateUsername('');
      expect(result.error).toBe(UsernameValidationError.REQUIRED);
      expect(result.error).toBe('Username is required');
    });

    it('should return correct error message for null input', () => {
      const result = validateUsername(null);
      expect(result.error).toBe(UsernameValidationError.REQUIRED);
      expect(result.error).toBe('Username is required');
    });

    it('should return correct error message for undefined input', () => {
      const result = validateUsername(undefined);
      expect(result.error).toBe(UsernameValidationError.REQUIRED);
      expect(result.error).toBe('Username is required');
    });
  });

  describe('Edge Cases', () => {
    it('should reject whitespace-only string', () => {
      const result = validateUsername('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.REQUIRED);
    });

    it('should handle username with leading/trailing spaces (trimmed)', () => {
      const result = validateUsername('  john_doe  ');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject username that becomes too short after trimming', () => {
      const result = validateUsername('  ab  ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.TOO_SHORT);
    });

    it('should prioritize character validation over length validation', () => {
      // Single uppercase character - should fail on INVALID_CHARACTERS, not TOO_SHORT
      const result = validateUsername('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });

    it('should prioritize character validation over length validation (long)', () => {
      // Long string with uppercase - should fail on INVALID_CHARACTERS, not TOO_LONG
      const result = validateUsername('A'.repeat(50));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
    });
  });

  describe('Username Normalization', () => {
    it('should normalize uppercase username to lowercase', () => {
      const normalized = normalizeUsername('JohnDoe');
      expect(normalized).toBe('johndoe');
    });

    it('should normalize mixed case username to lowercase', () => {
      const normalized = normalizeUsername('JoHn_DoE_123');
      expect(normalized).toBe('john_doe_123');
    });

    it('should preserve already lowercase username', () => {
      const normalized = normalizeUsername('john_doe');
      expect(normalized).toBe('john_doe');
    });

    it('should trim leading and trailing whitespace', () => {
      const normalized = normalizeUsername('  john_doe  ');
      expect(normalized).toBe('john_doe');
    });

    it('should handle username with only whitespace', () => {
      const normalized = normalizeUsername('   ');
      expect(normalized).toBe('');
    });

    it('should normalize and trim in one operation', () => {
      const normalized = normalizeUsername('  JohnDoe  ');
      expect(normalized).toBe('johndoe');
    });
  });
});
