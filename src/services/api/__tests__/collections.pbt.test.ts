/**
 * Property-Based Tests for CollectionsService
 * 
 * These tests use fast-check to verify universal properties across many generated inputs.
 * Each test runs 100 iterations with random data to ensure correctness.
 * 
 * Feature: social-friend-system
 * 
 * NOTE: These tests require a real Supabase connection to run.
 * They are currently skipped in the test suite due to environment setup requirements.
 */

import * as fc from 'fast-check';
import { CollectionsService } from '../collections';
import { supabase } from '../../../lib/supabase';
import type { PrivacyLevel } from '../../../types/social.types';

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
  fc.uuid().map((uuid) => uuid.toLowerCase());

/**
 * Generate a privacy level
 */
const privacyLevelArbitrary = (): fc.Arbitrary<PrivacyLevel> =>
  fc.constantFrom('public', 'friends', 'close_friends', 'private');

/**
 * Generate collection name
 */
const collectionNameArbitrary = () =>
  fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

/**
 * Generate collection description
 */
const collectionDescriptionArbitrary = () =>
  fc.option(fc.string({ maxLength: 500 }), { nil: undefined });

/**
 * Clean up test data after each test
 */
async function cleanupTestData(userIds: string[], collectionIds: string[] = [], venueIds: string[] = []) {
  try {
    // Delete collection_venues
    if (collectionIds.length > 0) {
      await supabase
        .from('collection_venues')
        .delete()
        .in('collection_id', collectionIds);
    }

    // Delete collection_follows
    if (collectionIds.length > 0) {
      await supabase
        .from('collection_follows')
        .delete()
        .in('collection_id', collectionIds);
    }

    // Delete collections
    if (collectionIds.length > 0) {
      await supabase
        .from('collections')
        .delete()
        .in('id', collectionIds);
    }

    // Delete test venues
    if (venueIds.length > 0) {
      await supabase
        .from('venues')
        .delete()
        .in('id', venueIds);
    }

    // Delete friendships
    if (userIds.length > 0) {
      await supabase
        .from('friendships')
        .delete()
        .in('user_id_1', userIds);

      await supabase
        .from('friendships')
        .delete()
        .in('user_id_2', userIds);
    }
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
}

/**
 * Create test user profiles
 */
async function createTestUsers(userIds: string[]) {
  try {
    const profiles = userIds.map((id, index) => ({
      id,
      email: `test-user-${id}@example.com`,
      name: `Test User ${index + 1}`,
    }));

    await supabase.from('profiles').upsert(profiles);
  } catch (error) {
    console.warn('User creation warning:', error);
  }
}

/**
 * Create test venues
 */
async function createTestVenues(venueIds: string[]) {
  try {
    const venues = venueIds.map((id, index) => ({
      id,
      name: `Test Venue ${index + 1}`,
      address: `${index + 1} Test St`,
      city: 'Test City',
      state: 'TS',
      latitude: 40.7128 + index * 0.01,
      longitude: -74.0060 + index * 0.01,
    }));

    await supabase.from('venues').upsert(venues);
  } catch (error) {
    console.warn('Venue creation warning:', error);
  }
}

/**
 * Create a friendship between two users
 */
async function createFriendship(userId1: string, userId2: string, isCloseFriend1 = false, isCloseFriend2 = false) {
  const [orderedId1, orderedId2] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  await supabase.from('friendships').insert({
    user_id_1: orderedId1,
    user_id_2: orderedId2,
    is_close_friend_1: userId1 === orderedId1 ? isCloseFriend1 : isCloseFriend2,
    is_close_friend_2: userId1 === orderedId1 ? isCloseFriend2 : isCloseFriend1,
  });
}

// ============================================================================
// Property Tests
// ============================================================================

describe('CollectionsService Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(60000);

  /**
   * Property 28: Collection creation
   * Feature: social-friend-system, Property 28: Collection creation
   * Validates: Requirements 5.1
   * 
   * For any valid collection data, creating a collection should result in
   * a collection record with the specified name, description, and privacy level.
   */
  describe('Property 28: Collection creation', () => {
    it('should create a collection with correct fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          collectionNameArbitrary(),
          collectionDescriptionArbitrary(),
          privacyLevelArbitrary(),
          async (userId, name, description, privacyLevel) => {
            const collectionIds: string[] = [];

            try {
              // Setup: Create test user
              await createTestUsers([userId]);

              // Act: Create collection
              const collection = await CollectionsService.createCollection({
                user_id: userId,
                name,
                description,
                privacy_level: privacyLevel,
              });

              collectionIds.push(collection.id);

              // Assert: Verify collection was created correctly
              expect(collection).toBeDefined();
              expect(collection.id).toBeDefined();
              expect(collection.user_id).toBe(userId);
              expect(collection.name).toBe(name);
              expect(collection.description).toBe(description || null);
              expect(collection.privacy_level).toBe(privacyLevel);
              expect(collection.created_at).toBeDefined();
              expect(collection.updated_at).toBeDefined();

              // Verify in database
              const { data: dbCollection, error } = await supabase
                .from('collections')
                .select('*')
                .eq('id', collection.id)
                .single();

              expect(error).toBeNull();
              expect(dbCollection).toBeDefined();
              expect(dbCollection?.user_id).toBe(userId);
              expect(dbCollection?.name).toBe(name);
              expect(dbCollection?.description).toBe(description || null);
              expect(dbCollection?.privacy_level).toBe(privacyLevel);

              return true;
            } finally {
              // Cleanup
              await cleanupTestData([userId], collectionIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 29: Venue addition to collection
   * Feature: social-friend-system, Property 29: Venue addition to collection
   * Validates: Requirements 5.2
   * 
   * For any collection and venue, adding the venue should create a
   * collection_venue association with the correct order.
   */
  describe('Property 29: Venue addition to collection', () => {
    it('should create collection_venue association with correct order', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          collectionNameArbitrary(),
          fc.integer({ min: 0, max: 100 }),
          async (userId, venueId, collectionName, order) => {
            const collectionIds: string[] = [];
            const venueIds = [venueId];

            try {
              // Setup: Create test user and venue
              await createTestUsers([userId]);
              await createTestVenues([venueId]);

              // Setup: Create collection
              const collection = await CollectionsService.createCollection({
                user_id: userId,
                name: collectionName,
                privacy_level: 'friends',
              });

              collectionIds.push(collection.id);

              // Act: Add venue to collection
              await CollectionsService.addVenueToCollection(
                collection.id,
                venueId,
                order
              );

              // Assert: Verify collection_venue association was created
              const { data: collectionVenue, error } = await supabase
                .from('collection_venues')
                .select('*')
                .eq('collection_id', collection.id)
                .eq('venue_id', venueId)
                .single();

              expect(error).toBeNull();
              expect(collectionVenue).toBeDefined();
              expect(collectionVenue?.collection_id).toBe(collection.id);
              expect(collectionVenue?.venue_id).toBe(venueId);
              expect(collectionVenue?.order).toBe(order);
              expect(collectionVenue?.added_at).toBeDefined();

              // Verify venue appears in collection venues
              const venues = await CollectionsService.getCollectionVenues(collection.id);
              expect(venues.length).toBe(1);
              expect(venues[0].id).toBe(venueId);

              return true;
            } finally {
              // Cleanup
              await cleanupTestData([userId], collectionIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 52: Collection venue uniqueness
   * Feature: social-friend-system, Property 52: Collection venue uniqueness
   * Validates: Requirements 5.2
   * 
   * For any collection, each venue should appear at most once in the collection.
   */
  describe('Property 52: Collection venue uniqueness', () => {
    it('should prevent duplicate venues in a collection', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          uuidArbitrary(),
          collectionNameArbitrary(),
          async (userId, venueId, collectionName) => {
            const collectionIds: string[] = [];
            const venueIds = [venueId];

            try {
              // Setup: Create test user and venue
              await createTestUsers([userId]);
              await createTestVenues([venueId]);

              // Setup: Create collection
              const collection = await CollectionsService.createCollection({
                user_id: userId,
                name: collectionName,
                privacy_level: 'friends',
              });

              collectionIds.push(collection.id);

              // Act: Add venue to collection first time
              await CollectionsService.addVenueToCollection(
                collection.id,
                venueId,
                0
              );

              // Act: Attempt to add same venue again
              let duplicateError: Error | null = null;
              try {
                await CollectionsService.addVenueToCollection(
                  collection.id,
                  venueId,
                  1
                );
              } catch (error) {
                duplicateError = error as Error;
              }

              // Assert: Second addition should fail
              expect(duplicateError).toBeDefined();
              expect(duplicateError?.message).toContain('already exists');

              // Verify only one association exists in database
              const { data: associations, error } = await supabase
                .from('collection_venues')
                .select('*')
                .eq('collection_id', collection.id)
                .eq('venue_id', venueId);

              expect(error).toBeNull();
              expect(associations).toBeDefined();
              expect(associations?.length).toBe(1);

              // Verify venue appears only once in collection venues
              const venues = await CollectionsService.getCollectionVenues(collection.id);
              expect(venues.length).toBe(1);
              expect(venues[0].id).toBe(venueId);

              return true;
            } finally {
              // Cleanup
              await cleanupTestData([userId], collectionIds, venueIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 24: Collection privacy enforcement
   * Feature: social-friend-system, Property 24: Collection privacy enforcement
   * Validates: Requirements 5.8
   * 
   * For any collection query by a viewer, the collection should only be returned
   * if the viewer has permission based on the collection's privacy_level and their
   * relationship to the creator.
   */
  describe('Property 24: Collection privacy enforcement', () => {
    it('should enforce privacy based on viewer relationship', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(), // creator
          uuidArbitrary(), // viewer
          collectionNameArbitrary(),
          privacyLevelArbitrary(),
          fc.constantFrom('none', 'friend', 'close_friend'), // relationship type
          async (creatorId, viewerId, collectionName, privacyLevel, relationship) => {
            // Skip if creator and viewer are the same
            fc.pre(creatorId !== viewerId);

            const collectionIds: string[] = [];

            try {
              // Setup: Create test users
              await createTestUsers([creatorId, viewerId]);

              // Setup: Create relationship if needed
              if (relationship === 'friend') {
                await createFriendship(creatorId, viewerId, false, false);
              } else if (relationship === 'close_friend') {
                await createFriendship(creatorId, viewerId, true, false);
              }

              // Setup: Create collection
              const collection = await CollectionsService.createCollection({
                user_id: creatorId,
                name: collectionName,
                privacy_level: privacyLevel,
              });

              collectionIds.push(collection.id);

              // Act: Try to get collection as viewer
              const retrievedCollection = await CollectionsService.getCollection(
                collection.id,
                viewerId
              );

              // Assert: Determine if viewer should have access
              let shouldHaveAccess = false;

              if (privacyLevel === 'public') {
                shouldHaveAccess = true;
              } else if (privacyLevel === 'friends' && (relationship === 'friend' || relationship === 'close_friend')) {
                shouldHaveAccess = true;
              } else if (privacyLevel === 'close_friends' && relationship === 'close_friend') {
                shouldHaveAccess = true;
              } else if (privacyLevel === 'private') {
                shouldHaveAccess = false;
              }

              if (shouldHaveAccess) {
                expect(retrievedCollection).toBeDefined();
                expect(retrievedCollection?.id).toBe(collection.id);
              } else {
                // RLS should prevent access - collection should be null or not returned
                expect(retrievedCollection).toBeNull();
              }

              return true;
            } finally {
              // Cleanup
              await cleanupTestData([creatorId, viewerId], collectionIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
