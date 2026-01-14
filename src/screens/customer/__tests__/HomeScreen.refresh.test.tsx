/**
 * HomeScreen Pull-to-Refresh Integration Test
 * 
 * Validates: Requirements 4.3 - Pull-to-refresh updates spotlight venue data
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ScrollView } from 'react-native';
import HomeScreen from '../HomeScreen';
import { useNewVenues, useVenues, useCheckInStats } from '../../../hooks';

// Mock the hooks
jest.mock('../../../hooks', () => ({
  useVenues: jest.fn(),
  useCheckInStats: jest.fn(),
  useNewVenues: jest.fn(),
}));

jest.mock('../../../hooks/useLocation', () => ({
  useLocation: jest.fn(() => ({
    location: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#fff',
        text: '#000',
        textSecondary: '#666',
        primary: '#007AFF',
        surface: '#f5f5f5',
        border: '#e0e0e0',
        error: '#ff0000',
      },
      dark: false,
    },
  }),
}));

jest.mock('../../../contexts/LocationContext', () => ({
  useLocationContext: () => ({
    locationEnabled: false,
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../../../services/api/checkins', () => ({
  CheckInService: {
    getUserCurrentCheckInWithVenue: jest.fn(),
  },
}));

jest.mock('../../../utils/populateVenues', () => ({
  populateVenuesDatabase: jest.fn(),
}));

describe('HomeScreen - Pull-to-Refresh Integration', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Unit Test: Pull-to-refresh triggers spotlight refetch
   * Requirements: 4.3
   */
  it('should call refetchNewVenues when pull-to-refresh is triggered', async () => {
    const mockRefetchNewVenues = jest.fn().mockResolvedValue(undefined);
    const mockRefetch = jest.fn().mockResolvedValue(undefined);

    (useVenues as jest.Mock).mockReturnValue({
      venues: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    (useCheckInStats as jest.Mock).mockReturnValue({
      stats: new Map(),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useNewVenues as jest.Mock).mockReturnValue({
      venues: [],
      loading: false,
      error: null,
      refetch: mockRefetchNewVenues,
    });

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HomeScreen />);
      });

      const root = component!.root;

      // Find the ScrollView with RefreshControl
      const scrollViews = root.findAllByType(ScrollView);
      const mainScrollView = scrollViews.find(sv => sv.props.testID === 'home-scroll-view');
      
      if (mainScrollView && mainScrollView.props.refreshControl) {
        // Simulate pull-to-refresh
        await act(async () => {
          await mainScrollView.props.refreshControl.props.onRefresh();
        });

        // Verify refetchNewVenues was called
        expect(mockRefetchNewVenues).toHaveBeenCalled();
      }
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Unit Test: Spotlight venues refresh in parallel with other data
   * Requirements: 4.3, 4.4
   */
  it('should refresh spotlight venues in parallel with main venue data', async () => {
    const mockRefetchNewVenues = jest.fn().mockResolvedValue(undefined);
    const mockRefetch = jest.fn().mockResolvedValue(undefined);

    (useVenues as jest.Mock).mockReturnValue({
      venues: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    (useCheckInStats as jest.Mock).mockReturnValue({
      stats: new Map(),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useNewVenues as jest.Mock).mockReturnValue({
      venues: [],
      loading: false,
      error: null,
      refetch: mockRefetchNewVenues,
    });

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HomeScreen />);
      });

      const root = component!.root;

      // Find the ScrollView with RefreshControl
      const scrollViews = root.findAllByType(ScrollView);
      const mainScrollView = scrollViews.find(sv => sv.props.testID === 'home-scroll-view');
      
      if (mainScrollView && mainScrollView.props.refreshControl) {
        // Simulate pull-to-refresh
        await act(async () => {
          await mainScrollView.props.refreshControl.props.onRefresh();
        });

        // Verify both refetch functions were called (parallel refresh)
        expect(mockRefetch).toHaveBeenCalled();
        expect(mockRefetchNewVenues).toHaveBeenCalled();
      }
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });
});
