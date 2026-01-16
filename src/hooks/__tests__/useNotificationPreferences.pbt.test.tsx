/**
 * Property-Based Tests for useNotificationPreferences Hook
 * Feature: social-push-notifications
 * 
 * Tests Properties 17 and 18:
 * - Property 17: Preference Sync - Validates Requirements 8.10
 * - Property 18: Immediate Preference Save - Validates Requirements 8.9
 */

import * as fc from 'fast-check';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useNotificationPreferences } from '../useNotificationPreferences';
import { NotificationService } from '../../services/api/notifications';
import { supabase } from '../../lib/supabase';
import type { NotificationPreferences } from '../../types/social.types';

// Mock dependencies
jest.mock('../../lib/supabase');
jest.mock('../../services/api/notifications');

// Create a mock user that can be updated
const mockUser = { id: 'test-user-id' };
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
  })),
}));

describe('useNotificationPreferences - Property-Based Tests', () => {
  // Mock user ID for tests
  const mockUserId = 'test-user-id';

  // Default preferences for testing
  const defaultPreferences: NotificationPreferences = {
    user_id: mockUserId,
    friend_requests: true,
    friend_accepted: true,
    follow_requests: true,
    new_followers: true,
    venue_shares: true,
    group_outing_invites: true,
    group_outing_reminders: true,
    collection_follows: true,
    collection_updates: false,
    activity_likes: false,
    activity_comments: true,
    friend_checkins_nearby: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Mock Supabase channel subscription
  let mockSubscription: any;
  let mockChannelCallback: ((payload: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock subscription
    mockSubscription = {
      unsubscribe: jest.fn(),
    };

    // Mock Supabase channel with subscription
    (supabase.channel as jest.Mock) = jest.fn(() => ({
      on: jest.fn((event: string, config: any, callback: (payload: any) => void) => {
        mockChannelCallback = callback;
        return {
          subscribe: jest.fn(() => mockSubscription),
        };
      }),
    }));

    // Mock NotificationService methods with proper async behavior
    (NotificationService.getNotificationPreferences as jest.Mock) = jest
      .fn()
      .mockImplementation(async () => {
        // Simulate async delay
        await new Promise(resolve => setTimeout(resolve, 0));
        return defaultPreferences;
      });

    (NotificationService.updateNotificationPreferences as jest.Mock) = jest.fn(
      async (userId: string, updates: Partial<NotificationPreferences>) => {
        // Simulate async delay
        await new Promise(resolve => setTimeout(resolve, 0));
        return {
          ...defaultPreferences,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      }
    );
  });

  afterEach(() => {
    mockChannelCallback = null;
  });

  describe('Property 18: Immediate Preference Save', () => {
    /**
     * Feature: social-push-notifications, Property 18: Immediate Preference Save
     * Validates: Requirements 8.9
     * 
     * For any user preference change, it should be saved to the database immediately.
     * This ensures that preference changes are persisted without delay and are
     * available for cross-device sync.
     */
    it('should immediately save any preference change to the database', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random preference key and boolean value
          fc.constantFrom(
            'friend_requests',
            'friend_accepted',
            'follow_requests',
            'new_followers',
            'venue_shares',
            'group_outing_invites',
            'group_outing_reminders',
            'collection_follows',
            'collection_updates',
            'activity_likes',
            'activity_comments',
            'friend_checkins_nearby'
          ),
          fc.boolean(),
          async (preferenceKey, newValue) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Render the hook
            const { result } = renderHook(() => useNotificationPreferences());

            // Wait for initial load with increased timeout
            await waitFor(
              () => {
                expect(result.current.loading).toBe(false);
                expect(result.current.preferences).toBeTruthy();
              },
              { timeout: 3000 }
            );

            // Update the preference
            await act(async () => {
              await result.current.updatePreference(
                preferenceKey as keyof Omit<
                  NotificationPreferences,
                  'user_id' | 'created_at' | 'updated_at'
                >,
                newValue
              );
            });

            // Verify that updateNotificationPreferences was called immediately
            expect(NotificationService.updateNotificationPreferences).toHaveBeenCalledTimes(1);
            expect(NotificationService.updateNotificationPreferences).toHaveBeenCalledWith(
              mockUserId,
              { [preferenceKey]: newValue }
            );

            // Verify the preference was updated in local state
            await waitFor(
              () => {
                expect(result.current.preferences).toBeTruthy();
                expect(result.current.preferences![preferenceKey]).toBe(newValue);
              },
              { timeout: 3000 }
            );
          }
        ),
        { numRuns: 100 }
      );
    }, 120000); // 2 minute timeout for the entire property test

    it('should save multiple sequential preference changes immediately', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of preference changes
          fc.array(
            fc.record({
              key: fc.constantFrom(
                'friend_requests',
                'friend_accepted',
                'venue_shares',
                'activity_likes'
              ),
              value: fc.boolean(),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (preferenceChanges) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Render the hook
            const { result } = renderHook(() => useNotificationPreferences());

            // Wait for initial load with increased timeout
            await waitFor(
              () => {
                expect(result.current.loading).toBe(false);
                expect(result.current.preferences).toBeTruthy();
              },
              { timeout: 3000 }
            );

            // Apply each preference change sequentially
            for (const change of preferenceChanges) {
              await act(async () => {
                await result.current.updatePreference(
                  change.key as keyof Omit<
                    NotificationPreferences,
                    'user_id' | 'created_at' | 'updated_at'
                  >,
                  change.value
                );
              });
            }

            // Verify that updateNotificationPreferences was called for each change
            expect(NotificationService.updateNotificationPreferences).toHaveBeenCalledTimes(
              preferenceChanges.length
            );

            // Verify each call had the correct parameters
            preferenceChanges.forEach((change, index) => {
              expect(NotificationService.updateNotificationPreferences).toHaveBeenNthCalledWith(
                index + 1,
                mockUserId,
                { [change.key]: change.value }
              );
            });
          }
        ),
        { numRuns: 50 }
      );
    }, 120000); // 2 minute timeout

    it('should persist preference changes even if value is the same as current', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'friend_requests',
            'venue_shares',
            'activity_comments'
          ),
          fc.boolean(),
          async (preferenceKey, value) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Set up initial preferences with the same value
            const initialPrefs = {
              ...defaultPreferences,
              [preferenceKey]: value,
            };

            (NotificationService.getNotificationPreferences as jest.Mock).mockImplementation(
              async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
                return initialPrefs;
              }
            );

            // Render the hook
            const { result } = renderHook(() => useNotificationPreferences());

            // Wait for initial load with increased timeout
            await waitFor(
              () => {
                expect(result.current.loading).toBe(false);
                expect(result.current.preferences).toBeTruthy();
              },
              { timeout: 3000 }
            );

            // Update with the same value
            await act(async () => {
              await result.current.updatePreference(
                preferenceKey as keyof Omit<
                  NotificationPreferences,
                  'user_id' | 'created_at' | 'updated_at'
                >,
                value
              );
            });

            // Verify that updateNotificationPreferences was still called
            // (immediate save happens regardless of whether value changed)
            expect(NotificationService.updateNotificationPreferences).toHaveBeenCalledTimes(1);
            expect(NotificationService.updateNotificationPreferences).toHaveBeenCalledWith(
              mockUserId,
              { [preferenceKey]: value }
            );
          }
        ),
        { numRuns: 100 }
      );
    }, 120000); // 2 minute timeout
  });

  describe('Property 17: Preference Sync', () => {
    /**
     * Feature: social-push-notifications, Property 17: Preference Sync
     * Validates: Requirements 8.10
     * 
     * For any user preference change, it should be synced across all of that user's devices.
     * This is achieved through Supabase real-time subscriptions that listen for changes
     * to the notification_preferences table.
     */
    it('should sync preference changes from another device via real-time subscription', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random preference updates from "another device"
          fc.constantFrom(
            'friend_requests',
            'friend_accepted',
            'venue_shares',
            'activity_likes',
            'collection_follows'
          ),
          fc.boolean(),
          async (preferenceKey, newValue) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Render the hook
            const { result } = renderHook(() => useNotificationPreferences());

            // Wait for initial load with increased timeout
            await waitFor(
              () => {
                expect(result.current.loading).toBe(false);
                expect(result.current.preferences).toBeTruthy();
              },
              { timeout: 3000 }
            );

            // Verify subscription was set up
            expect(supabase.channel).toHaveBeenCalledWith(
              `notification_preferences:${mockUserId}`
            );

            // Simulate a preference change from another device
            const updatedPreferences = {
              ...defaultPreferences,
              [preferenceKey]: newValue,
              updated_at: new Date().toISOString(),
            };

            // Trigger the subscription callback (simulating real-time update)
            await act(async () => {
              if (mockChannelCallback) {
                mockChannelCallback({
                  new: updatedPreferences,
                  old: defaultPreferences,
                });
              }
            });

            // Verify the local state was updated with the synced preferences
            await waitFor(
              () => {
                expect(result.current.preferences).toBeTruthy();
                expect(result.current.preferences![preferenceKey]).toBe(newValue);
              },
              { timeout: 3000 }
            );
          }
        ),
        { numRuns: 100 }
      );
    }, 120000); // 2 minute timeout

    it('should sync multiple preference changes from another device', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate multiple preference updates
          fc.array(
            fc.record({
              key: fc.constantFrom(
                'friend_requests',
                'venue_shares',
                'activity_likes',
                'collection_updates'
              ),
              value: fc.boolean(),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (preferenceChanges) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Render the hook
            const { result } = renderHook(() => useNotificationPreferences());

            // Wait for initial load with increased timeout
            await waitFor(
              () => {
                expect(result.current.loading).toBe(false);
                expect(result.current.preferences).toBeTruthy();
              },
              { timeout: 3000 }
            );

            // Apply each preference change via subscription (from another device)
            let currentPreferences = { ...defaultPreferences };

            for (const change of preferenceChanges) {
              currentPreferences = {
                ...currentPreferences,
                [change.key]: change.value,
                updated_at: new Date().toISOString(),
              };

              // Trigger the subscription callback
              await act(async () => {
                if (mockChannelCallback) {
                  mockChannelCallback({
                    new: currentPreferences,
                    old: defaultPreferences,
                  });
                }
              });

              // Wait for state update
              await waitFor(
                () => {
                  expect(result.current.preferences![change.key]).toBe(change.value);
                },
                { timeout: 3000 }
              );
            }

            // Verify final state matches the last update for each key
            // Build a map of the last value for each key
            const finalValues = new Map<string, boolean>();
            for (const change of preferenceChanges) {
              finalValues.set(change.key, change.value);
            }

            // Verify each key has its final value
            finalValues.forEach((value, key) => {
              expect(result.current.preferences![key]).toBe(value);
            });
          }
        ),
        { numRuns: 50 }
      );
    }, 120000); // 2 minute timeout

    it('should maintain subscription throughout component lifecycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (numUpdates) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Render the hook
            const { result, unmount } = renderHook(() => useNotificationPreferences());

            // Wait for initial load with increased timeout
            await waitFor(
              () => {
                expect(result.current.loading).toBe(false);
                expect(result.current.preferences).toBeTruthy();
              },
              { timeout: 3000 }
            );

            // Verify subscription was set up
            expect(supabase.channel).toHaveBeenCalledTimes(1);

            // Simulate multiple updates from another device
            for (let i = 0; i < numUpdates; i++) {
              const updatedPreferences = {
                ...defaultPreferences,
                friend_requests: i % 2 === 0,
                updated_at: new Date().toISOString(),
              };

              await act(async () => {
                if (mockChannelCallback) {
                  mockChannelCallback({
                    new: updatedPreferences,
                    old: defaultPreferences,
                  });
                }
              });

              await waitFor(
                () => {
                  expect(result.current.preferences?.friend_requests).toBe(i % 2 === 0);
                },
                { timeout: 3000 }
              );
            }

            // Unmount and verify cleanup
            unmount();

            // Verify subscription was cleaned up
            expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 50 }
      );
    }, 120000); // 2 minute timeout

    it('should handle concurrent updates from local and remote sources', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('friend_requests', 'venue_shares', 'activity_likes'),
          fc.boolean(),
          fc.boolean(),
          async (preferenceKey, localValue, remoteValue) => {
            // Skip if values are the same (not interesting for this test)
            if (localValue === remoteValue) {
              return;
            }

            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Render the hook
            const { result } = renderHook(() => useNotificationPreferences());

            // Wait for initial load with increased timeout
            await waitFor(
              () => {
                expect(result.current.loading).toBe(false);
                expect(result.current.preferences).toBeTruthy();
              },
              { timeout: 3000 }
            );

            // Make a local update
            await act(async () => {
              await result.current.updatePreference(
                preferenceKey as keyof Omit<
                  NotificationPreferences,
                  'user_id' | 'created_at' | 'updated_at'
                >,
                localValue
              );
            });

            // Wait for local update to complete
            await waitFor(
              () => {
                expect(result.current.preferences![preferenceKey]).toBe(localValue);
              },
              { timeout: 3000 }
            );

            // Simulate a remote update (from another device)
            const remotePreferences = {
              ...defaultPreferences,
              [preferenceKey]: remoteValue,
              updated_at: new Date().toISOString(),
            };

            await act(async () => {
              if (mockChannelCallback) {
                mockChannelCallback({
                  new: remotePreferences,
                  old: defaultPreferences,
                });
              }
            });

            // Verify that remote update takes precedence (last write wins)
            await waitFor(
              () => {
                expect(result.current.preferences![preferenceKey]).toBe(remoteValue);
              },
              { timeout: 3000 }
            );
          }
        ),
        { numRuns: 100 }
      );
    }, 120000); // 2 minute timeout
  });
});
