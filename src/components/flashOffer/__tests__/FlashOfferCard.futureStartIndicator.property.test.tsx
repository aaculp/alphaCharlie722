/**
 * Property-Based Test for FlashOfferCard Future Start Time Indicator
 * 
 * Feature: homescreen-flash-offers-section
 * Property 4: Future Start Time Indicator
 * 
 * Validates: Requirements 1.4
 * 
 * Tests verify that offers with start_time on the current day but after the current time
 * display a "Starts Soon" indicator using property-based testing with fast-check.
 * 
 * NOTE: These tests are skipped if run within 30 minutes of midnight to avoid
 * day boundary issues. Run these tests during normal daytime hours for full coverage.
 */

import React from 'react';
import * as fc from 'fast-check';
import { render } from '@testing-library/react-native';
import { FlashOfferCard } from '../FlashOfferCard';
import type { FlashOffer, FlashOfferStatus } from '../../../types/flashOffer.types';

// Mock ThemeContext
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        card: '#FFFFFF',
        border: '#E0E0E0',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#007AFF',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
      },
    },
  }),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock hooks
jest.mock('../../../hooks/useCountdownTimer', () => ({
  useCountdownTimer: (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const totalSeconds = Math.floor(diff / 1000);
    
    return {
      timeRemaining: totalSeconds > 0 ? '2h 30m 15s' : 'Expired',
      isExpired: totalSeconds <= 0,
      totalSeconds: Math.max(0, totalSeconds),
    };
  },
}));

jest.mock('../../../hooks/useRealtimeOffer', () => ({
  useRealtimeOffer: () => ({
    offer: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../utils/animations', () => ({
  fadeIn: jest.fn(() => ({ start: jest.fn() })),
  scaleIn: jest.fn(() => ({ start: jest.fn() })),
  countdownPulse: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
}));

jest.mock('../../../utils/haptics', () => ({
  triggerLightHaptic: jest.fn(),
}));

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a date on the current day with a specific hour offset from now
 * Ensures the generated time stays within the current day
 */
const futureDateTodayArbitrary = () => {
  return fc.integer({ min: 1, max: 6 }).chain(hoursFromNow => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setHours(now.getHours() + hoursFromNow);
    
    // Check if adding hours keeps us on the same day
    if (futureDate.toDateString() === now.toDateString()) {
      return fc.constant(futureDate.toISOString());
    } else {
      // If it would cross to next day, generate a time earlier in the current day
      // that's still in the future
      const safeDate = new Date(now);
      safeDate.setMinutes(now.getMinutes() + 30); // Just 30 minutes in the future
      
      // Double check it's still today
      if (safeDate.toDateString() === now.toDateString()) {
        return fc.constant(safeDate.toISOString());
      } else {
        // We're too close to midnight, skip this test case
        return fc.constant(null as any).filter(() => false);
      }
    }
  }).filter(date => date !== null);
};

/**
 * Generate a date on a different day (not today)
 */
const dateNotTodayArbitrary = () => {
  return fc.integer({ min: 1, max: 7 }).map(daysOffset => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString();
  });
};

/**
 * Generate a date in the past (before now)
 */
const pastDateTodayArbitrary = () => {
  return fc.integer({ min: 1, max: 12 }).map(hoursAgo => {
    const date = new Date();
    date.setHours(date.getHours() - hoursAgo);
    return date.toISOString();
  });
};

/**
 * Check if a date is on the current calendar day
 */
