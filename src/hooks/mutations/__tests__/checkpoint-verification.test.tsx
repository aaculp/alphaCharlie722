/**
 * Checkpoint Verification Tests for Task 7
 * 
 * This file contains verification tests for the checkpoint task:
 * - Test check-in flow with optimistic updates
 * - Verify rollback on simulated error
 * - Test flash offer claiming and refetching (when implemented)
 * 
 * These tests are designed to be quick and demonstrate that the
 * core functionality works as expected.
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCheckInMutation } from '../useCheckInMutation';
import { CheckInService } from '../../../services/api/checkins';
import { queryKeys } from '../../../lib/queryKeys';
import type { CheckIn, VenueWithStats } from '../../../types';
import React from 'react';

// Mock the CheckInService
jest.mock('../../../services/api/checkins');

const mockCheckInService = CheckInService as jest.Mocked<typeof CheckInService>;

// Helper to create a wrapper with QueryClient
function createWrapper(initialVenue?: VenueWithStats) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  if (initialVenue) {
    queryClient.setQueryData(
      queryKeys.venues.detail(initialVenue.id),
      initialVenue
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

describe('Checkpoint 7: Check-in and Flash Offers Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Check-in Flow with Optimistic Updates', () => {
    it('CHECKPOINT: should perform complete check-in flow with optimistic update', async () => {
      // Setup
      const mockVenue: VenueWithStats = {
        id: 'venue-123',
        name: 'Test Restaurant',
        category: 'restaurant',
        location: 'New York',
        rating: 4.5,
        review_count: 100,
        description: 'A great restaurant',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip_code: '10001',
        country: 'USA',
        phone: '555-1234',
        email: 'test@restaurant.com',
        website: 'https://restaurant.com',
        hours: {},
        amenities: [],
        price_range: '$',
        cuisine_type: 'Italian',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aggregate_rating: 4.5,
        image_url: 'https://test.com/image.jpg',
        latitude: 40.7128,
        longitude: -74.0060,
        is_active: true,
        is_featured: false,
        tags: [],
        stats: {
          active_checkins: 5,
          recent_checkins: 10,
          user_is_checked_in: false,
        },
      } as VenueWithStats;

      const mockCheckIn: CheckIn = {
        id: 'checkin-123',
        venue_id: 'venue-123',
        user_id: 'user-456',
        checked_in_at: '2024-01-01T12:00:00Z',
        checked_out_at: null,
        is_active: true,
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      // Simulate server delay to observe optimistic update
      mockCheckInService.checkIn.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockCheckIn), 100);
          })
      );

      const { queryClient, wrapper } = createWrapper(mockVenue);

      const { result } = renderHook(() => useCheckInMutation(), {
        wrapper,
      });

      console.log('✓ Step 1: Initial state - user not checked in');
      const initialVenue = queryClient.getQueryData<VenueWithStats>(
        queryKeys.venues.detail('venue-123')
      );
      expect(initialVenue?.stats?.user_is_checked_in).toBe(false);
      expect(initialVenue?.stats?.active_checkins).toBe(5);

      // Execute mutation
      console.log('✓ Step 2: Executing check-in mutation');
      act(() => {
        result.current.mutate({
          venueId: 'venue-123',
          userId: 'user-456',
        });
      });

      // Verify optimistic update happened immediately
      console.log('✓ Step 3: Verifying optimistic update (before server response)');
      await waitFor(() => {
        const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
          queryKeys.venues.detail('venue-123')
        );
        expect(optimisticVenue?.stats?.user_is_checked_in).toBe(true);
        expect(optimisticVenue?.stats?.active_checkins).toBe(6);
      });

      // Wait for mutation to complete
      console.log('✓ Step 4: Waiting for server confirmation');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      console.log('✓ Step 5: Check-in flow completed successfully');
      expect(mockCheckInService.checkIn).toHaveBeenCalledWith(
        'venue-123',
        'user-456'
      );
    });
  });

  describe('Rollback on Simulated Error', () => {
    it('CHECKPOINT: should rollback optimistic update when check-in fails', async () => {
      // Setup
      const mockVenue: VenueWithStats = {
        id: 'venue-456',
        name: 'Test Bar',
        category: 'bar',
        location: 'Boston',
        rating: 4.0,
        review_count: 50,
        description: 'A cool bar',
        address: '456 Bar St',
        city: 'Boston',
        state: 'MA',
        zip_code: '02101',
        country: 'USA',
        phone: '555-5678',
        email: 'test@bar.com',
        website: 'https://bar.com',
        hours: {},
        amenities: [],
        price_range: '$$',
        cuisine_type: 'American',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aggregate_rating: 4.0,
        image_url: 'https://test.com/bar.jpg',
        latitude: 42.3601,
        longitude: -71.0589,
        is_active: true,
        is_featured: false,
        tags: [],
        stats: {
          active_checkins: 3,
          recent_checkins: 7,
          user_is_checked_in: false,
        },
      } as VenueWithStats;

      // Simulate server error
      const errorMessage = 'Network error: Failed to check in';
      mockCheckInService.checkIn.mockRejectedValue(new Error(errorMessage));

      const { queryClient, wrapper } = createWrapper(mockVenue);

      const { result } = renderHook(() => useCheckInMutation(), {
        wrapper,
      });

      console.log('✓ Step 1: Initial state - 3 active check-ins');
      const initialVenue = queryClient.getQueryData<VenueWithStats>(
        queryKeys.venues.detail('venue-456')
      );
      expect(initialVenue?.stats?.active_checkins).toBe(3);
      expect(initialVenue?.stats?.user_is_checked_in).toBe(false);

      // Execute mutation (will fail)
      console.log('✓ Step 2: Executing check-in mutation (will fail)');
      act(() => {
        result.current.mutate({
          venueId: 'venue-456',
          userId: 'user-789',
        });
      });

      // Wait for mutation to fail
      console.log('✓ Step 3: Waiting for mutation to fail');
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify rollback happened
      console.log('✓ Step 4: Verifying rollback to previous state');
      const rolledBackVenue = queryClient.getQueryData<VenueWithStats>(
        queryKeys.venues.detail('venue-456')
      );
      expect(rolledBackVenue?.stats?.active_checkins).toBe(3);
      expect(rolledBackVenue?.stats?.user_is_checked_in).toBe(false);
      expect(result.current.error?.message).toBe(errorMessage);

      console.log('✓ Step 5: Rollback completed successfully');
    });
  });

  describe('Flash Offers (Placeholder)', () => {
    it('CHECKPOINT: Flash offers not yet implemented - skipping verification', () => {
      console.log('⚠ Flash offer queries and mutations not yet implemented');
      console.log('⚠ This will be verified in a future checkpoint after task 6 is complete');
      
      // This test is a placeholder to remind us that flash offers
      // need to be implemented and tested in task 6
      expect(true).toBe(true);
    });
  });

  describe('Query Invalidation', () => {
    it('CHECKPOINT: should invalidate correct queries after successful check-in', async () => {
      const mockVenue: VenueWithStats = {
        id: 'venue-789',
        name: 'Test Cafe',
        category: 'cafe',
        location: 'Seattle',
        rating: 4.8,
        review_count: 200,
        description: 'A cozy cafe',
        address: '789 Cafe Ave',
        city: 'Seattle',
        state: 'WA',
        zip_code: '98101',
        country: 'USA',
        phone: '555-9999',
        email: 'test@cafe.com',
        website: 'https://cafe.com',
        hours: {},
        amenities: [],
        price_range: '$',
        cuisine_type: 'Coffee',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aggregate_rating: 4.8,
        image_url: 'https://test.com/cafe.jpg',
        latitude: 47.6062,
        longitude: -122.3321,
        is_active: true,
        is_featured: false,
        tags: [],
        stats: {
          active_checkins: 8,
          recent_checkins: 15,
          user_is_checked_in: false,
        },
      } as VenueWithStats;

      const mockCheckIn: CheckIn = {
        id: 'checkin-789',
        venue_id: 'venue-789',
        user_id: 'user-111',
        checked_in_at: '2024-01-01T12:00:00Z',
        checked_out_at: null,
        is_active: true,
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

      const { queryClient, wrapper } = createWrapper(mockVenue);

      // Spy on invalidateQueries
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCheckInMutation(), {
        wrapper,
      });

      console.log('✓ Step 1: Executing check-in mutation');
      act(() => {
        result.current.mutate({
          venueId: 'venue-789',
          userId: 'user-111',
        });
      });

      // Wait for mutation to complete
      console.log('✓ Step 2: Waiting for mutation to complete');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify correct queries were invalidated
      console.log('✓ Step 3: Verifying query invalidation');
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.detail('venue-789'),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.lists(),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.checkIns.byUser('user-111'),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.checkIns.byVenue('venue-789'),
      });

      console.log('✓ Step 4: All expected queries were invalidated');
    });
  });
});
