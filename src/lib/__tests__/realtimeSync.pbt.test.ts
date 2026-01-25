/**
 * Property-Based Tests for Real-Time Sync
 * 
 * Feature: react-query-integration
 * Property 15: Real-time event invalidation
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3**
 * 
 * Tests verify that Supabase real-time events trigger correct query invalidation
 * using property-based testing with fast-check.
 */

import fc from 'fast-check';
import { QueryClient } from '@tanstack/react-query';
import { setupRealtimeSync } from '../realtimeSync';
import { supabase } from '../supabase';
import { queryKeys } from '../queryKeys';

// Mock the supabase client
jest.mock('../supabase', () => ({
  supabase: {
    channel: jest.fn(),
  },
}));

type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';
type TableName = 'venues' | 'check_ins' | 'flash_offers';

interface MockChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
}

describe('Feature: react-query-integration, Property 15: Real-time event invalidation', () => {
  let mockChannel: MockChannel;
  let capturedCallbacks: Map<string, (payload: any) => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallbacks = new Map();

    // Create mock channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    };

    // Capture the callback when .on() is called
    mockChannel.on.mockImplementation((event: string, config: any, callback: (payload: any) => void) => {
      const key = `${config.table}-${event}`;
      capturedCallbacks.set(key, callback);
      return mockChannel;
    });

    // Mock supabase.channel to return our mock channel
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 7.1, 7.2, 7.3**
   * 
   * Property: For any Supabase real-time event (INSERT, UPDATE, DELETE) on tracked tables
   * (venues, check_ins, flash_offers), the system SHALL invalidate the corresponding queries
   * based on the affected entity ID and type.
   * 
   * This property verifies that:
   * 1. Venue events invalidate venue detail and list queries
   * 2. Check-in events invalidate check-in and venue queries
   * 3. Flash offer events invalidate flash offer and venue queries
   * 4. Invalidation happens for all event types (INSERT, UPDATE, DELETE)
   */
  it('should invalidate correct queries for any real-time event on any tracked table', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random event types
        fc.constantFrom<RealtimeEventType>('INSERT', 'UPDATE', 'DELETE'),
        // Generate random table names
        fc.constantFrom<TableName>('venues', 'check_ins', 'flash_offers'),
        // Generate random entity IDs
        fc.uuid(),
        fc.uuid(), // venue_id for check_ins and flash_offers
        fc.uuid(), // user_id for check_ins
        async (eventType, tableName, entityId, venueId, userId) => {
          const queryClient = new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
              },
            },
          });

          // Spy on invalidateQueries
          const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

          // Set up real-time sync
          const cleanup = setupRealtimeSync(queryClient);

          // Simulate real-time event based on table and event type
          let payload: any;

          if (tableName === 'venues') {
            payload = {
              eventType,
              new: eventType !== 'DELETE' ? { id: entityId } : undefined,
              old: eventType === 'DELETE' ? { id: entityId } : undefined,
            };

            // Trigger the callback
            const callback = capturedCallbacks.get('venues-postgres_changes');
            expect(callback).toBeDefined();
            callback!(payload);

            // Property 1: Venue events should invalidate venue detail query
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.venues.detail(entityId),
            });

            // Property 2: Venue events should invalidate venue list queries
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.venues.lists(),
            });
          } else if (tableName === 'check_ins') {
            payload = {
              eventType: 'INSERT', // Only INSERT events for check_ins
              new: { venue_id: venueId, user_id: userId },
            };

            // Trigger the callback
            const callback = capturedCallbacks.get('check_ins-postgres_changes');
            expect(callback).toBeDefined();
            callback!(payload);

            // Property 3: Check-in events should invalidate check-in by venue query
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.checkIns.byVenue(venueId),
            });

            // Property 4: Check-in events should invalidate check-in by user query
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.checkIns.byUser(userId),
            });

            // Property 5: Check-in events should invalidate venue detail query
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.venues.detail(venueId),
            });
          } else if (tableName === 'flash_offers') {
            payload = {
              eventType,
              new: eventType !== 'DELETE' ? { venue_id: venueId } : undefined,
              old: eventType === 'DELETE' ? { venue_id: venueId } : undefined,
            };

            // Trigger the callback
            const callback = capturedCallbacks.get('flash_offers-postgres_changes');
            expect(callback).toBeDefined();
            callback!(payload);

            // Property 6: Flash offer events should invalidate flash offer by venue query
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.flashOffers.byVenue(venueId),
            });

            // Property 7: Flash offer events should invalidate venue detail query
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.venues.detail(venueId),
            });
          }

          // Cleanup
          cleanup();
          invalidateSpy.mockRestore();

          return true;
        }
      ),
      { numRuns: 100, timeout: 30000 } // 100 iterations
    );
  }, 35000);

  /**
   * Property: Real-time subscriptions should be established for all tracked tables
   * 
   * This verifies that setupRealtimeSync creates subscriptions for all
   * required tables (venues, check_ins, flash_offers).
   */
  it('should establish subscriptions for all tracked tables', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(true), // Dummy property to run the test
        async () => {
          // Reset mocks for each iteration
          jest.clearAllMocks();
          
          // Recreate mock channel for this iteration
          const localMockChannel: MockChannel = {
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
            unsubscribe: jest.fn(),
          };
          
          (supabase.channel as jest.Mock).mockReturnValue(localMockChannel);

          const queryClient = new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
              },
            },
          });

          // Set up real-time sync
          const cleanup = setupRealtimeSync(queryClient);

          // Property 1: Should create channel for venues
          expect(supabase.channel).toHaveBeenCalledWith('venue-changes');

          // Property 2: Should create channel for check-ins
          expect(supabase.channel).toHaveBeenCalledWith('checkin-changes');

          // Property 3: Should create channel for flash offers
          expect(supabase.channel).toHaveBeenCalledWith('flash-offer-changes');

          // Property 4: Should subscribe to postgres_changes for venues
          expect(localMockChannel.on).toHaveBeenCalledWith(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'venues' },
            expect.any(Function)
          );

          // Property 5: Should subscribe to postgres_changes for check_ins
          expect(localMockChannel.on).toHaveBeenCalledWith(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'check_ins' },
            expect.any(Function)
          );

          // Property 6: Should subscribe to postgres_changes for flash_offers
          expect(localMockChannel.on).toHaveBeenCalledWith(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'flash_offers' },
            expect.any(Function)
          );

          // Property 7: Should call subscribe on all channels
          expect(localMockChannel.subscribe).toHaveBeenCalledTimes(3);

          // Cleanup
          cleanup();

          return true;
        }
      ),
      { numRuns: 10 } // Fewer runs since this is a setup test
    );
  });

  /**
   * Property: Cleanup function should unsubscribe from all channels
   * 
   * This verifies that the cleanup function returned by setupRealtimeSync
   * properly unsubscribes from all channels to prevent memory leaks.
   */
  it('should unsubscribe from all channels when cleanup is called', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(true), // Dummy property to run the test
        async () => {
          // Reset mocks for each iteration
          jest.clearAllMocks();
          
          // Recreate mock channel for this iteration
          const localMockChannel: MockChannel = {
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
            unsubscribe: jest.fn(),
          };
          
          (supabase.channel as jest.Mock).mockReturnValue(localMockChannel);

          const queryClient = new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
              },
            },
          });

          // Set up real-time sync
          const cleanup = setupRealtimeSync(queryClient);

          // Call cleanup
          cleanup();

          // Property: Should unsubscribe from all 3 channels
          expect(localMockChannel.unsubscribe).toHaveBeenCalledTimes(3);

          return true;
        }
      ),
      { numRuns: 10 } // Fewer runs since this is a cleanup test
    );
  });

  /**
   * Property: Invalidation should be selective based on entity ID
   * 
   * This verifies that real-time events only invalidate queries for the
   * specific entity that changed, not all entities of that type.
   */
  it('should only invalidate queries for the specific entity that changed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // Changed entity ID
        fc.uuid(), // Different entity ID (should not be invalidated)
        fc.constantFrom<TableName>('venues', 'flash_offers'),
        async (changedId, differentId, tableName) => {
          const queryClient = new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
              },
            },
          });

          const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

          // Set up real-time sync
          const cleanup = setupRealtimeSync(queryClient);

          // Simulate event for changed entity
          const payload = {
            eventType: 'UPDATE' as RealtimeEventType,
            new: tableName === 'venues' ? { id: changedId } : { venue_id: changedId },
          };

          const callback = capturedCallbacks.get(`${tableName}-postgres_changes`);
          expect(callback).toBeDefined();
          callback!(payload);

          // Property 1: Should invalidate query for changed entity
          if (tableName === 'venues') {
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.venues.detail(changedId),
            });

            // Property 2: Should NOT invalidate query for different entity
            expect(invalidateSpy).not.toHaveBeenCalledWith({
              queryKey: queryKeys.venues.detail(differentId),
            });
          } else if (tableName === 'flash_offers') {
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.flashOffers.byVenue(changedId),
            });

            // Property 2: Should NOT invalidate query for different entity
            expect(invalidateSpy).not.toHaveBeenCalledWith({
              queryKey: queryKeys.flashOffers.byVenue(differentId),
            });
          }

          // Cleanup
          cleanup();
          invalidateSpy.mockRestore();

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  /**
   * Property: Multiple events should trigger multiple invalidations
   * 
   * This verifies that the system can handle multiple real-time events
   * in sequence and invalidate queries correctly for each event.
   */
  it('should handle multiple sequential events correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }), // Multiple venue IDs
        async (venueIds) => {
          const queryClient = new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
              },
            },
          });

          const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

          // Set up real-time sync
          const cleanup = setupRealtimeSync(queryClient);

          const callback = capturedCallbacks.get('venues-postgres_changes');
          expect(callback).toBeDefined();

          // Trigger multiple events
          for (const venueId of venueIds) {
            const payload = {
              eventType: 'UPDATE' as RealtimeEventType,
              new: { id: venueId },
            };

            callback!(payload);
          }

          // Property: Each venue should have its detail query invalidated
          for (const venueId of venueIds) {
            expect(invalidateSpy).toHaveBeenCalledWith({
              queryKey: queryKeys.venues.detail(venueId),
            });
          }

          // Property: Venue lists should be invalidated for each event
          expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: queryKeys.venues.lists(),
          });
          expect(invalidateSpy.mock.calls.filter(
            call => JSON.stringify(call[0]) === JSON.stringify({ queryKey: queryKeys.venues.lists() })
          ).length).toBe(venueIds.length);

          // Cleanup
          cleanup();
          invalidateSpy.mockRestore();

          return true;
        }
      ),
      { numRuns: 30, timeout: 30000 }
    );
  }, 35000);
});
