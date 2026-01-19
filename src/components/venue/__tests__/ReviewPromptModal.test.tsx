/**
 * ReviewPromptModal Tests
 * 
 * Basic smoke tests for the ReviewPromptModal component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ReviewPromptModal from '../ReviewPromptModal';
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
  },
}));

const mockProps = {
  visible: true,
  onClose: jest.fn(),
  venueId: 'test-venue-id',
  venueName: 'Test Venue',
  onQuickRating: jest.fn(),
  onFullReview: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <ThemeProvider>{component}</ThemeProvider>
    </AuthProvider>
  );
};

describe('ReviewPromptModal', () => {
  it('renders without crashing', () => {
    const { getByText } = renderWithProviders(
      <ReviewPromptModal {...mockProps} />
    );
    
    expect(getByText('How was your visit?')).toBeTruthy();
  });

  it('displays venue name', () => {
    const { getByText } = renderWithProviders(
      <ReviewPromptModal {...mockProps} />
    );
    
    expect(getByText('Test Venue')).toBeTruthy();
  });

  it('displays vibe selection label', () => {
    const { getByText } = renderWithProviders(
      <ReviewPromptModal {...mockProps} />
    );
    
    expect(getByText('How was the vibe? (Optional)')).toBeTruthy();
  });

  it('displays all vibe options', () => {
    const { getByText } = renderWithProviders(
      <ReviewPromptModal {...mockProps} />
    );
    
    expect(getByText('Low-key')).toBeTruthy();
    expect(getByText('Vibey')).toBeTruthy();
    expect(getByText('Poppin')).toBeTruthy();
    expect(getByText('Lit')).toBeTruthy();
    expect(getByText('Maxed')).toBeTruthy();
  });

  it('displays rating label', () => {
    const { getByText } = renderWithProviders(
      <ReviewPromptModal {...mockProps} />
    );
    
    expect(getByText('Rate your experience')).toBeTruthy();
  });

  it('displays helper text', () => {
    const { getByText } = renderWithProviders(
      <ReviewPromptModal {...mockProps} />
    );
    
    expect(getByText('Tap a star to submit a quick rating')).toBeTruthy();
  });

  it('displays "Maybe Later" button', () => {
    const { getByText } = renderWithProviders(
      <ReviewPromptModal {...mockProps} />
    );
    
    expect(getByText('Maybe Later')).toBeTruthy();
  });

  it('displays "Add Written Review" button', () => {
    const { getByText } = renderWithProviders(
      <ReviewPromptModal {...mockProps} />
    );
    
    expect(getByText('Add Written Review')).toBeTruthy();
  });
});
