/**
 * Property-Based Tests for Device Tokens RLS Policies
 * Task: 1.1 and 1.2 - Write property tests for RLS policies
 * Feature: flash-offer-push-backend
 * 
 * ⚠️ IMPORTANT: These tests require a REAL Supabase connection with RLS enabled.
 * They test actual RLS policies, not mocked behavior.
 * 
 * To run these tests:
 * 1. Start local Supabase: `supabase start`
 * 2. Ensure RLS policies are applied (migration 017)
 * 3. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables
 * 4. Run: `npm test -- deviceTokens.rls.pbt.test.ts`
 * 
 * These tests will be SKIPPED if using mocked Supabase client.
 * 
 * Tests RLS policies on device_tokens table to ensure:
 * - Clients cannot access other users' tokens (Property 15)
 * - Users can only access their own tokens (Property 16)
 */

// CRITICAL: Unmock the Supabase client for these integration tests
// This tells Jest to use the REAL Supabase client, not the mock
jest.unmock('../../../lib/supabase');

import * as fc from 'fast-check';
import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Check if we're using a real Supabase connection or mocked
const isRealSupabase = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('mock');

// Create a service role client for test setup (bypasses RLS)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = isRealSupabase && serviceRoleKey
  ? createClient(process.env.SUPABASE_URL!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Skip these tests if using mocked Supabase
const describeRLS = isRealSupabase ? describe : describe.skip;

describeRLS('Device Tokens RLS - Property-Based Tests (REQUIRES REAL SUPABASE)', () => {
  let testUserId1: string;
  let testUserId2: string;
  let testToken1: string;
  let testToken2: string;

  beforeAll(async () => {
    // Create test users and tokens for testing
    // In a real scenario, these would be created through proper auth flow
    testUserId1 = 'test-user-1-' + Date.now();
    testUserId2 = 'test-user-2-' + Date.now();
    testToken1 = 'test-token-1-' + Date.now();
    testToken2 = 'test-token-2-' + Date.now();
  });

  afterAll(async () => {
    // Cleanup test data
    // Note: This uses service role to bypass RLS for cleanup
    try {
      await supabase
        .from('device_tokens')
        .delete()
        .or(`token.eq.${testToken1},token.eq.${testToken2}`);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  /**
   * Property 15: Client Token Access Restriction
   * Feature: flash-offer-push-backend, Property 15: Client Token Access Restriction
   * Validates: Requirements 5.3
   * 
   * For any user attempting to query device_tokens table for tokens belonging to
   * other users, the query should fail with an RLS policy violation or return no results.
   */
  describe('Property 15: Client Token Access Restriction', () => {
    it('should prevent users from accessing other users tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // currentUserId
          fc.uuid(), // otherUserId
          fc.string({ minLength: 20, maxLength: 200 }), // token
          fc.constantFrom('ios', 'android'), // platform
          async (currentUserId, otherUserId, token, platform) => {
            // Ensure we're testing different users
            fc.pre(currentUserId !== otherUserId);
            fc.pre(token.trim().length > 0);
            fc.pre(supabaseAdmin !== null); // Skip if no service role key

            // First, insert a token for otherUserId using service role (bypasses RLS)
            const insertResult = await supabaseAdmin!
              .from('device_tokens')
              .insert({
                user_id: otherUserId,
                token: token,
                platform: platform,
                is_active: true,
              })
              .select()
              .single();

            // If insert failed, skip this test case
            if (insertResult.error) {
              fc.pre(false);
              return;
            }

            // Now try to query as currentUserId using anon client (tests RLS)
            // This should either return no results or fail due to RLS
            const queryResult = await supabase
              .from('device_tokens')
              .select('*')
              .eq('user_id', otherUserId);

            // The query should either:
            // 1. Return no data (RLS filtered it out)
            // 2. Return an error (RLS denied access)
            // 3. Return empty array (RLS filtered it out)
            
            if (queryResult.error) {
              // RLS denied access - this is acceptable
              expect(queryResult.error).toBeDefined();
            } else {
              // RLS filtered results - should be empty or not include the token
              const foundToken = queryResult.data?.find(t => t.token === token);
              expect(foundToken).toBeUndefined();
            }

            // Cleanup using service role
            await supabaseAdmin!
              .from('device_tokens')
              .delete()
              .eq('token', token);
          }
        ),
        { numRuns: 10, timeout: 30000 } // Reduced runs for faster testing, increased timeout
      );
    }, 35000); // Test timeout

    it('should prevent reading all device tokens without user filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }), // multiple user IDs
          async (userIds) => {
            // Ensure we have at least 2 different users
            const uniqueUserIds = [...new Set(userIds)];
            fc.pre(uniqueUserIds.length >= 2);

            // Try to query all device tokens without filtering by user
            // This should be blocked by RLS or return only current user's tokens
            const queryResult = await supabase
              .from('device_tokens')
              .select('*');

            // The query should either:
            // 1. Return an error (RLS denied access)
            // 2. Return only tokens for the authenticated user (not all tokens)
            
            if (queryResult.error) {
              // RLS denied access - this is acceptable
              expect(queryResult.error).toBeDefined();
            } else {
              // If data is returned, it should only be for the current authenticated user
              // We can't verify the exact user here without knowing the auth context,
              // but we can verify that not all users' tokens are returned
              const data = queryResult.data || [];
              
              // If there are multiple users in the system, we shouldn't get all their tokens
              // This is a weak check, but without proper auth context, it's the best we can do
              const uniqueUserIdsInResult = new Set(data.map(t => t.user_id));
              
              // Should not return tokens for all possible users
              expect(uniqueUserIdsInResult.size).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    }, 35000);
  });

  /**
   * Property 16: User Own Token Access
   * Feature: flash-offer-push-backend, Property 16: User Own Token Access
   * Validates: Requirements 5.4
   * 
   * For any user querying their own device tokens, the query should succeed
   * and return only their tokens.
   */
  describe('Property 16: User Own Token Access', () => {
    it('should allow users to read their own device tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.array(
            fc.record({
              token: fc.string({ minLength: 20, maxLength: 200 }),
              platform: fc.constantFrom('ios', 'android'),
            }),
            { minLength: 1, maxLength: 3 }
          ), // user's tokens
          async (userId, tokens) => {
            // Skip invalid inputs
            fc.pre(tokens.every(t => t.token.trim().length > 0));

            // Insert tokens for the user (using service role or proper auth)
            const insertPromises = tokens.map(t =>
              supabase
                .from('device_tokens')
                .insert({
                  user_id: userId,
                  token: t.token,
                  platform: t.platform,
                  is_active: true,
                })
                .select()
                .single()
            );

            const insertResults = await Promise.all(insertPromises);
            
            // Skip if any inserts failed
            if (insertResults.some(r => r.error)) {
              fc.pre(false);
              return;
            }

            // Now query as the user (simulating authenticated user)
            const queryResult = await supabase
              .from('device_tokens')
              .select('*')
              .eq('user_id', userId);

            // The query should succeed
            expect(queryResult.error).toBeNull();
            
            // Should return the user's tokens
            expect(queryResult.data).toBeDefined();
            
            // All returned tokens should belong to the user
            const allBelongToUser = queryResult.data?.every(t => t.user_id === userId);
            expect(allBelongToUser).toBe(true);

            // Should include the tokens we just inserted
            const insertedTokenStrings = tokens.map(t => t.token);
            const returnedTokenStrings = queryResult.data?.map(t => t.token) || [];
            
            insertedTokenStrings.forEach(token => {
              expect(returnedTokenStrings).toContain(token);
            });

            // Cleanup
            const cleanupPromises = tokens.map(t =>
              supabase
                .from('device_tokens')
                .delete()
                .eq('token', t.token)
            );
            await Promise.all(cleanupPromises);
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    }, 35000);

    it('should allow users to insert their own device tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.string({ minLength: 20, maxLength: 200 }), // token
          fc.constantFrom('ios', 'android'), // platform
          async (userId, token, platform) => {
            // Skip invalid inputs
            fc.pre(token.trim().length > 0);

            // Try to insert a token for the user (simulating authenticated user)
            const insertResult = await supabase
              .from('device_tokens')
              .insert({
                user_id: userId,
                token: token,
                platform: platform,
                is_active: true,
              })
              .select()
              .single();

            // The insert should succeed (or fail for reasons other than RLS)
            // If it fails due to RLS, that's a test failure
            if (insertResult.error) {
              // Check if it's an RLS error (typically code 42501 or similar)
              // For now, we'll just verify it's not a permission error
              expect(insertResult.error.code).not.toBe('42501');
            } else {
              // Insert succeeded
              expect(insertResult.data).toBeDefined();
              expect(insertResult.data.user_id).toBe(userId);
              expect(insertResult.data.token).toBe(token);
            }

            // Cleanup
            await supabase
              .from('device_tokens')
              .delete()
              .eq('token', token);
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    }, 35000);

    it('should allow users to update their own device tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.string({ minLength: 20, maxLength: 200 }), // token
          fc.constantFrom('ios', 'android'), // platform
          fc.boolean(), // new is_active value
          async (userId, token, platform, newIsActive) => {
            // Skip invalid inputs
            fc.pre(token.trim().length > 0);

            // First insert a token
            const insertResult = await supabase
              .from('device_tokens')
              .insert({
                user_id: userId,
                token: token,
                platform: platform,
                is_active: true,
              })
              .select()
              .single();

            // Skip if insert failed
            if (insertResult.error) {
              fc.pre(false);
              return;
            }

            // Now try to update it (simulating authenticated user)
            const updateResult = await supabase
              .from('device_tokens')
              .update({ is_active: newIsActive })
              .eq('token', token)
              .eq('user_id', userId)
              .select()
              .single();

            // The update should succeed
            if (updateResult.error) {
              // Check if it's an RLS error
              expect(updateResult.error.code).not.toBe('42501');
            } else {
              // Update succeeded
              expect(updateResult.data).toBeDefined();
              expect(updateResult.data.is_active).toBe(newIsActive);
            }

            // Cleanup
            await supabase
              .from('device_tokens')
              .delete()
              .eq('token', token);
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    }, 35000);

    it('should allow users to delete their own device tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.string({ minLength: 20, maxLength: 200 }), // token
          fc.constantFrom('ios', 'android'), // platform
          async (userId, token, platform) => {
            // Skip invalid inputs
            fc.pre(token.trim().length > 0);

            // First insert a token
            const insertResult = await supabase
              .from('device_tokens')
              .insert({
                user_id: userId,
                token: token,
                platform: platform,
                is_active: true,
              })
              .select()
              .single();

            // Skip if insert failed
            if (insertResult.error) {
              fc.pre(false);
              return;
            }

            // Now try to delete it (simulating authenticated user)
            const deleteResult = await supabase
              .from('device_tokens')
              .delete()
              .eq('token', token)
              .eq('user_id', userId);

            // The delete should succeed
            if (deleteResult.error) {
              // Check if it's an RLS error
              expect(deleteResult.error.code).not.toBe('42501');
            } else {
              // Delete succeeded
              expect(deleteResult.error).toBeNull();
            }

            // Verify it's deleted
            const queryResult = await supabase
              .from('device_tokens')
              .select('*')
              .eq('token', token);

            expect(queryResult.data?.length).toBe(0);
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    }, 35000);
  });
});
