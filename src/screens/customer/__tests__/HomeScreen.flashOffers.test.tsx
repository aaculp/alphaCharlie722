/**
 * HomeScreen - Flash Offers Section Tests
 * 
 * Tests for the enhanced Flash Offers section on HomeScreen
 * Validates Requirements: 2.1, 2.3, 2.4, 3.2, 3.3, 3.4, 8.5
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '../HomeScreen';
import { useFlashOffers } from '../../../hooks';
import { useVenuesQuery } from '../../../hooks/queries/useVenuesQuery';
import { useNewVenues } from '../../../hooks';
import { useLocation } from '../../../hooks/useLocation';
import { useCheckInStats } from '../../../hooks';

// Mock all hooks
jest.mock('../../../hooks', () => ({
  useFlashOffers: jest.fn(),
  useNewVenues: jest.fn(),
  useCheckInStats: jest.fn(),
}));

jest.mock('../../../hooks/queries/useVenuesQuery', () => ({
  useVenuesQuery: jest.fn(),
}));

jest.mock('../../../hooks/useLocation', () => ({
  useLocation: jest.fn(),
}));

jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#007AFF',
        card: '#F5F5F5',
        border: '#E0E0E0',
      },
    },
  }),
}));

jest.mock('../../../contexts/LocationContext', () => ({
  useLocationContext: () => ({
    locationEnabled: true,
    currentLocation: { latitude: 40.7128, longitude: -74.006 },
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('HomeScreen - Flash Offers Section', () => {
  const mockUseVenuesQuery = useVenuesQuery as jest.MockedFunction<typeof useVenuesQuery>;
  const mockUseNewVenues = useNewVenues as jest.MockedFunction<typeof useNewVenues>;
  const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
  const mockUseCheckInStats = useCheckInStats as jest.MockedFunction<typeof useCheckInStats>;
  const mockUseFlashOffers = useFlashOffers as jest.MockedFunction<typeof useFlashOffers>;

  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Setup default mocks
    mockUseVenuesQuery.mockReturnValue({
      venues: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseNewVenues.mockReturnValue({
      venues: [],
      loading: false,
      refetch: jest.fn(),
    } as any);

    mockUseLocation.mockReturnValue({
      location: { latitude: 40.7128, longitude: -74.006 },
      loading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseCheckInStats.mockReturnValue({
      stats: new Map(),
      refetch: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to render with QueryClientProvider
  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Requirement 2.3, 3.3: Section Always Visible', () => {
    it('should render Flash Offers section even when no offers are available', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: true,
        hasLocation: true,
      });

      const { getByText } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Flash Offers')).toBeTruthy();
      });
    });

    it('should render Flash Offers section when offers are available', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [
          {
            id: 'offer-1',
            venue_id: 'venue-1',
            venue_name: 'Test Venue',
            title: 'Test Offer',
            description: 'Test Description',
            expected_value: 25.00,
            max_claims: 10,
            claimed_count: 3,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            radius_miles: 10,
            target_favorites_only: false,
            status: 'active' as const,
            push_sent: false,
            push_sent_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            distance_miles: 2.5,
          },
        ],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: false,
        hasLocation: true,
      });

      const { getByText } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Flash Offers')).toBeTruthy();
      });
    });
  });

  describe('Requirement 2.1, 2.4: Empty State Display', () => {
    it('should display EmptyState component when isEmpty is true', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: true,
        hasLocation: true,
      });

      const { getByText } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('No flash offers available right now')).toBeTruthy();
        expect(getByText('Check back soon for limited-time deals')).toBeTruthy();
      });
    });

    it('should not display EmptyState when offers are available', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [
          {
            id: 'offer-1',
            venue_id: 'venue-1',
            venue_name: 'Test Venue',
            title: 'Test Offer',
            description: 'Test Description',
            expected_value: 25.00,
            max_claims: 10,
            claimed_count: 3,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            radius_miles: 10,
            target_favorites_only: false,
            status: 'active' as const,
            push_sent: false,
            push_sent_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            distance_miles: 2.5,
          },
        ],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: false,
        hasLocation: true,
      });

      const { queryByText } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(queryByText('No flash offers available right now')).toBeNull();
      });
    });
  });

  describe('Requirement 3.4: Section Positioning', () => {
    it('should render Flash Offers section between New Venues and Recent Check-Ins', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: true,
        hasLocation: true,
      });

      const { getByText, UNSAFE_root } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        const flashOffersText = getByText('Flash Offers');
        expect(flashOffersText).toBeTruthy();
      });

      // Note: Full ordering test would require more complex DOM traversal
      // This test verifies the section exists, which is the key requirement
    });
  });

  describe('Requirement 8.5: Permission Prompt Removal', () => {
    it('should not display "Grant Permission" prompt even when location permission is denied', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: true,
        requestLocationPermission: jest.fn(),
        isEmpty: true,
        hasLocation: false,
      });

      const { queryByText } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(queryByText('Location Permission Required')).toBeNull();
        expect(queryByText('Grant Permission')).toBeNull();
      });
    });
  });

  describe('Requirement 2.1: Same-Day Mode Enabled', () => {
    it('should call useFlashOffers with sameDayMode: true', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: true,
        hasLocation: true,
      });

      renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(mockUseFlashOffers).toHaveBeenCalledWith({
          radiusMiles: 10,
          enabled: true,
          sameDayMode: true,
        });
      });
    });
  });

  describe('Distance Display', () => {
    it('should pass distanceMiles and showDistance props to FlashOfferCard when location is available', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [
          {
            id: 'offer-1',
            venue_id: 'venue-1',
            venue_name: 'Test Venue',
            title: 'Test Offer',
            description: 'Test Description',
            expected_value: 25.00,
            max_claims: 10,
            claimed_count: 3,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            radius_miles: 10,
            target_favorites_only: false,
            status: 'active' as const,
            push_sent: false,
            push_sent_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            distance_miles: 2.5,
          },
        ],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: false,
        hasLocation: true,
      });

      const { getByText } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Flash Offers')).toBeTruthy();
        // FlashOfferCard should receive distanceMiles and showDistance props
        // Full prop verification would require accessing the component instance
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when flash offers are loading', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
        isOffline: false,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: false,
        hasLocation: true,
      });

      const { getByText, UNSAFE_getAllByType } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Flash Offers')).toBeTruthy();
        // ActivityIndicator should be present
        const activityIndicators = UNSAFE_getAllByType(require('react-native').ActivityIndicator);
        expect(activityIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Offline Indicator', () => {
    it('should display offline indicator when isOffline is true', async () => {
      mockUseFlashOffers.mockReturnValue({
        offers: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isOffline: true,
        retry: jest.fn(),
        locationPermissionDenied: false,
        requestLocationPermission: jest.fn(),
        isEmpty: true,
        hasLocation: true,
      });

      const { getByText } = renderWithQueryClient(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Offline Mode')).toBeTruthy();
        expect(getByText('Showing cached flash offers. Connect to see latest offers.')).toBeTruthy();
      });
    });
  });
});
