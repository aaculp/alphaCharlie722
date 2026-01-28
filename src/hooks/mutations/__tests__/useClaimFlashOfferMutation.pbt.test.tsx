/**
 * Property-Based Tests for useClaimFlashOfferMutation Hook
 * 
 * Feature: react-query-integration
 * Property 7: Flash offer mutation invalidation
 * 
 * **Validates: Requirements 4.3**
 * 
 * Tests verify that flash offer claim invalidates correct queries
 * using property-based testing with fast-check.
 * 
 * NOTE: These tests may show "Jest did not exit" warning due to React Query's
 * internal garbage collection timers. This is a known issue and doesn't affect
 * test validity. Use --forceExit flag if needed: npm test -- --forceExit
 */

import fc from 'fast-check';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClaimFlashOfferMutation } from '../useClaimFlashOfferMutation';
import { ClaimService } from '../../../services/api/flashOfferClaims';
import { queryKeys } from '../../../lib/queryKeys';
import type { FlashOfferClaim } from '../../../services/api/flashOfferClaims';
import type { FlashOffer } from '../../../types/flashOffer.types';
import React from 'react';

// Mock the ClaimService
jest.mock('../../../services/api/flashOfferClaims');

const mockClaimService = ClaimService as jest.Mocked<typeof ClaimService>;

// Helper to create a wrapper with QueryClient
function createWrapper(initialOffers?: FlashOffer[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable garbage collection timer
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Pre-populate cache with flash offers if provided
  if (initialOffers && initialOffers.length > 0) {
    const venueId = initialOffers[0].venue_id;
    queryClient.setQueryData(
      queryKeys.flashOffers.byVenue(venueId, undefined),
      initialOffers
    );
  }

  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  };
}

