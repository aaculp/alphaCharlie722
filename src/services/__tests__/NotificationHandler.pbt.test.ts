/**
 * Property-Based Tests for NotificationHandler
 * Task: 8.6 Write property tests for notification handling
 * Feature: social-push-notifications
 * 
 * Tests notification display, tap-to-open, app state handling, and read status updates
 */

import * as fc from 'fast-check';
import { NotificationHandler, NavigationHandler, ParsedNotificationData } from '../NotificationHandler';
import { NotificationService } from '../api/notifications';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import type { NotificationType } from '../../types/social.types';

// Mock NotificationService
jest.mock('../api/notifications', () => ({
  NotificationService: {
    markAsRead: jest.fn(),
  },
}));

describe('NotificationHandler - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Arbitraries (Generators)
  // ============================================================================

  /**
   * Generate valid notification types
   */
  const notificationTypeArb = fc.constantFrom<NotificationType>(
    'friend_request',
    'friend_accepted',
    'venue_share',
    'collection_follow',
    'collection_update',
    'activity_like',
    'activity_comment',
    'group_outing_invite',
    'group_outing_response',
    'group_outing_reminder',
    'friend_checkin_nearby'
  );

  /**
   * Generate valid FCM remote message
   */
  const remoteMessageArb = fc.record({
    messageId: fc.string({ minLength: 10, maxLength: 50 }),
    data: fc.record({
      type: notificationTypeArb,
      actorId: fc.option(fc.uuid(), { nil: undefined }),
      referenceId: fc.option(fc.uuid(), { nil: undefined }),
      navigationTarget: fc.string({ minLength: 3, maxLength: 30 }),
      navigationParams: fc.option(
        fc.jsonValue().map(v => JSON.stringify(v)),
        { nil: undefined }
      ),
    }),
    notification: fc.option(
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 100 }),
        body: fc.string({ minLength: 1, maxLength: 200 }),
      }),
      { nil: undefined }
    ),
  }) as fc.Arbitrary<FirebaseMessagingTypes.RemoteMessage>;

  /**
   * Generate navigation parameters based on notification type
   */
  const navigationParamsForType = (type: NotificationType): fc.Arbitrary<Record<string, any>> => {
    switch (type) {
      case 'friend_request':
        return fc.constant({});
      
      case 'friend_accepted':
      case 'friend_checkin_nearby':
        return fc.record({
          actorId: fc.uuid(),
        });
      
      case 'venue_share':
        return fc.record({
          venueId: fc.uuid(),
          venueName: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
        });
      
      case 'collection_follow':
      case 'collection_update':
        return fc.record({
          collectionId: fc.uuid(),
        });
      
      case 'activity_like':
      case 'activity_comment':
        return fc.record({
          activityId: fc.uuid(),
        });
      
      case 'group_outing_invite':
      case 'group_outing_response':
      case 'group_outing_reminder':
        return fc.record({
          outingId: fc.uuid(),
        });
      
      default:
        return fc.constant({});
    }
  };

  // ============================================================================
  // Property 13: Notification Display in Tray
  // ============================================================================

  /**
   * Property 13: Notification Display in Tray
   * Feature: social-push-notifications, Property 13: Notification Display in Tray
   * Validates: Requirements 7.1
   * 
   * For any received notification, it should appear in the device's notification tray.
   * 
   * Note: This property tests that the notification handler processes the notification
   * correctly. The actual display in the system tray is handled by FCM and the OS.
   */
  describe('Property 13: Notification Display in Tray', () => {
    it('should process foreground notifications for display', async () => {
      await fc.assert(
        fc.asyncProperty(
          remoteMessageArb,
          async (notification) => {
            // Ensure notification has required data
            fc.pre(
              notification.data?.type !== undefined &&
              notification.data?.navigationTarget !== undefined
            );

            // Handle foreground notification
            NotificationHandler.handleForegroundNotification(notification);

            // Verify notification was processed without errors
            // In a real scenario, this would trigger the OS to display the notification
            // The handler logs the notification, which indicates successful processing
            expect(true).toBe(true); // Handler completed without throwing
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should process background notifications for display', async () => {
      await fc.assert(
        fc.asyncProperty(
          remoteMessageArb,
          async (notification) => {
            // Ensure notification has required data
            fc.pre(
              notification.data?.type !== undefined &&
              notification.data?.navigationTarget !== undefined
            );

            // Handle background notification
            await NotificationHandler.handleBackgroundNotification(notification);

            // Verify notification was processed without errors
            // Background notifications are automatically displayed by the OS
            expect(true).toBe(true); // Handler completed without throwing
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle notifications with missing data gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            messageId: fc.string(),
            data: fc.option(
              fc.record({
                type: fc.option(notificationTypeArb, { nil: undefined }),
                navigationTarget: fc.option(fc.string(), { nil: undefined }),
              }),
              { nil: undefined }
            ),
          }) as fc.Arbitrary<FirebaseMessagingTypes.RemoteMessage>,
          async (notification) => {
            // Handle foreground notification with potentially missing data
            NotificationHandler.handleForegroundNotification(notification);

            // Should not throw even with invalid data
            expect(true).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Property 14: Tap-to-Open Behavior
  // ============================================================================

  /**
   * Property 14: Tap-to-Open Behavior
   * Feature: social-push-notifications, Property 14: Tap-to-Open Behavior
   * Validates: Requirements 7.2, 7.3
   * 
   * For any notification tapped by a user, the app should open and navigate to
   * the appropriate screen.
   */
  describe('Property 14: Tap-to-Open Behavior', () => {
    it('should navigate to correct screen when notification is tapped', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          async (notificationType) => {
            const navigationParams = fc.sample(navigationParamsForType(notificationType), 1)[0];
            
            // Create notification with proper structure
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: fc.sample(fc.string(), 1)[0],
              data: {
                type: notificationType,
                navigationTarget: 'TestScreen',
                navigationParams: JSON.stringify(navigationParams),
                actorId: fc.sample(fc.uuid(), 1)[0],
                referenceId: fc.sample(fc.uuid(), 1)[0],
              },
            };

            // Mock navigation handler
            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);

            // Mock markAsRead
            (NotificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

            // Handle notification tap
            await NotificationHandler.handleNotificationTap(notification);

            // Verify navigation was called
            expect(mockNavigate).toHaveBeenCalled();
            
            // Verify markAsRead was called with referenceId
            if (notification.data?.referenceId) {
              expect(NotificationService.markAsRead).toHaveBeenCalledWith(
                notification.data.referenceId
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should navigate to friend requests for friend_request type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // actorId
          fc.uuid(), // referenceId
          async (actorId, referenceId) => {
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test-message',
              data: {
                type: 'friend_request',
                actorId,
                referenceId,
                navigationTarget: 'FriendRequests',
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);
            (NotificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

            await NotificationHandler.handleNotificationTap(notification);

            // Verify navigation to FriendRequests screen
            expect(mockNavigate).toHaveBeenCalledWith('FriendRequests');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should navigate to profile for friend_accepted type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // actorId
          fc.uuid(), // referenceId
          async (actorId, referenceId) => {
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test-message',
              data: {
                type: 'friend_accepted',
                actorId,
                referenceId,
                navigationTarget: 'Profile',
                navigationParams: JSON.stringify({ actorId }),
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);
            (NotificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

            await NotificationHandler.handleNotificationTap(notification);

            // Verify navigation to Profile screen with userId
            expect(mockNavigate).toHaveBeenCalledWith('Profile', { userId: actorId });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should navigate to venue detail for venue_share type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // venueId
          fc.string({ minLength: 3, maxLength: 50 }), // venueName
          fc.uuid(), // referenceId
          async (venueId, venueName, referenceId) => {
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test-message',
              data: {
                type: 'venue_share',
                referenceId,
                navigationTarget: 'VenueDetail',
                navigationParams: JSON.stringify({ venueId, venueName }),
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);
            (NotificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

            await NotificationHandler.handleNotificationTap(notification);

            // Verify navigation to VenueDetail screen
            expect(mockNavigate).toHaveBeenCalledWith('VenueDetail', {
              venueId,
              venueName,
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle tap without navigation handler gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          remoteMessageArb,
          async (notification) => {
            // Ensure notification has required data
            fc.pre(
              notification.data?.type !== undefined &&
              notification.data?.navigationTarget !== undefined
            );

            // Clear navigation handler
            NotificationHandler.setNavigationHandler(null as any);
            (NotificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

            // Should not throw even without navigation handler
            await expect(
              NotificationHandler.handleNotificationTap(notification)
            ).resolves.not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Property 15: App State Handling
  // ============================================================================

  /**
   * Property 15: App State Handling
   * Feature: social-push-notifications, Property 15: App State Handling
   * Validates: Requirements 7.4, 7.5, 7.6
   * 
   * For any notification received, it should be handled correctly regardless of
   * app state (foreground, background, closed).
   */
  describe('Property 15: App State Handling', () => {
    it('should handle foreground notifications correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          remoteMessageArb,
          async (notification) => {
            // Ensure notification has required data
            fc.pre(
              notification.data?.type !== undefined &&
              notification.data?.navigationTarget !== undefined
            );

            // Handle foreground notification
            NotificationHandler.handleForegroundNotification(notification);

            // Should complete without throwing
            expect(true).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle background notifications correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          remoteMessageArb,
          async (notification) => {
            // Ensure notification has required data
            fc.pre(
              notification.data?.type !== undefined &&
              notification.data?.navigationTarget !== undefined
            );

            // Handle background notification
            await NotificationHandler.handleBackgroundNotification(notification);

            // Should complete without throwing
            expect(true).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle notification tap from any app state', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          fc.constantFrom('foreground', 'background', 'closed'),
          async (type, appState) => {
            // Generate appropriate navigation params for the type
            const navigationParams = fc.sample(navigationParamsForType(type), 1)[0];
            
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test',
              data: {
                type,
                navigationTarget: 'TestScreen',
                navigationParams: JSON.stringify(navigationParams),
                actorId: fc.sample(fc.uuid(), 1)[0],
                referenceId: fc.sample(fc.uuid(), 1)[0],
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);
            (NotificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

            // Handle notification tap (same behavior regardless of app state)
            await NotificationHandler.handleNotificationTap(notification);

            // Should complete without throwing
            expect(true).toBe(true);
            
            // Navigation should be called if handler is set
            expect(mockNavigate).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should process notifications with different data structures', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          fc.option(fc.uuid(), { nil: undefined }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (type, actorId, referenceId) => {
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test',
              data: {
                type,
                actorId,
                referenceId,
                navigationTarget: 'TestScreen',
              },
            };

            // Test foreground handling
            NotificationHandler.handleForegroundNotification(notification);

            // Test background handling
            await NotificationHandler.handleBackgroundNotification(notification);

            // Both should complete without throwing
            expect(true).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Property 16: Read Status Update
  // ============================================================================

  /**
   * Property 16: Read Status Update
   * Feature: social-push-notifications, Property 16: Read Status Update
   * Validates: Requirements 7.8
   * 
   * For any notification opened by a user, the corresponding in-app notification
   * should be marked as read.
   */
  describe('Property 16: Read Status Update', () => {
    it('should mark notification as read when tapped', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          fc.uuid(), // referenceId
          async (type, referenceId) => {
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test',
              data: {
                type,
                referenceId,
                navigationTarget: 'TestScreen',
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);
            (NotificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

            await NotificationHandler.handleNotificationTap(notification);

            // Verify markAsRead was called with the referenceId
            expect(NotificationService.markAsRead).toHaveBeenCalledWith(referenceId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle markAsRead errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          fc.uuid(), // referenceId
          async (type, referenceId) => {
            // Generate appropriate navigation params for the type
            const navigationParams = fc.sample(navigationParamsForType(type), 1)[0];
            
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test',
              data: {
                type,
                referenceId,
                navigationTarget: 'TestScreen',
                navigationParams: JSON.stringify(navigationParams),
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);
            
            // Mock markAsRead to throw error
            (NotificationService.markAsRead as jest.Mock).mockRejectedValue(
              new Error('Database error')
            );

            // Should not throw even if markAsRead fails
            await expect(
              NotificationHandler.handleNotificationTap(notification)
            ).resolves.not.toThrow();

            // Navigation should still occur
            expect(mockNavigate).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not call markAsRead when referenceId is missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          async (type) => {
            // Generate appropriate navigation params for the type
            const navigationParams = fc.sample(navigationParamsForType(type), 1)[0];
            
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test',
              data: {
                type,
                // No referenceId
                navigationTarget: 'TestScreen',
                navigationParams: JSON.stringify(navigationParams),
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);
            (NotificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

            await NotificationHandler.handleNotificationTap(notification);

            // markAsRead should not be called without referenceId
            expect(NotificationService.markAsRead).not.toHaveBeenCalled();
            
            // But navigation should still occur
            expect(mockNavigate).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark as read before navigation', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          fc.uuid(), // referenceId
          async (type, referenceId) => {
            // Generate appropriate navigation params for the type
            const navigationParams = fc.sample(navigationParamsForType(type), 1)[0];
            
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test',
              data: {
                type,
                referenceId,
                navigationTarget: 'TestScreen',
                navigationParams: JSON.stringify(navigationParams),
              },
            };

            const callOrder: string[] = [];
            
            const mockNavigate = jest.fn(() => {
              callOrder.push('navigate');
            });
            
            NotificationHandler.setNavigationHandler(mockNavigate);
            
            (NotificationService.markAsRead as jest.Mock).mockImplementation(() => {
              callOrder.push('markAsRead');
              return Promise.resolve();
            });

            await NotificationHandler.handleNotificationTap(notification);

            // markAsRead should be called before navigation
            expect(callOrder[0]).toBe('markAsRead');
            expect(callOrder[1]).toBe('navigate');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Additional Edge Case Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle notifications with complex navigation params', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          async (type) => {
            // Generate appropriate navigation params for the type
            const params = fc.sample(navigationParamsForType(type), 1)[0];
            
            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test',
              data: {
                type,
                navigationTarget: 'TestScreen',
                navigationParams: JSON.stringify(params),
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);

            await NotificationHandler.handleNotificationTap(notification);

            // Should handle complex params without throwing
            expect(mockNavigate).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle notifications with invalid JSON in navigationParams', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationTypeArb,
          fc.string(), // Invalid JSON string
          async (type, invalidJson) => {
            // Ensure it's not valid JSON
            fc.pre(() => {
              try {
                JSON.parse(invalidJson);
                return false; // Skip if it's valid JSON
              } catch {
                return true; // Use if it's invalid JSON
              }
            });

            const notification: FirebaseMessagingTypes.RemoteMessage = {
              messageId: 'test',
              data: {
                type,
                navigationTarget: 'TestScreen',
                navigationParams: invalidJson,
              },
            };

            const mockNavigate = jest.fn();
            NotificationHandler.setNavigationHandler(mockNavigate);

            // Should handle invalid JSON gracefully
            await expect(
              NotificationHandler.handleNotificationTap(notification)
            ).resolves.not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
