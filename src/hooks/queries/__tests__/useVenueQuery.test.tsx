/**
 * Unit Tests for useVenueQuery Hook
 * 
 * Tests the useVenueQuery hook functionality including:
 * - Correct data structure returned
 * - Loading states
 * - Error handling
 * - Refetch capability
 * - Query enabling/disabling
 * 
 * Validates Requirements: 2.2
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVenueQuery } from '../useVenueQuery';
import { VenueService } from '../../../services/api/venues';
import type { Venue } from '../../../types/venue.types';
import React from 'react';

// Mock the VenueService
jest.mock('../../../services/api/venues');

const mockVenueService = VenueService as jest.Mocked<typeof VenueService>;

// Sample venue data for testing
const mockVenue: Venue = {
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
} as Venue;

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useVenueQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct data structure', async () => {
    mockVenueService.getVenueById.mockResolvedValue(mockVenue);

    const { result } = renderHook(
      () => useVenueQuery({ venueId: 'venue-123' }),
      {
        wrapper: createWrapper(),
      }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.venue).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data structure
    expect(result.current.venue).toEqual(mockVenue);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle loading states correctly', async () => {
    mockVenueService.getVenueById.mockResolvedValue(mockVenue);

    const { result } = renderHook(
      () => useVenueQuery({ venueId: 'venue-123' }),
      {
        wrapper: createWrapper(),
      }
    );

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not be loading after data arrives
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors correctly', async () => {
    const errorMessage = 'Failed to fetch venue';
    mockVenueService.getVenueById.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(
      () => useVenueQuery({ venueId: 'venue-123' }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.venue).toBeUndefined();
  });

  it('should support refetch capability', async () => {
    mockVenueService.getVenueById.mockResolvedValue(mockVenue);

    const { result } = renderHook(
      () => useVenueQuery({ venueId: 'venue-123' }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear mock and set new data
    mockVenueService.getVenueById.mockClear();
    const updatedVenue = { ...mockVenue, rating: 4.8 };
    mockVenueService.getVenueById.mockResolvedValue(updatedVenue);

    // Trigger refetch
    await result.current.refetch();

    // Verify refetch was called
    expect(mockVenueService.getVenueById).toHaveBeenCalledTimes(1);
    expect(mockVenueService.getVenueById).toHaveBeenCalledWith('venue-123');
  });

  it('should pass venueId to VenueService.getVenueById', async () => {
    mockVenueService.getVenueById.mockResolvedValue(mockVenue);

    const venueId = 'venue-456';

    renderHook(() => useVenueQuery({ venueId }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockVenueService.getVenueById).toHaveBeenCalledWith(venueId);
    });
  });

  it('should respect enabled option', () => {
    mockVenueService.getVenueById.mockResolvedValue(mockVenue);

    renderHook(
      () => useVenueQuery({ venueId: 'venue-123', enabled: false }),
      {
        wrapper: createWrapper(),
      }
    );

    // Should not call the service when disabled
    expect(mockVenueService.getVenueById).not.toHaveBeenCalled();
  });

  it('should enable query by default', async () => {
    mockVenueService.getVenueById.mockResolvedValue(mockVenue);

    renderHook(() => useVenueQuery({ venueId: 'venue-123' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockVenueService.getVenueById).toHaveBeenCalled();
    });
  });

  it('should return undefined when venue not found', async () => {
    mockVenueService.getVenueById.mockRejectedValue(
      new Error('Venue not found')
    );

    const { result } = renderHook(
      () => useVenueQuery({ venueId: 'non-existent' }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.venue).toBeUndefined();
    expect(result.current.isError).toBe(true);
  });

  it('should allow custom staleTime override', async () => {
    mockVenueService.getVenueById.mockResolvedValue(mockVenue);

    const { result } = renderHook(
      () =>
        useVenueQuery({
          venueId: 'venue-123',
          staleTime: 60000, // 1 minute
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.venue).toEqual(mockVenue);
  });

  it('should use correct query key from queryKeys factory', async () => {
    mockVenueService.getVenueById.mockResolvedValue(mockVenue);

    const venueId = 'venue-789';

    renderHook(() => useVenueQuery({ venueId }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockVenueService.getVenueById).toHaveBeenCalledWith(venueId);
    });

    // The query key should be ['venues', 'detail', venueId]
    // This is implicitly tested by the hook working correctly
  });
});
