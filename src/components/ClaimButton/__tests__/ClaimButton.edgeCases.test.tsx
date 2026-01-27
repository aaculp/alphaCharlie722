/**
 * Integration Tests for ClaimButton Edge Cases
 * Feature: venue-detail-claim-button
 * Task: 17.1 Write integration tests for edge cases
 * 
 * Tests edge case scenarios:
 * - Offer expiration while viewing
 * - Check-in status change while viewing
 * - Timeout errors with retry option
 * - Race condition when offer becomes full during claim
 * 
 * Validates: Requirements 5.5, 8.1, 8.2, 8.4
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ClaimButton } from '../ClaimButton';
import { FlashOffer } from '../../../types/flashOffer.types';
import { FlashOfferClaim } from '../../../types/flashOfferClaim.types';

// Mock ThemeContext
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        success: '#34C759',
        textSecondary: '#666666',
        border: '#E0E0E0',
        error: '#FF3B30',
        warning: '#FF9500',
      },
    },
  }),
}));

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  }),
}));

// Mock useClaimFlashOfferMutation
let mockMutate = jest.fn();
let mockIsPending = false;
jest.mock('../../../hooks/mutations/useClaimFlashOfferMutation', () => ({
  useClaimFlashOfferMutation: jest.fn((callbacks) => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  })),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock haptics
jest.mock('../../../utils/haptics', () => ({
  triggerSuccessHaptic: jest.fn(),
}));

// Mock ClaimFeedbackModal
jest.mock('../../ClaimFeedbackModal/ClaimFeedbackModal', () => 'ClaimFeedbackModal');

// Helper to create a mock flash offer
const createMockOffer = (overrides?: Partial<FlashOffer>): FlashOffer => {
  const now = new Date();
  const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
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

// Helper to create a mock claim
const createMockClaim = (overrides?: Partial<FlashOfferClaim>): FlashOfferClaim => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    id: 'claim-1',
    offer_id: 'test-offer-1',
    user_id: 'user-1',
    token: '123456',
    status: 'active',
    expires_at: expiresAt.toISOString(),
    redeemed_at: null,
    redeemed_by_user_id: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
};

// Reset mocks before each test
beforeEach(() => {
  mockMutate = jest.fn();
  mockIsPending = false;
  const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
  useClaimFlashOfferMutation.mockImplementation((callbacks) => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }));
  mockNavigate.mockClear();
});

describe('ClaimButton Edge Cases - Offer Expiration While Viewing', () => {
  /**
   * Requirement 8.2: When an offer expires while the user is viewing it,
   * the system shall update the card to show expired status
   */
  it('should update button state when offer expires while viewing', () => {
    const offer = createMockOffer({ status: 'active' });
    
    // Render with active offer
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Initially should show "Claim Offer"
    expect(getByText('Claim Offer')).toBeTruthy();
    
    // Simulate offer expiring (prop update from parent)
    const expiredOffer = { ...offer, status: 'expired' as const };
    rerender(
      <ClaimButton
        offer={expiredOffer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Should now show "Expired"
    expect(getByText('Expired')).toBeTruthy();
  });

  it('should disable button when offer expires', () => {
    const offer = createMockOffer({ status: 'active' });
    
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Simulate offer expiring
    const expiredOffer = { ...offer, status: 'expired' as const };
    rerender(
      <ClaimButton
        offer={expiredOffer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Button should be disabled
    const button = getByText('Expired');
    expect(button).toBeTruthy();
    
    // Pressing should not trigger mutation
    fireEvent.press(button);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should update button state when offer is cancelled while viewing', () => {
    const offer = createMockOffer({ status: 'active' });
    
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Initially should show "Claim Offer"
    expect(getByText('Claim Offer')).toBeTruthy();
    
    // Simulate offer being cancelled
    const cancelledOffer = { ...offer, status: 'cancelled' as const };
    rerender(
      <ClaimButton
        offer={cancelledOffer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Should now show "Expired" (cancelled maps to expired state)
    expect(getByText('Expired')).toBeTruthy();
  });

  it('should update button state when offer becomes full while viewing', () => {
    const offer = createMockOffer({
      status: 'active',
      max_claims: 100,
      claimed_count: 50,
    });
    
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Initially should show "Claim Offer"
    expect(getByText('Claim Offer')).toBeTruthy();
    
    // Simulate offer becoming full
    const fullOffer = {
      ...offer,
      status: 'full' as const,
      claimed_count: 100,
    };
    rerender(
      <ClaimButton
        offer={fullOffer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Should now show "Offer Full"
    expect(getByText('Offer Full')).toBeTruthy();
  });
});

describe('ClaimButton Edge Cases - Check-in Status Change While Viewing', () => {
  /**
   * Requirement 8.1: When the user's check-in status changes while viewing the page,
   * the system shall update the button state accordingly
   */
  it('should update button state when user checks in while viewing', () => {
    const offer = createMockOffer({ status: 'active' });
    
    // Render with user not checked in
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    // Initially should show "Check In to Claim"
    expect(getByText('Check In to Claim')).toBeTruthy();
    
    // Simulate user checking in (prop update from parent)
    rerender(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Should now show "Claim Offer"
    expect(getByText('Claim Offer')).toBeTruthy();
  });

  it('should enable claiming when user checks in', () => {
    const offer = createMockOffer({ status: 'active' });
    
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    // Simulate user checking in
    rerender(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Should be able to claim now
    const button = getByText('Claim Offer');
    fireEvent.press(button);
    
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith({
      offerId: offer.id,
      userId: 'test-user-id',
      venueId: offer.venue_id,
    });
  });

  it('should update button state when user checks out while viewing', () => {
    const offer = createMockOffer({ status: 'active' });
    
    // Render with user checked in
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Initially should show "Claim Offer"
    expect(getByText('Claim Offer')).toBeTruthy();
    
    // Simulate user checking out
    rerender(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    // Should now show "Check In to Claim"
    expect(getByText('Check In to Claim')).toBeTruthy();
  });

  it('should disable claiming when user checks out', () => {
    const offer = createMockOffer({ status: 'active' });
    
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Simulate user checking out
    rerender(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    // Should not be able to claim
    const button = getByText('Check In to Claim');
    
    // Pressing should not trigger mutation (no onNavigate provided)
    fireEvent.press(button);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should maintain claimed state even if user checks out', () => {
    const offer = createMockOffer({ status: 'active' });
    const claim = createMockClaim();
    
    // Render with user checked in and claimed
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={claim}
        isCheckedIn={true}
      />
    );
    
    // Initially should show "View Claim"
    expect(getByText('View Claim')).toBeTruthy();
    
    // Simulate user checking out
    rerender(
      <ClaimButton
        offer={offer}
        userClaim={claim}
        isCheckedIn={false}
      />
    );
    
    // Should still show "View Claim" (claimed state has priority)
    expect(getByText('View Claim')).toBeTruthy();
  });
});

describe('ClaimButton Edge Cases - Timeout Errors', () => {
  /**
   * Requirement 8.4: When the claim operation times out,
   * the system shall display a timeout message and allow retry
   */
  it('should display timeout error message with check claims option', () => {
    const offer = createMockOffer();
    const timeoutError = new Error('Request timeout');
    
    // Mock mutation to trigger timeout error
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(timeoutError);
      },
      isPending: false,
    }));
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Should display timeout error message
    expect(getByText('Request timed out. Your claim may still be processing. Check My Claims or try again.')).toBeTruthy();
  });

  it('should show check claims button for timeout errors', () => {
    const offer = createMockOffer();
    const timeoutError = new Error('Operation timed out');
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(timeoutError);
      },
      isPending: false,
    }));
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Should show "Check Claims" button
    expect(getByText('Check Claims')).toBeTruthy();
  });

  it('should allow dismissing timeout error', () => {
    const offer = createMockOffer();
    const timeoutError = new Error('Request timeout');
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(timeoutError);
      },
      isPending: false,
    }));
    
    const { getByText, queryByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Error should be displayed
    expect(getByText('Request timed out. Your claim may still be processing. Check My Claims or try again.')).toBeTruthy();
    
    // Dismiss error
    fireEvent.press(getByText('Dismiss'));
    
    // Error should be cleared
    expect(queryByText('Request timed out. Your claim may still be processing. Check My Claims or try again.')).toBeNull();
  });

  it('should maintain claimable state after timeout error', () => {
    const offer = createMockOffer();
    const timeoutError = new Error('Request timeout');
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(timeoutError);
      },
      isPending: false,
    }));
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Button should still show "Claim Offer" (not changed to claimed)
    expect(getByText('Claim Offer')).toBeTruthy();
  });
});

