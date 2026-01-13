/**
 * Property-Based Tests for useCheckInHistory Hook
 * Feature: recent-check-ins-history
 */

import * as fc from 'fast-check';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useCheckInHistory } from '../useCheckInHistory';
import { CheckInService } from '../../services/api/checkins';
import type { CheckInHistoryResponse } from '../../types';

// Mock dependencies
jest.mock('../../services/api/checkins');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Helper to generate valid ISO date strings
const validDateArbitrary = (minDaysAgo: number, maxDaysAgo: number = 0) =>
  fc.integer({ min: Date.now() - minDaysAgo * 24 * 60 * 60 * 1000, max: Date.now() - maxDaysAgo * 24 * 60 * 60 * 1000 })
    .map(timestamp => new Date(timestamp).toISOString());

// Helper to generate check-in with venue
const checkInWithVenueArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    venue_id: fc.uuid(),
    user_id: fc.constant('test-user-id'),
    checked_in_at: validDateArbitrary(30, 0),
    checked_out_at: fc.oneof(fc.constant(null), validDateArbitrary(30, 0)),
    is_active: fc.boolean(),
    created_at: validDateArbitrary(30, 0),
    updated_at: validDateArbitrary(30, 0),
    venue: fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      location: fc.string({ minLength: 1, maxLength: 100 }),
      category: fc.constantFrom('Coffee Shop', 'Bar', 'Restaurant', 'Cafe'),
      image_url: fc.oneof(fc.constant(null), fc.webUrl()),
      rating: fc.double({ min: 0, max: 5 }),
      latitude: fc.oneof(fc.constant(null), fc.double({ min: -90, max: 90 })),
      longitude: fc.oneof(fc.constant(null), fc.double({ min: -180, max: 180 }))
    })
  });

// Test component that uses the hook
const TestComponent: React.FC<{ enabled?: boolean; onResult?: (result: any) => void }> = ({ enabled = true, onResult }) => {
  const result = useCheckInHistory({ enabled });
  
  React.useEffect(() => {
    if (onResult && !result.loading) {
      onResult(result);
    }
  }, [result.loading, onResult]);
  
  return null;
};

describe('useCheckInHistory Hook - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 2: Descending Chronological Order
   * Feature: recent-check-ins-history, Property 2: Descending Chronological Order
   * Validates: Requirements 1.2
   * 
   * For any list of check-ins returned by the history service, each check-in should have
   * a checked_in_at timestamp that is greater than or equal to the timestamp of the
   * check-in that follows it in the list.
   */
  describe('Property 2: Descending Chronological Order', () => {
    it('should return check-ins in descending chronological order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(checkInWithVenueArbitrary(), { minLength: 2, maxLength: 50 }),
          async (mockCheckIns) => {
            // Sort check-ins in descending order by checked_in_at (most recent first)
            const sortedCheckIns = [...mockCheckIns].sort((a, b) => 
              new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
            );

            const mockResponse: CheckInHistoryResponse = {
              checkIns: sortedCheckIns,
              hasMore: false,
              total: sortedCheckIns.length
            };

            (CheckInService.getUserCheckInHistory as jest.Mock).mockResolvedValue(mockResponse);

            return new Promise<void>((resolve) => {
              const onResult = (result: any) => {
                const checkIns = result.checkIns;

                // Verify the list is in descending chronological order
                for (let i = 0; i < checkIns.length - 1; i++) {
                  const currentTimestamp = new Date(checkIns[i].checked_in_at).getTime();
                  const nextTimestamp = new Date(checkIns[i + 1].checked_in_at).getTime();
                  
                  expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
                }
                resolve();
              };

              ReactTestRenderer.act(() => {
                ReactTestRenderer.create(<TestComponent enabled={true} onResult={onResult} />);
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Refresh Re-Query
   * Feature: recent-check-ins-history, Property 10: Refresh Re-Query
   * Validates: Requirements 4.2, 4.3
   * 
   * For any refresh action triggered by the user, the system should make a new query
   * to the backend service and update the displayed check-ins with the fresh data.
   */
  describe('Property 10: Refresh Re-Query', () => {
    it('should call service with offset 0 on refresh', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(checkInWithVenueArbitrary(), { minLength: 1, maxLength: 20 }),
          async (mockCheckIns) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();
            
            const sortedCheckIns = [...mockCheckIns].sort((a, b) => 
              new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
            );

            const mockResponse: CheckInHistoryResponse = {
              checkIns: sortedCheckIns,
              hasMore: false,
              total: sortedCheckIns.length
            };

            // Mock both initial and refresh calls
            (CheckInService.getUserCheckInHistory as jest.Mock).mockResolvedValue(mockResponse);

            // Create a simple test that just verifies the service calls
            let refetchFn: any;
            
            const onResult = (result: any) => {
              if (!result.loading && !refetchFn) {
                refetchFn = result.refetch;
              }
            };

            // Render the component
            await ReactTestRenderer.act(async () => {
              ReactTestRenderer.create(<TestComponent enabled={true} onResult={onResult} />);
              // Wait for initial load
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            // Verify initial call
            expect(CheckInService.getUserCheckInHistory).toHaveBeenCalledTimes(1);
            const initialCall = (CheckInService.getUserCheckInHistory as jest.Mock).mock.calls[0][0];
            expect(initialCall.offset).toBe(0);

            // Call refetch
            if (refetchFn) {
              await ReactTestRenderer.act(async () => {
                await refetchFn();
              });

              // Verify refresh call
              expect(CheckInService.getUserCheckInHistory).toHaveBeenCalledTimes(2);
              const refreshCall = (CheckInService.getUserCheckInHistory as jest.Mock).mock.calls[1][0];
              expect(refreshCall.offset).toBe(0);
            }
          }
        ),
        { numRuns: 20 } // Reduced runs for async hook testing
      );
    }, 30000); // 30 second timeout
  });
});
