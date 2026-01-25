/**
 * Unit tests for query key factory
 * 
 * Tests verify:
 * - Correct hierarchical key structure
 * - Type-safe key generation
 * - Consistent key patterns across entity types
 * - Proper handling of filters and parameters
 */

import { queryKeys } from '../queryKeys';

describe('Query Key Factory', () => {
  describe('Venue Keys', () => {
    it('should generate correct key for all venues', () => {
      const key = queryKeys.venues.all;
      expect(key).toEqual(['venues']);
    });

    it('should generate correct key for venue lists', () => {
      const key = queryKeys.venues.lists();
      expect(key).toEqual(['venues', 'list']);
    });

    it('should generate correct key for filtered venue list', () => {
      const filters = { category: 'restaurant', limit: 10 };
      const key = queryKeys.venues.list(filters);
      expect(key).toEqual(['venues', 'list', filters]);
    });

    it('should generate correct key for venue list without filters', () => {
      const key = queryKeys.venues.list();
      expect(key).toEqual(['venues', 'list', undefined]);
    });

    it('should generate correct key for venue details', () => {
      const key = queryKeys.venues.details();
      expect(key).toEqual(['venues', 'detail']);
    });

    it('should generate correct key for specific venue detail', () => {
      const venueId = 'venue-123';
      const key = queryKeys.venues.detail(venueId);
      expect(key).toEqual(['venues', 'detail', venueId]);
    });
  });

  describe('Check-in Keys', () => {
    it('should generate correct key for all check-ins', () => {
      const key = queryKeys.checkIns.all;
      expect(key).toEqual(['check-ins']);
    });

    it('should generate correct key for check-ins by user', () => {
      const userId = 'user-456';
      const key = queryKeys.checkIns.byUser(userId);
      expect(key).toEqual(['check-ins', 'user', userId]);
    });

    it('should generate correct key for check-ins by venue', () => {
      const venueId = 'venue-789';
      const key = queryKeys.checkIns.byVenue(venueId);
      expect(key).toEqual(['check-ins', 'venue', venueId]);
    });
  });

  describe('Flash Offer Keys', () => {
    it('should generate correct key for all flash offers', () => {
      const key = queryKeys.flashOffers.all;
      expect(key).toEqual(['flash-offers']);
    });

    it('should generate correct key for flash offers by venue', () => {
      const venueId = 'venue-123';
      const key = queryKeys.flashOffers.byVenue(venueId);
      expect(key).toEqual(['flash-offers', 'venue', venueId, undefined]);
    });

    it('should generate correct key for flash offers by venue with filters', () => {
      const venueId = 'venue-123';
      const filters = { status: 'active', limit: 5 };
      const key = queryKeys.flashOffers.byVenue(venueId, filters);
      expect(key).toEqual(['flash-offers', 'venue', venueId, filters]);
    });
  });

  describe('User Keys', () => {
    it('should generate correct key for all users', () => {
      const key = queryKeys.users.all;
      expect(key).toEqual(['users']);
    });

    it('should generate correct key for user profile', () => {
      const userId = 'user-123';
      const key = queryKeys.users.profile(userId);
      expect(key).toEqual(['users', userId, 'profile']);
    });

    it('should generate correct key for user friends', () => {
      const userId = 'user-456';
      const key = queryKeys.users.friends(userId);
      expect(key).toEqual(['users', userId, 'friends']);
    });
  });

  describe('Collection Keys', () => {
    it('should generate correct key for all collections', () => {
      const key = queryKeys.collections.all;
      expect(key).toEqual(['collections']);
    });

    it('should generate correct key for collections by user', () => {
      const userId = 'user-789';
      const key = queryKeys.collections.byUser(userId);
      expect(key).toEqual(['collections', 'user', userId]);
    });

    it('should generate correct key for collection detail', () => {
      const collectionId = 'collection-123';
      const key = queryKeys.collections.detail(collectionId);
      expect(key).toEqual(['collections', collectionId]);
    });
  });

  describe('Activity Feed Keys', () => {
    it('should generate correct key for activity feed by user', () => {
      const userId = 'user-999';
      const key = queryKeys.activityFeed.byUser(userId);
      expect(key).toEqual(['activity-feed', userId]);
    });
  });

  describe('Key Structure Consistency', () => {
    it('should have entity type as first element for all keys', () => {
      expect(queryKeys.venues.all[0]).toBe('venues');
      expect(queryKeys.checkIns.all[0]).toBe('check-ins');
      expect(queryKeys.flashOffers.all[0]).toBe('flash-offers');
      expect(queryKeys.users.all[0]).toBe('users');
      expect(queryKeys.collections.all[0]).toBe('collections');
      expect(queryKeys.activityFeed.byUser('user-1')[0]).toBe('activity-feed');
    });

    it('should support hierarchical invalidation', () => {
      // All venue keys should start with ['venues']
      const venueList = queryKeys.venues.list();
      const venueDetail = queryKeys.venues.detail('venue-1');
      
      expect(venueList[0]).toBe('venues');
      expect(venueDetail[0]).toBe('venues');
      
      // This allows invalidating all venue queries with queryKeys.venues.all
    });

    it('should generate unique keys for different entities', () => {
      const venueKey = queryKeys.venues.detail('123');
      const userKey = queryKeys.users.profile('123');
      const collectionKey = queryKeys.collections.detail('123');
      
      expect(venueKey).not.toEqual(userKey);
      expect(venueKey).not.toEqual(collectionKey);
      expect(userKey).not.toEqual(collectionKey);
    });

    it('should generate unique keys for different filters', () => {
      const key1 = queryKeys.venues.list({ category: 'restaurant' });
      const key2 = queryKeys.venues.list({ category: 'bar' });
      const key3 = queryKeys.venues.list();
      
      expect(key1).not.toEqual(key2);
      expect(key1).not.toEqual(key3);
      expect(key2).not.toEqual(key3);
    });
  });

  describe('Type Safety', () => {
    it('should return readonly arrays (const assertions)', () => {
      // TypeScript will enforce this at compile time
      // This test verifies the structure is correct
      const key = queryKeys.venues.all;
      expect(Array.isArray(key)).toBe(true);
      expect(Object.isFrozen(key)).toBe(false); // as const doesn't freeze at runtime
    });

    it('should accept valid parameters', () => {
      // These should compile without errors
      expect(() => {
        queryKeys.venues.detail('valid-id');
        queryKeys.users.profile('user-id');
        queryKeys.checkIns.byUser('user-id');
        queryKeys.flashOffers.byVenue('venue-id');
        queryKeys.collections.byUser('user-id');
        queryKeys.activityFeed.byUser('user-id');
      }).not.toThrow();
    });
  });
});
