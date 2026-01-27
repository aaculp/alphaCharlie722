/**
 * Property-Based Test for Flash Offers Same-Day Filtering
 * 
 * Feature: homescreen-flash-offers-section
 * Property 1: Same-Day Filtering Completeness
 * 
 * Validates: Requirements 1.1, 1.5
 * 
 * Tests verify that getSameDayOffers returns all and only offers with start_time
 * on the current calendar day and end_time >= current time using property-based
 * testing with fast-check.
 */

import * as fc from 'fast-check';
import { FlashOfferService } from '../flashOffers';
import { supabase } from '../../../lib/supabase';
import type { FlashOffer, FlashOfferStatus } from '../flashOffers';

// Skip these tests if Supabase is not properly configured
const isSupabaseConfigured = () => {
  try {
    return supabase && typeof supabase.from === 'function';
  } catch {
    return false;
  }
};

const describeIfSupabase = isSupabaseConfigured() ? describe : describe.skip;

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a valid UUID v4 with better randomness
 */
const uuidArbitrary = () =>
  fc.integer().map(() => {
    // Generate a random UUID using crypto
    return `${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}-4${Math.random().toString(16).slice(3, 6)}-8${Math.random().toString(16).slice(3, 6)}-${Math.random().toString(16).slice(2, 14)}`;
  });

/**
 * Generate a flash offer status
 */
const flashOfferStatusArbitrary = (): fc.Arbitrary<FlashOfferStatus> =>
  fc.constantFrom('scheduled', 'active', 'expired', 'cancelled', 'full');

/**
 * Generate a date within a specific range relative to today
 * @param daysOffset - Number of days to offset from today (negative for past, positive for future)
 * @param hourRange - Range of hours within the day (0-23)
 */
const dateWithOffsetArbitrary = (daysOffset: number, hourRange?: { min: number; max: number }) => {
  return fc.record({
    hour: fc.integer({ min: hourRange?.min ?? 0, max: hourRange?.max ?? 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
    second: fc.integer({ min: 0, max: 59 }),
  }).map(({ hour, minute, second }) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, minute, second, 0);
    return date.toISOString();
  });
};

/**
 * Generate a flash offer with configurable date ranges
 */
