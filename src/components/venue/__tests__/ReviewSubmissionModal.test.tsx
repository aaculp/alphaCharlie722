/**
 * ReviewSubmissionModal Tests
 * 
 * Basic smoke tests for the ReviewSubmissionModal component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ReviewSubmissionModal from '../ReviewSubmissionModal';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}));

jest.mock('../../../services/api/reviews', () => ({
  ReviewService: {
    submitReview: jest.fn(),
    updateReview: jest.fn(),
  },
}));

const mockProps = {
  visible: true,
  onClose: jest.fn(),
  venueId: 'test-venue-id',
  venueName: 'Test Venue',
  onSubmitSuccess: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <ThemeProvider>{component}</ThemeProvider>
    </AuthProvider>
  );
};

describe('ReviewSubmissionModal', () => {
  it('renders without crashing', () => {
    const { getByText } = renderWithProviders(
      <ReviewSubmissionModal {...mockProps} />
    );
    
    expect(getByText('Write a Review')).toBeTruthy();
  });

  it('displays venue name', () => {
    const { getByText } = renderWithProviders(
      <ReviewSubmissionModal {...mockProps} />
    );
    
    expect(getByText('Test Venue')).toBeTruthy();
  });

  it('shows edit mode title when existingReview is provided', () => {
    const existingReview = {
      id: 'test-review-id',
      venue_id: 'test-venue-id',
      user_id: 'test-user-id',
      rating: 4,
      review_text: 'Great place!',
      is_verified: true,
      helpful_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { getByText } = renderWithProviders(
      <ReviewSubmissionModal {...mockProps} existingReview={existingReview} />
    );
    
    expect(getByText('Edit Review')).toBeTruthy();
  });

  it('displays rating label', () => {
    const { getByText } = renderWithProviders(
      <ReviewSubmissionModal {...mockProps} />
    );
    
    expect(getByText(/Rating/)).toBeTruthy();
  });

  it('displays review text input placeholder', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <ReviewSubmissionModal {...mockProps} />
    );
    
    expect(getByPlaceholderText('Share your experience... (optional)')).toBeTruthy();
  });

  it('displays character counter', () => {
    const { getByText } = renderWithProviders(
      <ReviewSubmissionModal {...mockProps} />
    );
    
    expect(getByText('0/500')).toBeTruthy();
  });

  it('displays submit button', () => {
    const { getByText } = renderWithProviders(
      <ReviewSubmissionModal {...mockProps} />
    );
    
    expect(getByText('Submit Review')).toBeTruthy();
  });

  it('displays cancel button', () => {
    const { getByText } = renderWithProviders(
      <ReviewSubmissionModal {...mockProps} />
    );
    
    expect(getByText('Cancel')).toBeTruthy();
  });
});
