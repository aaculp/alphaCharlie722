/**
 * HomeScreen Swipe Integration Test
 * 
 * Validates: Requirements 1.3, 11.5 - WideVenueCard swipe integration in HomeScreen
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import HomeScreen from '../HomeScreen';
import { WideVenueCard } from '../../../components/ui';
import { useNewVenues, useVenues, useCheckInStats } from '../../../hooks';
import type { Venue } from '../../../types';

// Extend the global Reanimated mock to include useAnimatedProps
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const ScrollView = require('react-native').ScrollView;
  return {
    default: {
      call: () => {},
    },
    View,
    Text: require('react-native').Text,
    Image: require('react-native').Image,
    ScrollView,
    Animated: {
      View,
      Text: require('react-native').Text,
      ScrollView,
      createAnimatedComponent: (component) => component,
    },
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      quad: (t) => t,
      cubic: (t) => t,
      bezier: () => (t) => t,
    },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (callback) => callback(),
    useAnimatedProps: (callback) => callback(),
    withTiming: (value) => value,
    withSpring: (value) => value,
    withDecay: (value) => value,
    withRepeat: (value) => value,
    withSequence: (...values) => values[0],
    withDelay: (delay, value) => value,
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    interpolate: (value, input, output) => output[0],
    Extrapolate: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity',
    },
    cancelAnimation: () => {},
    measure: () => ({}),
    scrollTo: () => {},
  };
});

// Mock the hooks
jest.mock('../../../hooks', () => ({
  useVenues: jest.fn(),
  useCheckInStats: jest.fn(),
  useNewVenues: jest.fn(),
}));

// Mock gesture handler with proper Pan gesture methods
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  const mockGesture = {
    enabled: jest.fn().mockReturnThis(),
    onStart: jest.fn().mockReturnThis(),
    onUpdate: jest.fn().mockReturnThis(),
    onEnd: jest.fn().mockReturnThis(),
    onFinalize: jest.fn().mockReturnThis(),
  };
  return {
    GestureDetector: View,
    Gesture: {
      Pan: jest.fn(() => mockGesture),
      Tap: jest.fn(() => mockGesture),
    },
  };
});

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
    isDark: false,
  }),
}));

jest.mock('../../../contexts/LocationContext', () => ({
  useLocationContext: () => ({
    locationEnabled: false,
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../../../services/api/checkins', () => ({
  CheckInService: {
    getUserCurrentCheckInWithVenue: jest.fn().mockResolvedValue(null),
    checkIn: jest.fn().mockResolvedValue({ id: 'check-in-id' }),
    checkOut: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../utils/populateVenues', () => ({
  populateVenuesDatabase: jest.fn(),
}));

const mockVenue: Venue = {
  id: 'venue-1',
  name: 'Test Venue',
  location: '123 Test St',
  category: 'Bars',
  rating: 4.5,
  review_count: 100,
  image_url: 'https://example.com/image.jpg',
  latitude: 40.7128,
  longitude: -74.0060,
  max_capacity: 100,
  price_range: '$$',
  description: 'A test venue',
};

describe('HomeScreen - Swipe Integration', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Unit Test: WideVenueCard renders with enableSwipe prop
   * Requirements: 1.3
   */
  it('should render WideVenueCard with enableSwipe={true}', async () => {
    (useVenues as jest.Mock).mockReturnValue({
      venues: [mockVenue],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useCheckInStats as jest.Mock).mockReturnValue({
      stats: new Map([['venue-1', { active_checkins: 5 }]]),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useNewVenues as jest.Mock).mockReturnValue({
      venues: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HomeScreen />);
      });

      const root = component!.root;

      // Find WideVenueCard components
      const venueCards = root.findAllByType(WideVenueCard);
      expect(venueCards.length).toBeGreaterThan(0);

      // Verify enableSwipe prop is set to true
      const firstCard = venueCards[0];
      expect(firstCard.props.enableSwipe).toBe(true);
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Unit Test: WideVenueCard receives swipe handlers
   * Requirements: 11.5
   */
  it('should pass onSwipeCheckIn and onSwipeCheckOut handlers to WideVenueCard', async () => {
    (useVenues as jest.Mock).mockReturnValue({
      venues: [mockVenue],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useCheckInStats as jest.Mock).mockReturnValue({
      stats: new Map([['venue-1', { active_checkins: 5 }]]),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useNewVenues as jest.Mock).mockReturnValue({
      venues: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HomeScreen />);
      });

      const root = component!.root;

      // Find WideVenueCard components
      const venueCards = root.findAllByType(WideVenueCard);
      expect(venueCards.length).toBeGreaterThan(0);

      // Verify swipe handlers are provided
      const firstCard = venueCards[0];
      expect(firstCard.props.onSwipeCheckIn).toBeDefined();
      expect(typeof firstCard.props.onSwipeCheckIn).toBe('function');
      expect(firstCard.props.onSwipeCheckOut).toBeDefined();
      expect(typeof firstCard.props.onSwipeCheckOut).toBe('function');
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Unit Test: WideVenueCard receives scrollEnabled shared value
   * Requirements: 11.5
   */
  it('should pass scrollEnabled shared value to WideVenueCard for gesture conflict resolution', async () => {
    (useVenues as jest.Mock).mockReturnValue({
      venues: [mockVenue],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useCheckInStats as jest.Mock).mockReturnValue({
      stats: new Map([['venue-1', { active_checkins: 5 }]]),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useNewVenues as jest.Mock).mockReturnValue({
      venues: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HomeScreen />);
      });

      const root = component!.root;

      // Find WideVenueCard components
      const venueCards = root.findAllByType(WideVenueCard);
      expect(venueCards.length).toBeGreaterThan(0);

      // Verify scrollEnabled shared value is provided
      const firstCard = venueCards[0];
      expect(firstCard.props.scrollEnabled).toBeDefined();
      expect(firstCard.props.scrollEnabled).toHaveProperty('value');
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });

  /**
   * Unit Test: All required props are passed to WideVenueCard
   * Requirements: 1.3, 11.5
   */
  it('should pass all required props to WideVenueCard including swipe props', async () => {
    (useVenues as jest.Mock).mockReturnValue({
      venues: [mockVenue],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useCheckInStats as jest.Mock).mockReturnValue({
      stats: new Map([['venue-1', { active_checkins: 5 }]]),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useNewVenues as jest.Mock).mockReturnValue({
      venues: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    let component: renderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        component = renderer.create(<HomeScreen />);
      });

      const root = component!.root;

      // Find WideVenueCard components
      const venueCards = root.findAllByType(WideVenueCard);
      expect(venueCards.length).toBeGreaterThan(0);

      // Verify all required props are present
      const firstCard = venueCards[0];
      expect(firstCard.props.venue).toBeDefined();
      expect(firstCard.props.checkInCount).toBeDefined();
      expect(firstCard.props.onPress).toBeDefined();
      expect(firstCard.props.customerCountVariant).toBe('traffic');
      expect(firstCard.props.engagementChipVariant).toBe('traffic');
      expect(firstCard.props.onCheckInChange).toBeDefined();
      expect(firstCard.props.isUserCheckedIn).toBeDefined();
      
      // Verify swipe-specific props
      expect(firstCard.props.enableSwipe).toBe(true);
      expect(firstCard.props.onSwipeCheckIn).toBeDefined();
      expect(firstCard.props.onSwipeCheckOut).toBeDefined();
      expect(firstCard.props.scrollEnabled).toBeDefined();
    } finally {
      if (component) {
        await act(async () => {
          component!.unmount();
        });
      }
    }
  });
});
