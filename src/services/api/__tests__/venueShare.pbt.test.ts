/**
 * Property-Based Tests for VenueShareService
 * 
 * These tests use fast-check to verify universal properties across many generated inputs.
 * Each test runs 100 iterations with random data to ensure correctness.
 * 
 * Feature: social-friend-system
 */

import * as fc from 'fast-check';
import { VenueShareService } from '../venueShare';
import { supabase } from '../../../lib/supabase';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a valid UUID v4
 */
const uuidArbitrary = () =>
  fc.uuid().map((uuid) => uuid.toLowerCase());

/**
 * Generate an array of distinct user IDs
 */
const distinctUserIdsArbitrary = (minLength: number = 1, maxLength: number = 5) =>
  fc
    .array(uuidArbitrary(), { minLength, maxLength })
    .map((ids) => [...new Set(ids)]); // Ensure uniqueness

/**
 * Generate a venue share message (optional)
 */
const messageArbitrary = () =>
  fc.option(
    fc.string({ minLength: 1, maxLength: 200 }),
    { nil: null }
  );

/**
 * Clean up test data after each test
 */
async function cleanupTestData(userIds: string[], venueIds: string[]) {
  try {
    // Delete venue shares
    await supabase
      .from('venue_shares')
      .delete()
      .in('from_user_id', userIds);

    await supabase
      .from('venue_shares')
      .delete()
      .in('to_user_id', userIds);

    // Delete test venues
    await supabase
      .from('venues')
      .delete()
      .in('id', venueIds);

    // Delete test profiles
    await supabase
      .from('profiles')
      .delete()
      .in('id', userIds);
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

// ============================================================================
// Property Tests
// ============================================================================

describe('VenueShareService Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(60000);

  /**
   * Property 37: Venue share creation
   * Feature: social-friend-system, Property 37: Venue share creation
   * Validates: Requirements 4.3
   * 
   * For any venue share to multiple friends, a venue_share record should be
   * created for each recipient with the correct venue_id and message.
   */
  describe('Property 37: Venue share creation', () => {
    it('should create venue_share records for each recipient with correct data', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(), // fromUserId
          uuidArbitrary(), // venueId
          distinctUserIdsArbitrary(1, 5), // toUserIds (1-5 recipients)
          messageArbitrary(), // optional message
          async (fromUserId, venueId, toUserIds, message) => {
            // Pre-condition: fromUserId should not be in toUserIds
            fc.pre(!toUserIds.includes(fromUserId));
            fc.pre(toUserIds.length > 0);

            const allUserIds = [fromUserId, ...toUserIds];

            try {
              // Setup: Create test users and venue
              await createTestUsers(allUserIds);
              await createTestVenues([venueId]);

              // Act: Share venue with multiple friends
              const shares = await VenueShareService.shareVenue(
                fromUserId,
                venueId,
                toUserIds,
                message || undefined
              );

              // Assert: Verify correct number of shares created
              expect(shares).toBeDefined();
              expect(shares.length).toBe(toUserIds.length);

              // Assert: Verify each share has correct data
              for (let i = 0; i < shares.length; i++) {
                const share = shares[i];
                expect(share.from_user_id).toBe(fromUserId);
                expect(share.venue_id).toBe(venueId);
                expect(toUserIds).toContain(share.to_user_id);
                expect(share.message).toBe(message);
                expect(share.viewed).toBe(false);
                expect(share.viewed_at).toBeNull();
                expect(share.id).toBeDefined();
                expect(share.created_at).toBeDefined();
              }

              // Assert: Verify all recipients are covered (no duplicates)
              const recipientIds = shares.map((s) => s.to_user_id);
              expect(new Set(recipientIds).size).toBe(toUserIds.length);
              toUserIds.forEach((toUserId) => {
                expect(recipientIds).toContain(toUserId);
              });

              // Verify in database
              const { data: dbShares, error } = await supabase
                .from('venue_shares')
                .select('*')
                .eq('from_user_id', fromUserId)
                .eq('venue_id', venueId)
                .in('to_user_id', toUserIds);

              expect(error).toBeNull();
              expect(dbShares).toBeDefined();
              expect(dbShares?.length).toBe(toUserIds.length);

              // Verify each database record
              dbShares?.forEach((dbShare) => {
                expect(dbShare.from_user_id).toBe(fromUserId);
                expect(dbShare.venue_id).toBe(venueId);
                expect(toUserIds).toContain(dbShare.to_user_id);
                expect(dbShare.message).toBe(message);
                expect(dbShare.viewed).toBe(false);
                expect(dbShare.viewed_at).toBeNull();
              });

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(allUserIds, [venueId]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 39: Share view tracking
   * Feature: social-friend-system, Property 39: Share view tracking
   * Validates: Requirements 4.5
   * 
   * For any venue share, when viewed by the recipient, the viewed flag
   * should be set to true and viewed_at should be set to the current timestamp.
   */
  describe('Property 39: Share view tracking', () => {
    it('should set viewed flag and timestamp when share is marked as viewed', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(), // fromUserId
          uuidArbitrary(), // toUserId
          uuidArbitrary(), // venueId
          messageArbitrary(), // optional message
          async (fromUserId, toUserId, venueId, message) => {
            // Pre-condition: users must be distinct
            fc.pre(fromUserId !== toUserId);

            const allUserIds = [fromUserId, toUserId];

            try {
              // Setup: Create test users and venue
              await createTestUsers(allUserIds);
              await createTestVenues([venueId]);

              // Setup: Create a venue share
              const shares = await VenueShareService.shareVenue(
                fromUserId,
                venueId,
                [toUserId],
                message || undefined
              );

              expect(shares.length).toBe(1);
              const share = shares[0];

              // Verify initial state (not viewed)
              expect(share.viewed).toBe(false);
              expect(share.viewed_at).toBeNull();

              // Record time before marking as viewed
              const beforeViewTime = new Date();

              // Act: Mark share as viewed
              await VenueShareService.markShareAsViewed(share.id);

              // Record time after marking as viewed
              const afterViewTime = new Date();

              // Assert: Verify share is marked as viewed in database
              const { data: viewedShare, error } = await supabase
                .from('venue_shares')
                .select('*')
                .eq('id', share.id)
                .single();

              expect(error).toBeNull();
              expect(viewedShare).toBeDefined();
              expect(viewedShare?.viewed).toBe(true);
              expect(viewedShare?.viewed_at).toBeDefined();
              expect(viewedShare?.viewed_at).not.toBeNull();

              // Verify viewed_at timestamp is reasonable (between before and after)
              if (viewedShare?.viewed_at) {
                const viewedAtTime = new Date(viewedShare.viewed_at);
                expect(viewedAtTime.getTime()).toBeGreaterThanOrEqual(
                  beforeViewTime.getTime() - 1000 // Allow 1 second tolerance
                );
                expect(viewedAtTime.getTime()).toBeLessThanOrEqual(
                  afterViewTime.getTime() + 1000 // Allow 1 second tolerance
                );
              }

              // Assert: Verify other fields remain unchanged
              expect(viewedShare?.from_user_id).toBe(fromUserId);
              expect(viewedShare?.to_user_id).toBe(toUserId);
              expect(viewedShare?.venue_id).toBe(venueId);
              expect(viewedShare?.message).toBe(message);

              // Assert: Attempting to mark as viewed again should not change viewed_at
              const firstViewedAt = viewedShare?.viewed_at;
              
              // Wait a small amount to ensure timestamp would be different if updated
              await new Promise((resolve) => setTimeout(resolve, 10));
              
              await VenueShareService.markShareAsViewed(share.id);

              const { data: secondViewedShare } = await supabase
                .from('venue_shares')
                .select('*')
                .eq('id', share.id)
                .single();

              // viewed_at should remain the same (idempotent)
              expect(secondViewedShare?.viewed_at).toBe(firstViewedAt);

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(allUserIds, [venueId]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
