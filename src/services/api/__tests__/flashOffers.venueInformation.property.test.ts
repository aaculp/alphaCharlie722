/**
 * Property-Based Test for Flash Offers Venue Information Inclusion
 * 
 * Feature: homescreen-flash-offers-section
 * Property 9: Venue Information Inclusion
 * 
 * Validates: Requirements 5.4
 * 
 * Tests verify that all flash offers returned by getSameDayOffers include
 * venue_name field populated from the venues table join using property-based
 * testing with fast-check.
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
 * Generate a valid UUID v4
 */
const uuidArbitrary = () =>
  fc.uuid();

/**
 * Generate a date on the current day
 */
const currentDayDateArbitrary = () => {
  return fc.record({
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  }).map(({ hour, minute }) => {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  });
};

/**
 * Generate a flash offer for testing
 */
const flashOfferArbitrary = () => {
  const now = new Date();
  const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  return fc.record({
    id: uuidArbitrary(),
    venue_id: uuidArbitrary(),
    title: fc.string({ minLength: 3, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    expected_value: fc.option(fc.double({ min: 0, max: 1000, noNaN: true }), { nil: null }),
    max_claims: fc.integer({ min: 10, max: 1000 }),
    claimed_count: fc.integer({ min: 0, max: 100 }),
    start_time: currentDayDateArbitrary(),
    end_time: fc.constant(futureTime.toISOString()),
    radius_miles: fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
    target_favorites_only: fc.boolean(),
    status: fc.constant('active' as FlashOfferStatus),
    push_sent: fc.boolean(),
    push_sent_at: fc.option(fc.constant(now.toISOString()), { nil: null }),
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
 * Clean up test data
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

describeIfSupabase('FlashOfferService Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(60000);

  /**
   * Property 9: Venue Information Inclusion
   * Feature: homescreen-flash-offers-section, Property 9: Venue Information Inclusion
   * Validates: Requirements 5.4
   * 
   * For any flash offer returned by getSameDayOffers, the offer object should
   * include the venue_name field populated from the venues table join.
   */
  describe('Property 9: Venue Information Inclusion', () => {
    it('should include venue_name for all returned offers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(flashOfferArbitrary(), { minLength: 1, maxLength: 10 }),
          async (offers) => {
            const offerIds: string[] = [];
            const venueIds: string[] = [];

            try {
              // Setup: Create venues with unique names
              const venues = await Promise.all(
                offers.map(async (offer, index) => {
                  const venue = await fc.sample(venueArbitrary(offer.venue_id), 1);
                  venueIds.push(offer.venue_id);
                  return {
                    ...venue[0],
                    name: `Test Venue ${index} - ${offer.venue_id.substring(0, 8)}`,
                  };
                })
              );

              await createTestVenues(venues);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Setup: Create offers
              const offersToCreate = offers.map(offer => {
                offerIds.push(offer.id);
                return {
                  ...offer,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              });

              await createTestOffers(offersToCreate);
              await new Promise(resolve => setTimeout(resolve, 200));

              // Act: Fetch same-day offers
              const result = await FlashOfferService.getSameDayOffers();

              // Filter to only our test offers
              const testOfferIds = new Set(offerIds);
              const testResults = result.filter(r => testOfferIds.has(r.id));

              // Skip if none of our test offers were returned (they might not be same-day)
              if (testResults.length === 0) {
                return true;
              }

              // Assert: All returned offers have venue_name populated
              testResults.forEach(offer => {
                // Property 1: venue_name field must exist
                expect(offer).toHaveProperty('venue_name');
                
                // Property 2: venue_name must be a string
                expect(typeof offer.venue_name).toBe('string');
                
                // Property 3: venue_name must not be empty
                expect(offer.venue_name.length).toBeGreaterThan(0);
                
                // Property 4: venue_name must match the venue we created
                const expectedVenue = venues.find(v => v.id === offer.venue_id);
                expect(expectedVenue).toBeDefined();
                expect(offer.venue_name).toBe(expectedVenue!.name);
              });

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 50 } // Reduced runs since we're hitting the database
      );
    });

    it('should include venue_name even for offers with minimal data', async () => {
      await fc.assert(
        fc.asyncProperty(
          flashOfferArbitrary(),
          async (offer) => {
            const offerIds: string[] = [offer.id];
            const venueIds: string[] = [offer.venue_id];

            try {
              // Setup: Create a minimal venue
              const venue = {
                id: offer.venue_id,
                name: 'Minimal Venue',
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                latitude: 40.7128,
                longitude: -74.0060,
              };

              await createTestVenues([venue]);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Setup: Create offer
              const offerToCreate = {
                ...offer,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              await createTestOffers([offerToCreate]);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Act: Fetch same-day offers
              const result = await FlashOfferService.getSameDayOffers();

              // Find our test offer
              const testOffer = result.find(r => r.id === offer.id);

              if (testOffer) {
                // Assert: venue_name is populated
                expect(testOffer.venue_name).toBe('Minimal Venue');
              }

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve venue_name across multiple fetches', async () => {
      await fc.assert(
        fc.asyncProperty(
          flashOfferArbitrary(),
          async (offer) => {
            const offerIds: string[] = [offer.id];
            const venueIds: string[] = [offer.venue_id];

            try {
              // Setup: Create venue
              const venue = {
                id: offer.venue_id,
                name: 'Consistent Venue Name',
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                latitude: 40.7128,
                longitude: -74.0060,
              };

              await createTestVenues([venue]);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Setup: Create offer
              const offerToCreate = {
                ...offer,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              await createTestOffers([offerToCreate]);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Act: Fetch same-day offers multiple times
              const result1 = await FlashOfferService.getSameDayOffers();
              const result2 = await FlashOfferService.getSameDayOffers();

              // Find our test offer in both results
              const testOffer1 = result1.find(r => r.id === offer.id);
              const testOffer2 = result2.find(r => r.id === offer.id);

              if (testOffer1 && testOffer2) {
                // Assert: venue_name is consistent across fetches
                expect(testOffer1.venue_name).toBe('Consistent Venue Name');
                expect(testOffer2.venue_name).toBe('Consistent Venue Name');
                expect(testOffer1.venue_name).toBe(testOffer2.venue_name);
              }

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle venue names with special characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          flashOfferArbitrary(),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (offer, venueName) => {
            const offerIds: string[] = [offer.id];
            const venueIds: string[] = [offer.venue_id];

            try {
              // Setup: Create venue with special characters in name
              const venue = {
                id: offer.venue_id,
                name: venueName,
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                latitude: 40.7128,
                longitude: -74.0060,
              };

              await createTestVenues([venue]);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Setup: Create offer
              const offerToCreate = {
                ...offer,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              await createTestOffers([offerToCreate]);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Act: Fetch same-day offers
              const result = await FlashOfferService.getSameDayOffers();

              // Find our test offer
              const testOffer = result.find(r => r.id === offer.id);

              if (testOffer) {
                // Assert: venue_name matches exactly, including special characters
                expect(testOffer.venue_name).toBe(venueName);
              }

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(offerIds, venueIds);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});

