/**
 * useTimezoneMigration Hook
 * 
 * Handles automatic timezone migration for existing users who have 'UTC' timezone
 * and no configured quiet hours. This ensures users get the correct timezone
 * automatically without manual configuration.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationPreferencesService } from '../services/api/notificationPreferences';
import { getDeviceTimezone } from '../utils/timezone';

/**
 * Hook to automatically migrate existing users from UTC to device timezone
 * 
 * Migration Logic:
 * - Only runs once per app session
 * - Only migrates users with timezone = 'UTC'
 * - Only migrates users with no quiet hours configured
 * - Updates to detected device timezone
 * - Logs migration for monitoring
 * - Handles errors gracefully without crashing
 * 
 * This hook should be called in the main app component after user authentication.
 * 
 * @example
 * ```typescript
 * function App() {
 *   useTimezoneMigration();
 *   return <AppContent />;
 * }
 * ```
 */
export function useTimezoneMigration(): void {
  const { user } = useAuth();
  const hasMigratedRef = useRef(false);

  useEffect(() => {
    // Only run if user is authenticated
    if (!user?.id) {
      return;
    }

    // Only run once per session
    if (hasMigratedRef.current) {
      console.log('⏭️ Timezone migration already attempted this session');
      return;
    }

    // Mark as attempted to prevent duplicate runs
    hasMigratedRef.current = true;

    // Run migration asynchronously (non-blocking)
    migrateTimezoneIfNeeded(user.id);
  }, [user?.id]);
}

/**
 * Performs timezone migration for a user if needed
 * 
 * Migration Criteria:
 * 1. User's timezone is 'UTC'
 * 2. User has no quiet hours configured (both start and end are null)
 * 
 * If both conditions are met, updates to detected device timezone.
 * 
 * @param userId - ID of the user to check for migration
 */
async function migrateTimezoneIfNeeded(userId: string): Promise<void> {
  try {
    console.log('🔍 Checking if timezone migration needed for user:', userId);

    // Fetch current notification preferences
    const preferences = await NotificationPreferencesService.getPreferences(userId);

    // Check migration criteria
    const isUTC = preferences.timezone === 'UTC';
    const hasNoQuietHours = !preferences.quiet_hours_start && !preferences.quiet_hours_end;

    console.log('📊 Migration check:', {
      userId,
      currentTimezone: preferences.timezone,
      isUTC,
      hasQuietHoursStart: !!preferences.quiet_hours_start,
      hasQuietHoursEnd: !!preferences.quiet_hours_end,
      hasNoQuietHours,
      shouldMigrate: isUTC && hasNoQuietHours,
    });

    // Only migrate if both conditions are met
    if (!isUTC || !hasNoQuietHours) {
      console.log('⏭️ Timezone migration not needed:', {
        reason: !isUTC 
          ? 'User timezone is not UTC' 
          : 'User has quiet hours configured',
      });
      return;
    }

    // Detect device timezone
    const deviceTimezone = getDeviceTimezone();

    // Don't migrate if device timezone is also UTC
    if (deviceTimezone === 'UTC') {
      console.log('⏭️ Device timezone is also UTC, no migration needed');
      return;
    }

    console.log('🔄 Migrating timezone:', {
      userId,
      oldTimezone: 'UTC',
      newTimezone: deviceTimezone,
    });

    // Update preferences with detected timezone
    await NotificationPreferencesService.updatePreferences(userId, {
      timezone: deviceTimezone,
    });

    console.log('✅ Timezone migration successful:', {
      userId,
      oldTimezone: 'UTC',
      newTimezone: deviceTimezone,
      trigger: 'auto-migration',
    });
  } catch (error) {
    // Log error but don't crash the app
    console.error('❌ Timezone migration failed:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Don't throw - migration failure should not block app usage
    // User can still manually set timezone in settings if needed
  }
}