describe('ClaimButton Edge Cases - Race Condition Errors', () => {
  /**
   * Requirement 5.5: When multiple users claim an offer simultaneously,
   * the system shall handle race conditions using the atomic claim function
   * 
   * Requirement 8.4: When an offer becomes full during the claim process,
   * the system shall display an appropriate error message
   */
  it('should display race condition error when offer becomes full during claim', () => {
    const offer = createMockOffer();
    const raceError = new Error('Race condition detected');
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(raceError);
      },
      isPending: false,
    }));
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Should display race condition error message
    expect(getByText('This offer was just claimed by someone else and is now full')).toBeTruthy();
  });

  it('should display race condition error for concurrent maximum claims', () => {
    const offer = createMockOffer();
    const raceError = new Error('Maximum claims reached due to concurrent requests');
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(raceError);
      },
      isPending: false,
    }));
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Should display race condition error message
    expect(getByText('This offer was just claimed by someone else and is now full')).toBeTruthy();
  });

  it('should only show dismiss button for race condition errors', () => {
    const offer = createMockOffer();
    const raceError = new Error('Race condition detected');
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(raceError);
      },
      isPending: false,
    }));
    
    const { getByText, queryByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Should show dismiss button
    expect(getByText('Dismiss')).toBeTruthy();
    
    // Should NOT show retry button (race condition is not retryable)
    expect(queryByText('Retry')).toBeNull();
  });

  it('should allow dismissing race condition error', () => {
    const offer = createMockOffer();
    const raceError = new Error('Race condition detected');
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(raceError);
      },
      isPending: false,
    }));
    
    const { getByText, queryByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Error should be displayed
    expect(getByText('This offer was just claimed by someone else and is now full')).toBeTruthy();
    
    // Dismiss error
    fireEvent.press(getByText('Dismiss'));
    
    // Error should be cleared
    expect(queryByText('This offer was just claimed by someone else and is now full')).toBeNull();
  });

  it('should maintain claimable state after race condition error', () => {
    const offer = createMockOffer();
    const raceError = new Error('Race condition detected');
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(raceError);
      },
      isPending: false,
    }));
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Trigger claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Button should still show "Claim Offer" (not changed to claimed)
    // Note: In reality, the parent would update the offer to full status
    expect(getByText('Claim Offer')).toBeTruthy();
  });
});

