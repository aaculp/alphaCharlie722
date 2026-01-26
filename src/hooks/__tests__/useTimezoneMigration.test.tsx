/**
 * Unit Tests for useTimezoneMigration Hook
 * 
 * Tests the automatic timezone migration functionality for existing users.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useTimezoneMigration } from '../useTimezoneMigration';
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

describe('useTimezoneMigration Hook', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  /**
   * Test: Hook runs once per session
   * Validates: Requirement 4.1
   */
  it('should run migration check only once per session', async () => {
    // Setup: User with UTC timezone and no quiet hours
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/New_York');
    mockUpdatePreferences.mockResolvedValue({} as any);

    // Render hook
    const { rerender } = renderHook(() => useTimezoneMigration());

    // Wait for migration to complete
    await waitFor(() => {
      expect(mockGetPreferences).toHaveBeenCalledTimes(1);
    });

    // Rerender hook (simulating component re-render)
    rerender();
    rerender();
    rerender();

    // Migration should still only have been called once
    expect(mockGetPreferences).toHaveBeenCalledTimes(1);
    expect(mockUpdatePreferences).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Only migrates UTC users without quiet hours
   * Validates: Requirements 4.2, 4.3
   */
  it('should migrate UTC user without quiet hours', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/Los_Angeles');
    mockUpdatePreferences.mockResolvedValue({} as any);

    renderHook(() => useTimezoneMigration());

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith(mockUserId, {
        timezone: 'America/Los_Angeles',
      });
    });
  });

  /**
   * Test: Does not migrate UTC user with quiet hours configured
   * Validates: Requirement 4.3
   */
  it('should NOT migrate UTC user with quiet hours configured', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
      flash_offers_enabled: true,
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/New_York');

    renderHook(() => useTimezoneMigration());

    await waitFor(() => {
      expect(mockGetPreferences).toHaveBeenCalled();
    });

    // Should not update preferences
    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  /**
   * Test: Does not migrate non-UTC user
   * Validates: Requirement 4.2
   */
  it('should NOT migrate user with non-UTC timezone', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'America/Chicago',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/New_York');

    renderHook(() => useTimezoneMigration());

    await waitFor(() => {
      expect(mockGetPreferences).toHaveBeenCalled();
    });

    // Should not update preferences
    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  /**
   * Test: Does not migrate if device timezone is also UTC
   * Validates: Requirement 4.2
   */
  it('should NOT migrate if device timezone is also UTC', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('UTC');

    renderHook(() => useTimezoneMigration());

    await waitFor(() => {
      expect(mockGetPreferences).toHaveBeenCalled();
    });

    // Should not update preferences
    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  /**
   * Test: Migration happens silently
   * Validates: Requirement 4.4
   */
  it('should perform migration silently without UI blocking', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Europe/London');
    mockUpdatePreferences.mockResolvedValue({} as any);

    // Hook should return immediately (non-blocking)
    const { result } = renderHook(() => useTimezoneMigration());

    // Hook returns void, so result.current is undefined
    expect(result.current).toBeUndefined();

    // Migration happens in background
    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalled();
    });
  });

  /**
   * Test: Errors logged but don't crash app
   * Validates: Requirements 4.5, 4.6
   */
  it('should log errors gracefully without crashing', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    const mockError = new Error('Database connection failed');
    mockGetPreferences.mockRejectedValue(mockError);

    // Hook should not throw
    expect(() => {
      renderHook(() => useTimezoneMigration());
    }).not.toThrow();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '❌ Timezone migration failed:',
        expect.objectContaining({
          userId: mockUserId,
          error: 'Database connection failed',
        })
      );
    });
  });

  /**
   * Test: Does not run when user is not authenticated
   * Validates: Requirement 4.1
   */
  it('should not run migration when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
    } as any);

    renderHook(() => useTimezoneMigration());

    // Wait a bit to ensure nothing happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not call any services
    expect(mockGetPreferences).not.toHaveBeenCalled();
    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  /**
   * Test: Logs migration for monitoring
   * Validates: Requirement 4.5
   */
  it('should log migration details for monitoring', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Asia/Tokyo');
    mockUpdatePreferences.mockResolvedValue({} as any);

    renderHook(() => useTimezoneMigration());

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        '✅ Timezone migration successful:',
        expect.objectContaining({
          userId: mockUserId,
          oldTimezone: 'UTC',
          newTimezone: 'Asia/Tokyo',
          trigger: 'auto-migration',
        })
      );
    });
  });

  /**
   * Test: Handles update errors gracefully
   * Validates: Requirements 4.5, 4.6
   */
  it('should handle update errors gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId } as any,
    } as any);

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/New_York');
    mockUpdatePreferences.mockRejectedValue(new Error('Network error'));

    renderHook(() => useTimezoneMigration());

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '❌ Timezone migration failed:',
        expect.objectContaining({
          userId: mockUserId,
          error: 'Network error',
        })
      );
    });

    // Should not throw or crash
    expect(mockUpdatePreferences).toHaveBeenCalled();
  });
});
