/**
 * Unit Tests for useCheckInMutation Hook
 * 
 * Tests the useCheckInMutation hook functionality including:
 * - Mutation execution
 * - Optimistic updates
 * - Rollback on error
 * - Query invalidation on success
 * - Success and error callbacks
 * 
 * Validates Requirements: 3.1, 3.2, 3.3, 3.4
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

// Sample data for testing
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
  price_range: '$$',
  cuisine_type: 'Italian',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  stats: {
    active_checkins: 5,
    recent_checkins: 10,
    user_is_checked_in: false,
  },
} as VenueWithStats;

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
      mutations: {
        retry: false, // Disable retries for tests
      },
    },
  });

  // Pre-populate cache with venue data for optimistic update tests
  queryClient.setQueryData(
    queryKeys.venues.detail('venue-123'),
    mockVenue
  );

  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  };
}

describe('useCheckInMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute check-in mutation successfully', async () => {
    mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

    const { result } = renderHook(() => useCheckInMutation(), {
      wrapper: createWrapper().wrapper,
    });

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify service was called with correct parameters
    expect(mockCheckInService.checkIn).toHaveBeenCalledWith(
      'venue-123',
      'user-456'
    );
    expect(mockCheckInService.checkIn).toHaveBeenCalledTimes(1);
  });

  it('should perform optimistic update before server confirmation', async () => {
    mockCheckInService.checkIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockCheckIn), 100);
        })
    );

    const { queryClient, wrapper } = createWrapper();

    const { result } = renderHook(() => useCheckInMutation(), {
      wrapper,
    });

    // Get initial venue data
    const initialVenue = queryClient.getQueryData<VenueWithStats>(
      queryKeys.venues.detail('venue-123')
    );
    expect(initialVenue?.stats?.user_is_checked_in).toBe(false);
    expect(initialVenue?.stats?.active_checkins).toBe(5);

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Check optimistic update happened immediately (before server response)
    await waitFor(() => {
      const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
        queryKeys.venues.detail('venue-123')
      );
      expect(optimisticVenue?.stats?.user_is_checked_in).toBe(true);
      expect(optimisticVenue?.stats?.active_checkins).toBe(6);
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should rollback optimistic update on error', async () => {
    const errorMessage = 'Failed to check in';
    mockCheckInService.checkIn.mockRejectedValue(new Error(errorMessage));

    const { queryClient, wrapper } = createWrapper();

    const { result } = renderHook(() => useCheckInMutation(), {
      wrapper,
    });

    // Get initial venue data
    const initialVenue = queryClient.getQueryData<VenueWithStats>(
      queryKeys.venues.detail('venue-123')
    );
    const initialCheckInCount = initialVenue?.stats?.active_checkins;

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Wait for mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify rollback happened
    const rolledBackVenue = queryClient.getQueryData<VenueWithStats>(
      queryKeys.venues.detail('venue-123')
    );
    expect(rolledBackVenue?.stats?.user_is_checked_in).toBe(false);
    expect(rolledBackVenue?.stats?.active_checkins).toBe(initialCheckInCount);
    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('should invalidate correct queries on success', async () => {
    mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

    const { queryClient, wrapper } = createWrapper();

    // Spy on invalidateQueries
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCheckInMutation(), {
      wrapper,
    });

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify correct queries were invalidated
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.venues.detail('venue-123'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.venues.lists(),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.checkIns.byUser('user-456'),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.checkIns.byVenue('venue-123'),
    });
  });

  it('should call onSuccess callback when mutation succeeds', async () => {
    mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

    const onSuccess = jest.fn();

    const { result } = renderHook(
      () => useCheckInMutation({ onSuccess }),
      {
        wrapper: createWrapper().wrapper,
      }
    );

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify callback was called with correct data
    expect(onSuccess).toHaveBeenCalledWith(mockCheckIn);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('should call onError callback when mutation fails', async () => {
    const errorMessage = 'Failed to check in';
    const error = new Error(errorMessage);
    mockCheckInService.checkIn.mockRejectedValue(error);

    const onError = jest.fn();

    const { result } = renderHook(
      () => useCheckInMutation({ onError }),
      {
        wrapper: createWrapper().wrapper,
      }
    );

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Wait for mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify callback was called with correct error
    expect(onError).toHaveBeenCalledWith(error);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('should handle mutation when venue data is not in cache', async () => {
    mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCheckInMutation(), {
      wrapper,
    });

    // Execute mutation without venue in cache
    act(() => {
      result.current.mutate({
        venueId: 'venue-999',
        userId: 'user-456',
      });
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should still succeed even without cached venue data
    expect(mockCheckInService.checkIn).toHaveBeenCalledWith(
      'venue-999',
      'user-456'
    );
  });

  it('should increment both active and recent check-in counts', async () => {
    mockCheckInService.checkIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockCheckIn), 50);
        })
    );

    const { queryClient, wrapper } = createWrapper();

    const { result } = renderHook(() => useCheckInMutation(), {
      wrapper,
    });

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Check optimistic update
    await waitFor(() => {
      const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
        queryKeys.venues.detail('venue-123')
      );
      expect(optimisticVenue?.stats?.active_checkins).toBe(6); // 5 + 1
      expect(optimisticVenue?.stats?.recent_checkins).toBe(11); // 10 + 1
    });
  });

  it('should set user_checkin_time to current time in optimistic update', async () => {
    mockCheckInService.checkIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockCheckIn), 50);
        })
    );

    const { queryClient, wrapper } = createWrapper();

    const { result } = renderHook(() => useCheckInMutation(), {
      wrapper,
    });

    const beforeTime = new Date().toISOString();

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Check optimistic update
    await waitFor(() => {
      const optimisticVenue = queryClient.getQueryData<VenueWithStats>(
        queryKeys.venues.detail('venue-123')
      );
      expect(optimisticVenue?.stats?.user_checkin_time).toBeDefined();
      
      // Check that the time is recent (within last second)
      const checkInTime = new Date(optimisticVenue?.stats?.user_checkin_time || '');
      const now = new Date();
      const timeDiff = now.getTime() - checkInTime.getTime();
      expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
    });
  });

  it('should return correct mutation state properties', async () => {
    mockCheckInService.checkIn.mockResolvedValue(mockCheckIn);

    const { result } = renderHook(() => useCheckInMutation(), {
      wrapper: createWrapper().wrapper,
    });

    // Initial state
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);

    // Execute mutation
    act(() => {
      result.current.mutate({
        venueId: 'venue-123',
        userId: 'user-456',
      });
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
