/**
 * useNotificationPreferences Hook
 * 
 * Manages notification preferences for the current user.
 * Handles loading, updating, and syncing preferences across devices.
 * Implements real-time sync using Supabase subscriptions.
 * 
 * Requirements: 2.4, 8.1, 8.2, 8.9, 8.10
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../services/api/notifications';
import { supabase } from '../lib/supabase';
import type { NotificationPreferences } from '../types/social.types';

interface UseNotificationPreferencesResult {
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: Error | null;
  updatePreference: (
    key: keyof Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>,
    value: boolean
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage notification preferences for the current user
 * 
 * @returns Notification preferences state and update functions
 */
export function useNotificationPreferences(): UseNotificationPreferencesResult {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load notification preferences from the database
   */
  const loadPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const prefs = await NotificationService.getNotificationPreferences(user.id);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Update a single notification preference
   * Immediately saves to database for cross-device sync
   */
  const updatePreference = useCallback(
    async (
      key: keyof Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>,
      value: boolean
    ) => {
      if (!user || !preferences) {
        throw new Error('Cannot update preferences: user not logged in');
      }

      try {
        // Optimistically update local state
        setPreferences((prev) => {
          if (!prev) return prev;
          return { ...prev, [key]: value };
        });

        // Save to database
        const updated = await NotificationService.updateNotificationPreferences(user.id, {
          [key]: value,
        });

        // Update with server response
        setPreferences(updated);
        
        console.log(`✅ Preference ${key} updated to ${value}`);
      } catch (err) {
        console.error('Error updating notification preference:', err);
        
        // Revert optimistic update on error
        await loadPreferences();
        
        throw err;
      }
    },
    [user, preferences, loadPreferences]
  );

  /**
   * Refetch preferences from the database
   * Useful for syncing after changes on another device
   */
  const refetch = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Set up real-time subscription for cross-device sync
  // Requirements: 8.9, 8.10
  useEffect(() => {
    if (!user) {
      return;
    }

    console.log('🔄 Setting up real-time preference sync for user:', user.id);

    // Subscribe to changes in notification_preferences table for this user
    const subscription = supabase
      .channel(`notification_preferences:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_preferences',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Preference change detected from another device:', payload);
          
          // Update local state with the new preferences
          if (payload.new) {
            setPreferences(payload.new as NotificationPreferences);
            console.log('✅ Preferences synced from another device');
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('🔕 Removing real-time preference sync');
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    refetch,
  };
}
