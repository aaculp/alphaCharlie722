/**
 * Unit Tests for NotificationSettingsScreen
 * Feature: flash-offer-push-backend
 * 
 * Tests the flash offer notification settings screen functionality,
 * including toggle, time pickers, timezone selection, and distance settings.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NotificationSettingsScreen from '../NotificationSettingsScreen';
import { NotificationPreferencesService } from '../../../services/api/notificationPreferences';

// Mock dependencies
jest.mock('../../../services/api/notificationPreferences');

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ value, onChange }: any) => {
      return React.createElement('DateTimePicker', {
        testID: 'date-time-picker',
        value,
        onChange,
      });
    },
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock contexts
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#FFFFFF',
        primary: '#007AFF',
        text: '#000000',
        textSecondary: '#666666',
        surface: '#F5F5F5',
        border: '#E5E5E5',
      },
      fonts: {
        primary: { bold: 'Poppins-Bold', semiBold: 'Poppins-SemiBold' },
        secondary: { regular: 'Inter-Regular', semiBold: 'Inter-SemiBold', medium: 'Inter-Medium' },
      },
      isDark: false,
    },
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
};

describe('NotificationSettingsScreen - Unit Tests', () => {
  jest.setTimeout(15000);

  const mockPreferences = {
    user_id: 'test-user-id',
    flash_offers_enabled: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
    timezone: 'UTC',
    max_distance_miles: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (NotificationPreferencesService.getPreferences as jest.Mock).mockResolvedValue(mockPreferences);
    (NotificationPreferencesService.updatePreferences as jest.Mock).mockImplementation(
      async (userId, updates) => ({
        ...mockPreferences,
        ...updates,
        updated_at: new Date().toISOString(),
      })
    );
  });

  /**
   * Test: Notification toggle updates preferences correctly
   * Validates: Requirements 12.3
   * 
   * When the user toggles flash offer notifications on/off,
   * the preference should be updated in the database.
   */
  it('should update preferences when notification toggle is changed', async () => {
    const { findByText, getByRole } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    // Wait for screen to load
    await waitFor(async () => {
      const title = await findByText('Flash Offer Notifications');
      expect(title).toBeTruthy();
    });

    // Find the toggle switch
    const toggle = getByRole('switch');
    expect(toggle.props.value).toBe(true);

    // Toggle off
    fireEvent(toggle, 'valueChange', false);

    // Verify updatePreferences was called with correct parameters
    await waitFor(() => {
      expect(NotificationPreferencesService.updatePreferences).toHaveBeenCalledWith(
        'test-user-id',
        { flash_offers_enabled: false }
      );
    });
  });

  /**
   * Test: Toggle on updates preferences to enabled
   */
  it('should enable notifications when toggle is turned on', async () => {
    // Start with notifications disabled
    const disabledPreferences = {
      ...mockPreferences,
      flash_offers_enabled: false,
    };
    (NotificationPreferencesService.getPreferences as jest.Mock).mockResolvedValue(disabledPreferences);

    const { findByText, getByRole } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const title = await findByText('Flash Offer Notifications');
      expect(title).toBeTruthy();
    });

    const toggle = getByRole('switch');
    expect(toggle.props.value).toBe(false);

    // Toggle on
    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => {
      expect(NotificationPreferencesService.updatePreferences).toHaveBeenCalledWith(
        'test-user-id',
        { flash_offers_enabled: true }
      );
    });
  });

  /**
   * Test: Loading state displays correctly
   */
  it('should display loading state while fetching preferences', async () => {
    let resolvePreferences: any;
    const preferencesPromise = new Promise((resolve) => {
      resolvePreferences = resolve;
    });

    (NotificationPreferencesService.getPreferences as jest.Mock).mockReturnValue(preferencesPromise);

    const { findByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    const loadingText = await findByText('Loading preferences...');
    expect(loadingText).toBeTruthy();

    // Resolve the promise
    resolvePreferences(mockPreferences);

    await waitFor(async () => {
      const title = await findByText('Flash Offer Notifications');
      expect(title).toBeTruthy();
    });
  });

  /**
   * Test: Error handling when loading preferences fails
   */
  it('should display error alert when loading preferences fails', async () => {
    (NotificationPreferencesService.getPreferences as jest.Mock).mockRejectedValue(
      new Error('Failed to load preferences')
    );

    render(<NotificationSettingsScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to load notification preferences. Please try again.'
      );
    });
  });

  /**
   * Test: Error handling when updating preferences fails
   */
  it('should display error alert when updating preferences fails', async () => {
    (NotificationPreferencesService.updatePreferences as jest.Mock).mockRejectedValue(
      new Error('Failed to update preferences')
    );

    const { findByText, getByRole } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const title = await findByText('Flash Offer Notifications');
      expect(title).toBeTruthy();
    });

    const toggle = getByRole('switch');
    fireEvent(toggle, 'valueChange', false);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to update preferences. Please try again.'
      );
    });
  });

  /**
   * Test: Distance selection updates preferences
   */
  it('should update max distance when distance option is selected', async () => {
    const { findByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const title = await findByText('Flash Offer Notifications');
      expect(title).toBeTruthy();
    });

    // Select 5 miles option
    const fiveMilesButton = await findByText('5 mi');
    fireEvent.press(fiveMilesButton);

    await waitFor(() => {
      expect(NotificationPreferencesService.updatePreferences).toHaveBeenCalledWith(
        'test-user-id',
        { max_distance_miles: 5 }
      );
    });
  });

  /**
   * Test: No Limit distance option updates preferences to null
   */
  it('should set max distance to null when No Limit is selected', async () => {
    const { findByText, getAllByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const title = await findByText('Flash Offer Notifications');
      expect(title).toBeTruthy();
    });

    // Select No Limit option - there are multiple "No Limit" texts, get the one in the button
    const noLimitButtons = getAllByText('No Limit');
    const noLimitButton = noLimitButtons[noLimitButtons.length - 1]; // Last one is the button
    fireEvent.press(noLimitButton);

    await waitFor(() => {
      expect(NotificationPreferencesService.updatePreferences).toHaveBeenCalledWith(
        'test-user-id',
        { max_distance_miles: null }
      );
    });
  });

  /**
   * Test: Timezone selection opens modal
   */
  it('should open timezone modal when timezone setting is pressed', async () => {
    const { findByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const title = await findByText('Flash Offer Notifications');
      expect(title).toBeTruthy();
    });

    // Press timezone setting
    const timezoneButton = await findByText('UTC');
    fireEvent.press(timezoneButton);

    // Modal should appear
    await waitFor(async () => {
      const modalTitle = await findByText('Select Timezone');
      expect(modalTitle).toBeTruthy();
    });
  });

  /**
   * Test: Timezone selection updates preferences
   */
  it('should update timezone when a timezone is selected from modal', async () => {
    const { findByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const title = await findByText('Flash Offer Notifications');
      expect(title).toBeTruthy();
    });

    // Open timezone modal
    const timezoneButton = await findByText('UTC');
    fireEvent.press(timezoneButton);

    // Select Eastern Time
    const easternTimeOption = await findByText('Eastern Time (ET)');
    fireEvent.press(easternTimeOption);

    await waitFor(() => {
      expect(NotificationPreferencesService.updatePreferences).toHaveBeenCalledWith(
        'test-user-id',
        { timezone: 'America/New_York' }
      );
    });
  });

  /**
   * Test: Back button navigates back
   */
  it('should navigate back when back button is pressed', async () => {
    const { findByTestId } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const backButton = await findByTestId('back-button');
      expect(backButton).toBeTruthy();
    });

    const backButton = await findByTestId('back-button');
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  /**
   * Test: Quiet hours display correctly when set
   */
  it('should display formatted quiet hours when they are set', async () => {
    const preferencesWithQuietHours = {
      ...mockPreferences,
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
    };
    (NotificationPreferencesService.getPreferences as jest.Mock).mockResolvedValue(
      preferencesWithQuietHours
    );

    const { findByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const startTime = await findByText('10:00 PM');
      expect(startTime).toBeTruthy();
    });

    const endTime = await findByText('8:00 AM');
    expect(endTime).toBeTruthy();
  });

  /**
   * Test: Clear quiet hours button appears when quiet hours are set
   */
  it('should show clear button when quiet hours are set', async () => {
    const preferencesWithQuietHours = {
      ...mockPreferences,
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
    };
    (NotificationPreferencesService.getPreferences as jest.Mock).mockResolvedValue(
      preferencesWithQuietHours
    );

    const { findByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const clearButton = await findByText('Clear Quiet Hours');
      expect(clearButton).toBeTruthy();
    });
  });

  /**
   * Test: Clear quiet hours shows confirmation alert
   */
  it('should show confirmation alert when clearing quiet hours', async () => {
    const preferencesWithQuietHours = {
      ...mockPreferences,
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
    };
    (NotificationPreferencesService.getPreferences as jest.Mock).mockResolvedValue(
      preferencesWithQuietHours
    );

    const { findByText } = render(
      <NotificationSettingsScreen navigation={mockNavigation} />
    );

    await waitFor(async () => {
      const clearButton = await findByText('Clear Quiet Hours');
      expect(clearButton).toBeTruthy();
    });

    const clearButton = await findByText('Clear Quiet Hours');
    fireEvent.press(clearButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Clear Quiet Hours',
      expect.stringContaining('Are you sure'),
      expect.any(Array)
    );
  });
});
