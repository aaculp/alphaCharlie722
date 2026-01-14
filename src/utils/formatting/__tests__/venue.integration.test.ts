/**
 * Integration test for venue spotlight utilities
 * 
 * This test verifies that the utility functions work correctly together
 * and can handle real-world data scenarios.
 */

import {
  calculateDaysSinceSignup,
  formatSignupText,
  isEligibleForSpotlight,
} from '../venue';

describe('Venue Spotlight Utilities - Integration', () => {
  describe('calculateDaysSinceSignup', () => {
    it('should calculate 0 days for today', () => {
      const today = new Date().toISOString();
      const days = calculateDaysSinceSignup(today);
      expect(days).toBe(0);
    });

    it('should calculate 1 day for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const days = calculateDaysSinceSignup(yesterday.toISOString());
      expect(days).toBe(1);
    });

    it('should calculate 30 days for 30 days ago', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const days = calculateDaysSinceSignup(thirtyDaysAgo.toISOString());
      expect(days).toBe(30);
    });
  });

  describe('formatSignupText', () => {
    it('should format 0 days as "Joined today"', () => {
      expect(formatSignupText(0)).toBe('Joined today');
    });

    it('should format 1 day as "Joined yesterday"', () => {
      expect(formatSignupText(1)).toBe('Joined yesterday');
    });

    it('should format N days as "Joined N days ago"', () => {
      expect(formatSignupText(5)).toBe('Joined 5 days ago');
      expect(formatSignupText(15)).toBe('Joined 15 days ago');
      expect(formatSignupText(30)).toBe('Joined 30 days ago');
    });
  });

  describe('isEligibleForSpotlight', () => {
    it('should return true for venues within 30-day window', () => {
      const today = new Date().toISOString();
      expect(isEligibleForSpotlight(today)).toBe(true);

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      expect(isEligibleForSpotlight(fifteenDaysAgo.toISOString())).toBe(true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      expect(isEligibleForSpotlight(thirtyDaysAgo.toISOString())).toBe(true);
    });

    it('should return false for venues outside 30-day window', () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      expect(isEligibleForSpotlight(thirtyOneDaysAgo.toISOString())).toBe(false);

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      expect(isEligibleForSpotlight(sixtyDaysAgo.toISOString())).toBe(false);
    });

    it('should respect custom maxDays parameter', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      expect(isEligibleForSpotlight(tenDaysAgo.toISOString(), 7)).toBe(false);
      expect(isEligibleForSpotlight(tenDaysAgo.toISOString(), 15)).toBe(true);
    });
  });

  describe('Integration: Full workflow', () => {
    it('should correctly process a venue signup from 5 days ago', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const signupDate = fiveDaysAgo.toISOString();

      const days = calculateDaysSinceSignup(signupDate);
      const text = formatSignupText(days);
      const eligible = isEligibleForSpotlight(signupDate);

      expect(days).toBe(5);
      expect(text).toBe('Joined 5 days ago');
      expect(eligible).toBe(true);
    });

    it('should correctly process a venue signup from today', () => {
      const today = new Date().toISOString();

      const days = calculateDaysSinceSignup(today);
      const text = formatSignupText(days);
      const eligible = isEligibleForSpotlight(today);

      expect(days).toBe(0);
      expect(text).toBe('Joined today');
      expect(eligible).toBe(true);
    });

    it('should correctly process a venue signup from 31 days ago', () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      const signupDate = thirtyOneDaysAgo.toISOString();

      const days = calculateDaysSinceSignup(signupDate);
      const text = formatSignupText(days);
      const eligible = isEligibleForSpotlight(signupDate);

      expect(days).toBe(31);
      expect(text).toBe('Joined 31 days ago');
      expect(eligible).toBe(false);
    });
  });
});
