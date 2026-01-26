/**
 * Unit Tests for useTimezoneChangeDetection Hook
 * 
 * Tests the timezone change detection functionality that prompts users
 * when their device timezone changes.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { useTimezoneChangeDetection } from '../useTimezoneChangeDetection';
import { NotificationPreferencesService } from '../../services/api/notificationPreferences';
import { getDeviceTimezone } from '../../utils/timezone';

// Mock dependencies
jest.mock('../../services/api/notificationPreferences');
jest.mock('../../utils/timezone');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Import after mocking
import { useAuth } from '../../contexts/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetPreferences = NotificationPreferencesService.getPreferences as jest.MockedFunction<
  typeof NotificationPreferencesService.getPreferences
>;
const mockUpdatePreferences = NotificationPreferencesService.updatePreferences as jest.MockedFunction<
  typeof NotificationPreferencesService.updatePreferences
>;
const mockGetDeviceTimezone = getDeviceTimezone as jest.MockedFunction<typeof getDeviceTimezone>;

describe('useTimezoneChangeDetection Hook', () => {
  const mockUserId = 'test-user-123';
  let appStateListeners: Array<(state: AppStateStatus) => void> = [];

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    appStateListeners = [];

    // Mock AppState.addEventListener
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'change') {
        appStateListeners.push(handler as (state: AppStateStatus) => void);
      }
      return {
        remove: jest.fn(() => {
          appStateListeners = appStateListeners.filter(l => l !== handler);
        }),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Helper to simulate app coming to foreground
   */
  const simulateForeground = () => {
    act(() => {
      appStateListeners.forEach(listener => listener('active'));
    });
  };

  /**
   * Test: Detects timezone changes on app foreground
   * Validates: Requirement 5.1
   */
  it('should detect timezone changes when app comes to foreground', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/Los_Angeles');

    const { result } = renderHook(() => useTimezoneChangeDetection());

    // Wait for initial check
    await waitFor(() => {
      expect(result.current.state.showPrompt).toBe(true);
    });

    expect(result.current.state.oldTimezone).toBe('America/New_York');
    expect(result.current.state.newTimezone).toBe('America/Los_Angeles');
  });

  /**
   * Test: Does not show prompt when timezones match
   * Validates: Requirement 5.2
   */
  it('should not show prompt when timezones match', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/New_York');

    const { result } = renderHook(() => useTimezoneChangeDetection());

    // Wait for check to complete
    await waitFor(() => {
      expect(mockGetPreferences).toHaveBeenCalled();
    });

    expect(result.current.state.showPrompt).toBe(false);
  });

  /**
   * Test: Respects 7-day cooldown period
   * Validates: Requirement 5.6
   */
  it('should respect 7-day cooldown period', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    // Last check was 3 days ago (within cooldown)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: threeDaysAgo.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/Los_Angeles');

    const { result } = renderHook(() => useTimezoneChangeDetection());

    // Wait for check to complete
    await waitFor(() => {
      expect(mockGetPreferences).toHaveBeenCalled();
    });

    // Should not show prompt due to cooldown
    expect(result.current.state.showPrompt).toBe(false);
  });

  /**
   * Test: Shows prompt after cooldown expires
   * Validates: Requirement 5.6
   */
  it('should show prompt after 7-day cooldown expires', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    // Last check was 8 days ago (cooldown expired)
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: eightDaysAgo.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Europe/London');

    const { result } = renderHook(() => useTimezoneChangeDetection());

    // Wait for prompt to show
    await waitFor(() => {
      expect(result.current.state.showPrompt).toBe(true);
    });

    expect(result.current.state.oldTimezone).toBe('America/New_York');
    expect(result.current.state.newTimezone).toBe('Europe/London');
  });

  /**
   * Test: Accept handler updates timezone
   * Validates: Requirement 5.5
   */
  it('should update timezone when user accepts', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Asia/Tokyo');
    mockUpdatePreferences.mockResolvedValue({} as any);

    const { result } = renderHook(() => useTimezoneChangeDetection());

    // Wait for prompt to show
    await waitFor(() => {
      expect(result.current.state.showPrompt).toBe(true);
    });

    // Accept the change
    await act(async () => {
      await result.current.handlers.handleAccept();
    });

    // Should update preferences with new timezone and timestamp
    expect(mockUpdatePreferences).toHaveBeenCalledWith(mockUserId, {
      timezone: 'Asia/Tokyo',
      last_timezone_check: expect.any(String),
    });

    // Prompt should be hidden
    expect(result.current.state.showPrompt).toBe(false);
  });

  /**
   * Test: Decline handler updates last check timestamp
   * Validates: Requirements 5.6, 5.7
   */
  it('should update last check timestamp when user declines', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Europe/Paris');
    mockUpdatePreferences.mockResolvedValue({} as any);

    const { result } = renderHook(() => useTimezoneChangeDetection());

    // Wait for prompt to show
    await waitFor(() => {
      expect(result.current.state.showPrompt).toBe(true);
    });

    // Decline the change
    await act(async () => {
      await result.current.handlers.handleDecline();
    });

    // Should update only last check timestamp (not timezone)
    expect(mockUpdatePreferences).toHaveBeenCalledWith(mockUserId, {
      last_timezone_check: expect.any(String),
    });

    // Prompt should be hidden
    expect(result.current.state.showPrompt).toBe(false);
  });

  /**
   * Test: Only checks once per session
   * Validates: Non-blocking operation
   */
  it('should only check once per session', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/Los_Angeles');

    renderHook(() => useTimezoneChangeDetection());

    // Wait for initial check
    await waitFor(() => {
      expect(mockGetPreferences).toHaveBeenCalledTimes(1);
    });

    // Simulate multiple foreground events
    simulateForeground();
    simulateForeground();
    simulateForeground();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should still only have checked once
    expect(mockGetPreferences).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Handles errors gracefully
   * Validates: Requirement 5.4 (non-blocking operation)
   */
  it('should handle errors gracefully without crashing', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    const mockError = new Error('Network error');
    mockGetPreferences.mockRejectedValue(mockError);

    // Hook should not throw
    expect(() => {
      renderHook(() => useTimezoneChangeDetection());
    }).not.toThrow();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '❌ Error checking timezone change:',
        expect.objectContaining({
          userId: mockUserId,
          error: 'Network error',
        })
      );
    });
  });

  /**
   * Test: Does not run when user is not authenticated
   * Validates: Non-blocking operation
   */
  it('should not run when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
    } as any);

    renderHook(() => useTimezoneChangeDetection());

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not call any services
    expect(mockGetPreferences).not.toHaveBeenCalled();
  });

  /**
   * Test: Provides modal state and handlers
   * Validates: Requirement 5.3, 5.4
   */
  it('should provide modal state and handlers', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/Chicago');

    const { result } = renderHook(() => useTimezoneChangeDetection());

    // Wait for prompt
    await waitFor(() => {
      expect(result.current.state.showPrompt).toBe(true);
    });

    // Verify state structure
    expect(result.current.state).toMatchObject({
      showPrompt: true,
      oldTimezone: 'America/New_York',
      newTimezone: 'America/Chicago',
      isChecking: false,
    });

    // Verify handlers exist
    expect(typeof result.current.handlers.handleAccept).toBe('function');
    expect(typeof result.current.handlers.handleDecline).toBe('function');
  });

  /**
   * Test: Handles accept errors gracefully
   * Validates: Requirement 5.4 (non-blocking operation)
   */
  it('should handle accept errors gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Europe/Berlin');
    mockUpdatePreferences.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useTimezoneChangeDetection());

    await waitFor(() => {
      expect(result.current.state.showPrompt).toBe(true);
    });

    // Accept should not throw
    await act(async () => {
      await expect(result.current.handlers.handleAccept()).resolves.not.toThrow();
    });

    // Error should be logged
    expect(console.error).toHaveBeenCalledWith(
      '❌ Error updating timezone:',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Update failed',
      })
    );

    // Prompt should still be hidden
    expect(result.current.state.showPrompt).toBe(false);
  });

  /**
   * Test: Handles decline errors gracefully
   * Validates: Requirement 5.4 (non-blocking operation)
   */
  it('should handle decline errors gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/New_York',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Australia/Sydney');
    mockUpdatePreferences.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useTimezoneChangeDetection());

    await waitFor(() => {
      expect(result.current.state.showPrompt).toBe(true);
    });

    // Decline should not throw
    await act(async () => {
      await expect(result.current.handlers.handleDecline()).resolves.not.toThrow();
    });

    // Error should be logged
    expect(console.error).toHaveBeenCalledWith(
      '❌ Error updating last check timestamp:',
      expect.objectContaining({
        userId: mockUserId,
        error: 'Update failed',
      })
    );

    // Prompt should still be hidden
    expect(result.current.state.showPrompt).toBe(false);
  });

  /**
   * Test: Cleans up AppState listener on unmount
   * Validates: Non-blocking operation
   */
  it('should clean up AppState listener on unmount', () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    const { unmount } = renderHook(() => useTimezoneChangeDetection());

    // Verify listener was added
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    // Unmount
    unmount();

    // Verify listeners were cleaned up
    expect(appStateListeners.length).toBe(0);
  });

  /**
   * Test: Shows both old and new timezone in state
   * Validates: Requirement 5.3
   */
  it('should show both old and new timezone in state', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'Europe/London',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Asia/Dubai');

    const { result } = renderHook(() => useTimezoneChangeDetection());

    await waitFor(() => {
      expect(result.current.state.showPrompt).toBe(true);
    });

    expect(result.current.state.oldTimezone).toBe('Europe/London');
    expect(result.current.state.newTimezone).toBe('Asia/Dubai');
  });

  /**
   * Test: Logs timezone change detection
   * Validates: Monitoring and debugging
   */
  it('should log timezone change detection', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/Denver',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/Phoenix');

    renderHook(() => useTimezoneChangeDetection());

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        '🔔 Timezone changed, showing prompt:',
        expect.objectContaining({
          oldTimezone: 'America/Denver',
          newTimezone: 'America/Phoenix',
        })
      );
    });
  });
});
