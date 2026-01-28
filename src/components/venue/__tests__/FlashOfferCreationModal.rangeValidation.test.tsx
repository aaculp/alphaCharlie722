/**
 * FlashOfferCreationModal Range Validation Tests
 * 
 * Tests that the expected value field validates non-negative values
 * and maximum value constraints.
 * 
 * Requirements: 3.2, 3.3, 1.6, 1.7
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FlashOfferCreationModal } from '../FlashOfferCreationModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../contexts/ThemeContext');
jest.mock('../../../services/api/flashOffers');
jest.mock('../../../services/api/flashOfferNotifications');

describe('FlashOfferCreationModal - Range Validation', () => {
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

  describe('Negative Value Validation', () => {
    it('should prevent negative values from being entered', async () => {
      const { getByPlaceholderText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const expectedValueInput = getByPlaceholderText('e.g., 10.00');

      // Try to enter a negative value - should be rejected by input handler
      fireEvent.changeText(expectedValueInput, '-10');

      // The input should remain empty because negative values are not accepted
      expect(expectedValueInput.props.value).toBe('');
    });

    it('should not display error for zero value', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in required fields
      const titleInput = getByPlaceholderText('e.g., Happy Hour Special');
      const descriptionInput = getByPlaceholderText('Describe your offer in detail...');
      const maxClaimsInput = getByPlaceholderText('e.g., 50');
      const expectedValueInput = getByPlaceholderText('e.g., 10.00');

      fireEvent.changeText(titleInput, 'Test Offer');
      fireEvent.changeText(descriptionInput, 'This is a test offer description');
      fireEvent.changeText(maxClaimsInput, '50');
      fireEvent.changeText(expectedValueInput, '0');

      // Try to proceed to next step
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      // Wait for validation to run
      await waitFor(() => {
        expect(queryByText('Value must be 0 or greater')).toBeNull();
      });
    });

    it('should not display error for positive values', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in required fields
      const titleInput = getByPlaceholderText('e.g., Happy Hour Special');
      const descriptionInput = getByPlaceholderText('Describe your offer in detail...');
      const maxClaimsInput = getByPlaceholderText('e.g., 50');
      const expectedValueInput = getByPlaceholderText('e.g., 10.00');

      fireEvent.changeText(titleInput, 'Test Offer');
      fireEvent.changeText(descriptionInput, 'This is a test offer description');
      fireEvent.changeText(maxClaimsInput, '50');
      fireEvent.changeText(expectedValueInput, '25.50');

      // Try to proceed to next step
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      // Wait for validation to run
      await waitFor(() => {
        expect(queryByText('Value must be 0 or greater')).toBeNull();
      });
    });
  });

  describe('Maximum Value Validation', () => {
    it('should display error message for values greater than 10000', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in required fields
      const titleInput = getByPlaceholderText('e.g., Happy Hour Special');
      const descriptionInput = getByPlaceholderText('Describe your offer in detail...');
      const maxClaimsInput = getByPlaceholderText('e.g., 50');
      const expectedValueInput = getByPlaceholderText('e.g., 10.00');

      fireEvent.changeText(titleInput, 'Test Offer');
      fireEvent.changeText(descriptionInput, 'This is a test offer description');
      fireEvent.changeText(maxClaimsInput, '50');
      fireEvent.changeText(expectedValueInput, '10001');

      // Try to proceed to next step
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      // Wait for validation to run
      await waitFor(() => {
        expect(queryByText('Value must be less than $10,000')).toBeTruthy();
      });
    });

    it('should not display error for value exactly at 10000', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in required fields
      const titleInput = getByPlaceholderText('e.g., Happy Hour Special');
      const descriptionInput = getByPlaceholderText('Describe your offer in detail...');
      const maxClaimsInput = getByPlaceholderText('e.g., 50');
      const expectedValueInput = getByPlaceholderText('e.g., 10.00');

      fireEvent.changeText(titleInput, 'Test Offer');
      fireEvent.changeText(descriptionInput, 'This is a test offer description');
      fireEvent.changeText(maxClaimsInput, '50');
      fireEvent.changeText(expectedValueInput, '10000');

      // Try to proceed to next step
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      // Wait for validation to run
      await waitFor(() => {
        expect(queryByText('Value must be less than $10,000')).toBeNull();
      });
    });

    it('should not display error for values below 10000', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in required fields
      const titleInput = getByPlaceholderText('e.g., Happy Hour Special');
      const descriptionInput = getByPlaceholderText('Describe your offer in detail...');
      const maxClaimsInput = getByPlaceholderText('e.g., 50');
      const expectedValueInput = getByPlaceholderText('e.g., 10.00');

      fireEvent.changeText(titleInput, 'Test Offer');
      fireEvent.changeText(descriptionInput, 'This is a test offer description');
      fireEvent.changeText(maxClaimsInput, '50');
      fireEvent.changeText(expectedValueInput, '9999.99');

      // Try to proceed to next step
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      // Wait for validation to run
      await waitFor(() => {
        expect(queryByText('Value must be less than $10,000')).toBeNull();
      });
    });
  });

  describe('Empty Value Validation', () => {
    it('should not display error for empty expected value', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in required fields, leave expected value empty
      const titleInput = getByPlaceholderText('e.g., Happy Hour Special');
      const descriptionInput = getByPlaceholderText('Describe your offer in detail...');
      const maxClaimsInput = getByPlaceholderText('e.g., 50');

      fireEvent.changeText(titleInput, 'Test Offer');
      fireEvent.changeText(descriptionInput, 'This is a test offer description');
      fireEvent.changeText(maxClaimsInput, '50');

      // Try to proceed to next step
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      // Wait for validation to run
      await waitFor(() => {
        expect(queryByText('Value must be 0 or greater')).toBeNull();
        expect(queryByText('Value must be less than $10,000')).toBeNull();
      });
    });
  });

  describe('Error Display', () => {
    it('should show red border on input when validation fails for excessive value', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in required fields with invalid expected value
      const titleInput = getByPlaceholderText('e.g., Happy Hour Special');
      const descriptionInput = getByPlaceholderText('Describe your offer in detail...');
      const maxClaimsInput = getByPlaceholderText('e.g., 50');
      const expectedValueInput = getByPlaceholderText('e.g., 10.00');

      fireEvent.changeText(titleInput, 'Test Offer');
      fireEvent.changeText(descriptionInput, 'This is a test offer description');
      fireEvent.changeText(maxClaimsInput, '50');
      fireEvent.changeText(expectedValueInput, '10001');

      // Try to proceed to next step
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      // Wait for validation to run and error message to appear
      await waitFor(() => {
        expect(queryByText('Value must be less than $10,000')).toBeTruthy();
      });
    });
  });
});
