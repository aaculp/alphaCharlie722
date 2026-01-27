/**
 * Property-Based Test for Flash Offers Location-Independent Display
 * 
 * Feature: homescreen-flash-offers-section
 * Property 3: Location-Independent Display
 * 
 * Validates: Requirements 1.3, 8.1, 8.3
 * 
 * Tests verify that getSameDayOffers returns all same-day offers sorted by start_time
 * when location data is not provided (location permission denied).
 */

import * as fc from 'fast-check';
import { FlashOfferService } from '../flashOffers';
import { supabase } from '../../../lib/supabase';
import type { FlashOfferStatus } from '../flashOffers';

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
    return `${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}-4${Math.random().toString(16).slice(3, 6)}-8${Math.random().toString(16).slice(3, 6)}-${Math.random().toString(16).slice(2, 14)}`;
  });

/**
 * Generate a date for today with specific hour
 */
const todayDateWithHourArbitrary = (hour: number) => {
  return fc.record({
    minute: fc.integer({ min: 0, max: 59 }),
    second: fc.integer({ min: 0, max: 59 }),
  }).map(({ minute, second }) => {
    const date = new Date();
    date.setHours(hour, minute, second, 0);
    return date.toISOString();
  });
};

/**
 * Generate a future date (later today or tomorrow)
 */
const futureDateArbitrary = () => {
  return fc.record({
    hoursFromNow: fc.integer({ min: 1, max: 24 }),
  }).map(({ hoursFromNow }) => {
    const date = new Date();
    date.setHours(date.getHours() + hoursFromNow);
    return date.toISOString();
  });
};

/**
 * Clean up test data after each test
 */
