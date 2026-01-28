/**
 * Unit Tests for useFlashOffersQuery Hook
 * 
 * Tests the useFlashOffersQuery hook functionality including:
 * - Correct staleTime configuration (10 seconds)
 * - refetchOnWindowFocus enabled
 * - refetchInterval configuration (30 seconds)
 * - Loading states
 * - Error handling
 * - Refetch capability
 * 
 * Validates Requirements: 4.1, 4.2, 4.5
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFlashOffersQuery } from '../useFlashOffersQuery';
import { FlashOfferService } from '../../../services/api/flashOffers';
import type { FlashOffer } from '../../../types/flashOffer.types';
import React from 'react';

// Mock the FlashOfferService
jest.mock('../../../services/api/flashOffers');

const mockFlashOfferService = FlashOfferService as jest.Mocked<typeof FlashOfferService>;

// Sample flash offer data for testing
const mockFlashOffers: FlashOffer[] = [
  {
    id: 'offer-1',
    venue_id: 'venue-1',
    title: 'Happy Hour Special',
    description: '50% off all drinks',
    expected_value: 20.00,
    max_claims: 50,
    claimed_count: 10,
    start_time: '2024-01-01T17:00:00Z',
    end_time: '2024-01-01T19:00:00Z',
    radius_miles: 2.0,
    target_favorites_only: false,
    status: 'active',
    push_sent: true,
    push_sent_at: '2024-01-01T16:55:00Z',
    created_at: '2024-01-01T16:00:00Z',
    updated_at: '2024-01-01T16:00:00Z',
  },
  {
    id: 'offer-2',
    venue_id: 'venue-1',
    title: 'Free Appetizer',
    description: 'Free appetizer with any entree',
    expected_value: 15.00,
    max_claims: 25,
    claimed_count: 5,
    start_time: '2024-01-01T18:00:00Z',
    end_time: '2024-01-01T20:00:00Z',
    radius_miles: 1.5,
    target_favorites_only: true,
    status: 'active',
    push_sent: false,
    push_sent_at: null,
    created_at: '2024-01-01T17:00:00Z',
    updated_at: '2024-01-01T17:00:00Z',
  },
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

describe('useFlashOffersQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Tests', () => {
    it('should have staleTime set to 10 seconds', async () => {
      // Requirement 4.2: Test staleTime is 10 seconds
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Get the query from the cache to check its configuration
      const queries = queryClient.getQueryCache().getAll();
      const flashOfferQuery = queries.find((q) =>
        q.queryKey[0] === 'flash-offers'
      );

      expect(flashOfferQuery).toBeDefined();
      // Check that staleTime is 10000ms (10 seconds)
      expect(flashOfferQuery?.options.staleTime).toBe(10000);
    });

    it('should have refetchOnWindowFocus enabled', async () => {
      // Requirement 4.5: Test refetchOnWindowFocus is enabled
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Get the query from the cache to check its configuration
      const queries = queryClient.getQueryCache().getAll();
      const flashOfferQuery = queries.find((q) =>
        q.queryKey[0] === 'flash-offers'
      );

      expect(flashOfferQuery).toBeDefined();
      // Check that refetchOnWindowFocus is true
      expect(flashOfferQuery?.options.refetchOnWindowFocus).toBe(true);
    });

    it('should have refetchInterval set to 30 seconds', async () => {
      // Requirement 4.5: Test refetchInterval is 30 seconds
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Get the query from the cache to check its configuration
      const queries = queryClient.getQueryCache().getAll();
      const flashOfferQuery = queries.find((q) =>
        q.queryKey[0] === 'flash-offers'
      );

      expect(flashOfferQuery).toBeDefined();
      // Check that refetchInterval is 30000ms (30 seconds)
      expect(flashOfferQuery?.options.refetchInterval).toBe(30000);
    });
  });

  describe('Functionality Tests', () => {
    it('should return correct data structure', async () => {
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      const { result } = renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1' }),
        { wrapper: createWrapper() }
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.flashOffers).toEqual([]);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check data structure
      expect(result.current.flashOffers).toEqual(mockFlashOffers);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should handle loading states correctly', async () => {
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      const { result } = renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1' }),
        { wrapper: createWrapper() }
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
      const errorMessage = 'Failed to fetch flash offers';
      mockFlashOfferService.getVenueOffers.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.flashOffers).toEqual([]);
    });

    it('should support refetch capability', async () => {
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      const { result } = renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock and set new data
      mockFlashOfferService.getVenueOffers.mockClear();
      const newOffers = [mockFlashOffers[0]];
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: newOffers,
        hasMore: false,
        total: 1,
      });

      // Trigger refetch
      await result.current.refetch();

      // Verify refetch was called
      expect(mockFlashOfferService.getVenueOffers).toHaveBeenCalledTimes(1);
    });

    it('should respect enabled option', () => {
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1', enabled: false }),
        { wrapper: createWrapper() }
      );

      // Should not call the service when disabled
      expect(mockFlashOfferService.getVenueOffers).not.toHaveBeenCalled();
    });

    it('should not fetch when venueId is not provided', () => {
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      renderHook(() => useFlashOffersQuery(), {
        wrapper: createWrapper(),
      });

      // Should not call the service when venueId is missing
      expect(mockFlashOfferService.getVenueOffers).not.toHaveBeenCalled();
    });

    it('should return empty array when no data', async () => {
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: [],
        hasMore: false,
        total: 0,
      });

      const { result } = renderHook(
        () => useFlashOffersQuery({ venueId: 'venue-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.flashOffers).toEqual([]);
      expect(result.current.isError).toBe(false);
    });

    it('should call getVenueOffers with correct parameters', async () => {
      mockFlashOfferService.getVenueOffers.mockResolvedValue({
        offers: mockFlashOffers,
        hasMore: false,
        total: 2,
      });

      renderHook(() => useFlashOffersQuery({ venueId: 'venue-1' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFlashOfferService.getVenueOffers).toHaveBeenCalledWith(
          'venue-1',
          'active'
        );
      });
    });
  });
});
