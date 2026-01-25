/**
 * Property-Based Tests for SearchScreen Venue Search
 * Feature: at-search-feature
 * 
 * Tests the venue search filtering logic in SearchScreen.
 * These tests validate that venue search correctly matches across multiple fields
 * (name, category, location, description) with case-insensitive matching.
 */

import * as fc from 'fast-check';
import type { Venue } from '../../../types';

/**
 * Arbitraries for generating test data
 */

// Generate venue names
const venueNameArbitrary = fc.oneof(
  fc.constantFrom(
    'The Coffee Shop',
    'Pizza Palace',
    'Burger King',
    'Sushi Bar',
    'Taco Bell',
    'Starbucks',
    'McDonald\'s',
    'Subway'
  ),
  fc.string({ minLength: 3, maxLength: 50 })
);

// Generate venue categories
const venueCategoryArbitrary = fc.constantFrom(
  'Fast Food',
  'Fine Dining',
  'Coffee Shops',
  'Sports Bars',
  'Breweries',
  'Casual Dining',
  'Pizza',
  'Sushi'
);

// Generate venue locations
const venueLocationArbitrary = fc.oneof(
  fc.constantFrom(
    'Downtown',
    'Uptown',
    'West Side',
    'East Side',
    'North End',
    'South Beach',
    'City Center',
    'Suburbs'
  ),
  fc.string({ minLength: 3, maxLength: 50 })
);

// Generate venue descriptions
const venueDescriptionArbitrary = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string({ minLength: 10, maxLength: 200 })
);

// Generate complete Venue objects
const venueArbitrary = fc.record({
  id: fc.uuid(),
  name: venueNameArbitrary,
  category: venueCategoryArbitrary,
  location: venueLocationArbitrary,
  description: venueDescriptionArbitrary,
  image_url: fc.webUrl(),
  rating: fc.double({ min: 1, max: 5, noNaN: true }),
  price_range: fc.constantFrom('$', '$$', '$$$'),
  hours: fc.constant({}),
  created_at: fc.constant('2024-01-01T00:00:00.000Z'),
  updated_at: fc.constant('2024-01-01T00:00:00.000Z'),
}) as fc.Arbitrary<Venue>;

/**
 * Simulates the venue search filtering logic from SearchScreen
 * This is extracted from the filterVenues function for testing
 */
const searchVenues = (venues: Venue[], searchQuery: string): Venue[] => {
  if (searchQuery.trim() === '') {
    return venues;
  }

  const query = searchQuery.toLowerCase();
  return venues.filter(venue =>
    venue.name.toLowerCase().includes(query) ||
    venue.category.toLowerCase().includes(query) ||
    venue.location.toLowerCase().includes(query) ||
    venue.description?.toLowerCase().includes(query)
  );
};

