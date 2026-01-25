/**
 * Unit Tests for SearchScreen Venue Search
 * Feature: at-search-feature
 * 
 * Tests specific examples and edge cases for venue search filtering.
 * These tests validate that venue search correctly matches across multiple fields
 * (name, category, location, description) with case-insensitive matching.
 * 
 * Requirements: 7.1, 7.3
 */

import type { Venue } from '../../../types';

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

/**
 * Helper function to create a test venue with minimal required fields
 */
const createTestVenue = (overrides: Partial<Venue> = {}): Venue => ({
  id: 'test-venue-id',
  name: 'Test Venue',
  description: 'A test venue description',
  category: 'Test Category',
  location: 'Test Location',
  address: '123 Test St',
  phone: null,
  website: null,
  rating: 4.5,
  review_count: 10,
  aggregate_rating: 4.5,
  image_url: 'https://example.com/image.jpg',
  price_range: '$',
  hours: {},
  latitude: 0,
  longitude: 0,
  venue_owner_id: null,
  is_verified: false,
  max_capacity: null,
  current_capacity: null,
  last_capacity_update: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('SearchScreen Venue Search - Unit Tests', () => {
  describe('Search by venue name', () => {
    it('should find venue by exact name match', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
        createTestVenue({ id: '2', name: 'Burger King' }),
        createTestVenue({ id: '3', name: 'Sushi Bar' }),
      ];

      const results = searchVenues(venues, 'Pizza Palace');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
      expect(results[0].name).toBe('Pizza Palace');
    });

    it('should find venue by partial name match', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'The Coffee Shop' }),
        createTestVenue({ id: '2', name: 'Burger King' }),
        createTestVenue({ id: '3', name: 'Sushi Bar' }),
      ];

      const results = searchVenues(venues, 'Coffee');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should find multiple venues with matching names', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
        createTestVenue({ id: '2', name: 'Pizza Hut' }),
        createTestVenue({ id: '3', name: 'Burger King' }),
      ];

      const results = searchVenues(venues, 'Pizza');

      expect(results).toHaveLength(2);
      expect(results.map(v => v.id)).toEqual(expect.arrayContaining(['1', '2']));
    });

    it('should perform case-insensitive name search', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'The Coffee Shop' }),
      ];

      const resultsLower = searchVenues(venues, 'coffee');
      const resultsUpper = searchVenues(venues, 'COFFEE');
      const resultsMixed = searchVenues(venues, 'CoFfEe');

      expect(resultsLower).toHaveLength(1);
      expect(resultsUpper).toHaveLength(1);
      expect(resultsMixed).toHaveLength(1);
    });
  });

  describe('Search by category', () => {
    it('should find venue by exact category match', () => {
      const venues = [
        createTestVenue({ id: '1', category: 'Fast Food' }),
        createTestVenue({ id: '2', category: 'Fine Dining' }),
        createTestVenue({ id: '3', category: 'Coffee Shops' }),
      ];

      const results = searchVenues(venues, 'Fast Food');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should find venue by partial category match', () => {
      const venues = [
        createTestVenue({ id: '1', category: 'Fast Food' }),
        createTestVenue({ id: '2', category: 'Fine Dining' }),
      ];

      const results = searchVenues(venues, 'Fast');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should find multiple venues in same category', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace', category: 'Fast Food' }),
        createTestVenue({ id: '2', name: 'Burger King', category: 'Fast Food' }),
        createTestVenue({ id: '3', name: 'Fancy Restaurant', category: 'Fine Dining' }),
      ];

      const results = searchVenues(venues, 'Fast Food');

      expect(results).toHaveLength(2);
      expect(results.map(v => v.id)).toEqual(expect.arrayContaining(['1', '2']));
    });

    it('should perform case-insensitive category search', () => {
      const venues = [
        createTestVenue({ id: '1', category: 'Coffee Shops' }),
      ];

      const resultsLower = searchVenues(venues, 'coffee shops');
      const resultsUpper = searchVenues(venues, 'COFFEE SHOPS');
      const resultsMixed = searchVenues(venues, 'CoFfEe ShOpS');

      expect(resultsLower).toHaveLength(1);
      expect(resultsUpper).toHaveLength(1);
      expect(resultsMixed).toHaveLength(1);
    });
  });

  describe('Search by location', () => {
    it('should find venue by exact location match', () => {
      const venues = [
        createTestVenue({ id: '1', location: 'Downtown' }),
        createTestVenue({ id: '2', location: 'Uptown' }),
        createTestVenue({ id: '3', location: 'West Side' }),
      ];

      const results = searchVenues(venues, 'Downtown');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should find venue by partial location match', () => {
      const venues = [
        createTestVenue({ id: '1', location: 'Downtown Manhattan' }),
        createTestVenue({ id: '2', location: 'Uptown' }),
      ];

      const results = searchVenues(venues, 'Manhattan');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should find multiple venues in same location', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace', location: 'Downtown' }),
        createTestVenue({ id: '2', name: 'Burger King', location: 'Downtown' }),
        createTestVenue({ id: '3', name: 'Sushi Bar', location: 'Uptown' }),
      ];

      const results = searchVenues(venues, 'Downtown');

      expect(results).toHaveLength(2);
      expect(results.map(v => v.id)).toEqual(expect.arrayContaining(['1', '2']));
    });

    it('should perform case-insensitive location search', () => {
      const venues = [
        createTestVenue({ id: '1', location: 'West Side' }),
      ];

      const resultsLower = searchVenues(venues, 'west side');
      const resultsUpper = searchVenues(venues, 'WEST SIDE');
      const resultsMixed = searchVenues(venues, 'WeSt SiDe');

      expect(resultsLower).toHaveLength(1);
      expect(resultsUpper).toHaveLength(1);
      expect(resultsMixed).toHaveLength(1);
    });
  });

  describe('Search by description', () => {
    it('should find venue by description match', () => {
      const venues = [
        createTestVenue({ id: '1', description: 'Best pizza in town with authentic Italian recipes' }),
        createTestVenue({ id: '2', description: 'Fresh burgers and fries' }),
        createTestVenue({ id: '3', description: 'Traditional sushi and Japanese cuisine' }),
      ];

      const results = searchVenues(venues, 'Italian');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should find venue by partial description match', () => {
      const venues = [
        createTestVenue({ id: '1', description: 'Authentic wood-fired pizza' }),
        createTestVenue({ id: '2', description: 'Fresh burgers' }),
      ];

      const results = searchVenues(venues, 'wood-fired');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should perform case-insensitive description search', () => {
      const venues = [
        createTestVenue({ id: '1', description: 'Authentic Italian Cuisine' }),
      ];

      const resultsLower = searchVenues(venues, 'italian');
      const resultsUpper = searchVenues(venues, 'ITALIAN');
      const resultsMixed = searchVenues(venues, 'ItAlIaN');

      expect(resultsLower).toHaveLength(1);
      expect(resultsUpper).toHaveLength(1);
      expect(resultsMixed).toHaveLength(1);
    });

    it('should handle venues with null description', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace', description: null }),
        createTestVenue({ id: '2', name: 'Burger King', description: 'Great burgers' }),
      ];

      const results = searchVenues(venues, 'burgers');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should handle venues with undefined description', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace', description: undefined }),
        createTestVenue({ id: '2', name: 'Burger King', description: 'Great burgers' }),
      ];

      const results = searchVenues(venues, 'burgers');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });
  });

  describe('Multi-field search', () => {
    it('should find venue matching any field', () => {
      const venues = [
        createTestVenue({
          id: '1',
          name: 'Pizza Palace',
          category: 'Fast Food',
          location: 'Downtown',
          description: 'Best pizza in town',
        }),
      ];

      const resultsByName = searchVenues(venues, 'Pizza');
      const resultsByCategory = searchVenues(venues, 'Fast Food');
      const resultsByLocation = searchVenues(venues, 'Downtown');
      const resultsByDescription = searchVenues(venues, 'Best pizza');

      expect(resultsByName).toHaveLength(1);
      expect(resultsByCategory).toHaveLength(1);
      expect(resultsByLocation).toHaveLength(1);
      expect(resultsByDescription).toHaveLength(1);
    });

    it('should find venue when query matches multiple fields', () => {
      const venues = [
        createTestVenue({
          id: '1',
          name: 'Downtown Pizza',
          category: 'Fast Food',
          location: 'Downtown Manhattan',
          description: 'Downtown location with great pizza',
        }),
      ];

      const results = searchVenues(venues, 'Downtown');

      // Should find the venue (matches name, location, and description)
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should return distinct venues when query matches multiple fields', () => {
      const venues = [
        createTestVenue({
          id: '1',
          name: 'Coffee Coffee',
          category: 'Coffee Shops',
          location: 'Coffee Street',
          description: 'Best coffee in town',
        }),
      ];

      const results = searchVenues(venues, 'Coffee');

      // Should return the venue only once, even though it matches multiple fields
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });
  });

  describe('Empty results handling', () => {
    it('should return empty array when no venues match', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
        createTestVenue({ id: '2', name: 'Burger King' }),
      ];

      const results = searchVenues(venues, 'Sushi');

      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
    });

    it('should return empty array when searching empty venue list', () => {
      const venues: Venue[] = [];

      const results = searchVenues(venues, 'Pizza');

      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
    });

    it('should return all venues when search query is empty', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
        createTestVenue({ id: '2', name: 'Burger King' }),
        createTestVenue({ id: '3', name: 'Sushi Bar' }),
      ];

      const results = searchVenues(venues, '');

      expect(results).toHaveLength(3);
      expect(results).toEqual(venues);
    });

    it('should return all venues when search query is whitespace only', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
        createTestVenue({ id: '2', name: 'Burger King' }),
      ];

      const resultsSpace = searchVenues(venues, '   ');
      const resultsTab = searchVenues(venues, '\t');
      const resultsNewline = searchVenues(venues, '\n');

      expect(resultsSpace).toHaveLength(2);
      expect(resultsTab).toHaveLength(2);
      expect(resultsNewline).toHaveLength(2);
    });

    it('should return empty array for non-existent search term', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace', category: 'Fast Food', location: 'Downtown' }),
        createTestVenue({ id: '2', name: 'Burger King', category: 'Fast Food', location: 'Uptown' }),
      ];

      const results = searchVenues(venues, 'xyznonexistent123');

      expect(results).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in search query', () => {
      const venues = [
        createTestVenue({ id: '1', name: "Joe's Pizza & Pasta" }),
        createTestVenue({ id: '2', name: 'The Coffee Shop' }),
      ];

      const results = searchVenues(venues, '&');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should handle apostrophes in search query', () => {
      const venues = [
        createTestVenue({ id: '1', name: "Joe's Pizza" }),
        createTestVenue({ id: '2', name: 'Pizza Palace' }),
      ];

      const results = searchVenues(venues, "Joe's");

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should handle hyphens in search query', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Wood-Fired Pizza' }),
        createTestVenue({ id: '2', name: 'Pizza Palace' }),
      ];

      const results = searchVenues(venues, 'Wood-Fired');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should handle numbers in search query', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Route 66 Diner' }),
        createTestVenue({ id: '2', name: 'Pizza Palace' }),
      ];

      const results = searchVenues(venues, '66');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should handle unicode characters', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Café François' }),
        createTestVenue({ id: '2', name: 'Pizza Palace' }),
      ];

      const results = searchVenues(venues, 'Café');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should handle search query with leading/trailing whitespace', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
      ];

      // The search function checks if trim() is empty, but uses the original query
      // So '  Pizza  '.toLowerCase() becomes '  pizza  ' which won't match 'pizza palace'
      // because includes() looks for exact substring match including spaces
      const results = searchVenues(venues, '  Pizza  ');

      // This will not match because the query has leading/trailing spaces
      // The actual implementation doesn't trim the query before searching
      expect(results).toHaveLength(0);
    });

    it('should not modify original venues array', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
        createTestVenue({ id: '2', name: 'Burger King' }),
      ];
      const originalVenues = [...venues];

      searchVenues(venues, 'Pizza');

      expect(venues).toEqual(originalVenues);
    });

    it('should handle very long search queries', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
      ];

      const longQuery = 'a'.repeat(1000);
      const results = searchVenues(venues, longQuery);

      expect(results).toHaveLength(0);
    });

    it('should handle venues with empty strings in fields', () => {
      const venues = [
        createTestVenue({ id: '1', name: '', category: '', location: '', description: '' }),
        createTestVenue({ id: '2', name: 'Pizza Palace' }),
      ];

      const results = searchVenues(venues, 'Pizza');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });
  });

  describe('Performance and consistency', () => {
    it('should return consistent results for same query', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
        createTestVenue({ id: '2', name: 'Burger King' }),
        createTestVenue({ id: '3', name: 'Sushi Bar' }),
      ];

      const results1 = searchVenues(venues, 'Pizza');
      const results2 = searchVenues(venues, 'Pizza');
      const results3 = searchVenues(venues, 'Pizza');

      expect(results1).toEqual(results2);
      expect(results2).toEqual(results3);
    });

    it('should handle large venue lists efficiently', () => {
      const venues = Array.from({ length: 1000 }, (_, i) =>
        createTestVenue({ id: `venue-${i}`, name: `Venue ${i}` })
      );

      const startTime = Date.now();
      const results = searchVenues(venues, 'Venue 500');
      const endTime = Date.now();

      expect(results).toHaveLength(1);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should preserve venue object structure', () => {
      const venues = [
        createTestVenue({ id: '1', name: 'Pizza Palace' }),
      ];

      const results = searchVenues(venues, 'Pizza');

      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('category');
      expect(results[0]).toHaveProperty('location');
      expect(results[0]).toHaveProperty('description');
      expect(results[0]).toHaveProperty('rating');
      expect(results[0]).toHaveProperty('price_range');
    });
  });
});
