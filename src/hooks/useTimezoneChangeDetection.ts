/**
 * useTimezoneChangeDetection Hook
 * 
 * Detects when the device timezone changes and prompts the user to update
 * their notification preferences. Includes a 7-day cooldown to prevent
 * prompt fatigue.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { NotificationPreferencesService } from '../services/api/notificationPreferences';
import { getDeviceTimezone } from '../utils/timezone';

/**
 * State returned by the timezone change detection hook
 */
export interface TimezoneChangeState {
  /** Whether to show the timezone change prompt modal */
  showPrompt: boolean;
  /** The old timezone stored in preferences */
  oldTimezone: string;
  /** The new timezone detected on the device */
  newTimezone: string;
  /** Whether the hook is currently checking for timezone changes */
  isChecking: boolean;
}

/**
 * Handlers for accepting or declining timezone changes
 */
export interface TimezoneChangeHandlers {
  /** Handler for when user accepts the timezone change */
  handleAccept: () => Promise<void>;
  /** Handler for when user declines the timezone change */
  handleDecline: () => Promise<void>;
}

/**
 * Return type of the useTimezoneChangeDetection hook
 */
export interface UseTimezoneChangeDetectionReturn {
  state: TimezoneChangeState;
  handlers: TimezoneChangeHandlers;
}

/**
 * Number of days to wait before prompting again after user declines
 */
const COOLDOWN_DAYS = 7;

/**
 * Hook to detect timezone changes and prompt user to update preferences
 * 
 * Features:
 * - Listens to app foreground events
 * - Detects current device timezone
 * - Compares with stored timezone in preferences
 * - Checks if last check was >7 days ago
 * - Shows prompt if timezone differs and cooldown expired
 * - Updates last_timezone_check timestamp
 * - Provides accept/decline handlers
 * 
 * Usage:
 * ```typescript
 * function App() {
 *   const { state, handlers } = useTimezoneChangeDetection();
 *   
 *   return (
 *     <>
 *       <AppContent />
 *       <TimezoneChangeModal
 *         visible={state.showPrompt}
 *         oldTimezone={state.oldTimezone}
 *         newTimezone={state.newTimezone}
 *         onAccept={handlers.handleAccept}
 *         onDecline={handlers.handleDecline}
 *       />
 *     </>
 *   );
 * }
 * ```
 * 
 * @returns State and handlers for timezone change detection
 */
export function useTimezoneChangeDetection(): UseTimezoneChangeDetectionReturn {
  const { user } = useAuth();
  const [state, setState] = useState<TimezoneChangeState>({
    showPrompt: false,
    oldTimezone: '',
    newTimezone: '',
    isChecking: false,
  });

  // Track if we've already checked this session to avoid duplicate checks
  const hasCheckedThisSessionRef = useRef(false);

  /**
   * Check if timezone has changed and prompt user if needed
   */
  const checkTimezoneChange = useCallback(async () => {
    // Only check if user is authenticated
    if (!user?.id) {
      return;
    }

    // Only check once per session
    if (hasCheckedThisSessionRef.current) {
      console.log('⏭️ Timezone change already checked this session');
      return;
    }

    try {
      setState(prev => ({ ...prev, isChecking: true }));
      console.log('🔍 Checking for timezone changes for user:', user.id);

      // Get current preferences
      const preferences = await NotificationPreferencesService.getPreferences(user.id);
      
      // Detect current device timezone
      const deviceTimezone = getDeviceTimezone();

      console.log('📊 Timezone check:', {
        userId: user.id,
        storedTimezone: preferences.timezone,
        deviceTimezone,
        lastCheck: preferences.last_timezone_check,
      });

      // Check if timezones differ
      if (preferences.timezone === deviceTimezone) {
        console.log('✅ Timezone matches, no prompt needed');
        hasCheckedThisSessionRef.current = true;
        setState(prev => ({ ...prev, isChecking: false }));
        return;
      }

      // Check cooldown period
      if (preferences.last_timezone_check) {
        const lastCheckDate = new Date(preferences.last_timezone_check);
        const daysSinceLastCheck = (Date.now() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastCheck < COOLDOWN_DAYS) {
          console.log(`⏭️ Cooldown active: ${daysSinceLastCheck.toFixed(1)} days since last check (need ${COOLDOWN_DAYS})`);
          hasCheckedThisSessionRef.current = true;
          setState(prev => ({ ...prev, isChecking: false }));
          return;
        }
      }

      // Show prompt
      console.log('🔔 Timezone changed, showing prompt:', {
        oldTimezone: preferences.timezone,
        newTimezone: deviceTimezone,
      });

      setState({
        showPrompt: true,
        oldTimezone: preferences.timezone,
        newTimezone: deviceTimezone,
        isChecking: false,
      });

      // Mark as checked for this session
      hasCheckedThisSessionRef.current = true;
    } catch (error) {
      console.error('❌ Error checking timezone change:', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Don't show prompt on error, just mark as checked
      hasCheckedThisSessionRef.current = true;
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, [user?.id]);

  /**
   * Handle user accepting the timezone change
   */
  const handleAccept = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      console.log('✅ User accepted timezone change:', {
        userId: user.id,
        oldTimezone: state.oldTimezone,
        newTimezone: state.newTimezone,
      });

      // Update preferences with new timezone and last check timestamp
      await NotificationPreferencesService.updatePreferences(user.id, {
        timezone: state.newTimezone,
        last_timezone_check: new Date().toISOString(),
      });

      console.log('✅ Timezone updated successfully');

      // Hide prompt
      setState(prev => ({
        ...prev,
        showPrompt: false,
      }));
    } catch (error) {
      console.error('❌ Error updating timezone:', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Hide prompt even on error (user can try again from settings)
      setState(prev => ({
        ...prev,
        showPrompt: false,
      }));
    }
  }, [user?.id, state.oldTimezone, state.newTimezone]);

  /**
   * Handle user declining the timezone change
   */
  const handleDecline = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      console.log('⏭️ User declined timezone change:', {
        userId: user.id,
        oldTimezone: state.oldTimezone,
        newTimezone: state.newTimezone,
      });

      // Update last check timestamp to start cooldown period
      await NotificationPreferencesService.updatePreferences(user.id, {
        last_timezone_check: new Date().toISOString(),
      });

      console.log('✅ Cooldown period started');

      // Hide prompt
      setState(prev => ({
        ...prev,
        showPrompt: false,
      }));
    } catch (error) {
      console.error('❌ Error updating last check timestamp:', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Hide prompt even on error
      setState(prev => ({
        ...prev,
        showPrompt: false,
      }));
    }
  }, [user?.id, state.oldTimezone, state.newTimezone]);

  /**
   * Listen to app state changes and check timezone on foreground
   */
  useEffect(() => {
    // Check immediately when hook mounts (app starts)
    checkTimezoneChange();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // Check when app comes to foreground
      if (nextAppState === 'active') {
        console.log('📱 App came to foreground, checking timezone');
        checkTimezoneChange();
      }
    });

    // Cleanup listener on unmount
    return () => {
      subscription.remove();
    };
  }, [checkTimezoneChange]);

  return {
    state,
    handlers: {
      handleAccept,
      handleDecline,
    },
  };
}