async function cleanupTestData(offerIds: string[] = [], venueIds: string[] = []) {
  try {
    if (offerIds.length > 0) {
      await supabase.from('flash_offers').delete().in('id', offerIds);
    }
    if (venueIds.length > 0) {
      await supabase.from('venues').delete().in('id', venueIds);
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

// ============================================================================
// Property Tests
// ============================================================================

describeIfSupabase('FlashOfferService Location-Independent Display Property Tests', () => {
  jest.setTimeout(60000);

  // Clean up any timers after each test
  afterEach(() => {
    jest.clearAllTimers();
  });

  /**
   * Property 3: Location-Independent Display
   * Feature: homescreen-flash-offers-section, Property 3: Location-Independent Display
   * Validates: Requirements 1.3, 8.1, 8.3
   * 
   * For any set of same-day offers, when location permission is denied (no location data),
   * all same-day offers should be returned without distance information and sorted by
   * start_time ascending.
   */
  describe('Property 3: Location-Independent Display', () => {
    it('should return all same-day offers sorted by start_time when no location provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate offers with various start times throughout the day
          fc.array(
            fc.record({
              id: uuidArbitrary(),
              venueId: uuidArbitrary(),
              startHour: fc.integer({ min: 0, max: 23 }),
            }),
            { minLength: 5, maxLength: 15 }
          ),
          async (offerSpecs) => {
            const offerIds: string[] = [];
            const venueIds: string[] = [];

            try {
              // Create venues at random locations
              const venues = offerSpecs.map((spec) => {
                venueIds.push(spec.venueId);
                
                return {
                  id: spec.venueId,
                  name: `Test Venue ${spec.venueId.slice(0, 8)}`,
                  address: '123 Test St',
                  city: 'Test City',
                  state: 'TS',
                  latitude: 40.7128 + Math.random() * 10,
                  longitude: -74.0060 + Math.random() * 10,
                };
              });

              await createTestVenues(venues);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Verify venues were created
              const { data: createdVenues, error: venueCheckError } = await supabase
                .from('venues')
                .select('id')
                .in('id', venueIds);
              
              if (venueCheckError || !createdVenues || createdVenues.length !== venues.length) {
                console.warn('Venue creation verification failed:', venueCheckError, createdVenues?.length, venues.length);
                // Skip this test iteration if venues weren't created properly
                fc.pre(false);
                return true;
              }

              // Create same-day offers with different start times
              const offers = await Promise.all(
                offerSpecs.map(async (spec) => {
                  offerIds.push(spec.id);
                  
                  // Generate start time for the specified hour
                  const startTime = fc.sample(todayDateWithHourArbitrary(spec.startHour), 1);
                  
                  return {
                    id: spec.id,
                    venue_id: spec.venueId,
                    title: 'Test Flash Offer',
                    description: 'Test description',
                    value_cap: null,
                    max_claims: 10,
                    claimed_count: 0,
                    start_time: startTime[0],
                    end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
                    radius_miles: 10,
                    target_favorites_only: false,
                    status: 'active' as FlashOfferStatus,
                    push_sent: false,
                    push_sent_at: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                })
              );

              await createTestOffers(offers);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Act: Fetch same-day offers WITHOUT location
              const result = await FlashOfferService.getSameDayOffers();

              // Assert: All same-day offers should be returned
              expect(result.length).toBe(offerSpecs.length);

              // Assert: No distance information should be present
              result.forEach(offer => {
                expect(offer.distance_miles).toBeUndefined();
              });

              // Assert: Offers should be sorted by start_time (ascending)
              for (let i = 1; i < result.length; i++) {
                const prevStartTime = new Date(result[i - 1].start_time).getTime();
                const currStartTime = new Date(result[i].start_time).getTime();
                expect(currStartTime).toBeGreaterThanOrEqual(prevStartTime);
              }

              // Assert: venue_name should be populated for all offers
              result.forEach(offer => {
                expect(offer.venue_name).toBeDefined();
                expect(typeof offer.venue_name).toBe('string');
                expect(offer.venue_name.length).toBeGreaterThan(0);
              });

              return true;
            } finally {
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle offers with identical start times', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate multiple offers with the same start time
          fc.record({
            startHour: fc.integer({ min: 0, max: 23 }),
            offerCount: fc.integer({ min: 3, max: 10 }),
          }),
          async ({ startHour, offerCount }) => {
            const offerIds: string[] = [];
            const venueIds: string[] = [];

            try {
              // Generate offer specs
              const offerSpecs = Array.from({ length: offerCount }, () => ({
                id: fc.sample(uuidArbitrary(), 1)[0],
                venueId: fc.sample(uuidArbitrary(), 1)[0],
              }));

              // Create venues
              const venues = offerSpecs.map((spec) => {
                venueIds.push(spec.venueId);
                
                return {
                  id: spec.venueId,
                  name: `Test Venue ${spec.venueId.slice(0, 8)}`,
                  address: '123 Test St',
                  city: 'Test City',
                  state: 'TS',
                  latitude: 40.7128 + Math.random() * 10,
                  longitude: -74.0060 + Math.random() * 10,
                };
              });

              await createTestVenues(venues);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Create offers with the same start time
              const startTime = fc.sample(todayDateWithHourArbitrary(startHour), 1)[0];
              const offers = offerSpecs.map((spec) => {
                offerIds.push(spec.id);
                
                return {
                  id: spec.id,
                  venue_id: spec.venueId,
                  title: 'Test Flash Offer',
                  description: 'Test description',
                  value_cap: null,
                  max_claims: 10,
                  claimed_count: 0,
                  start_time: startTime,
                  end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
                  radius_miles: 10,
                  target_favorites_only: false,
                  status: 'active' as FlashOfferStatus,
                  push_sent: false,
                  push_sent_at: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              });

              await createTestOffers(offers);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Act: Fetch same-day offers WITHOUT location
              const result = await FlashOfferService.getSameDayOffers();

              // Assert: All offers should be returned
              expect(result.length).toBe(offerCount);

              // Assert: All offers should have the same start_time
              const firstStartTime = result[0].start_time;
              result.forEach(offer => {
                expect(offer.start_time).toBe(firstStartTime);
              });

              // Assert: No distance information should be present
              result.forEach(offer => {
                expect(offer.distance_miles).toBeUndefined();
              });

              return true;
            } finally {
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return offers in chronological order regardless of venue location', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate offers with sequential start times
          fc.array(
            fc.record({
              id: uuidArbitrary(),
              venueId: uuidArbitrary(),
              hourOffset: fc.integer({ min: 0, max: 10 }),
            }),
            { minLength: 5, maxLength: 12 }
          ),
          async (offerSpecs) => {
            const offerIds: string[] = [];
            const venueIds: string[] = [];

            try {
              // Create venues at widely varying locations
              const venues = offerSpecs.map((spec) => {
                venueIds.push(spec.venueId);
                
                return {
                  id: spec.venueId,
                  name: `Test Venue ${spec.venueId.slice(0, 8)}`,
                  address: '123 Test St',
                  city: 'Test City',
                  state: 'TS',
                  // Spread venues across a wide geographic area
                  latitude: 25 + Math.random() * 20,
                  longitude: -125 + Math.random() * 50,
                };
              });

              await createTestVenues(venues);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Create offers with start times based on hourOffset
              const baseTime = new Date();
              const offers = offerSpecs.map((spec) => {
                offerIds.push(spec.id);
                
                const startTime = new Date(baseTime);
                startTime.setHours(baseTime.getHours() + spec.hourOffset);
                
                return {
                  id: spec.id,
                  venue_id: spec.venueId,
                  title: 'Test Flash Offer',
                  description: 'Test description',
                  value_cap: null,
                  max_claims: 10,
                  claimed_count: 0,
                  start_time: startTime.toISOString(),
                  end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  radius_miles: 10,
                  target_favorites_only: false,
                  status: 'active' as FlashOfferStatus,
                  push_sent: false,
                  push_sent_at: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              });

              await createTestOffers(offers);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Act: Fetch same-day offers WITHOUT location
              const result = await FlashOfferService.getSameDayOffers();

              // Assert: Offers should be sorted by start_time, not by venue location
              for (let i = 1; i < result.length; i++) {
                const prevStartTime = new Date(result[i - 1].start_time).getTime();
                const currStartTime = new Date(result[i].start_time).getTime();
                expect(currStartTime).toBeGreaterThanOrEqual(prevStartTime);
              }

              // Assert: No distance information should be present
              result.forEach(offer => {
                expect(offer.distance_miles).toBeUndefined();
              });

              return true;
            } finally {
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no same-day offers exist (without location)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate offers from yesterday or tomorrow
          fc.array(
            fc.record({
              id: uuidArbitrary(),
              venueId: uuidArbitrary(),
              dayOffset: fc.constantFrom(-1, 1), // Yesterday or tomorrow
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (offerSpecs) => {
            const offerIds: string[] = [];
            const venueIds: string[] = [];

            try {
              // Create venues
              const venues = offerSpecs.map((spec) => {
                venueIds.push(spec.venueId);
                
                return {
                  id: spec.venueId,
                  name: `Test Venue ${spec.venueId.slice(0, 8)}`,
                  address: '123 Test St',
                  city: 'Test City',
                  state: 'TS',
                  latitude: 40.7128,
                  longitude: -74.0060,
                };
              });

              await createTestVenues(venues);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Create offers from yesterday or tomorrow
              const offers = offerSpecs.map((spec) => {
                offerIds.push(spec.id);
                
                const startTime = new Date();
                startTime.setDate(startTime.getDate() + spec.dayOffset);
                
                const endTime = new Date(startTime);
                endTime.setHours(endTime.getHours() + 2);
                
                return {
                  id: spec.id,
                  venue_id: spec.venueId,
                  title: 'Test Flash Offer',
                  description: 'Test description',
                  value_cap: null,
                  max_claims: 10,
                  claimed_count: 0,
                  start_time: startTime.toISOString(),
                  end_time: endTime.toISOString(),
                  radius_miles: 10,
                  target_favorites_only: false,
                  status: 'active' as FlashOfferStatus,
                  push_sent: false,
                  push_sent_at: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              });

              await createTestOffers(offers);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Act: Fetch same-day offers WITHOUT location
              const result = await FlashOfferService.getSameDayOffers();

              // Assert: Should return empty array (no same-day offers)
              // Note: This might return offers if there are other same-day offers in the database
              // So we just verify that none of our test offers are returned
              const testOfferIds = new Set(offerIds);
              result.forEach(offer => {
                expect(testOfferIds.has(offer.id)).toBe(false);
              });

              return true;
            } finally {
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
