/**
 * Integration Tests for Timezone Migration in App.tsx
 * 
 * Tests that the useTimezoneMigration hook is properly integrated into the
 * main app component and runs after user authentication.
 * 
 * Requirements: 4.1, 4.4
 * 
 * Note: These tests verify the hook integration by testing the hook behavior
 * in a realistic context rather than rendering the full App component.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useTimezoneMigration } from '../../src/hooks/useTimezoneMigration';
import { NotificationPreferencesService } from '../../src/services/api/notificationPreferences';
import { getDeviceTimezone } from '../../src/utils/timezone';

// Mock dependencies
jest.mock('../../src/services/api/notificationPreferences');
jest.mock('../../src/utils/timezone');
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Import after mocking
import { useAuth } from '../../src/contexts/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetPreferences = NotificationPreferencesService.getPreferences as jest.MockedFunction<
  typeof NotificationPreferencesService.getPreferences
>;
const mockUpdatePreferences = NotificationPreferencesService.updatePreferences as jest.MockedFunction<
  typeof NotificationPreferencesService.updatePreferences
>;
const mockGetDeviceTimezone = getDeviceTimezone as jest.MockedFunction<typeof getDeviceTimezone>;

describe('Timezone Migration Integration in App.tsx', () => {
  const mockUserId = 'test-user-integration-123';

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  /**
   * Test: Migration hook runs on app startup for authenticated users
   * Validates: Requirements 4.1, 4.4
   * 
   * This test verifies that when the hook is integrated into App.tsx,
   * it will run automatically for authenticated users.
   */
  it('should run migration hook on app startup for authenticated users', async () => {
    // Setup: Authenticated user with UTC timezone and no quiet hours
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId, email: 'test@example.com' } as any,
      session: { access_token: 'mock-token' } as any,
      userType: 'customer',
      venueBusinessAccount: null,
      loading: false,
      initializing: false,
      authError: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      refreshUserType: jest.fn(),
      clearAuthError: jest.fn(),
    });

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('America/New_York');
    mockUpdatePreferences.mockResolvedValue({} as any);

    // Render the hook (simulating App.tsx integration)
    renderHook(() => useTimezoneMigration());

    // Wait for migration to be triggered
    await waitFor(
      () => {
        expect(mockGetPreferences).toHaveBeenCalledWith(mockUserId);
      },
      { timeout: 3000 }
    );

    // Verify migration was executed
    await waitFor(
      () => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith(mockUserId, {
          timezone: 'America/New_York',
        });
      },
      { timeout: 3000 }
    );

    // Verify logging
    expect(console.log).toHaveBeenCalledWith(
      '✅ Timezone migration successful:',
      expect.objectContaining({
        userId: mockUserId,
        oldTimezone: 'UTC',
        newTimezone: 'America/New_York',
        trigger: 'auto-migration',
      })
    );
  });

  /**
   * Test: Migration hook does not run for unauthenticated users
   * Validates: Requirement 4.1
   */
  it('should NOT run migration hook when user is not authenticated', async () => {
    // Setup: No authenticated user
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      userType: null,
      venueBusinessAccount: null,
      loading: false,
      initializing: false,
      authError: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      refreshUserType: jest.fn(),
      clearAuthError: jest.fn(),
    });

    // Render the hook
    renderHook(() => useTimezoneMigration());

    // Wait a bit to ensure nothing happens
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify migration was NOT triggered
    expect(mockGetPreferences).not.toHaveBeenCalled();
    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  /**
   * Test: Migration does not block app startup
   * Validates: Requirement 4.4
   * 
   * This test verifies that the hook returns immediately and runs
   * migration in the background, which is critical for app startup performance.
   */
  it('should not block app startup while migration runs', async () => {
    // Setup: Authenticated user
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId, email: 'test@example.com' } as any,
      session: { access_token: 'mock-token' } as any,
      userType: 'customer',
      venueBusinessAccount: null,
      loading: false,
      initializing: false,
      authError: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      refreshUserType: jest.fn(),
      clearAuthError: jest.fn(),
    });

    // Simulate slow migration
    mockGetPreferences.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                user_id: mockUserId,
                timezone: 'UTC',
                quiet_hours_start: null,
                quiet_hours_end: null,
                flash_offers_enabled: true,
                max_distance_miles: null,
                last_timezone_check: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }),
            1000
          )
        )
    );

    mockGetDeviceTimezone.mockReturnValue('America/Los_Angeles');
    mockUpdatePreferences.mockResolvedValue({} as any);

    // Hook should render immediately (non-blocking)
    const startTime = Date.now();
    const { result } = renderHook(() => useTimezoneMigration());
    const renderTime = Date.now() - startTime;

    // Hook should return quickly (< 10ms)
    expect(renderTime).toBeLessThan(10);

    // Hook returns void
    expect(result.current).toBeUndefined();

    // Migration happens in background
    await waitFor(
      () => {
        expect(mockGetPreferences).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  /**
   * Test: Migration errors are logged but don't crash app
   * Validates: Requirement 4.4
   */
  it('should handle migration errors gracefully without crashing app', async () => {
    // Setup: Authenticated user
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId, email: 'test@example.com' } as any,
      session: { access_token: 'mock-token' } as any,
      userType: 'customer',
      venueBusinessAccount: null,
      loading: false,
      initializing: false,
      authError: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      refreshUserType: jest.fn(),
      clearAuthError: jest.fn(),
    });

    // Simulate migration error
    mockGetPreferences.mockRejectedValue(new Error('Network error'));

    // Hook should not throw
    expect(() => {
      renderHook(() => useTimezoneMigration());
    }).not.toThrow();

    // Wait for error to be logged
    await waitFor(
      () => {
        expect(console.error).toHaveBeenCalledWith(
          '❌ Timezone migration failed:',
          expect.objectContaining({
            userId: mockUserId,
            error: 'Network error',
          })
        );
      },
      { timeout: 3000 }
    );
  });

  /**
   * Test: Migration only runs once per app session
   * Validates: Requirement 4.1
   */
  it('should run migration only once per app session', async () => {
    // Setup: Authenticated user
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId, email: 'test@example.com' } as any,
      session: { access_token: 'mock-token' } as any,
      userType: 'customer',
      venueBusinessAccount: null,
      loading: false,
      initializing: false,
      authError: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      refreshUserType: jest.fn(),
      clearAuthError: jest.fn(),
    });

    mockGetPreferences.mockResolvedValue({
      user_id: mockUserId,
      timezone: 'UTC',
      quiet_hours_start: null,
      quiet_hours_end: null,
      flash_offers_enabled: true,
      max_distance_miles: null,
      last_timezone_check: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockGetDeviceTimezone.mockReturnValue('Europe/London');
    mockUpdatePreferences.mockResolvedValue({} as any);

    // Render the hook
    const { rerender } = renderHook(() => useTimezoneMigration());

    // Wait for first migration
    await waitFor(
      () => {
        expect(mockGetPreferences).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    // Rerender the hook (simulating component updates in App.tsx)
    rerender();
    rerender();

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Migration should still only have been called once
    expect(mockGetPreferences).toHaveBeenCalledTimes(1);
    expect(mockUpdatePreferences).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Verify hook is properly exported and can be imported
   * Validates: Integration requirement
   */
  it('should be properly exported and importable for App.tsx integration', () => {
    // Verify the hook is a function
    expect(typeof useTimezoneMigration).toBe('function');

    // Verify the hook can be called
    mockUseAuth.mockReturnValue({
      user: null,
    } as any);

    expect(() => {
      renderHook(() => useTimezoneMigration());
    }).not.toThrow();
  });
});
