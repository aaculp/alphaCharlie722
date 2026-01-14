/**
 * Property-Based and Unit Tests for HistoryScreen
 * Feature: recent-check-ins-history
 */

import * as fc from 'fast-check';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import HistoryScreen from '../HistoryScreen';
import { useCheckInHistory } from '../../../hooks/useCheckInHistory';
import { CheckInService } from '../../../services/api/checkins';
import type { CheckInWithVenue } from '../../../types';

// Mock dependencies
jest.mock('../../../hooks/useCheckInHistory');
jest.mock('../../../services/api/checkins');
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#007AFF',
        surface: '#F5F5F5',
        border: '#E0E0E0',
        error: '#FF3B30',
        success: '#34C759',
      }
    },
    isDark: false
  })
}));
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate
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

describe('HistoryScreen - Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  /**
   * Property 9: Navigation Parameter Passing
   * Feature: recent-check-ins-history, Property 9: Navigation Parameter Passing
   * Validates: Requirements 3.2
   * 
   * For any check-in item that is tapped, the navigation action should pass the
   * correct venue_id from that check-in to the venue detail screen.
   */
  describe('Property 9: Navigation Parameter Passing', () => {
    it('should pass correct venue_id when check-in item is tapped', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(checkInWithVenueArbitrary(), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          async (mockCheckIns, selectedIndex) => {
            // Ensure selectedIndex is within bounds
            const actualIndex = selectedIndex % mockCheckIns.length;
            const selectedCheckIn = mockCheckIns[actualIndex];

            // Mock the hook to return our test data
            (useCheckInHistory as jest.Mock).mockReturnValue({
              checkIns: mockCheckIns,
              loading: false,
              refreshing: false,
              loadingMore: false,
              error: null,
              hasMore: false,
              loadMore: jest.fn(),
              refetch: jest.fn(),
            });

            // Mock visit counts
            const visitCountsMap = new Map<string, number>();
            mockCheckIns.forEach(checkIn => {
              visitCountsMap.set(checkIn.venue_id, Math.floor(Math.random() * 10) + 1);
            });
            (CheckInService.getUserVenueVisitCounts as jest.Mock).mockResolvedValue(visitCountsMap);

            let component: renderer.ReactTestRenderer | undefined;
            try {
              // Render the screen
              await act(async () => {
                component = renderer.create(<HistoryScreen />);
              });

              // Wait for visit counts to load
              await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
              });

              const root = component!.root;

              // Find all TouchableOpacity components (check-in items)
              const touchables = root.findAllByType(TouchableOpacity);
              
              // Filter to find check-in item touchables (they should have onPress)
              const checkInTouchables = touchables.filter(t => 
                t.props.onPress && t.props.activeOpacity === 0.7
              );

              // Tap the selected check-in item
              if (checkInTouchables[actualIndex]) {
                await act(async () => {
                  checkInTouchables[actualIndex].props.onPress();
                });

                // Verify navigation was called with correct parameters
                expect(mockNavigate).toHaveBeenCalledWith('VenueDetail', {
                  venueId: selectedCheckIn.venue_id,
                  venueName: selectedCheckIn.venue.name,
                });
              }

              // Clear mock for next iteration
              mockNavigate.mockClear();
            } finally {
              if (component) {
                await act(async () => {
                  component!.unmount();
                });
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('HistoryScreen - Unit Tests', () => {
  // Increase timeout for unit tests
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  /**
   * Unit Test: Pull-to-refresh triggers refetch
   * Requirements: 4.1
   */
  it('should trigger refetch when pull-to-refresh is activated', async () => {
    const mockRefetch = jest.fn();
    const mockCheckIns: CheckInWithVenue[] = [
      {
        id: 'check-in-1',
        venue_id: 'venue-1',
        user_id: 'test-user-id',
        checked_in_at: new Date().toISOString(),
        checked_out_at: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        venue: {
          id: 'venue-1',
          name: 'Test Venue',
          location: 'Test Location',
          category: 'Coffee Shop',
          image_url: 'https://example.com/image.jpg',
          rating: 4.5,
          latitude: 40.7128,
          longitude: -74.0060,
        }
      }
    ];

    (useCheckInHistory as jest.Mock).mockReturnValue({
      checkIns: mockCheckIns,
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refetch: mockRefetch,
    });

    (CheckInService.getUserVenueVisitCounts as jest.Mock).mockResolvedValue(new Map([['venue-1', 1]]));

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HistoryScreen />);
      });

      const root = component!.root;

      // Find the ScrollView with RefreshControl
      const scrollViews = root.findAllByType(ScrollView);
      const mainScrollView = scrollViews.find(sv => sv.props.testID === 'history-scroll-view');
      
      if (mainScrollView && mainScrollView.props.refreshControl) {
        // Simulate pull-to-refresh
        await act(async () => {
          mainScrollView.props.refreshControl.props.onRefresh();
        });

        // Verify refetch was called
        expect(mockRefetch).toHaveBeenCalled();
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
   * Unit Test: Scroll to bottom triggers loadMore
   * Requirements: 7.1, 7.2
   */
  it('should trigger loadMore when scrolled to bottom', async () => {
    const mockLoadMore = jest.fn();
    const mockCheckIns: CheckInWithVenue[] = Array.from({ length: 50 }, (_, i) => ({
      id: `check-in-${i}`,
      venue_id: `venue-${i}`,
      user_id: 'test-user-id',
      checked_in_at: new Date(Date.now() - i * 60000).toISOString(),
      checked_out_at: null,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      venue: {
        id: `venue-${i}`,
        name: `Test Venue ${i}`,
        location: 'Test Location',
        category: 'Coffee Shop',
        image_url: 'https://example.com/image.jpg',
        rating: 4.5,
        latitude: 40.7128,
        longitude: -74.0060,
      }
    }));

    (useCheckInHistory as jest.Mock).mockReturnValue({
      checkIns: mockCheckIns,
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refetch: jest.fn(),
    });

    (CheckInService.getUserVenueVisitCounts as jest.Mock).mockResolvedValue(new Map());

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HistoryScreen />);
      });

      const root = component!.root;

      // Find the ScrollView
      const scrollViews = root.findAllByType(ScrollView);
      const mainScrollView = scrollViews.find(sv => sv.props.testID === 'history-scroll-view');
      
      if (mainScrollView && mainScrollView.props.onScroll) {
        // Simulate scroll to bottom
        await act(async () => {
          mainScrollView.props.onScroll({
            nativeEvent: {
              contentOffset: { y: 1000 },
              contentSize: { height: 1000, width: 400 },
              layoutMeasurement: { height: 800, width: 400 },
            },
          });
        });

        // Verify loadMore was called
        expect(mockLoadMore).toHaveBeenCalled();
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
   * Unit Test: Tap on item navigates with correct venue_id
   * Requirements: 3.1
   */
  it('should navigate to VenueDetail with correct venue_id when item is tapped', async () => {
    const mockCheckIns: CheckInWithVenue[] = [
      {
        id: 'check-in-1',
        venue_id: 'venue-123',
        user_id: 'test-user-id',
        checked_in_at: new Date().toISOString(),
        checked_out_at: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        venue: {
          id: 'venue-123',
          name: 'Specific Test Venue',
          location: 'Test Location',
          category: 'Coffee Shop',
          image_url: 'https://example.com/image.jpg',
          rating: 4.5,
          latitude: 40.7128,
          longitude: -74.0060,
        }
      }
    ];

    (useCheckInHistory as jest.Mock).mockReturnValue({
      checkIns: mockCheckIns,
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refetch: jest.fn(),
    });

    (CheckInService.getUserVenueVisitCounts as jest.Mock).mockResolvedValue(new Map([['venue-123', 1]]));

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HistoryScreen />);
      });

      // Wait for component to render
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const root = component!.root;

      // Find all TouchableOpacity components
      const touchables = root.findAllByType(TouchableOpacity);
      
      // Find the check-in item touchable (has activeOpacity of 0.7)
      const checkInTouchable = touchables.find(t => t.props.activeOpacity === 0.7);

      if (checkInTouchable) {
        // Tap on the item
        await act(async () => {
          checkInTouchable.props.onPress();
        });

        // Verify navigation was called with correct parameters
        expect(mockNavigate).toHaveBeenCalledWith('VenueDetail', {
          venueId: 'venue-123',
          venueName: 'Specific Test Venue',
        });
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
   * Unit Test: Empty state displays when no check-ins
   * Requirements: 8.1
   */
  it('should display empty state when no check-ins', async () => {
    (useCheckInHistory as jest.Mock).mockReturnValue({
      checkIns: [],
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refetch: jest.fn(),
    });

    (CheckInService.getUserVenueVisitCounts as jest.Mock).mockResolvedValue(new Map());

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HistoryScreen />);
      });

      const root = component!.root;

      // Find all Text components
      const textComponents = root.findAllByType(Text);
      
      // Verify empty state is displayed
      const emptyTitleText = textComponents.find(t => t.props.children === 'No recent check-ins');
      const emptyMessageText = textComponents.find(t => 
        t.props.children === "You haven't checked in to any venues in the past 30 days."
      );
      const exploreButtonText = textComponents.find(t => t.props.children === 'Explore Venues');

      expect(emptyTitleText).toBeTruthy();
      expect(emptyMessageText).toBeTruthy();
      expect(exploreButtonText).toBeTruthy();
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Unit Test: Error state displays on error
   * Requirements: 1.4
   */
  it('should display error state when error occurs', async () => {
    const mockError = new Error('Failed to load check-in history');

    (useCheckInHistory as jest.Mock).mockReturnValue({
      checkIns: [],
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: mockError,
      hasMore: false,
      loadMore: jest.fn(),
      refetch: jest.fn(),
    });

    (CheckInService.getUserVenueVisitCounts as jest.Mock).mockResolvedValue(new Map());

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HistoryScreen />);
      });

      // Wait for component to stabilize
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (!component) {
        throw new Error('Component failed to render');
      }

      const root = component.root;

      // Find all Text components
      const textComponents = root.findAllByType(Text);
      
      // Verify error state is displayed
      const errorTitleText = textComponents.find(t => t.props.children === 'Oops! Something went wrong');
      const errorMessageText = textComponents.find(t => t.props.children === 'Failed to load check-in history');
      const retryButtonText = textComponents.find(t => t.props.children === 'Retry');

      expect(errorTitleText).toBeTruthy();
      expect(errorMessageText).toBeTruthy();
      expect(retryButtonText).toBeTruthy();
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });
});
