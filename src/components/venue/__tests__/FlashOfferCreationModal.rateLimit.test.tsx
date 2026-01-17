/**
 * FlashOfferCreationModal Rate Limit Error Handling Tests
 * 
 * Tests that rate limit errors are properly displayed to venue owners
 * with clear messages about their tier limits and when they can send again.
 * 
 * Requirements: 11.7
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { FlashOfferCreationModal } from '../FlashOfferCreationModal';
import { FlashOfferService } from '../../../services/api/flashOffers';
import { FlashOfferNotificationService } from '../../../services/api/flashOfferNotifications';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../contexts/ThemeContext');
jest.mock('../../../services/api/flashOffers');
jest.mock('../../../services/api/flashOfferNotifications');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('FlashOfferCreationModal - Rate Limit Error Handling', () => {
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

    // Mock FlashOfferService
    (FlashOfferService.createFlashOffer as jest.Mock).mockResolvedValue({
      id: 'offer-789',
      title: 'Test Offer',
    });
  });

  it('should display rate limit error with tier-specific information for free tier', async () => {
    // Mock rate limit error response
    (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
      success: false,
      targetedUserCount: 0,
      sentCount: 0,
      failedCount: 0,
      errors: [{ token: '', error: 'Rate limit exceeded' }],
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorDetails: {
        currentCount: 3,
        limit: 3,
        resetsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill in form (step 1)
    fireEvent.changeText(getByPlaceholderText('e.g., Happy Hour Special'), 'Test Offer');
    fireEvent.changeText(getByPlaceholderText('Describe your offer in detail...'), 'This is a test offer description');
    fireEvent.changeText(getByPlaceholderText('e.g., 50'), '10');

    // Go to step 2
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('When and who?')).toBeTruthy();
    });

    // Submit form
    fireEvent.press(getByText('Create Offer'));

    // Wait for rate limit error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Daily Limit Reached',
        expect.stringContaining("You've reached your daily limit of 3 flash offers (3/3 sent)"),
        expect.any(Array)
      );
    });

    // Verify the message includes tier information
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const message = alertCall[1];
    expect(message).toContain('FREE plan allows 3 offers per 24 hours');
    expect(message).toContain('approximately 5 hours');
    expect(message).toContain('Upgrade to CORE to send up to 5 offers per day');
  });

  it('should display rate limit error with tier-specific information for core tier', async () => {
    // Update mock to core tier
    (useAuth as jest.Mock).mockReturnValue({
      venueBusinessAccount: {
        ...mockVenueBusinessAccount,
        subscription_tier: 'core',
      },
    });

    // Mock rate limit error response
    (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
      success: false,
      targetedUserCount: 0,
      sentCount: 0,
      failedCount: 0,
      errors: [{ token: '', error: 'Rate limit exceeded' }],
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorDetails: {
        currentCount: 5,
        limit: 5,
        resetsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill in form and submit
    fireEvent.changeText(getByPlaceholderText('e.g., Happy Hour Special'), 'Test Offer');
    fireEvent.changeText(getByPlaceholderText('Describe your offer in detail...'), 'This is a test offer description');
    fireEvent.changeText(getByPlaceholderText('e.g., 50'), '10');
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('When and who?')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Offer'));

    // Wait for rate limit error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Verify the message includes core tier information
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const message = alertCall[1];
    expect(message).toContain('CORE plan allows 5 offers per 24 hours');
    expect(message).toContain('approximately 2 hours');
    expect(message).toContain('Upgrade to PRO to send up to 10 offers per day');
  });

  it('should display rate limit error without upgrade suggestion for pro tier', async () => {
    // Update mock to pro tier
    (useAuth as jest.Mock).mockReturnValue({
      venueBusinessAccount: {
        ...mockVenueBusinessAccount,
        subscription_tier: 'pro',
      },
    });

    // Mock rate limit error response
    (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
      success: false,
      targetedUserCount: 0,
      sentCount: 0,
      failedCount: 0,
      errors: [{ token: '', error: 'Rate limit exceeded' }],
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorDetails: {
        currentCount: 10,
        limit: 10,
        resetsAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill in form and submit
    fireEvent.changeText(getByPlaceholderText('e.g., Happy Hour Special'), 'Test Offer');
    fireEvent.changeText(getByPlaceholderText('Describe your offer in detail...'), 'This is a test offer description');
    fireEvent.changeText(getByPlaceholderText('e.g., 50'), '10');
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('When and who?')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Offer'));

    // Wait for rate limit error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Verify the message does NOT include upgrade suggestion
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const message = alertCall[1];
    expect(message).toContain('PRO plan allows 10 offers per 24 hours');
    expect(message).not.toContain('Upgrade to');
  });

  it('should not show success message when rate limit is exceeded', async () => {
    // Mock rate limit error response
    (FlashOfferNotificationService.sendFlashOfferPush as jest.Mock).mockResolvedValue({
      success: false,
      targetedUserCount: 0,
      sentCount: 0,
      failedCount: 0,
      errors: [{ token: '', error: 'Rate limit exceeded' }],
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorDetails: {
        currentCount: 3,
        limit: 3,
        resetsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <FlashOfferCreationModal
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill in form and submit
    fireEvent.changeText(getByPlaceholderText('e.g., Happy Hour Special'), 'Test Offer');
    fireEvent.changeText(getByPlaceholderText('Describe your offer in detail...'), 'This is a test offer description');
    fireEvent.changeText(getByPlaceholderText('e.g., 50'), '10');
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(getByText('When and who?')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Offer'));

    // Wait for rate limit error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Daily Limit Reached',
        expect.any(String),
        expect.any(Array)
      );
    });

    // Verify success alert was NOT called
    expect(Alert.alert).not.toHaveBeenCalledWith(
      'Success!',
      expect.any(String),
      expect.any(Array)
    );

    // Verify onSuccess was NOT called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