function isOnCurrentDay(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Check if a date is in the future
 */
function isInFuture(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date > now;
}

/**
 * Generate a flash offer with configurable start and end times
 */
const flashOfferArbitrary = (
  startTimeGen: fc.Arbitrary<string>,
  endTimeGen: fc.Arbitrary<string>
) => {
  return fc.record({
    id: fc.uuid(),
    venue_id: fc.uuid(),
    title: fc.string({ minLength: 3, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    expected_value: fc.option(fc.double({ min: 0, max: 1000, noNaN: true }), { nil: null }),
    max_claims: fc.integer({ min: 10, max: 1000 }),
    claimed_count: fc.integer({ min: 0, max: 100 }),
    start_time: startTimeGen,
    end_time: endTimeGen,
    radius_miles: fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
    target_favorites_only: fc.boolean(),
    status: fc.constant('active' as FlashOfferStatus),
    push_sent: fc.boolean(),
    push_sent_at: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });
};

// ============================================================================
// Property Tests
// ============================================================================

describe('FlashOfferCard Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(60000);

  /**
   * Property 4: Future Start Time Indicator
   * Feature: homescreen-flash-offers-section, Property 4: Future Start Time Indicator
   * Validates: Requirements 1.4
   * 
   * For any offer where start_time is on the current day but after the current time,
   * the rendered FlashOfferCard should include a "Starts Soon" indicator.
   */
  describe('Property 4: Future Start Time Indicator', () => {
    // Skip these tests if we're too close to midnight (after 22:00)
    // to avoid day boundary issues
    const currentHour = new Date().getHours();
    const skipTests = currentHour >= 22;
    
    const testFn = skipTests ? it.skip : it;
    
    testFn('should display "STARTS SOON" badge for offers starting later today', async () => {
      // Skip if we're within 30 minutes of midnight
      const now = new Date();
      const minutesUntilMidnight = (24 - now.getHours()) * 60 - now.getMinutes();
      if (minutesUntilMidnight < 30) {
        console.log('Skipping test - too close to midnight');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          flashOfferArbitrary(
            futureDateTodayArbitrary(), // Start time: later today
            futureDateTodayArbitrary().map(start => {
              // End time: after start time
              const startDate = new Date(start);
              const endDate = new Date(startDate);
              endDate.setHours(endDate.getHours() + 2);
              return endDate.toISOString();
            })
          ),
          async (offer) => {
            // Verify preconditions
            const startTime = new Date(offer.start_time);
            const testNow = new Date();
            
            // Only test if start_time is actually on current day and in future
            // AND we have at least 5 minutes until midnight
            const minutesUntilMidnight = (24 - testNow.getHours()) * 60 - testNow.getMinutes();
            if (!isOnCurrentDay(offer.start_time) || !isInFuture(offer.start_time) || minutesUntilMidnight < 5) {
              return true; // Skip this iteration
            }

            // Render the card
            const { getByText, queryByText } = render(
              <FlashOfferCard
                offer={offer}
                venueName="Test Venue"
                onPress={jest.fn()}
              />
            );

            // Property: "STARTS SOON" badge should be present
            const startsSoonBadge = queryByText('STARTS SOON');
            expect(startsSoonBadge).toBeTruthy();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT display "STARTS SOON" badge for offers that have already started', async () => {
      await fc.assert(
        fc.asyncProperty(
          flashOfferArbitrary(
            pastDateTodayArbitrary(), // Start time: earlier today (already started)
            futureDateTodayArbitrary() // End time: later today
          ),
          async (offer) => {
            // Verify preconditions
            if (!isOnCurrentDay(offer.start_time) || isInFuture(offer.start_time)) {
              return true; // Skip this iteration
            }

            // Render the card
            const { queryByText } = render(
              <FlashOfferCard
                offer={offer}
                venueName="Test Venue"
                onPress={jest.fn()}
              />
            );

            // Property: "STARTS SOON" badge should NOT be present
            const startsSoonBadge = queryByText('STARTS SOON');
            expect(startsSoonBadge).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT display "STARTS SOON" badge for offers starting on a different day', async () => {
      await fc.assert(
        fc.asyncProperty(
          flashOfferArbitrary(
            dateNotTodayArbitrary(), // Start time: not today
            dateNotTodayArbitrary().map(start => {
              // End time: after start time
              const startDate = new Date(start);
              const endDate = new Date(startDate);
              endDate.setHours(endDate.getHours() + 2);
              return endDate.toISOString();
            })
          ),
          async (offer) => {
            // Verify preconditions
            if (isOnCurrentDay(offer.start_time)) {
              return true; // Skip this iteration
            }

            // Render the card
            const { queryByText } = render(
              <FlashOfferCard
                offer={offer}
                venueName="Test Venue"
                onPress={jest.fn()}
              />
            );

            // Property: "STARTS SOON" badge should NOT be present for offers not starting today
            const startsSoonBadge = queryByText('STARTS SOON');
            expect(startsSoonBadge).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize "STARTS SOON" over other urgency indicators', async () => {
      await fc.assert(
        fc.asyncProperty(
          flashOfferArbitrary(
            futureDateTodayArbitrary(), // Start time: later today
            futureDateTodayArbitrary().map(start => {
              const startDate = new Date(start);
              const endDate = new Date(startDate);
              endDate.setHours(endDate.getHours() + 2);
              return endDate.toISOString();
            })
          ).map(offer => ({
            ...offer,
            // Set conditions that would normally trigger "LIMITED" badge
            max_claims: 100,
            claimed_count: 97, // Only 3 left
          })),
          async (offer) => {
            // Verify preconditions
            if (!isOnCurrentDay(offer.start_time) || !isInFuture(offer.start_time)) {
              return true; // Skip this iteration
            }

            // Render the card
            const { getByText, queryByText } = render(
              <FlashOfferCard
                offer={offer}
                venueName="Test Venue"
                onPress={jest.fn()}
              />
            );

            // Property: "STARTS SOON" should be present
            const startsSoonBadge = queryByText('STARTS SOON');
            expect(startsSoonBadge).toBeTruthy();

            // Property: "LIMITED" should NOT be present (STARTS SOON takes priority)
            const limitedBadge = queryByText('LIMITED');
            expect(limitedBadge).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    testFn('should display "STARTS SOON" consistently across multiple renders', async () => {
      // Skip if we're within 30 minutes of midnight
      const now = new Date();
      const minutesUntilMidnight = (24 - now.getHours()) * 60 - now.getMinutes();
      if (minutesUntilMidnight < 30) {
        console.log('Skipping test - too close to midnight');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          flashOfferArbitrary(
            futureDateTodayArbitrary(),
            futureDateTodayArbitrary().map(start => {
              const startDate = new Date(start);
              const endDate = new Date(startDate);
              endDate.setHours(endDate.getHours() + 2);
              return endDate.toISOString();
            })
          ),
          async (offer) => {
            // Verify preconditions
            const testNow = new Date();
            const minutesUntilMidnight = (24 - testNow.getHours()) * 60 - testNow.getMinutes();
            
            if (!isOnCurrentDay(offer.start_time) || !isInFuture(offer.start_time) || minutesUntilMidnight < 5) {
              return true; // Skip this iteration
            }

            // Render the card multiple times
            const render1 = render(
              <FlashOfferCard
                offer={offer}
                venueName="Test Venue"
                onPress={jest.fn()}
              />
            );

            const render2 = render(
              <FlashOfferCard
                offer={offer}
                venueName="Test Venue"
                onPress={jest.fn()}
              />
            );

            // Property: Both renders should show "STARTS SOON"
            expect(render1.queryByText('STARTS SOON')).toBeTruthy();
            expect(render2.queryByText('STARTS SOON')).toBeTruthy();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