describe('ClaimButton Edge Cases - Combined Scenarios', () => {
  it('should handle offer expiring during a claim attempt', () => {
    const offer = createMockOffer({ status: 'active' });
    
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Start claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Simulate offer expiring while claim is processing
    const expiredOffer = { ...offer, status: 'expired' as const };
    rerender(
      <ClaimButton
        offer={expiredOffer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Should show expired state
    expect(getByText('Expired')).toBeTruthy();
  });

  it('should handle user checking out during a claim attempt', () => {
    const offer = createMockOffer({ status: 'active' });
    
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Start claim
    fireEvent.press(getByText('Claim Offer'));
    
    // Simulate user checking out while claim is processing
    rerender(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    // Should show not checked in state
    expect(getByText('Check In to Claim')).toBeTruthy();
  });

  it('should handle successful claim after timeout error', () => {
    const offer = createMockOffer();
    const timeoutError = new Error('Request timeout');
    const mockClaim = createMockClaim();
    let attemptCount = 0;
    
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError, onSuccess }) => ({
      mutate: (params: any) => {
        mockMutate(params);
        attemptCount++;
        if (attemptCount === 1) {
          onError(timeoutError);
        } else {
          onSuccess(mockClaim);
        }
      },
      isPending: false,
    }));
    
    const { getByText, queryByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // First attempt - timeout
    fireEvent.press(getByText('Claim Offer'));
    expect(getByText('Request timed out. Your claim may still be processing. Check My Claims or try again.')).toBeTruthy();
    
    // Dismiss error
    fireEvent.press(getByText('Dismiss'));
    
    // Second attempt - success
    fireEvent.press(getByText('Claim Offer'));
    
    // Error should be cleared
    expect(queryByText('Request timed out. Your claim may still be processing. Check My Claims or try again.')).toBeNull();
  });

  it('should prioritize loading state over prop changes', () => {
    const offer = createMockOffer({ status: 'active' });
    
    // Mock mutation to be pending
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(() => ({
      mutate: mockMutate,
      isPending: true,
    }));
    
    const { getByText, rerender } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Should show loading state
    expect(getByText('Claiming...')).toBeTruthy();
    
    // Try to change check-in status while loading
    rerender(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    // Should still show loading state (loading has priority)
    expect(getByText('Claiming...')).toBeTruthy();
  });
});
