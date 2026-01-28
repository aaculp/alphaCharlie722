/**
 * FlashOfferCreationModal Numeric Input Validation Tests
 * 
 * Tests that the expected value field only accepts numeric input
 * with up to 2 decimal places.
 * 
 * Requirements: 3.1, 3.7
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FlashOfferCreationModal } from '../FlashOfferCreationModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../contexts/ThemeContext');
jest.mock('../../../services/api/flashOffers');
jest.mock('../../../services/api/flashOfferNotifications');

describe('FlashOfferCreationModal - Numeric Input Validation', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const mockVenueBusinessAccount = {
    id: 'venue-123',
    venues: {
      id: 'venue-456',
      name: 'Test Venue',
    },
    subscription_tier: 'free' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth
    (useAuth as jest.Mock).mockReturnValue({
      venueBusinessAccount: mockVenueBusinessAccount,
    });

    // Mock useTheme
    (useTheme as jest.Mock).mockReturnValue({
      theme: {
        colors: {
          background: '#fff',
          text: '#000',
          primary: '#007AFF',
          surface: '#f5f5f5',
          border: '#e0e0e0',
          textSecondary: '#666',
        },
      },
      isDark: false,
    });
  });

  it('should accept valid numeric input with no decimal places', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    fireEvent.changeText(input, '25');
    
    expect(input.props.value).toBe('25');
  });

  it('should accept valid numeric input with 1 decimal place', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    fireEvent.changeText(input, '10.5');
    
    expect(input.props.value).toBe('10.5');
  });

  it('should accept valid numeric input with 2 decimal places', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    fireEvent.changeText(input, '10.99');
    
    expect(input.props.value).toBe('10.99');
  });

  it('should reject numeric input with more than 2 decimal places', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    // First set a valid value
    fireEvent.changeText(input, '10.99');
    expect(input.props.value).toBe('10.99');
    
    // Try to add a third decimal place - should be rejected
    fireEvent.changeText(input, '10.999');
    expect(input.props.value).toBe('10.99'); // Should remain unchanged
  });

  it('should reject non-numeric input', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    fireEvent.changeText(input, 'abc');
    
    expect(input.props.value).toBe(''); // Should remain empty
  });

  it('should reject input with letters mixed with numbers', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    // First set a valid value
    fireEvent.changeText(input, '10');
    expect(input.props.value).toBe('10');
    
    // Try to add letters - should be rejected
    fireEvent.changeText(input, '10abc');
    expect(input.props.value).toBe('10'); // Should remain unchanged
  });

  it('should accept empty string', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    // First set a value
    fireEvent.changeText(input, '10.00');
    expect(input.props.value).toBe('10.00');
    
    // Clear the input
    fireEvent.changeText(input, '');
    expect(input.props.value).toBe('');
  });

  it('should accept decimal point without leading digits', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    fireEvent.changeText(input, '.5');
    
    expect(input.props.value).toBe('.5');
  });

  it('should accept decimal point without trailing digits', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    fireEvent.changeText(input, '10.');
    
    expect(input.props.value).toBe('10.');
  });

  it('should reject multiple decimal points', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    // First set a valid value with decimal
    fireEvent.changeText(input, '10.5');
    expect(input.props.value).toBe('10.5');
    
    // Try to add another decimal point - should be rejected
    fireEvent.changeText(input, '10.5.5');
    expect(input.props.value).toBe('10.5'); // Should remain unchanged
  });

  it('should have decimal-pad keyboard type', () => {
    const { getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = getByPlaceholderText('e.g., 10.00');
    
    expect(input.props.keyboardType).toBe('decimal-pad');
  });
});
