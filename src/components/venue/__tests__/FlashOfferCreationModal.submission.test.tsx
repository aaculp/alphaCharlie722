/**
 * FlashOfferCreationModal Submission Tests
 * 
 * Tests that the expected value is correctly converted from string to number
 * before submission and that empty strings are handled as undefined.
 * 
 * Requirements: 3.4, 4.5
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { FlashOfferCreationModal } from '../FlashOfferCreationModal';
import { FlashOfferService } from '../../../services/api/flashOffers';
import { FlashOfferNotificationService } from '../../../services/api/flashOfferNotifications';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../contexts/ThemeContext');
jest.mock('../../../services/api/flashOffers');
jest.mock('../../../services/api/flashOfferNotifications');

describe('FlashOfferCreationModal - Submission', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuth as jest.Mock).mockReturnValue({
      venueBusinessAccount: {
        venues: { id: 'venue-123' },
        subscription_tier: 'core',
      },
    });

    (useTheme as jest.Mock).mockReturnValue({
      theme: {
        colors: {
          background: '#fff',
          text: '#000',
          primary: '#007AFF',
          surface: '#f5f5f5',
          border: '#ddd',
          textSecondary: '#666',
        },
      },
      isDark: false,
    });

    jest.spyOn(Alert, 'alert');
  });

  const fillRequiredFields = (getByPlaceholderText: any, getByText: any, expectedValue?: string) => {
    // Fill step 1
    fireEvent.changeText(getByPlaceholderText('e.g., Happy Hour Special'), 'Test Offer');
    fireEvent.changeText(getByPlaceholderText('Describe your offer in detail...'), 'This is a test offer description');
    if (expectedValue !== undefined) {
      fireEvent.changeText(getByPlaceholderText('e.g., 10.00'), expectedValue);
    }
    fireEvent.changeText(getByPlaceholderText('e.g., 50'), '50');
    
    // Go to step 2
    fireEvent.press(getByText('Next'));
  };

  describe('Expected Value Conversion', () => {
    it('should convert numeric string to number before submission', async () => {
      const mockCreateFlashOffer = jest.fn().mockResolvedValue({
        id: 'offer-123',
        title: 'Test Offer',
        expected_value: 25.50,
      });
      (FlashOfferService.createFlashOffer as jest.Mock) = mockCreateFlashOffer;
      
      (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
        success: true,
        sentCount: 10,
      });

      const { getByPlaceholderText, getByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fillRequiredFields(getByPlaceholderText, getByText, '25.50');

      // Submit
      await waitFor(() => {
        const createButton = getByText('Create Offer');
        fireEvent.press(createButton);
      });

      // Verify createFlashOffer was called with numeric value
      await waitFor(() => {
        expect(mockCreateFlashOffer).toHaveBeenCalledWith(
          'venue-123',
          expect.objectContaining({
            expected_value: 25.50,
          })
        );
      });
    });

    it('should convert integer string to number before submission', async () => {
      const mockCreateFlashOffer = jest.fn().mockResolvedValue({
        id: 'offer-123',
        title: 'Test Offer',
        expected_value: 10,
      });
      (FlashOfferService.createFlashOffer as jest.Mock) = mockCreateFlashOffer;
      
      (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
        success: true,
        sentCount: 10,
      });

      const { getByPlaceholderText, getByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fillRequiredFields(getByPlaceholderText, getByText, '10');

      // Submit
      await waitFor(() => {
        const createButton = getByText('Create Offer');
        fireEvent.press(createButton);
      });

      // Verify createFlashOffer was called with numeric value
      await waitFor(() => {
        expect(mockCreateFlashOffer).toHaveBeenCalledWith(
          'venue-123',
          expect.objectContaining({
            expected_value: 10,
          })
        );
      });
    });

    it('should handle empty string as undefined', async () => {
      const mockCreateFlashOffer = jest.fn().mockResolvedValue({
        id: 'offer-123',
        title: 'Test Offer',
        expected_value: null,
      });
      (FlashOfferService.createFlashOffer as jest.Mock) = mockCreateFlashOffer;
      
      (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
        success: true,
        sentCount: 10,
      });

      const { getByPlaceholderText, getByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Don't fill expected value field (leave it empty)
      fillRequiredFields(getByPlaceholderText, getByText);

      // Submit
      await waitFor(() => {
        const createButton = getByText('Create Offer');
        fireEvent.press(createButton);
      });

      // Verify createFlashOffer was called with undefined (not included in object)
      await waitFor(() => {
        expect(mockCreateFlashOffer).toHaveBeenCalledWith(
          'venue-123',
          expect.objectContaining({
            title: 'Test Offer',
            description: 'This is a test offer description',
            max_claims: 50,
          })
        );
        
        // Verify expected_value is undefined
        const callArgs = mockCreateFlashOffer.mock.calls[0][1];
        expect(callArgs.expected_value).toBeUndefined();
      });
    });

    it('should handle whitespace-only string as undefined', async () => {
      const mockCreateFlashOffer = jest.fn().mockResolvedValue({
        id: 'offer-123',
        title: 'Test Offer',
        expected_value: null,
      });
      (FlashOfferService.createFlashOffer as jest.Mock) = mockCreateFlashOffer;
      
      (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
        success: true,
        sentCount: 10,
      });

      const { getByPlaceholderText, getByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fillRequiredFields(getByPlaceholderText, getByText, '   ');

      // Submit
      await waitFor(() => {
        const createButton = getByText('Create Offer');
        fireEvent.press(createButton);
      });

      // Verify createFlashOffer was called with undefined
      await waitFor(() => {
        const callArgs = mockCreateFlashOffer.mock.calls[0][1];
        expect(callArgs.expected_value).toBeUndefined();
      });
    });

    it('should convert zero value to number', async () => {
      const mockCreateFlashOffer = jest.fn().mockResolvedValue({
        id: 'offer-123',
        title: 'Test Offer',
        expected_value: 0,
      });
      (FlashOfferService.createFlashOffer as jest.Mock) = mockCreateFlashOffer;
      
      (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
        success: true,
        sentCount: 10,
      });

      const { getByPlaceholderText, getByText } = render(
        <FlashOfferCreationModal
          visible={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fillRequiredFields(getByPlaceholderText, getByText, '0');

      // Submit
      await waitFor(() => {
        const createButton = getByText('Create Offer');
        fireEvent.press(createButton);
      });

      // Verify createFlashOffer was called with numeric value 0
      await waitFor(() => {
        expect(mockCreateFlashOffer).toHaveBeenCalledWith(
          'venue-123',
          expect.objectContaining({
            expected_value: 0,
          })
        );
      });
    });
  });
});
