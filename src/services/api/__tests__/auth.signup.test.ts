/**
 * Tests for user signup flow with notification preferences creation
 * Validates: Requirement 12.2
 */

import { AuthService } from '../auth';
import { NotificationPreferencesService } from '../notificationPreferences';
import { supabase } from '../../../lib/supabase';

// Mock the dependencies
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('../notificationPreferences');

describe('AuthService.signUp - Notification Preferences Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create default notification preferences when user signs up', async () => {
    const mockUserId = 'test-user-id-123';
    const mockEmail = 'test@example.com';
    const mockName = 'Test User';

    // Mock successful signup
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
          email: mockEmail,
        },
        session: null,
      },
      error: null,
    });

    // Mock profile creation
    const mockFrom = jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: mockUserId, email: mockEmail, name: mockName },
            error: null,
          }),
        }),
      }),
    });
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    // Mock notification preferences creation
    (NotificationPreferencesService.createDefaultPreferences as jest.Mock).mockResolvedValue({
      user_id: mockUserId,
      flash_offers_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
      timezone: 'UTC',
      max_distance_miles: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Call signUp
    await AuthService.signUp(mockEmail, 'password123', mockName);

    // Verify createDefaultPreferences was called with correct user ID
    expect(NotificationPreferencesService.createDefaultPreferences).toHaveBeenCalledWith(mockUserId);
    expect(NotificationPreferencesService.createDefaultPreferences).toHaveBeenCalledTimes(1);
  });

  it('should not block signup if notification preferences creation fails', async () => {
    const mockUserId = 'test-user-id-456';
    const mockEmail = 'test2@example.com';

    // Mock successful signup
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
          email: mockEmail,
        },
        session: null,
      },
      error: null,
    });

    // Mock profile creation
    const mockFrom = jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: mockUserId, email: mockEmail, name: null },
            error: null,
          }),
        }),
      }),
    });
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    // Mock notification preferences creation failure
    (NotificationPreferencesService.createDefaultPreferences as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    // Call signUp - should not throw
    const result = await AuthService.signUp(mockEmail, 'password123');

    // Verify signup still succeeded
    expect(result.user?.id).toBe(mockUserId);
    expect(NotificationPreferencesService.createDefaultPreferences).toHaveBeenCalledWith(mockUserId);
  });

  it('should not call createDefaultPreferences if user creation fails', async () => {
    const mockEmail = 'test3@example.com';

    // Mock failed signup
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: { message: 'Email already exists' },
    });

    // Call signUp - should throw
    await expect(AuthService.signUp(mockEmail, 'password123')).rejects.toThrow('Sign up failed');

    // Verify createDefaultPreferences was NOT called
    expect(NotificationPreferencesService.createDefaultPreferences).not.toHaveBeenCalled();
  });
});