const flashOfferArbitrary = (
  startDateGen: fc.Arbitrary<string>,
  endDateGen: fc.Arbitrary<string>
) => {
  return fc.record({
    id: uuidArbitrary(),
    venue_id: uuidArbitrary(),
    title: fc.string({ minLength: 3, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    value_cap: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
    max_claims: fc.integer({ min: 1, max: 1000 }),
    claimed_count: fc.integer({ min: 0, max: 100 }),
    start_time: startDateGen,
    end_time: endDateGen,
    radius_miles: fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
    target_favorites_only: fc.boolean(),
    status: fc.constant('active' as FlashOfferStatus),
    push_sent: fc.boolean(),
    push_sent_at: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  });
};

/**
 * Generate a venue for testing
 */
const venueArbitrary = (venueId: string) => {
  return fc.record({
    id: fc.constant(venueId),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    address: fc.string({ minLength: 5, maxLength: 200 }),
    city: fc.string({ minLength: 2, maxLength: 100 }),
    state: fc.string({ minLength: 2, maxLength: 2 }),
    latitude: fc.float({ min: Math.fround(-90), max: Math.fround(90), noNaN: true }),
    longitude: fc.float({ min: Math.fround(-180), max: Math.fround(180), noNaN: true }),
  });
};

/**
 * Clean up test data after each test
 */
async function cleanupTestData(offerIds: string[] = [], venueIds: string[] = []) {
  try {
    // Delete flash offers
    if (offerIds.length > 0) {
      await supabase
        .from('flash_offers')
        .delete()
        .in('id', offerIds);
    }

    // Delete test venues
    if (venueIds.length > 0) {
      await supabase
        .from('venues')
        .delete()
        .in('id', venueIds);
    }
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
}

/**
 * Create test venues in the database
 */
async function createTestVenues(venues: any[]) {
  try {
    const { error } = await supabase.from('venues').upsert(venues);
    if (error) {
      console.warn('Venue creation warning:', error);
    }
  } catch (error) {
    console.warn('Venue creation error:', error);
  }
}

/**
 * Create test flash offers in the database
 */
async function createTestOffers(offers: any[]) {
  try {
    const { error } = await supabase.from('flash_offers').upsert(offers);
    if (error) {
      console.warn('Offer creation warning:', error);
    }
  } catch (error) {
    console.warn('Offer creation error:', error);
  }
}

/**
 * Get current day boundaries in local timezone
 */
function getCurrentDayBoundaries() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { now, startOfDay, endOfDay };
}

/**
 * Check if a date is on the current calendar day
 */
function isOnCurrentDay(dateStr: string): boolean {
  const date = new Date(dateStr);
  const { startOfDay, endOfDay } = getCurrentDayBoundaries();
  return date >= startOfDay && date <= endOfDay;
}

/**
 * Check if an offer should be included in same-day results
 */
function shouldBeIncludedInSameDayResults(offer: any): boolean {
  const { now } = getCurrentDayBoundaries();
  const startTime = new Date(offer.start_time);
  const endTime = new Date(offer.end_time);
  
  return (
    offer.status === 'active' &&
    isOnCurrentDay(offer.start_time) &&
    endTime >= now
  );
}

// ============================================================================
// Property Tests
// ============================================================================

describeIfSupabase('FlashOfferService Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(60000);

  /**
   * Property 1: Same-Day Filtering Completeness
   * Feature: homescreen-flash-offers-section, Property 1: Same-Day Filtering Completeness
   * Validates: Requirements 1.1, 1.5
   * 
   * For any set of flash offers with various start_time and end_time values,
   * getSameDayOffers should return all and only offers where:
   * - start_time is on the current calendar day (local timezone)
   * - end_time >= current time
   * - status is 'active'
   */
  describe('Property 1: Same-Day Filtering Completeness', () => {
    it('should return all and only same-day non-expired offers', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a mix of offers with different date ranges
          fc.array(
            fc.tuple(
              uuidArbitrary(), // Unique ID for each offer
              uuidArbitrary(), // Unique venue ID for each offer
              fc.oneof(
                // Same-day offers that should be included (start today, end in future)
                fc.record({
                  type: fc.constant('same-day-future' as const),
                  startDate: dateWithOffsetArbitrary(0), // Today
                  endDate: dateWithOffsetArbitrary(0, { min: new Date().getHours() + 1, max: 23 }) // Later today
                }),
                // Same-day offers that should be included (start today, end tomorrow)
                fc.record({
                  type: fc.constant('same-day-tomorrow' as const),
                  startDate: dateWithOffsetArbitrary(0), // Today
                  endDate: dateWithOffsetArbitrary(1) // Tomorrow
                }),
                // Yesterday's offers that should NOT be included
                fc.record({
                  type: fc.constant('yesterday' as const),
                  startDate: dateWithOffsetArbitrary(-1), // Yesterday
                  endDate: dateWithOffsetArbitrary(0) // Today
                }),
                // Tomorrow's offers that should NOT be included
                fc.record({
                  type: fc.constant('tomorrow' as const),
                  startDate: dateWithOffsetArbitrary(1), // Tomorrow
                  endDate: dateWithOffsetArbitrary(2) // Day after tomorrow
                }),
                // Expired offers from today that should NOT be included
                fc.record({
                  type: fc.constant('expired-today' as const),
                  startDate: dateWithOffsetArbitrary(0, { min: 0, max: Math.max(0, new Date().getHours() - 2) }), // Earlier today
                  endDate: dateWithOffsetArbitrary(0, { min: 0, max: Math.max(0, new Date().getHours() - 1) }) // Already expired
                }),
                // Last week's offers that should NOT be included
                fc.record({
                  type: fc.constant('last-week' as const),
                  startDate: dateWithOffsetArbitrary(-7), // Last week
                  endDate: dateWithOffsetArbitrary(-6) // Last week
                }),
                // Next week's offers that should NOT be included
                fc.record({
                  type: fc.constant('next-week' as const),
                  startDate: dateWithOffsetArbitrary(7), // Next week
                  endDate: dateWithOffsetArbitrary(8) // Next week
                })
              )
            ),
            { minLength: 5, maxLength: 20 }
          ),
          async (offerSpecs) => {
            const offerIds: string[] = [];
            const venueIds: string[] = [];

            try {
              // Setup: Generate offers from specs with unique IDs
              const offers = offerSpecs.map(([offerId, venueId, spec]) => {
                offerIds.push(offerId);
                venueIds.push(venueId);
                
                return {
                  id: offerId,
                  venue_id: venueId,
                  title: 'Test Flash Offer',
                  description: 'Test description for flash offer',
                  value_cap: null,
                  max_claims: 10,
                  claimed_count: 0,
                  start_time: spec.startDate,
                  end_time: spec.endDate,
                  radius_miles: 10,
                  target_favorites_only: false,
                  status: 'active' as FlashOfferStatus,
                  push_sent: false,
                  push_sent_at: null,
                };
              });

              // Setup: Create unique venues for each offer
              const venues = venueIds.map((venueId, index) => ({
                id: venueId,
                name: `Test Venue ${index}`,
                address: `${index} Test St`,
                city: 'Test City',
                state: 'TS',
                latitude: 40.7128 + index * 0.01,
                longitude: -74.0060 + index * 0.01,
              }));

              await createTestVenues(venues);

              // Wait a bit to ensure venues are created
              await new Promise(resolve => setTimeout(resolve, 100));

              // Setup: Create test offers in database
              const offersToCreate = offers.map(offer => ({
                ...offer,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));

              await createTestOffers(offersToCreate);

              // Wait a bit to ensure offers are created
              await new Promise(resolve => setTimeout(resolve, 100));

              // Act: Fetch same-day offers
              const result = await FlashOfferService.getSameDayOffers();

              // Assert: Verify all returned offers meet same-day criteria
              result.forEach(offer => {
                const startTime = new Date(offer.start_time);
                const endTime = new Date(offer.end_time);
                const { now, startOfDay, endOfDay } = getCurrentDayBoundaries();

                // Property 1: start_time must be on current calendar day
                expect(startTime >= startOfDay && startTime <= endOfDay).toBe(true);

                // Property 2: end_time must be >= current time (not expired)
                expect(endTime >= now).toBe(true);

                // Property 3: status must be 'active'
                expect(offer.status).toBe('active');

                // Property 4: venue_name must be populated
                expect(offer.venue_name).toBeDefined();
                expect(typeof offer.venue_name).toBe('string');
                expect(offer.venue_name.length).toBeGreaterThan(0);
              });

              // Assert: Verify no same-day non-expired offers are missing
              const expectedOffers = offersToCreate.filter(shouldBeIncludedInSameDayResults);
              
              // Check that all expected offers are in the result
              expectedOffers.forEach(expectedOffer => {
                const found = result.find(r => r.id === expectedOffer.id);
                expect(found).toBeDefined();
              });

              // Assert: Verify result count matches expected count
              expect(result.length).toBe(expectedOffers.length);

              // Assert: Verify no offers that shouldn't be included are present
              const unexpectedOffers = offersToCreate.filter(
                offer => !shouldBeIncludedInSameDayResults(offer)
              );
              
              unexpectedOffers.forEach(unexpectedOffer => {
                const found = result.find(r => r.id === unexpectedOffer.id);
                expect(found).toBeUndefined();
              });

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty result set when no same-day offers exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate only offers that are NOT from today
          fc.array(
            fc.oneof(
              // Yesterday's offers
              flashOfferArbitrary(
                dateWithOffsetArbitrary(-1),
                dateWithOffsetArbitrary(0, { min: 0, max: new Date().getHours() - 1 })
              ),
              // Tomorrow's offers
              flashOfferArbitrary(
                dateWithOffsetArbitrary(1),
                dateWithOffsetArbitrary(2)
              ),
              // Last week's offers
              flashOfferArbitrary(
                dateWithOffsetArbitrary(-7),
                dateWithOffsetArbitrary(-6)
              )
            ),
            { minLength: 1, maxLength: 10 }
          ),
          async (offers) => {
            const offerIds: string[] = [];
            const venueIds: string[] = [];

            try {
              // Setup: Create venues and offers
              const venues = await Promise.all(
                offers.map(async (offer) => {
                  const venue = await fc.sample(venueArbitrary(offer.venue_id), 1);
                  venueIds.push(offer.venue_id);
                  return venue[0];
                })
              );

              await createTestVenues(venues);

              const offersToCreate = offers.map(offer => {
                offerIds.push(offer.id);
                return {
                  ...offer,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              });

              await createTestOffers(offersToCreate);

              // Act: Fetch same-day offers
              const result = await FlashOfferService.getSameDayOffers();

              // Assert: Result should be empty array (no same-day offers)
              const sameDayOffers = offersToCreate.filter(shouldBeIncludedInSameDayResults);
              expect(result.length).toBe(sameDayOffers.length);

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude expired offers even if they started today', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate offers that started today but already expired
          fc.array(
            flashOfferArbitrary(
              dateWithOffsetArbitrary(0, { min: 0, max: Math.max(0, new Date().getHours() - 2) }),
              dateWithOffsetArbitrary(0, { min: 0, max: Math.max(0, new Date().getHours() - 1) })
            ),
            { minLength: 1, maxLength: 10 }
          ),
          async (offers) => {
            const offerIds: string[] = [];
            const venueIds: string[] = [];

            try {
              // Setup: Create venues and offers
              const venues = await Promise.all(
                offers.map(async (offer) => {
                  const venue = await fc.sample(venueArbitrary(offer.venue_id), 1);
                  venueIds.push(offer.venue_id);
                  return venue[0];
                })
              );

              await createTestVenues(venues);

              const offersToCreate = offers.map(offer => {
                offerIds.push(offer.id);
                return {
                  ...offer,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              });

              await createTestOffers(offersToCreate);

              // Act: Fetch same-day offers
              const result = await FlashOfferService.getSameDayOffers();

              // Assert: None of the expired offers should be in the result
              offersToCreate.forEach(offer => {
                const found = result.find(r => r.id === offer.id);
                const endTime = new Date(offer.end_time);
                const { now } = getCurrentDayBoundaries();
                
                if (endTime < now) {
                  // Expired offers should not be included
                  expect(found).toBeUndefined();
                }
              });

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
