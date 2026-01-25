/**
 * Unit Tests for Navigation Integration
 * 
 * Feature: react-query-integration
 * 
 * **Validates: Requirements 2.3, 2.4, 8.5**
 * 
 * Tests verify that:
 * - Venue details are prefetched when navigating to detail screen
 * - Venue list queries are invalidated when returning to home
 * - Navigation listener is properly registered and cleaned up
 */

import { QueryClient } from '@tanstack/react-query';
import { setupNavigationSync } from '../navigationSync';
import { queryKeys } from '../queryKeys';
import { VenueService } from '../../services/api/venues';

// Mock the VenueService
jest.mock('../../services/api/venues', () => ({
  VenueService: {
    getVenueById: jest.fn(),
  },
}));

interface MockNavigationRef {
  current: {
    addListener: jest.Mock;
    getCurrentRoute: jest.Mock;
  } | null;
}

describe('Navigation Integration', () => {
  let queryClient: QueryClient;
  let mockNavigationRef: MockNavigationRef;
  let navigationListener: ((event?: any) => void) | null;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset navigation listener
    navigationListener = null;

    // Create mock navigation ref
    mockNavigationRef = {
      current: {
        addListener: jest.fn((event: string, callback: (event?: any) => void) => {
          navigationListener = callback;
          return jest.fn(); // Return unsubscribe function
        }),
        getCurrentRoute: jest.fn(),
      },
    };

    // Mock VenueService
    (VenueService.getVenueById as jest.Mock).mockResolvedValue({
      id: 'venue-123',
      name: 'Test Venue',
      category: 'restaurant',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirement 8.5**
   * 
   * Test that navigation listener is registered when setup is called.
   */
  describe('Navigation Listener Registration', () => {
    it('should register navigation state listener when setup is called', () => {
      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      expect(mockNavigationRef.current?.addListener).toHaveBeenCalledWith(
        'state',
        expect.any(Function)
      );
    });

    it('should return cleanup function that removes listener', () => {
      const cleanup = setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      expect(typeof cleanup).toBe('function');

      // Verify cleanup can be called without errors
      expect(() => cleanup()).not.toThrow();
    });

    it('should call unsubscribe when cleanup is invoked', () => {
      const mockUnsubscribe = jest.fn();
      mockNavigationRef.current!.addListener = jest.fn(() => mockUnsubscribe);

      const cleanup = setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      cleanup();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should not throw error if cleanup is called multiple times', () => {
      const cleanup = setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      expect(() => {
        cleanup();
        cleanup();
        cleanup();
      }).not.toThrow();
    });
  });

  /**
   * **Validates: Requirement 2.3**
   * 
   * Test that venue details are prefetched when navigating to VenueDetail screen.
   */
  describe('Prefetching on Navigation to Detail Screen', () => {
    it('should prefetch venue details when navigating to VenueDetail', async () => {
      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Simulate navigation to VenueDetail
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });

      // Trigger navigation state change
      if (navigationListener) {
        navigationListener();
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify prefetchQuery was called with correct parameters
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.detail('venue-123'),
        queryFn: expect.any(Function),
        staleTime: 30000,
      });

      // Verify VenueService was called
      expect(VenueService.getVenueById).toHaveBeenCalledWith('venue-123');
    });

    it('should not prefetch if venueId is missing from params', async () => {
      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Simulate navigation to VenueDetail without venueId
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: {},
      });

      // Trigger navigation state change
      if (navigationListener) {
        navigationListener();
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify prefetchQuery was NOT called
      expect(prefetchSpy).not.toHaveBeenCalled();
      expect(VenueService.getVenueById).not.toHaveBeenCalled();
    });

    it('should not prefetch when navigating to other screens', async () => {
      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Simulate navigation to HomeList
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });

      // Trigger navigation state change
      if (navigationListener) {
        navigationListener();
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify prefetchQuery was NOT called
      expect(prefetchSpy).not.toHaveBeenCalled();
    });

    it('should use correct staleTime for prefetched data', async () => {
      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Simulate navigation to VenueDetail
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-456' },
      });

      // Trigger navigation state change
      if (navigationListener) {
        navigationListener();
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify staleTime is 30 seconds
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          staleTime: 30000,
        })
      );
    });
  });

  /**
   * **Validates: Requirement 2.4**
   * 
   * Test that venue list queries are invalidated when returning from VenueDetail to Home.
   */
  describe('Invalidation on Navigation Back to Home', () => {
    it('should invalidate venue list queries when returning from VenueDetail to HomeList', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // First navigation: to VenueDetail
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });

      if (navigationListener) {
        navigationListener();
      }

      // Second navigation: back to HomeList
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });

      if (navigationListener) {
        navigationListener();
      }

      // Verify invalidateQueries was called with venue lists key
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.lists(),
      });
    });

    it('should invalidate venue list queries when returning from VenueDetail to SearchList', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // First navigation: to VenueDetail
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });

      if (navigationListener) {
        navigationListener();
      }

      // Second navigation: back to SearchList
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'SearchList',
        params: {},
      });

      if (navigationListener) {
        navigationListener();
      }

      // Verify invalidateQueries was called with venue lists key
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.lists(),
      });
    });

    it('should not invalidate when navigating from VenueDetail to other screens', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // First navigation: to VenueDetail
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });

      if (navigationListener) {
        navigationListener();
      }

      // Second navigation: to Profile (not a list screen)
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'ProfileMain',
        params: {},
      });

      if (navigationListener) {
        navigationListener();
      }

      // Verify invalidateQueries was NOT called
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('should not invalidate when navigating between list screens', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // First navigation: to HomeList
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });

      if (navigationListener) {
        navigationListener();
      }

      // Second navigation: to SearchList
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'SearchList',
        params: {},
      });

      if (navigationListener) {
        navigationListener();
      }

      // Verify invalidateQueries was NOT called
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('should track previous route correctly across multiple navigations', () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Navigation 1: HomeList
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });
      if (navigationListener) navigationListener();

      // Navigation 2: VenueDetail
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });
      if (navigationListener) navigationListener();

      // Navigation 3: Another VenueDetail
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-456' },
      });
      if (navigationListener) navigationListener();

      // Navigation 4: Back to HomeList
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });
      if (navigationListener) navigationListener();

      // Should invalidate only once (when returning from VenueDetail to HomeList)
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.lists(),
      });
    });
  });

  /**
   * Test edge cases and error handling
   */
  describe('Edge Cases and Error Handling', () => {
    it('should handle null navigation ref gracefully', () => {
      const nullRef = { current: null };

      expect(() => {
        setupNavigationSync({
          queryClient,
          navigationRef: nullRef as any,
        });
      }).not.toThrow();
    });

    it('should handle getCurrentRoute returning null', () => {
      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Mock getCurrentRoute to return null
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue(null);

      // Trigger navigation state change
      expect(() => {
        if (navigationListener) {
          navigationListener();
        }
      }).not.toThrow();
    });

    it('should handle missing params in route', () => {
      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Mock route with undefined params
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: undefined,
      });

      // Trigger navigation state change
      expect(() => {
        if (navigationListener) {
          navigationListener();
        }
      }).not.toThrow();

      // Should not attempt to prefetch
      expect(prefetchSpy).not.toHaveBeenCalled();
    });

    it('should handle VenueService errors gracefully', async () => {
      (VenueService.getVenueById as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Simulate navigation to VenueDetail
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });

      // Should not throw error
      expect(() => {
        if (navigationListener) {
          navigationListener();
        }
      }).not.toThrow();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Prefetch should still be attempted (error handling is in React Query)
      expect(VenueService.getVenueById).toHaveBeenCalled();
    });
  });

  /**
   * Test complete navigation flow
   */
  describe('Complete Navigation Flow', () => {
    it('should handle complete flow: Home → VenueDetail → Home', async () => {
      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery');
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      setupNavigationSync({
        queryClient,
        navigationRef: mockNavigationRef as any,
      });

      // Step 1: Start at HomeList
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });
      if (navigationListener) navigationListener();

      // Step 2: Navigate to VenueDetail (should prefetch)
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'VenueDetail',
        params: { venueId: 'venue-123' },
      });
      if (navigationListener) navigationListener();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: queryKeys.venues.detail('venue-123'),
        })
      );

      // Step 3: Navigate back to HomeList (should invalidate)
      mockNavigationRef.current!.getCurrentRoute.mockReturnValue({
        name: 'HomeList',
        params: {},
      });
      if (navigationListener) navigationListener();

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.venues.lists(),
      });
    });
  });
});
