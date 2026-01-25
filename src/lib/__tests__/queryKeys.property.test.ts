/**
 * Property-Based Tests for Query Key Factory
 * 
 * Feature: react-query-integration
 * Property 1: Query key structure consistency
 * 
 * Validates: Requirements 2.1, 2.2, 3.5, 4.1, 5.1, 5.2, 5.3, 6.1, 6.2
 * 
 * Tests verify that query keys follow consistent hierarchical structure
 * across all entity types using property-based testing with fast-check.
 */

import fc from 'fast-check';
import { queryKeys } from '../queryKeys';

describe('Feature: react-query-integration, Property 1: Query key structure consistency', () => {
  /**
   * Property: All query keys should be arrays with entity type as first element
   * 
   * For any entity type (venues, users, check-ins, flash-offers, collections, activity-feed),
   * the generated query key should:
   * 1. Be an array
   * 2. Have the entity type as the first element
   * 3. Include specific identifiers or filters as subsequent elements
   */
  it('should generate consistent query keys for all entity types', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Venue entity types
          fc.record({
            type: fc.constant('venue' as const),
            subtype: fc.constantFrom('all', 'list', 'detail'),
            id: fc.option(fc.uuid(), { nil: undefined }),
            filters: fc.option(
              fc.record({
                category: fc.option(fc.constantFrom('restaurant', 'bar', 'cafe'), { nil: undefined }),
                limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
              }),
              { nil: undefined }
            ),
          }),
          // User entity types
          fc.record({
            type: fc.constant('user' as const),
            subtype: fc.constantFrom('profile', 'friends'),
            id: fc.uuid(),
          }),
          // Check-in entity types
          fc.record({
            type: fc.constant('check-in' as const),
            subtype: fc.constantFrom('byUser', 'byVenue'),
            id: fc.uuid(),
          }),
          // Flash offer entity types
          fc.record({
            type: fc.constant('flash-offer' as const),
            subtype: fc.constant('byVenue'),
            id: fc.uuid(),
            filters: fc.option(
              fc.record({
                status: fc.option(fc.constantFrom('active', 'expired', 'scheduled'), { nil: undefined }),
                limit: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
              }),
              { nil: undefined }
            ),
          }),
          // Collection entity types
          fc.record({
            type: fc.constant('collection' as const),
            subtype: fc.constantFrom('byUser', 'detail'),
            id: fc.uuid(),
          }),
          // Activity feed entity types
          fc.record({
            type: fc.constant('activity-feed' as const),
            id: fc.uuid(),
          })
        ),
        (entity) => {
          let key: readonly unknown[];

          // Generate the appropriate query key based on entity type
          switch (entity.type) {
            case 'venue':
              if (entity.subtype === 'all') {
                key = queryKeys.venues.all;
              } else if (entity.subtype === 'list') {
                key = queryKeys.venues.list(entity.filters);
              } else {
                key = entity.id ? queryKeys.venues.detail(entity.id) : queryKeys.venues.details();
              }
              break;

            case 'user':
              if (entity.subtype === 'profile') {
                key = queryKeys.users.profile(entity.id);
              } else {
                key = queryKeys.users.friends(entity.id);
              }
              break;

            case 'check-in':
              if (entity.subtype === 'byUser') {
                key = queryKeys.checkIns.byUser(entity.id);
              } else {
                key = queryKeys.checkIns.byVenue(entity.id);
              }
              break;

            case 'flash-offer':
              key = queryKeys.flashOffers.byVenue(entity.id, entity.filters);
              break;

            case 'collection':
              if (entity.subtype === 'byUser') {
                key = queryKeys.collections.byUser(entity.id);
              } else {
                key = queryKeys.collections.detail(entity.id);
              }
              break;

            case 'activity-feed':
              key = queryKeys.activityFeed.byUser(entity.id);
              break;

            default:
              throw new Error(`Unknown entity type: ${(entity as any).type}`);
          }

          // Property 1: Key should be an array
          expect(Array.isArray(key)).toBe(true);

          // Property 2: Key should have at least one element
          expect(key.length).toBeGreaterThan(0);

          // Property 3: First element should be the entity type (pluralized or as-is)
          const expectedFirstElement = entity.type === 'activity-feed' 
            ? 'activity-feed'
            : entity.type === 'check-in'
            ? 'check-ins'
            : entity.type === 'flash-offer'
            ? 'flash-offers'
            : entity.type + 's';
          
          expect(key[0]).toBe(expectedFirstElement);

          // Property 4: If entity has an ID, it should be included in the key
          if (entity.id && entity.type !== 'venue') {
            expect(key).toContain(entity.id);
          }

          // Property 5: Keys should be immutable (readonly)
          // TypeScript enforces this at compile time with 'as const'
          expect(typeof key).toBe('object');

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property: Query keys with different parameters should generate different keys
   * 
   * For any two different sets of parameters, the generated query keys should be different.
   * This ensures proper cache isolation.
   */
  it('should generate unique keys for different parameters', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (id1, id2) => {
          fc.pre(id1 !== id2); // Precondition: IDs must be different

          // Test venue details
          const venueKey1 = queryKeys.venues.detail(id1);
          const venueKey2 = queryKeys.venues.detail(id2);
          expect(venueKey1).not.toEqual(venueKey2);

          // Test user profiles
          const userKey1 = queryKeys.users.profile(id1);
          const userKey2 = queryKeys.users.profile(id2);
          expect(userKey1).not.toEqual(userKey2);

          // Test collections
          const collectionKey1 = queryKeys.collections.detail(id1);
          const collectionKey2 = queryKeys.collections.detail(id2);
          expect(collectionKey1).not.toEqual(collectionKey2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Query keys should support hierarchical invalidation
   * 
   * For any specific query key, it should start with the base entity key,
   * allowing for hierarchical invalidation (e.g., invalidate all venue queries).
   */
  it('should support hierarchical invalidation structure', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.record({
          category: fc.option(fc.string(), { nil: undefined }),
          limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
        }),
        (id, filters) => {
          // All venue keys should start with ['venues']
          const venueBase = queryKeys.venues.all;
          const venueList = queryKeys.venues.list(filters);
          const venueDetail = queryKeys.venues.detail(id);

          expect(venueList[0]).toBe(venueBase[0]);
          expect(venueDetail[0]).toBe(venueBase[0]);

          // All user keys should start with ['users']
          const userBase = queryKeys.users.all;
          const userProfile = queryKeys.users.profile(id);
          const userFriends = queryKeys.users.friends(id);

          expect(userProfile[0]).toBe(userBase[0]);
          expect(userFriends[0]).toBe(userBase[0]);

          // All check-in keys should start with ['check-ins']
          const checkInBase = queryKeys.checkIns.all;
          const checkInByUser = queryKeys.checkIns.byUser(id);
          const checkInByVenue = queryKeys.checkIns.byVenue(id);

          expect(checkInByUser[0]).toBe(checkInBase[0]);
          expect(checkInByVenue[0]).toBe(checkInBase[0]);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Query keys with filters should include the filter object
   * 
   * For any query that accepts filters, the filter object should be included
   * in the query key to ensure proper cache isolation.
   */
  it('should include filters in query keys when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          category: fc.option(fc.string(), { nil: undefined }),
          limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          search: fc.option(fc.string(), { nil: undefined }),
        }),
        (filters) => {
          const key = queryKeys.venues.list(filters);

          // Key should contain the filters object
          expect(key).toContain(filters);

          // Key structure should be ['venues', 'list', filters]
          expect(key.length).toBe(3);
          expect(key[0]).toBe('venues');
          expect(key[1]).toBe('list');
          expect(key[2]).toEqual(filters);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Query keys should be deterministic
   * 
   * For any given set of parameters, calling the query key factory multiple times
   * should produce equivalent keys (deep equality).
   */
  it('should generate deterministic keys for same parameters', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.record({
          category: fc.option(fc.string(), { nil: undefined }),
          limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
        }),
        (id, filters) => {
          // Generate keys multiple times with same parameters
          const venueKey1 = queryKeys.venues.detail(id);
          const venueKey2 = queryKeys.venues.detail(id);
          expect(venueKey1).toEqual(venueKey2);

          const listKey1 = queryKeys.venues.list(filters);
          const listKey2 = queryKeys.venues.list(filters);
          expect(listKey1).toEqual(listKey2);

          const userKey1 = queryKeys.users.profile(id);
          const userKey2 = queryKeys.users.profile(id);
          expect(userKey1).toEqual(userKey2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