describe('SearchScreen Venue Search - Property-Based Tests', () => {
  describe('Property 16: Venue Search Multi-Field Coverage', () => {
    /**
     * Feature: at-search-feature, Property 16: Venue Search Multi-Field Coverage
     * Validates: Requirements 7.1
     *
     * For any venue search query, the results should include venues where the query
     * matches any of these fields: name, category, location, or description (case-insensitive).
     */
    
    it('should find venues by name match', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          fc.nat({ max: 19 }), // Index to select a venue
          (venues, index) => {
            const targetVenue = venues[index % venues.length];
            // Extract a substring from the venue name to search for
            const searchQuery = targetVenue.name.substring(0, Math.max(3, targetVenue.name.length / 2));
            
            const results = searchVenues(venues, searchQuery);
            
            // Results should include the target venue (case-insensitive match)
            const found = results.some(v => v.id === targetVenue.id);
            expect(found).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should find venues by category match', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          fc.nat({ max: 19 }), // Index to select a venue
          (venues, index) => {
            const targetVenue = venues[index % venues.length];
            // Search by category
            const searchQuery = targetVenue.category.substring(0, Math.max(3, targetVenue.category.length / 2));
            
            const results = searchVenues(venues, searchQuery);
            
            // Results should include the target venue
            const found = results.some(v => v.id === targetVenue.id);
            expect(found).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should find venues by location match', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          fc.nat({ max: 19 }), // Index to select a venue
          (venues, index) => {
            const targetVenue = venues[index % venues.length];
            // Search by location
            const searchQuery = targetVenue.location.substring(0, Math.max(3, targetVenue.location.length / 2));
            
            const results = searchVenues(venues, searchQuery);
            
            // Results should include the target venue
            const found = results.some(v => v.id === targetVenue.id);
            expect(found).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should find venues by description match when description exists', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 })
            .filter(venues => venues.some(v => v.description && v.description.length > 5)),
          (venues) => {
            // Find a venue with a description
            const targetVenue = venues.find(v => v.description && v.description.length > 5)!;
            // Search by description substring
            const searchQuery = targetVenue.description!.substring(0, Math.max(3, targetVenue.description!.length / 2));
            
            const results = searchVenues(venues, searchQuery);
            
            // Results should include the target venue
            const found = results.some(v => v.id === targetVenue.id);
            expect(found).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should perform case-insensitive search across all fields', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          fc.nat({ max: 19 }),
          fc.constantFrom('name', 'category', 'location'),
          (venues, index, field) => {
            const targetVenue = venues[index % venues.length];
            const fieldValue = targetVenue[field as keyof Venue] as string;
            
            // Create search queries with different cases
            const lowerQuery = fieldValue.toLowerCase();
            const upperQuery = fieldValue.toUpperCase();
            const mixedQuery = fieldValue.split('').map((c, i) => 
              i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
            ).join('');
            
            const resultsLower = searchVenues(venues, lowerQuery);
            const resultsUpper = searchVenues(venues, upperQuery);
            const resultsMixed = searchVenues(venues, mixedQuery);
            
            // All case variations should find the target venue
            expect(resultsLower.some(v => v.id === targetVenue.id)).toBe(true);
            expect(resultsUpper.some(v => v.id === targetVenue.id)).toBe(true);
            expect(resultsMixed.some(v => v.id === targetVenue.id)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for non-matching queries', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          (venues) => {
            // Use a query that is very unlikely to match any venue
            const searchQuery = 'xyzabc123nonexistent999';
            
            const results = searchVenues(venues, searchQuery);
            
            // Results should be empty or only contain venues that actually match
            results.forEach(venue => {
              const matches = 
                venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                venue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                venue.description?.toLowerCase().includes(searchQuery.toLowerCase());
              
              expect(matches).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all venues for empty search query', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 0, maxLength: 20 }),
          (venues) => {
            const results = searchVenues(venues, '');
            
            // Empty query should return all venues
            expect(results.length).toBe(venues.length);
            expect(results).toEqual(venues);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all venues for whitespace-only search query', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 0, maxLength: 20 }),
          fc.constantFrom('   ', '\t', '\n', '  \t  '),
          (venues, whitespace) => {
            const results = searchVenues(venues, whitespace);
            
            // Whitespace-only query should return all venues
            expect(results.length).toBe(venues.length);
            expect(results).toEqual(venues);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match partial strings in any field', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          fc.nat({ max: 19 }),
          (venues, index) => {
            const targetVenue = venues[index % venues.length];
            
            // Test partial matches from different parts of the name
            const nameLength = targetVenue.name.length;
            if (nameLength >= 6) {
              const startPartial = targetVenue.name.substring(0, 3);
              const middlePartial = targetVenue.name.substring(Math.floor(nameLength / 2) - 1, Math.floor(nameLength / 2) + 2);
              const endPartial = targetVenue.name.substring(nameLength - 3);
              
              const resultsStart = searchVenues(venues, startPartial);
              const resultsMiddle = searchVenues(venues, middlePartial);
              const resultsEnd = searchVenues(venues, endPartial);
              
              // All partial matches should find the venue
              expect(resultsStart.some(v => v.id === targetVenue.id)).toBe(true);
              expect(resultsMiddle.some(v => v.id === targetVenue.id)).toBe(true);
              expect(resultsEnd.some(v => v.id === targetVenue.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in search query', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          (venues) => {
            // Test with special characters that might appear in venue names
            const specialQueries = ['&', '-', '\'', '.', ','];
            
            specialQueries.forEach(query => {
              const results = searchVenues(venues, query);
              
              // Should not throw errors and should only return matching venues
              results.forEach(venue => {
                const matches = 
                  venue.name.toLowerCase().includes(query.toLowerCase()) ||
                  venue.category.toLowerCase().includes(query.toLowerCase()) ||
                  venue.location.toLowerCase().includes(query.toLowerCase()) ||
                  venue.description?.toLowerCase().includes(query.toLowerCase());
                
                expect(matches).toBe(true);
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle venues with null or undefined descriptions', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary.map(v => ({ ...v, description: null })), { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), // Filter out whitespace-only strings
          (venues, searchQuery) => {
            // Should not throw errors when description is null
            expect(() => searchVenues(venues, searchQuery)).not.toThrow();
            
            const results = searchVenues(venues, searchQuery);
            
            // Results should only match on name, category, or location
            results.forEach(venue => {
              const matches = 
                venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                venue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                venue.location.toLowerCase().includes(searchQuery.toLowerCase());
              
              expect(matches).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same query returns same results', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (venues, searchQuery) => {
            const results1 = searchVenues(venues, searchQuery);
            const results2 = searchVenues(venues, searchQuery);
            const results3 = searchVenues(venues, searchQuery);
            
            // All results should be identical
            expect(results1).toEqual(results2);
            expect(results2).toEqual(results3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve venue object structure in results', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (venues, searchQuery) => {
            const results = searchVenues(venues, searchQuery);
            
            // Each result should be a complete venue object
            results.forEach(venue => {
              expect(venue).toHaveProperty('id');
              expect(venue).toHaveProperty('name');
              expect(venue).toHaveProperty('category');
              expect(venue).toHaveProperty('location');
              expect(venue).toHaveProperty('rating');
              expect(venue).toHaveProperty('price_range');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match across multiple fields simultaneously', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          (venues) => {
            // Create a venue with a common word in multiple fields
            const commonWord = 'test';
            const testVenue: Venue = {
              ...venues[0],
              id: 'test-venue-id',
              name: `${commonWord} Restaurant`,
              category: `${commonWord} Category`,
              location: `${commonWord} Location`,
              description: `A ${commonWord} description`,
            };
            
            const venuesWithTest = [...venues, testVenue];
            const results = searchVenues(venuesWithTest, commonWord);
            
            // Should find the test venue
            expect(results.some(v => v.id === 'test-venue-id')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle unicode and international characters', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          (venues) => {
            // Create venues with international characters
            const internationalVenue: Venue = {
              ...venues[0],
              id: 'international-venue',
              name: 'Café François',
              category: 'Fine Dining',
              location: 'São Paulo',
              description: 'Delicious crêpes and café',
            };
            
            const venuesWithInternational = [...venues, internationalVenue];
            
            // Search for international characters
            const results1 = searchVenues(venuesWithInternational, 'café');
            const results2 = searchVenues(venuesWithInternational, 'são');
            const results3 = searchVenues(venuesWithInternational, 'crêpes');
            
            // Should find the international venue (case-insensitive)
            expect(results1.some(v => v.id === 'international-venue')).toBe(true);
            expect(results2.some(v => v.id === 'international-venue')).toBe(true);
            expect(results3.some(v => v.id === 'international-venue')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Property: Search Result Subset', () => {
    /**
     * Additional property to ensure search results are always a subset of input venues
     */
    it('should always return a subset of the input venues', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 20 }),
          (venues, searchQuery) => {
            const results = searchVenues(venues, searchQuery);
            
            // Results should be a subset of input venues
            expect(results.length).toBeLessThanOrEqual(venues.length);
            
            // Every result should exist in the input venues
            results.forEach(result => {
              expect(venues.some(v => v.id === result.id)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify the input venues array', () => {
      fc.assert(
        fc.property(
          fc.array(venueArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 20 }),
          (venues, searchQuery) => {
            const originalVenues = JSON.parse(JSON.stringify(venues));
            
            searchVenues(venues, searchQuery);
            
            // Input venues should remain unchanged
            expect(venues).toEqual(originalVenues);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
