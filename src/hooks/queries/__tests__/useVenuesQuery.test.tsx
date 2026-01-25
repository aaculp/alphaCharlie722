/**
 * Unit Tests for useVenuesQuery Hook
 * 
 * Tests the useVenuesQuery hook functionality including:
 * - Correct data structure returned
 * - Loading states
 * - Error handling
 * - Refetch capability
 * - Filter support
 * 
 * Validates Requirements: 2.1
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVenuesQuery } from '../useVenuesQuery';
import { VenueService } from '../../../services/api/venues';
import type { Venue } from '../../../types/venue.types';
import React from 'react';

// Mock the VenueService
jest.mock('../../../services/api/venues');

const mockVenueService = VenueService as jest.Mocked<typeof VenueService>;

// Sample venue data for testing
const mockVenues: Venue[] = [
  {
    id: 'venue-1',
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
  } as Venue,
  {
    id: 'venue-2',
    name: 'Test Cafe',
    category: 'cafe',
    location: 'Brooklyn',
    rating: 4.2,
    review_count: 50,
    description: 'A cozy cafe',
    address: '456 Oak Ave',
    city: 'Brooklyn',
    state: 'NY',
    zip_code: '11201',
    country: 'USA',
    phone: '555-5678',
    email: 'test@cafe.com',
    website: 'https://cafe.com',
    hours: {},
    amenities: [],
    price_range: '$',
    cuisine_type: 'Coffee',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  } as Venue,
];

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

describe('useVenuesQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct data structure', async () => {
    mockVenueService.getVenues.mockResolvedValue(mockVenues);

    const { result } = renderHook(() => useVenuesQuery(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.venues).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data structure
    expect(result.current.venues).toEqual(mockVenues);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle loading states correctly', async () => {
    mockVenueService.getVenues.mockResolvedValue(mockVenues);

    const { result } = renderHook(() => useVenuesQuery(), {
      wrapper: createWrapper(),
    });

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
    const errorMessage = 'Failed to fetch venues';
    mockVenueService.getVenues.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useVenuesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.venues).toEqual([]);
  });

  it('should support refetch capability', async () => {
    mockVenueService.getVenues.mockResolvedValue(mockVenues);

    const { result } = renderHook(() => useVenuesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear mock and set new data
    mockVenueService.getVenues.mockClear();
    const newVenues = [mockVenues[0]];
    mockVenueService.getVenues.mockResolvedValue(newVenues);

    // Trigger refetch
    await result.current.refetch();

    // Verify refetch was called
    expect(mockVenueService.getVenues).toHaveBeenCalledTimes(1);
  });

  it('should pass filters to VenueService.getVenues', async () => {
    mockVenueService.getVenues.mockResolvedValue(mockVenues);

    const filters = { category: 'restaurant', search: 'test' };
    
    renderHook(() => useVenuesQuery({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockVenueService.getVenues).toHaveBeenCalledWith(filters);
    });
  });

  it('should use getNearbyVenues when location filter is provided', async () => {
    mockVenueService.getNearbyVenues.mockResolvedValue(mockVenues);

    const filters = {
      location: { lat: 40.7128, lng: -74.0060, radius: 5 },
    };

    renderHook(() => useVenuesQuery({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockVenueService.getNearbyVenues).toHaveBeenCalledWith(
        40.7128,
        -74.0060,
        5,
        undefined
      );
    });
  });

  it('should respect enabled option', () => {
    mockVenueService.getVenues.mockResolvedValue(mockVenues);

    renderHook(() => useVenuesQuery({ enabled: false }), {
      wrapper: createWrapper(),
    });

    // Should not call the service when disabled
    expect(mockVenueService.getVenues).not.toHaveBeenCalled();
  });

  it('should return empty array when no data', async () => {
    mockVenueService.getVenues.mockResolvedValue([]);

    const { result } = renderHook(() => useVenuesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.venues).toEqual([]);
    expect(result.current.isError).toBe(false);
  });
});
