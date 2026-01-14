/**
 * Property-based tests for venue spotlight utilities
 * Feature: new-venues-spotlight
 * Property 7: Days Since Signup Display
 * Validates: Requirements 2.4
 */

import fc from 'fast-check';
import {
  calculateDaysSinceSignup,
  formatSignupText,
  isEligibleForSpotlight,
} from '../venue';

describe('Venue Spotlight Utilities - Property-Based Tests', () => {
  describe('Property 7: Days Since Signup Display', () => {
    it('should correctly calculate days for any valid date within last 365 days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          (daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const signupDate = date.toISOString();

            const calculatedDays = calculateDaysSinceSignup(signupDate);

            // Allow for small timing differences (within 1 day)
            return Math.abs(calculatedDays - daysAgo) <= 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format text correctly for any number of days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          (days) => {
            const text = formatSignupText(days);

            if (days === 0) {
              return text === 'Joined today';
            } else if (days === 1) {
              return text === 'Joined yesterday';
            } else {
              return text === `Joined ${days} days ago`;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display formatted text for any calculated days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          (daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const signupDate = date.toISOString();

            const days = calculateDaysSinceSignup(signupDate);
            const text = formatSignupText(days);

            // Verify text contains expected patterns
            return (
              text === 'Joined today' ||
              text === 'Joined yesterday' ||
              text.includes('Joined') && text.includes('days ago')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine eligibility for any date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 60 }),
          (daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const signupDate = date.toISOString();

            const eligible = isEligibleForSpotlight(signupDate, 30);
            const calculatedDays = calculateDaysSinceSignup(signupDate);

            // Eligibility should match whether days <= 30
            return eligible === (calculatedDays <= 30);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle custom maxDays parameter correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (daysAgo, maxDays) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const signupDate = date.toISOString();

            const eligible = isEligibleForSpotlight(signupDate, maxDays);
            const calculatedDays = calculateDaysSinceSignup(signupDate);

            return eligible === (calculatedDays <= maxDays);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Property Tests', () => {
    it('should maintain consistency between calculate and format', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), max: new Date() }),
          (date) => {
            // Skip invalid dates
            if (isNaN(date.getTime())) {
              return true;
            }
            
            const signupDate = date.toISOString();
            const days = calculateDaysSinceSignup(signupDate);
            const text = formatSignupText(days);

            // Text should always be a non-empty string
            return typeof text === 'string' && text.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never return negative days', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), max: new Date() }),
          (date) => {
            // Skip invalid dates
            if (isNaN(date.getTime())) {
              return true;
            }
            
            const signupDate = date.toISOString();
            const days = calculateDaysSinceSignup(signupDate);

            return days >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be monotonic: older dates have more days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 50 }),
          (daysAgo, additionalDays) => {
            const date1 = new Date();
            date1.setDate(date1.getDate() - daysAgo);
            
            const date2 = new Date();
            date2.setDate(date2.getDate() - (daysAgo + additionalDays));

            const days1 = calculateDaysSinceSignup(date1.toISOString());
            const days2 = calculateDaysSinceSignup(date2.toISOString());

            // date2 is older, so should have more or equal days
            return days2 >= days1;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
