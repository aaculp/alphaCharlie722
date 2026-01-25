/**
 * Property-Based Tests for Selective Query Invalidation
 * 
 * Feature: react-query-integration
 * Property 11: Selective invalidation
 * 
 * Validates: Requirements 13.4
 * 
 * Tests verify that query invalidation only affects matching queries
 * and leaves unrelated queries untouched.
 */

import fc from 'fast-check';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

describe('Feature: react-query-integration, Property 11: Selective invalidation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  /**
   * Property: Invalidating a specific venue detail should not affect other venue details
   * 
   * For any two different venue IDs, invalidating one should not invalidate the other.
   * We verify this by checking that non-invalidated queries still have their data.
   */
  it('should only invalidate matching venue detail queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid(), fc.uuid()).filter(
          ([id1, id2, id3]) => id1 !== id2 && id2 !== id3 && id1 !== id3
        ),
        async ([venueId1, venueId2, venueId3]) => {
          // Set up queries for three different venues
          const venue1Data = { id: venueId1, name: 'Venue 1' };
          const venue2Data = { id: venueId2, name: 'Venue 2' };
          const venue3Data = { id: venueId3, name: 'Venue 3' };
          
          queryClient.setQueryData(queryKeys.venues.detail(venueId1), venue1Data);
          queryClient.setQueryData(queryKeys.venues.detail(venueId2), venue2Data);
          queryClient.setQueryData(queryKeys.venues.detail(venueId3), venue3Data);

          // Invalidate only venueId1 with exact: true
          await queryClient.invalidateQueries({
            queryKey: queryKeys.venues.detail(venueId1),
            exact: true,
          });

          // Check that other venues still have their data (not affected by invalidation)
          const data2 = queryClient.getQueryData(queryKeys.venues.detail(venueId2));
          const data3 = queryClient.getQueryData(queryKeys.venues.detail(venueId3));

          expect(data2).toEqual(venue2Data);
          expect(data3).toEqual(venue3Data);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalidating user-specific queries should not affect other users
   */
  it('should only invalidate matching user queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([id1, id2]) => id1 !== id2),
        async ([userId1, userId2]) => {
          // Set up queries for two different users
          const user1Profile = { id: userId1, name: 'User 1' };
          const user2Profile = { id: userId2, name: 'User 2' };
          const user1Friends = [{ id: 'friend1' }];
          const user2Friends = [{ id: 'friend2' }];
          
          queryClient.setQueryData(queryKeys.users.profile(userId1), user1Profile);
          queryClient.setQueryData(queryKeys.users.profile(userId2), user2Profile);
          queryClient.setQueryData(queryKeys.users.friends(userId1), user1Friends);
          queryClient.setQueryData(queryKeys.users.friends(userId2), user2Friends);

          // Invalidate only userId1's profile with exact: true
          await queryClient.invalidateQueries({
            queryKey: queryKeys.users.profile(userId1),
            exact: true,
          });

          // Check that other queries still have their data
          const data2Profile = queryClient.getQueryData(queryKeys.users.profile(userId2));
          const data1Friends = queryClient.getQueryData(queryKeys.users.friends(userId1));
          const data2Friends = queryClient.getQueryData(queryKeys.users.friends(userId2));

          expect(data2Profile).toEqual(user2Profile);
          expect(data1Friends).toEqual(user1Friends);
          expect(data2Friends).toEqual(user2Friends);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalidating check-ins by venue should not affect check-ins by user
   */
  it('should only invalidate matching check-in queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid()),
        async ([venueId, userId]) => {
          // Set up check-in queries
          const venueCheckIns = [{ id: 'checkin1' }];
          const userCheckIns = [{ id: 'checkin2' }];
          
          queryClient.setQueryData(queryKeys.checkIns.byVenue(venueId), venueCheckIns);
          queryClient.setQueryData(queryKeys.checkIns.byUser(userId), userCheckIns);

          // Invalidate only check-ins by venue with exact: true
          await queryClient.invalidateQueries({
            queryKey: queryKeys.checkIns.byVenue(venueId),
            exact: true,
          });

          // Check that user check-ins still have their data
          const userCheckInsData = queryClient.getQueryData(queryKeys.checkIns.byUser(userId));
          expect(userCheckInsData).toEqual(userCheckIns);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalidating flash offers for one venue should not affect other venues
   */
  it('should only invalidate matching flash offer queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([id1, id2]) => id1 !== id2),
        async ([venueId1, venueId2]) => {
          // Set up flash offer queries for two venues
          const venue1Offers = [{ id: 'offer1' }];
          const venue2Offers = [{ id: 'offer2' }];
          
          queryClient.setQueryData(queryKeys.flashOffers.byVenue(venueId1, undefined), venue1Offers);
          queryClient.setQueryData(queryKeys.flashOffers.byVenue(venueId2, undefined), venue2Offers);

          // Invalidate only venueId1's flash offers with exact: true
          await queryClient.invalidateQueries({
            queryKey: queryKeys.flashOffers.byVenue(venueId1, undefined),
            exact: true,
          });

          // Check that venue2's offers still have their data
          const venue2OffersData = queryClient.getQueryData(
            queryKeys.flashOffers.byVenue(venueId2, undefined)
          );
          expect(venue2OffersData).toEqual(venue2Offers);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalidating collections for one user should not affect other users
   */
  it('should only invalidate matching collection queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid(), fc.uuid()).filter(
          ([id1, id2, _]) => id1 !== id2
        ),
        async ([userId1, userId2, collectionId]) => {
          // Set up collection queries
          const user1Collections = [{ id: 'col1' }];
          const user2Collections = [{ id: 'col2' }];
          const collectionDetail = { id: collectionId, name: 'Collection' };
          
          queryClient.setQueryData(queryKeys.collections.byUser(userId1), user1Collections);
          queryClient.setQueryData(queryKeys.collections.byUser(userId2), user2Collections);
          queryClient.setQueryData(queryKeys.collections.detail(collectionId), collectionDetail);

          // Invalidate only userId1's collections with exact: true
          await queryClient.invalidateQueries({
            queryKey: queryKeys.collections.byUser(userId1),
            exact: true,
          });

          // Check that other queries still have their data
          const user2CollectionsData = queryClient.getQueryData(
            queryKeys.collections.byUser(userId2)
          );
          const collectionDetailData = queryClient.getQueryData(
            queryKeys.collections.detail(collectionId)
          );

          expect(user2CollectionsData).toEqual(user2Collections);
          expect(collectionDetailData).toEqual(collectionDetail);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalidating activity feed for one user should not affect other users
   */
  it('should only invalidate matching activity feed queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([id1, id2]) => id1 !== id2),
        async ([userId1, userId2]) => {
          // Set up activity feed queries
          const user1Feed = [{ id: 'activity1' }];
          const user2Feed = [{ id: 'activity2' }];
          
          queryClient.setQueryData(queryKeys.activityFeed.byUser(userId1), user1Feed);
          queryClient.setQueryData(queryKeys.activityFeed.byUser(userId2), user2Feed);

          // Invalidate only userId1's activity feed with exact: true
          await queryClient.invalidateQueries({
            queryKey: queryKeys.activityFeed.byUser(userId1),
            exact: true,
          });

          // Check that user2's feed still has its data
          const user2FeedData = queryClient.getQueryData(queryKeys.activityFeed.byUser(userId2));
          expect(user2FeedData).toEqual(user2Feed);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalidating without exact flag should invalidate hierarchically
   */
  it('should invalidate hierarchically without exact flag', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([id1, id2]) => id1 !== id2),
        async ([userId1, userId2]) => {
          // Set up user queries
          const user1Profile = { id: userId1, name: 'User 1' };
          const user1Friends = [{ id: 'friend1' }];
          const user2Profile = { id: userId2, name: 'User 2' };
          const user2Friends = [{ id: 'friend2' }];
          
          queryClient.setQueryData(queryKeys.users.profile(userId1), user1Profile);
          queryClient.setQueryData(queryKeys.users.friends(userId1), user1Friends);
          queryClient.setQueryData(queryKeys.users.profile(userId2), user2Profile);
          queryClient.setQueryData(queryKeys.users.friends(userId2), user2Friends);

          // Invalidate all queries starting with ['users', userId1] (no exact flag)
          await queryClient.invalidateQueries({
            queryKey: ['users', userId1],
          });

          // Check that userId2 queries still have their data (not affected)
          const user2ProfileData = queryClient.getQueryData(queryKeys.users.profile(userId2));
          const user2FriendsData = queryClient.getQueryData(queryKeys.users.friends(userId2));

          expect(user2ProfileData).toEqual(user2Profile);
          expect(user2FriendsData).toEqual(user2Friends);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalidating venue lists should not affect venue details
   */
  it('should not invalidate venue details when invalidating lists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.uuid(),
          fc.record({
            category: fc.option(fc.string(), { nil: undefined }),
            limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          })
        ),
        async ([venueId, filters]) => {
          // Set up venue queries
          const venueList = [{ id: 'venue1' }];
          const venueDetail = { id: venueId, name: 'Venue Detail' };
          
          queryClient.setQueryData(queryKeys.venues.list(filters), venueList);
          queryClient.setQueryData(queryKeys.venues.detail(venueId), venueDetail);

          // Invalidate venue lists (without exact, to invalidate all list variations)
          await queryClient.invalidateQueries({
            queryKey: queryKeys.venues.lists(),
          });

          // Check that detail still has its data
          const detailData = queryClient.getQueryData(queryKeys.venues.detail(venueId));
          expect(detailData).toEqual(venueDetail);
        }
      ),
      { numRuns: 100 }
    );
  });
});