describe('Feature: react-query-integration, Property 7: Flash offer mutation invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 4.3**
   * 
   * Property: For any flash offer claim mutation, upon success, the system SHALL
   * invalidate queries with keys ["flash-offers", venueId], ["flash-offer-claims", userId],
   * ["venues", "detail", venueId], and ["venues", "list"].
   * 
   * This property verifies that:
   * 1. Flash offer queries for the venue are invalidated
   * 2. User claims queries are invalidated
   * 3. Venue detail query is invalidated
   * 4. Venue list queries are invalidated
   * 5. Invalidation happens for any offer/venue/user combination
   * 6. Only the correct queries are invalidated (selective invalidation)
   */
  it('should invalidate correct queries after successful claim for any offer/venue/user', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random IDs
        fc.uuid(), // offerId
        fc.uuid(), // venueId
        fc.uuid(), // userId
        // Generate random initial claim counts
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        async (offerId, venueId, userId, initialClaimedCount, maxClaims) => {
          // Create mock flash offer
          const mockOffer: FlashOffer = {
            id: offerId,
            venue_id: venueId,
            title: 'Test Offer',
            description: 'Test description',
            expected_value: 20.00,
            max_claims: maxClaims,
            claimed_count: initialClaimedCount,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            radius_miles: 2.0,
            target_favorites_only: false,
            status: 'active',
            push_sent: true,
            push_sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Mock successful claim
          const mockClaim: FlashOfferClaim = {
            id: 'claim-123',
            offer_id: offerId,
            user_id: userId,
            token: '123456',
            status: 'active',
            redeemed_at: null,
            redeemed_by_user_id: null,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockClaimService.claimOffer.mockResolvedValue(mockClaim);

          const { queryClient, wrapper } = createWrapper([mockOffer]);

          // Pre-populate cache with various queries to test selective invalidation
          // These should be invalidated
          queryClient.setQueryData(
            queryKeys.flashOffers.byVenue(venueId, undefined),
            [mockOffer]
          );
          queryClient.setQueryData(queryKeys.venues.detail(venueId), {
            id: venueId,
            name: 'Test Venue',
          });
          queryClient.setQueryData(queryKeys.venues.lists(), [
            { id: venueId, name: 'Test Venue' },
          ]);

          // These should NOT be invalidated (different venue)
          const otherVenueId = 'other-venue-id';
          queryClient.setQueryData(
            queryKeys.flashOffers.byVenue(otherVenueId, undefined),
            []
          );
          queryClient.setQueryData(queryKeys.venues.detail(otherVenueId), {
            id: otherVenueId,
            name: 'Other Venue',
          });

          // Track which queries get invalidated
          const invalidatedQueries: string[] = [];

          // Spy on invalidateQueries to track what gets invalidated
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters: any) => {
            // Track the query key pattern that was invalidated
            if (filters?.queryKey) {
              invalidatedQueries.push(JSON.stringify(filters.queryKey));
            }
            return originalInvalidate(filters);
          });

          const { result } = renderHook(() => useClaimFlashOfferMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              offerId,
              venueId,
              userId,
            });
          });

          // Wait for mutation to succeed
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: Flash offer queries for the venue should be invalidated
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.flashOffers.byVenue(venueId, undefined))
          );

          // Property 2: User claims query should be invalidated
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.flashOfferClaims.byUser(userId))
          );

          // Property 3: Venue detail query should be invalidated
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.detail(venueId))
          );

          // Property 4: Venue list queries should be invalidated
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.lists())
          );

          // Property 5: Exactly 4 query patterns should be invalidated
          expect(invalidatedQueries).toHaveLength(4);

          // Property 6: Other venue's flash offer queries should NOT be invalidated
          expect(invalidatedQueries).not.toContainEqual(
            JSON.stringify(queryKeys.flashOffers.byVenue(otherVenueId, undefined))
          );

          // Property 7: Other venue's detail query should NOT be invalidated
          expect(invalidatedQueries).not.toContainEqual(
            JSON.stringify(queryKeys.venues.detail(otherVenueId))
          );

          return true;
        }
      ),
      { numRuns: 100, timeout: 30000 } // 100 iterations with timeout
    );
  }, 35000); // Jest timeout for this test

  /**
   * Property: Invalidation should work with minimal offer data
   * 
   * This verifies that invalidation works correctly even when the offer
   * has minimal data fields.
   */
  it('should invalidate queries even with minimal offer data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        async (offerId, venueId, userId) => {
          // Create minimal mock offer (only required fields)
          const mockOffer: FlashOffer = {
            id: offerId,
            venue_id: venueId,
            title: 'Test',
            description: 'Test',
            expected_value: null,
            max_claims: 10,
            claimed_count: 0,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            radius_miles: 1.0,
            target_favorites_only: false,
            status: 'active',
            push_sent: false,
            push_sent_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const mockClaim: FlashOfferClaim = {
            id: 'claim-123',
            offer_id: offerId,
            user_id: userId,
            token: '123456',
            status: 'active',
            redeemed_at: null,
            redeemed_by_user_id: null,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockClaimService.claimOffer.mockResolvedValue(mockClaim);

          const { queryClient, wrapper } = createWrapper([mockOffer]);

          // Track invalidations
          const invalidatedQueries: string[] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters: any) => {
            if (filters?.queryKey) {
              invalidatedQueries.push(JSON.stringify(filters.queryKey));
            }
            return originalInvalidate(filters);
          });

          const { result } = renderHook(() => useClaimFlashOfferMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              offerId,
              venueId,
              userId,
            });
          });

          // Wait for mutation to succeed
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property: All 4 query patterns should still be invalidated
          expect(invalidatedQueries).toHaveLength(4);
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.flashOffers.byVenue(venueId, undefined))
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.flashOfferClaims.byUser(userId))
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.detail(venueId))
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.lists())
          );

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Invalidation should be idempotent
   * 
   * This verifies that multiple successful claims trigger the same
   * invalidation pattern each time.
   */
  it('should invalidate same queries for multiple successful claims', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 2, max: 3 }), // Number of claims to perform
        async (offerId, venueId, userId, numClaims) => {
          // Perform multiple claims and verify consistent invalidation
          for (let i = 0; i < numClaims; i++) {
            const mockOffer: FlashOffer = {
              id: `${offerId}-${i}`,
              venue_id: venueId,
              title: 'Test Offer',
              description: 'Test description',
              expected_value: 20.00,
              max_claims: 100,
              claimed_count: i,
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 3600000).toISOString(),
              radius_miles: 2.0,
              target_favorites_only: false,
              status: 'active',
              push_sent: true,
              push_sent_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const mockClaim: FlashOfferClaim = {
              id: `claim-${i}`,
              offer_id: `${offerId}-${i}`,
              user_id: userId,
              token: `12345${i}`,
              status: 'active',
              redeemed_at: null,
              redeemed_by_user_id: null,
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            mockClaimService.claimOffer.mockResolvedValue(mockClaim);

            // Create fresh query client for each iteration
            const { queryClient, wrapper } = createWrapper([mockOffer]);

            const invalidatedQueries: string[] = [];
            const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
            const spy = jest
              .spyOn(queryClient, 'invalidateQueries')
              .mockImplementation((filters: any) => {
                if (filters?.queryKey) {
                  invalidatedQueries.push(JSON.stringify(filters.queryKey));
                }
                return originalInvalidate(filters);
              });

            const { result } = renderHook(() => useClaimFlashOfferMutation(), {
              wrapper,
            });

            // Execute mutation
            act(() => {
              result.current.mutate({
                offerId: `${offerId}-${i}`,
                venueId,
                userId,
              });
            });

            // Wait for mutation to succeed
            await waitFor(
              () => {
                expect(result.current.isSuccess).toBe(true);
              },
              { timeout: 3000 }
            );

            // Property: Each claim should invalidate the same 4 query patterns
            expect(invalidatedQueries).toHaveLength(4);
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.flashOffers.byVenue(venueId, undefined))
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.flashOfferClaims.byUser(userId))
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.venues.detail(venueId))
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.venues.lists())
            );

            // Restore spy
            spy.mockRestore();
          }

          return true;
        }
      ),
      { numRuns: 20, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Invalidation should work with different venue combinations
   * 
   * This verifies that the invalidation logic correctly uses the specific
   * venueId from the mutation, not hardcoded values.
   */
  it('should invalidate queries with correct IDs for different venue combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple venue/offer/user combinations
        fc.array(
          fc.record({
            offerId: fc.uuid(),
            venueId: fc.uuid(),
            userId: fc.uuid(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (combinations) => {
          // For each combination, verify correct invalidation
          for (const { offerId, venueId, userId } of combinations) {
            const mockOffer: FlashOffer = {
              id: offerId,
              venue_id: venueId,
              title: 'Test Offer',
              description: 'Test description',
              expected_value: 20.00,
              max_claims: 100,
              claimed_count: 0,
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 3600000).toISOString(),
              radius_miles: 2.0,
              target_favorites_only: false,
              status: 'active',
              push_sent: true,
              push_sent_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const mockClaim: FlashOfferClaim = {
              id: `claim-${offerId}`,
              offer_id: offerId,
              user_id: userId,
              token: '123456',
              status: 'active',
              redeemed_at: null,
              redeemed_by_user_id: null,
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            mockClaimService.claimOffer.mockResolvedValue(mockClaim);

            const { queryClient, wrapper } = createWrapper([mockOffer]);

            const invalidatedQueries: string[] = [];
            const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
            jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters: any) => {
              if (filters?.queryKey) {
                invalidatedQueries.push(JSON.stringify(filters.queryKey));
              }
              return originalInvalidate(filters);
            });

            const { result } = renderHook(() => useClaimFlashOfferMutation(), {
              wrapper,
            });

            // Execute mutation
            act(() => {
              result.current.mutate({
                offerId,
                venueId,
                userId,
              });
            });

            // Wait for mutation to succeed
            await waitFor(() => {
              expect(result.current.isSuccess).toBe(true);
            });

            // Property: Invalidated queries should use the correct venueId
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.flashOffers.byVenue(venueId, undefined))
            );
            expect(invalidatedQueries).toContainEqual(
              JSON.stringify(queryKeys.venues.detail(venueId))
            );

            // Verify no other venue IDs are invalidated
            for (const otherCombo of combinations) {
              if (otherCombo.venueId !== venueId) {
                expect(invalidatedQueries).not.toContainEqual(
                  JSON.stringify(
                    queryKeys.flashOffers.byVenue(otherCombo.venueId, undefined)
                  )
                );
                expect(invalidatedQueries).not.toContainEqual(
                  JSON.stringify(queryKeys.venues.detail(otherCombo.venueId))
                );
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 30, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Invalidation should handle edge case claim counts
   * 
   * This verifies that invalidation works correctly even with
   * edge case values like 0 claims or maximum claims.
   */
  it('should handle edge case claim counts correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.constantFrom(0, 1, 49, 50, 99, 100), // Edge case values
        fc.constantFrom(50, 100, 1000), // Max claims values
        async (offerId, venueId, userId, edgeCaseCount, maxClaims) => {
          // Skip if claimed_count >= max_claims (offer would be full)
          if (edgeCaseCount >= maxClaims) {
            return true;
          }

          const mockOffer: FlashOffer = {
            id: offerId,
            venue_id: venueId,
            title: 'Test Offer',
            description: 'Test description',
            expected_value: 20.00,
            max_claims: maxClaims,
            claimed_count: edgeCaseCount,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            radius_miles: 2.0,
            target_favorites_only: false,
            status: 'active',
            push_sent: true,
            push_sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const mockClaim: FlashOfferClaim = {
            id: 'claim-123',
            offer_id: offerId,
            user_id: userId,
            token: '123456',
            status: 'active',
            redeemed_at: null,
            redeemed_by_user_id: null,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockClaimService.claimOffer.mockResolvedValue(mockClaim);

          const { queryClient, wrapper } = createWrapper([mockOffer]);

          const invalidatedQueries: string[] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          jest.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters: any) => {
            if (filters?.queryKey) {
              invalidatedQueries.push(JSON.stringify(filters.queryKey));
            }
            return originalInvalidate(filters);
          });

          const { result } = renderHook(() => useClaimFlashOfferMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              offerId,
              venueId,
              userId,
            });
          });

          // Wait for mutation to succeed
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property: Edge case counts should still trigger correct invalidation
          expect(invalidatedQueries).toHaveLength(4);
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.flashOffers.byVenue(venueId, undefined))
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.flashOfferClaims.byUser(userId))
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.detail(venueId))
          );
          expect(invalidatedQueries).toContainEqual(
            JSON.stringify(queryKeys.venues.lists())
          );

          return true;
        }
      ),
      { numRuns: 30, timeout: 30000 }
    );
  }, 35000);
});
