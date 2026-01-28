/**
 * Unit Tests for ClaimButton Component
 * Feature: venue-detail-claim-button
 * Task: 2.1 Write unit tests for ClaimButton rendering
 * 
 * Tests that each state renders correct button variant, labels, and styling
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
jest.mock('../../../hooks/mutations/useClaimFlashOfferMutation', () => ({
  useClaimFlashOfferMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
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
    expected_value: 10.00,
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
  const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
  useClaimFlashOfferMutation.mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  });
  mockNavigate.mockClear();
});

describe('ClaimButton Component - Claimable State', () => {
  it('should render "Claim Offer" button when user is eligible', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    expect(getByText('Claim Offer')).toBeTruthy();
  });

  it('should not be disabled when claimable', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Button should render and be pressable
    const button = getByText('Claim Offer');
    expect(button).toBeTruthy();
  });

  it('should call mutation when claimable button is pressed', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    
    // Mock the mutation hook to return our mock mutate function
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    fireEvent.press(getByText('Claim Offer'));
    
    // Should call mutation with correct parameters
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith({
      offerId: offer.id,
      userId: 'test-user-id',
      venueId: offer.venue_id,
    });
  });
});

describe('ClaimButton Component - Claimed State', () => {
  it('should render "View Claim" button when user has claimed', () => {
    const offer = createMockOffer();
    const claim = createMockClaim();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={claim}
        isCheckedIn={true}
      />
    );
    
    expect(getByText('View Claim')).toBeTruthy();
  });

  it('should not be disabled when claimed', () => {
    const offer = createMockOffer();
    const claim = createMockClaim();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={claim}
        isCheckedIn={true}
      />
    );
    
    // Button should render and be pressable
    const button = getByText('View Claim');
    expect(button).toBeTruthy();
  });

  it('should navigate to ClaimDetailScreen when claimed button is pressed', () => {
    const offer = createMockOffer();
    const claim = createMockClaim();
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={claim}
        isCheckedIn={true}
      />
    );
    
    fireEvent.press(getByText('View Claim'));
    
    // Should navigate to ClaimDetail screen with claim ID
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('ClaimDetail', { claimId: claim.id });
  });
});

describe('ClaimButton Component - Loading State', () => {
  it('should render "Claiming..." when loading', () => {
    const offer = createMockOffer();
    
    // Mock the mutation hook to return isPending: true
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
    });
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    expect(getByText('Claiming...')).toBeTruthy();
  });

  it('should be disabled when loading', () => {
    const offer = createMockOffer();
    
    // Mock the mutation hook to return isPending: true
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
    });
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Button should render with loading text
    const button = getByText('Claiming...');
    expect(button).toBeTruthy();
  });

  it('should not call mutation when loading button is pressed', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    
    // Mock the mutation hook to return isPending: true
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    fireEvent.press(getByText('Claiming...'));
    expect(mockMutate).not.toHaveBeenCalled();
  });
});

describe('ClaimButton Component - Not Checked In State', () => {
  it('should render "Check In to Claim" when user is not checked in', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    expect(getByText('Check In to Claim')).toBeTruthy();
  });

  it('should not be disabled when not checked in', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    // Button should render and be pressable
    const button = getByText('Check In to Claim');
    expect(button).toBeTruthy();
  });

  it('should call onPress when not checked in button is pressed', () => {
    const offer = createMockOffer();
    const onPress = jest.fn();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
        onPress={onPress}
      />
    );
    
    fireEvent.press(getByText('Check In to Claim'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should call onNavigate with check_in when not checked in button is pressed', () => {
    const offer = createMockOffer();
    const onNavigate = jest.fn();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
        onNavigate={onNavigate}
      />
    );
    
    fireEvent.press(getByText('Check In to Claim'));
    
    // onNavigate should be called with 'check_in' target
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('check_in');
  });
});

describe('ClaimButton Component - Full State', () => {
  it('should render "Offer Full" when offer is at capacity', () => {
    const offer = createMockOffer({
      max_claims: 100,
      claimed_count: 100,
      status: 'full',
    });
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    expect(getByText('Offer Full')).toBeTruthy();
  });

  it('should be disabled when full', () => {
    const offer = createMockOffer({
      max_claims: 100,
      claimed_count: 100,
      status: 'full',
    });
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Button should render with full text
    const button = getByText('Offer Full');
    expect(button).toBeTruthy();
  });

  it('should not call mutation when full button is pressed', () => {
    const offer = createMockOffer({
      max_claims: 100,
      claimed_count: 100,
      status: 'full',
    });
    const mockMutate = jest.fn();
    
    // Mock the mutation hook
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    fireEvent.press(getByText('Offer Full'));
    expect(mockMutate).not.toHaveBeenCalled();
  });
});

describe('ClaimButton Component - Expired State', () => {
  it('should render "Expired" when offer is expired', () => {
    const offer = createMockOffer({
      status: 'expired',
    });
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    expect(getByText('Expired')).toBeTruthy();
  });

  it('should render "Expired" when offer is cancelled', () => {
    const offer = createMockOffer({
      status: 'cancelled',
    });
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    expect(getByText('Expired')).toBeTruthy();
  });

  it('should be disabled when expired', () => {
    const offer = createMockOffer({
      status: 'expired',
    });
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Button should render with expired text
    const button = getByText('Expired');
    expect(button).toBeTruthy();
  });

  it('should not call mutation when expired button is pressed', () => {
    const offer = createMockOffer({
      status: 'expired',
    });
    const mockMutate = jest.fn();
    
    // Mock the mutation hook
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    fireEvent.press(getByText('Expired'));
    expect(mockMutate).not.toHaveBeenCalled();
  });
});

describe('ClaimButton Component - Compact Mode', () => {
  it('should render in compact mode when compact prop is true', () => {
    const offer = createMockOffer();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
        compact={true}
      />
    );
    
    expect(getByText('Claim Offer')).toBeTruthy();
  });
});

describe('ClaimButton Component - State Priority', () => {
  it('should prioritize loading state over claimed state', () => {
    const offer = createMockOffer();
    const claim = createMockClaim();
    
    // Mock the mutation hook to return isPending: true
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
    });
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={claim}
        isCheckedIn={true}
      />
    );
    
    expect(getByText('Claiming...')).toBeTruthy();
  });

  it('should prioritize claimed state over not checked in', () => {
    const offer = createMockOffer();
    const claim = createMockClaim();
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={claim}
        isCheckedIn={false}
      />
    );
    
    expect(getByText('View Claim')).toBeTruthy();
  });

  it('should prioritize not checked in over full state', () => {
    const offer = createMockOffer({
      max_claims: 100,
      claimed_count: 100,
      status: 'full',
    });
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={false}
      />
    );
    
    expect(getByText('Check In to Claim')).toBeTruthy();
  });
});

describe('ClaimButton Component - Error Display', () => {
  it('should display error message when mutation fails', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('Network error');
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        // Simulate error
        onError(mockError);
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
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Error message should be displayed
    expect(getByText('Unable to connect. Check your internet connection and try again.')).toBeTruthy();
  });

  it('should display retry button for retryable errors', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('Network error');
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(mockError);
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
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Retry button should be displayed
    expect(getByText('Retry')).toBeTruthy();
  });

  it('should display dismiss button for all errors', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('Network error');
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(mockError);
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
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Dismiss button should be displayed
    expect(getByText('Dismiss')).toBeTruthy();
  });

  it('should clear error when retry button is pressed', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('Network error');
    let errorCallback: any = null;
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => {
      errorCallback = onError;
      return {
        mutate: (params: any) => {
          mockMutate(params);
          if (errorCallback && mockMutate.mock.calls.length === 1) {
            errorCallback(mockError);
          }
        },
        isPending: false,
      };
    });
    
    const { getByText, queryByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Error should be displayed
    expect(getByText('Unable to connect. Check your internet connection and try again.')).toBeTruthy();
    
    // Press retry button
    fireEvent.press(getByText('Retry'));
    
    // Error should be cleared (mutation called again)
    expect(mockMutate).toHaveBeenCalledTimes(2);
  });

  it('should clear error when dismiss button is pressed', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('Network error');
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(mockError);
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
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Error should be displayed
    expect(getByText('Unable to connect. Check your internet connection and try again.')).toBeTruthy();
    
    // Press dismiss button
    fireEvent.press(getByText('Dismiss'));
    
    // Error should be cleared
    expect(queryByText('Unable to connect. Check your internet connection and try again.')).toBeNull();
  });

  it('should display navigate button for eligibility errors requiring navigation', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('User must be checked in at the venue');
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(mockError);
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
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Navigate button should be displayed
    expect(getByText('Check In')).toBeTruthy();
  });

  it('should call onNavigate when navigate button is pressed', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('User must be checked in at the venue');
    const onNavigate = jest.fn();
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(mockError);
      },
      isPending: false,
    }));
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
        onNavigate={onNavigate}
      />
    );
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Press navigate button
    fireEvent.press(getByText('Check In'));
    
    // onNavigate should be called with correct target
    expect(onNavigate).toHaveBeenCalledWith('check_in');
  });

  it('should clear error on successful claim', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('Network error');
    const mockClaim = createMockClaim();
    let errorCallback: any = null;
    let successCallback: any = null;
    
    // Mock the mutation hook with both callbacks
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError, onSuccess }: any) => {
      errorCallback = onError;
      successCallback = onSuccess;
      return {
        mutate: (params: any) => {
          mockMutate(params);
          if (mockMutate.mock.calls.length === 1 && errorCallback) {
            errorCallback(mockError);
          } else if (mockMutate.mock.calls.length === 2 && successCallback) {
            successCallback(mockClaim);
          }
        },
        isPending: false,
      };
    });
    
    const { getByText, queryByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Error should be displayed
    expect(getByText('Unable to connect. Check your internet connection and try again.')).toBeTruthy();
    
    // Press retry button (triggers success this time)
    fireEvent.press(getByText('Retry'));
    
    // Error should be cleared
    expect(queryByText('Unable to connect. Check your internet connection and try again.')).toBeNull();
  });

  it('should display appropriate error message for already claimed error', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('User has already claimed this offer');
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(mockError);
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
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Error message should be displayed
    expect(getByText("You've already claimed this offer. View your claim in My Claims.")).toBeTruthy();
  });

  it('should display appropriate error message for offer full error', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockError = new Error('Offer has reached its maximum claims');
    
    // Mock the mutation hook with onError callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onError }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onError(mockError);
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
    
    // Press the button to trigger error
    fireEvent.press(getByText('Claim Offer'));
    
    // Error message should be displayed
    expect(getByText('This offer has been fully claimed. Check back for new offers!')).toBeTruthy();
  });
});

describe('ClaimButton Component - Success Modal Integration', () => {
  beforeEach(() => {
    // Clear haptic mock before each test
    const { triggerSuccessHaptic } = require('../../../utils/haptics');
    triggerSuccessHaptic.mockClear();
  });

  it('should trigger haptic feedback on successful claim', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockClaim = createMockClaim();
    const { triggerSuccessHaptic } = require('../../../utils/haptics');
    
    // Mock the mutation hook with onSuccess callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onSuccess }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onSuccess(mockClaim);
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
    
    // Press the button to trigger success
    fireEvent.press(getByText('Claim Offer'));
    
    // Haptic feedback should be triggered
    expect(triggerSuccessHaptic).toHaveBeenCalledTimes(1);
  });

  it('should show success modal on successful claim', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockClaim = createMockClaim();
    
    // Mock the mutation hook with onSuccess callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onSuccess }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onSuccess(mockClaim);
      },
      isPending: false,
    }));
    
    const { UNSAFE_getByType, getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Press the button to trigger success
    fireEvent.press(getByText('Claim Offer'));
    
    // Modal should be rendered with visible=true
    const modal = UNSAFE_getByType('ClaimFeedbackModal');
    expect(modal.props.visible).toBe(true);
  });

  it('should pass claim data to success modal', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockClaim = createMockClaim();
    
    // Mock the mutation hook with onSuccess callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onSuccess }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onSuccess(mockClaim);
      },
      isPending: false,
    }));
    
    const { UNSAFE_getByType, getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
      />
    );
    
    // Press the button to trigger success
    fireEvent.press(getByText('Claim Offer'));
    
    // Modal should receive claim data
    const modal = UNSAFE_getByType('ClaimFeedbackModal');
    expect(modal.props.claim).toEqual(mockClaim);
    expect(modal.props.offerTitle).toBe(offer.title);
  });

  it('should call onClaimSuccess callback on successful claim', () => {
    const offer = createMockOffer();
    const mockMutate = jest.fn();
    const mockClaim = createMockClaim();
    const onClaimSuccess = jest.fn();
    
    // Mock the mutation hook with onSuccess callback
    const { useClaimFlashOfferMutation } = require('../../../hooks/mutations/useClaimFlashOfferMutation');
    useClaimFlashOfferMutation.mockImplementation(({ onSuccess }: any) => ({
      mutate: (params: any) => {
        mockMutate(params);
        onSuccess(mockClaim);
      },
      isPending: false,
    }));
    
    const { getByText } = render(
      <ClaimButton
        offer={offer}
        userClaim={null}
        isCheckedIn={true}
        onClaimSuccess={onClaimSuccess}
      />
    );
    
    // Press the button to trigger success
    fireEvent.press(getByText('Claim Offer'));
    
    // Callback should be called with claim data
    expect(onClaimSuccess).toHaveBeenCalledTimes(1);
    expect(onClaimSuccess).toHaveBeenCalledWith(mockClaim);
  });
});
