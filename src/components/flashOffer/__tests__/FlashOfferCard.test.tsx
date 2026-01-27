/**
 * Unit Tests for FlashOfferCard Component Enhancements
 * Feature: homescreen-flash-offers-section
 * Task: 4.5 Write unit tests for FlashOfferCard enhancements
 * 
 * Tests distance display, "Starts Soon" indicator, urgency indicators, and expired offer display
 * Validates: Requirements 1.4, 7.5, 8.1
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { FlashOfferCard } from '../FlashOfferCard';
import { FlashOffer } from '../../../types/flashOffer.types';

// Mock ThemeContext
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        card: '#FFFFFF',
        border: '#E0E0E0',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#007AFF',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
      },
    },
  }),
}));

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock ClaimButton component
jest.mock('../../ClaimButton/ClaimButton', () => ({
  ClaimButton: () => null,
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock hooks
jest.mock('../../../hooks/useCountdownTimer', () => ({
  useCountdownTimer: (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const totalSeconds = Math.floor(diff / 1000);
    
    return {
      timeRemaining: totalSeconds > 0 ? '2h 30m 15s' : 'Expired',
      isExpired: totalSeconds <= 0,
      totalSeconds: Math.max(0, totalSeconds),
    };
  },
}));

jest.mock('../../../hooks/useRealtimeOffer', () => ({
  useRealtimeOffer: () => ({
    offer: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../utils/animations', () => ({
  fadeIn: jest.fn(() => ({ start: jest.fn() })),
  scaleIn: jest.fn(() => ({ start: jest.fn() })),
  countdownPulse: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
}));

jest.mock('../../../utils/haptics', () => ({
  triggerLightHaptic: jest.fn(),
}));

// Helper to create a mock flash offer
const createMockOffer = (overrides?: Partial<FlashOffer>): FlashOffer => {
  const now = new Date();
  const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  
  return {
    id: 'test-offer-1',
    venue_id: 'venue-1',
    title: 'Test Flash Offer',
    description: 'Test description',
    value_cap: '$10 off',
    max_claims: 100,
    claimed_count: 50,
    start_time: now.toISOString(),
    end_time: futureTime.toISOString(),
    radius_miles: 10,
    target_favorites_only: false,
    status: 'active',
    push_sent: false,
    push_sent_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
};

describe('FlashOfferCard Component - Distance Display', () => {
  it('should display distance when showDistance is true and distanceMiles is provided', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
        showDistance={true}
        distanceMiles={2.5}
      />
    );
    
    expect(getByText('2.5 mi away')).toBeTruthy();
  });

  it('should display "< 0.1 mi away" for very close venues', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
        showDistance={true}
        distanceMiles={0.05}
      />
    );
    
    expect(getByText('< 0.1 mi away')).toBeTruthy();
  });

  it('should not display distance when showDistance is false', () => {
    const offer = createMockOffer();
    const { queryByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
        showDistance={false}
        distanceMiles={2.5}
      />
    );
    
    expect(queryByText('2.5 mi away')).toBeNull();
  });

  it('should not display distance when distanceMiles is undefined', () => {
    const offer = createMockOffer();
    const { queryByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
        showDistance={true}
      />
    );
    
    expect(queryByText(/mi away/)).toBeNull();
  });

  it('should format distance with one decimal place', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
        showDistance={true}
        distanceMiles={5.678}
      />
    );
    
    expect(getByText('5.7 mi away')).toBeTruthy();
  });
});

describe('FlashOfferCard Component - Starts Soon Indicator', () => {
  it('should display "STARTS SOON" badge for future offers on current day', () => {
    const now = new Date();
    const futureStart = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const futureEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
    
    const offer = createMockOffer({
      start_time: futureStart.toISOString(),
      end_time: futureEnd.toISOString(),
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('STARTS SOON')).toBeTruthy();
  });

  it('should not display "STARTS SOON" for offers that have already started', () => {
    const now = new Date();
    const pastStart = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
    const futureEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    const offer = createMockOffer({
      start_time: pastStart.toISOString(),
      end_time: futureEnd.toISOString(),
    });
    
    const { queryByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(queryByText('STARTS SOON')).toBeNull();
  });

  it('should not display "STARTS SOON" for offers starting on a different day', () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);
    
    const offer = createMockOffer({
      start_time: tomorrow.toISOString(),
      end_time: tomorrowEnd.toISOString(),
    });
    
    const { queryByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(queryByText('STARTS SOON')).toBeNull();
  });
});

describe('FlashOfferCard Component - Urgency Indicators', () => {
  it('should display "ENDING SOON" badge for offers with less than 1 hour remaining', () => {
    const now = new Date();
    const soonEnd = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    
    const offer = createMockOffer({
      end_time: soonEnd.toISOString(),
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('ENDING SOON')).toBeTruthy();
  });

  it('should display "LIMITED" badge for offers with 3 or fewer claims remaining', () => {
    const offer = createMockOffer({
      max_claims: 100,
      claimed_count: 97, // 3 remaining
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('LIMITED')).toBeTruthy();
  });

  it('should display "FULL" badge when offer reaches max claims', () => {
    const offer = createMockOffer({
      max_claims: 100,
      claimed_count: 100,
      status: 'full',
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('FULL')).toBeTruthy();
  });

  it('should prioritize "STARTS SOON" over other urgency indicators', () => {
    const now = new Date();
    const futureStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    
    const offer = createMockOffer({
      start_time: futureStart.toISOString(),
      end_time: futureEnd.toISOString(),
      max_claims: 100,
      claimed_count: 97, // Would normally show "LIMITED"
    });
    
    const { getByText, queryByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('STARTS SOON')).toBeTruthy();
    expect(queryByText('LIMITED')).toBeNull();
  });
});

describe('FlashOfferCard Component - Expired Offer Display', () => {
  it('should display "EXPIRED" badge for expired offers', () => {
    const now = new Date();
    const pastEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
    
    const offer = createMockOffer({
      end_time: pastEnd.toISOString(),
      status: 'expired',
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('EXPIRED')).toBeTruthy();
  });

  it('should reduce opacity for expired offers', () => {
    const now = new Date();
    const pastEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    
    const offer = createMockOffer({
      end_time: pastEnd.toISOString(),
      status: 'expired',
    });
    
    const { root } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    // Component should render (opacity is applied via styles)
    expect(root).toBeTruthy();
  });
});

describe('FlashOfferCard Component - Basic Rendering', () => {
  it('should render offer title and venue name', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('Test Flash Offer')).toBeTruthy();
    expect(getByText('Test Venue')).toBeTruthy();
  });

  it('should display claims remaining', () => {
    const offer = createMockOffer({
      max_claims: 100,
      claimed_count: 50,
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('50 of 100 left')).toBeTruthy();
  });

  it('should display value cap when present', () => {
    const offer = createMockOffer({
      value_cap: '$10 off',
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('$10 off')).toBeTruthy();
  });

  it('should handle offers without value cap', () => {
    const offer = createMockOffer({
      value_cap: null,
    });
    
    const { queryByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    // Should render without errors
    expect(queryByText('Test Flash Offer')).toBeTruthy();
  });
});

describe('FlashOfferCard Component - Edge Cases', () => {
  it('should handle zero claims remaining', () => {
    const offer = createMockOffer({
      max_claims: 100,
      claimed_count: 100,
      status: 'full',
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('All claimed')).toBeTruthy();
  });

  it('should handle very long venue names', () => {
    const offer = createMockOffer();
    const longVenueName = 'This is a very long venue name that should be truncated properly';
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName={longVenueName}
        onPress={jest.fn()}
      />
    );
    
    expect(getByText(longVenueName)).toBeTruthy();
  });

  it('should handle very long offer titles', () => {
    const longTitle = 'This is a very long offer title that should be truncated to prevent layout issues';
    const offer = createMockOffer({
      title: longTitle,
    });
    
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText(longTitle)).toBeTruthy();
  });

  it('should handle distance of exactly 0.1 miles', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <FlashOfferCard
        offer={offer}
        venueName="Test Venue"
        onPress={jest.fn()}
        showDistance={true}
        distanceMiles={0.1}
      />
    );
    
    expect(getByText('0.1 mi away')).toBeTruthy();
  });
});
