/**
 * Unit tests for venue spotlight utility functions
 * Requirements: 2.4, 5.1, 5.2
 */

import {
  calculateDaysSinceSignup,
  formatSignupText,
  isEligibleForSpotlight,
} from '../venue';

describe('Venue Spotlight Utilities - Unit Tests', () => {
  describe('calculateDaysSinceSignup', () => {
    it('should return 0 for today', () => {
      const today = new Date().toISOString();
      const result = calculateDaysSinceSignup(today);
      expect(result).toBe(0);
    });

    it('should return 1 for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = calculateDaysSinceSignup(yesterday.toISOString());
      expect(result).toBe(1);
    });

    it('should return 30 for 30 days ago', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = calculateDaysSinceSignup(thirtyDaysAgo.toISOString());
      expect(result).toBe(30);
    });

    it('should return 7 for 7 days ago', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const result = calculateDaysSinceSignup(sevenDaysAgo.toISOString());
      expect(result).toBe(7);
    });

    it('should handle various date formats', () => {
      const date = new Date();
      date.setDate(date.getDate() - 5);
      
      // Test ISO string
      expect(calculateDaysSinceSignup(date.toISOString())).toBe(5);
      
      // Test date string
      expect(calculateDaysSinceSignup(date.toString())).toBe(5);
    });
  });

  describe('formatSignupText', () => {
    it('should format 0 days as "Joined today"', () => {
      expect(formatSignupText(0)).toBe('Joined today');
    });

    it('should format 1 day as "Joined yesterday"', () => {
      expect(formatSignupText(1)).toBe('Joined yesterday');
    });

    it('should format 2 days as "Joined 2 days ago"', () => {
      expect(formatSignupText(2)).toBe('Joined 2 days ago');
    });

    it('should format 5 days as "Joined 5 days ago"', () => {
      expect(formatSignupText(5)).toBe('Joined 5 days ago');
    });

    it('should format 15 days as "Joined 15 days ago"', () => {
      expect(formatSignupText(15)).toBe('Joined 15 days ago');
    });

    it('should format 30 days as "Joined 30 days ago"', () => {
      expect(formatSignupText(30)).toBe('Joined 30 days ago');
    });

    it('should handle large numbers', () => {
      expect(formatSignupText(100)).toBe('Joined 100 days ago');
    });
  });

  describe('isEligibleForSpotlight', () => {
    it('should return true for dates within 30-day window', () => {
      const today = new Date().toISOString();
      expect(isEligibleForSpotlight(today)).toBe(true);

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      expect(isEligibleForSpotlight(fifteenDaysAgo.toISOString())).toBe(true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      expect(isEligibleForSpotlight(thirtyDaysAgo.toISOString())).toBe(true);
    });

    it('should return false for dates outside 30-day window', () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      expect(isEligibleForSpotlight(thirtyOneDaysAgo.toISOString())).toBe(false);

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      expect(isEligibleForSpotlight(sixtyDaysAgo.toISOString())).toBe(false);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      expect(isEligibleForSpotlight(ninetyDaysAgo.toISOString())).toBe(false);
    });

    it('should respect custom maxDays parameter', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const signupDate = tenDaysAgo.toISOString();
      
      expect(isEligibleForSpotlight(signupDate, 7)).toBe(false);
      expect(isEligibleForSpotlight(signupDate, 10)).toBe(true);
      expect(isEligibleForSpotlight(signupDate, 15)).toBe(true);
    });

    it('should handle edge case at exactly maxDays', () => {
      const exactlyThirtyDaysAgo = new Date();
      exactlyThirtyDaysAgo.setDate(exactlyThirtyDaysAgo.getDate() - 30);
      expect(isEligibleForSpotlight(exactlyThirtyDaysAgo.toISOString(), 30)).toBe(true);
    });
  });
});
