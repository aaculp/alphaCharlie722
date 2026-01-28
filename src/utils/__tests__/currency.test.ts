/**
 * Unit Tests for Currency Formatting Utility
 * Feature: flash-offer-expected-value
 */

import { formatCurrency } from '../currency';

describe('formatCurrency', () => {
  describe('Basic formatting', () => {
    it('should format a simple number with 2 decimal places', () => {
      expect(formatCurrency(10)).toBe('$10.00');
    });

    it('should format a number with existing decimals', () => {
      expect(formatCurrency(10.5)).toBe('$10.50');
    });

    it('should format a number with 2 decimal places already', () => {
      expect(formatCurrency(10.99)).toBe('$10.99');
    });
  });

  describe('Edge Case 1: Zero formatting', () => {
    /**
     * Validates: Requirement 10.4
     * When formatCurrency receives 0, it SHALL return "$0.00"
     */
    it('should format zero as "$0.00"', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('Edge Case 2: Null/undefined formatting', () => {
    /**
     * Validates: Requirement 10.3
     * When formatCurrency receives null or undefined, it SHALL return an empty string
     */
    it('should return empty string for null', () => {
      expect(formatCurrency(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatCurrency(undefined)).toBe('');
    });
  });

  describe('Edge Case 4: Specific currency formatting example', () => {
    /**
     * Validates: Requirement 10.5
     * When formatCurrency receives 1234.5, it SHALL return "$1,234.50"
     * (demonstrating thousands separator and decimal padding)
     */
    it('should format 1234.5 as "$1,234.50"', () => {
      expect(formatCurrency(1234.5)).toBe('$1,234.50');
    });
  });

  describe('Thousands separators', () => {
    /**
     * Validates: Requirement 10.6
     * The formatCurrency function SHALL use locale-aware formatting for thousands separators
     */
    it('should include thousands separator for values >= 1000', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(10000)).toBe('$10,000.00');
      expect(formatCurrency(100000)).toBe('$100,000.00');
    });

    it('should not include thousands separator for values < 1000', () => {
      expect(formatCurrency(999)).toBe('$999.00');
      expect(formatCurrency(999.99)).toBe('$999.99');
    });
  });

  describe('Decimal precision', () => {
    /**
     * Validates: Requirement 10.2
     * When formatCurrency receives a number, THE System SHALL return a string
     * with dollar sign prefix and 2 decimal places
     */
    it('should always show exactly 2 decimal places', () => {
      expect(formatCurrency(5)).toBe('$5.00');
      expect(formatCurrency(5.1)).toBe('$5.10');
      expect(formatCurrency(5.12)).toBe('$5.12');
    });

    it('should round to 2 decimal places if more precision provided', () => {
      expect(formatCurrency(5.125)).toBe('$5.13'); // Rounds up
      expect(formatCurrency(5.124)).toBe('$5.12'); // Rounds down
    });
  });

  describe('Large values', () => {
    it('should handle maximum expected value (10000)', () => {
      expect(formatCurrency(10000)).toBe('$10,000.00');
    });

    it('should handle values near maximum', () => {
      expect(formatCurrency(9999.99)).toBe('$9,999.99');
    });
  });

  describe('Small values', () => {
    it('should handle cents', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should handle fractional cents with rounding', () => {
      expect(formatCurrency(0.005)).toBe('$0.01'); // Rounds up
      expect(formatCurrency(0.004)).toBe('$0.00'); // Rounds down
    });
  });
});
