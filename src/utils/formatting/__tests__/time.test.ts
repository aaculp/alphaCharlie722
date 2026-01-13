/**
 * Property-Based Tests for Time Formatting Utilities
 * Feature: recent-check-ins-history
 */

import * as fc from 'fast-check';
import { formatCheckInTime, formatDuration, formatVisitCount } from '../time';

describe('Time Formatting Utilities - Property-Based Tests', () => {
  /**
   * Property 7: Timestamp Formatting
   * Feature: recent-check-ins-history, Property 7: Timestamp Formatting
   * Validates: Requirements 5.1, 5.2
   * 
   * For any check-in timestamp, if the timestamp is within the past 7 days, the formatted
   * output should be a relative time string, and if the timestamp is older than 7 days,
   * the formatted output should be a full date string.
   */
  describe('Property 7: Timestamp Formatting', () => {
    it('should format recent timestamps (< 7 days) as relative time', async () => {
      await fc.assert(
        fc.property(
          // Generate timestamps from 0 to 6 days ago
          fc.integer({ min: 0, max: 6 }).chain(daysAgo =>
            fc.integer({ min: 0, max: 23 }).chain(hoursAgo =>
              fc.integer({ min: 0, max: 59 }).map(minutesAgo => {
                const now = new Date();
                const timestamp = new Date(
                  now.getTime() - 
                  (daysAgo * 24 * 60 * 60 * 1000) -
                  (hoursAgo * 60 * 60 * 1000) -
                  (minutesAgo * 60 * 1000)
                );
                return { timestamp, daysAgo, hoursAgo, minutesAgo };
              })
            )
          ),
          ({ timestamp, daysAgo }) => {
            const formatted = formatCheckInTime(timestamp.toISOString());
            
            // Should NOT be a full date format (e.g., "Jan 5, 2026")
            const fullDatePattern = /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/;
            expect(formatted).not.toMatch(fullDatePattern);
            
            // Should be one of the relative formats or "Today at..."
            const relativePatterns = [
              /^Just now$/,
              /^\d+ minutes ago$/,
              /^\d+ hours? ago$/,
              /^Yesterday$/,
              /^\d+ days ago$/,
              /^Today at \d{1,2}:\d{2} (AM|PM)$/
            ];
            
            const matchesAnyPattern = relativePatterns.some(pattern => pattern.test(formatted));
            expect(matchesAnyPattern).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format old timestamps (>= 7 days) as full date', async () => {
      await fc.assert(
        fc.property(
          // Generate timestamps from 7 to 365 days ago
          fc.integer({ min: 7, max: 365 }).map(daysAgo => {
            const now = new Date();
            const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            return timestamp;
          }),
          (timestamp) => {
            const formatted = formatCheckInTime(timestamp.toISOString());
            
            // Should match full date format: "Jan 5, 2026"
            const fullDatePattern = /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/;
            expect(formatted).toMatch(fullDatePattern);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Duration Calculation and Formatting
   * Feature: recent-check-ins-history, Property 5: Duration Calculation and Formatting
   * Validates: Requirements 6.1, 6.2
   * 
   * For any check-in with both checked_in_at and checked_out_at timestamps, the calculated
   * duration should equal the time difference between the two timestamps, and the formatted
   * duration should display hours and minutes correctly.
   */
  describe('Property 5: Duration Calculation and Formatting', () => {
    it('should correctly calculate and format duration for any valid time range', async () => {
      await fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
            .filter(date => !isNaN(date.getTime())), // Filter out invalid dates
          fc.integer({ min: 1, max: 720 }), // 1 minute to 12 hours in minutes
          (startDate, durationMinutes) => {
            const startTime = startDate.toISOString();
            const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
            const endTime = endDate.toISOString();
            
            const formatted = formatDuration(startTime, endTime);
            
            // Calculate expected values
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            
            if (durationMinutes < 60) {
              // Should be "Xm" format
              expect(formatted).toBe(`${durationMinutes}m`);
            } else if (minutes === 0) {
              // Should be "Xh" format (no minutes)
              expect(formatted).toBe(`${hours}h`);
            } else {
              // Should be "Xh Ym" format
              expect(formatted).toBe(`${hours}h ${minutes}m`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "Currently checked in" when endTime is null', async () => {
      await fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
            .filter(date => !isNaN(date.getTime())), // Filter out invalid dates
          (startDate) => {
            const startTime = startDate.toISOString();
            const formatted = formatDuration(startTime, null);
            
            expect(formatted).toBe('Currently checked in');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Visit Count Formatting
   * Feature: recent-check-ins-history, Property 12: Visit Count Formatting
   * Validates: Requirements 10.3
   * 
   * For any visit count greater than 1, the formatted string should include the ordinal
   * suffix (e.g., "2nd visit", "3rd visit", "10th visit").
   */
  describe('Property 12: Visit Count Formatting', () => {
    it('should format visit counts with correct ordinal suffixes', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (count) => {
            const formatted = formatVisitCount(count);
            
            if (count === 1) {
              expect(formatted).toBe('First visit');
            } else {
              // Should contain the count and "visit"
              expect(formatted).toContain(count.toString());
              expect(formatted).toContain('visit');
              
              // Verify correct ordinal suffix
              const lastDigit = count % 10;
              const lastTwoDigits = count % 100;
              
              let expectedSuffix = 'th';
              if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
                expectedSuffix = 'th';
              } else if (lastDigit === 1) {
                expectedSuffix = 'st';
              } else if (lastDigit === 2) {
                expectedSuffix = 'nd';
              } else if (lastDigit === 3) {
                expectedSuffix = 'rd';
              }
              
              expect(formatted).toBe(`${count}${expectedSuffix} visit`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Unit Tests for Edge Cases
 * Feature: recent-check-ins-history
 */
describe('Time Formatting Utilities - Edge Cases', () => {
  /**
   * Edge case for Requirement 5.3: "Today" formatting
   */
  describe('formatCheckInTime - Today formatting', () => {
    it('should format timestamps from today with "Today at HH:MM AM/PM"', () => {
      const now = new Date();
      const todayMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30);
      const todayAfternoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 45);
      
      const morningFormatted = formatCheckInTime(todayMorning.toISOString());
      const afternoonFormatted = formatCheckInTime(todayAfternoon.toISOString());
      
      expect(morningFormatted).toMatch(/^Today at \d{1,2}:\d{2} (AM|PM)$/);
      expect(afternoonFormatted).toMatch(/^Today at \d{1,2}:\d{2} (AM|PM)$/);
      
      // Verify specific times
      expect(morningFormatted).toBe('Today at 9:30 AM');
      expect(afternoonFormatted).toBe('Today at 3:45 PM');
    });
  });

  /**
   * Edge case for Requirement 6.3: "Currently checked in" for active check-ins
   */
  describe('formatDuration - Currently checked in', () => {
    it('should return "Currently checked in" when checked_out_at is null', () => {
      const startTime = new Date('2026-01-12T10:00:00Z').toISOString();
      const formatted = formatDuration(startTime, null);
      
      expect(formatted).toBe('Currently checked in');
    });
  });

  /**
   * Edge case for Requirement 10.2: "First visit" for count of 1
   */
  describe('formatVisitCount - First visit', () => {
    it('should return "First visit" when count is 1', () => {
      const formatted = formatVisitCount(1);
      expect(formatted).toBe('First visit');
    });
  });

  /**
   * Edge case for Requirement 6.4: Short durations (<1 hour) formatting
   */
  describe('formatDuration - Short durations', () => {
    it('should format durations less than 1 hour as minutes only', () => {
      const startTime = new Date('2026-01-12T10:00:00Z').toISOString();
      
      // 15 minutes
      const end15 = new Date('2026-01-12T10:15:00Z').toISOString();
      expect(formatDuration(startTime, end15)).toBe('15m');
      
      // 45 minutes
      const end45 = new Date('2026-01-12T10:45:00Z').toISOString();
      expect(formatDuration(startTime, end45)).toBe('45m');
      
      // 59 minutes
      const end59 = new Date('2026-01-12T10:59:00Z').toISOString();
      expect(formatDuration(startTime, end59)).toBe('59m');
    });

    it('should format exactly 1 hour as "1h"', () => {
      const startTime = new Date('2026-01-12T10:00:00Z').toISOString();
      const endTime = new Date('2026-01-12T11:00:00Z').toISOString();
      
      expect(formatDuration(startTime, endTime)).toBe('1h');
    });
  });

  /**
   * Additional edge cases for ordinal suffixes
   */
  describe('formatVisitCount - Ordinal suffixes', () => {
    it('should handle special cases for 11th, 12th, 13th', () => {
      expect(formatVisitCount(11)).toBe('11th visit');
      expect(formatVisitCount(12)).toBe('12th visit');
      expect(formatVisitCount(13)).toBe('13th visit');
      expect(formatVisitCount(111)).toBe('111th visit');
      expect(formatVisitCount(112)).toBe('112th visit');
      expect(formatVisitCount(113)).toBe('113th visit');
    });

    it('should handle 1st, 2nd, 3rd correctly', () => {
      expect(formatVisitCount(2)).toBe('2nd visit');
      expect(formatVisitCount(3)).toBe('3rd visit');
      expect(formatVisitCount(21)).toBe('21st visit');
      expect(formatVisitCount(22)).toBe('22nd visit');
      expect(formatVisitCount(23)).toBe('23rd visit');
      expect(formatVisitCount(101)).toBe('101st visit');
      expect(formatVisitCount(102)).toBe('102nd visit');
      expect(formatVisitCount(103)).toBe('103rd visit');
    });
  });
});
