# Design Document: Social Push Notifications

## Overview

The Social Push Notifications system replaces the current polling-based notification system with real-time push notifications via Firebase Cloud Messaging (FCM). This eliminates the 30-second polling interval, reducing battery drain and API calls while providing instant notifications for social interactions like friend requests, venue shares, and activity updates.

The system integrates seamlessly with the existing social notification infrastructure, reusing the `social_notifications` table and `notification_preferences` table while adding FCM device token management and push delivery capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Social Event Triggers                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Friend Request│  │Friend Accepted│  │ Venue Share  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NotificationService (Existing)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Creates in-app notification in social_notifications  │  │
│  │ Calls PushNotificationService to send push          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           PushNotificationService (New)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Check User   │  │  Get Device  │  │  Send via    │     │
│  │ Preferences  │  │    Tokens    │  │     FCM      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Firebase Cloud Messaging                      │
│                    (FCM Service)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    User Devices                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  iOS Device  │  │Android Device│  │  Notification│     │
│  │   (APNs)     │  │    (FCM)     │  │   Handler    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Social Event Occurs**
   - User sends friend request, accepts request, or shares venue
   - Existing service (FriendsService, VenueShareService) handles business logic
   - Service calls NotificationService to create notification

2. **Notification Creation**
   - NotificationService creates in-app notification in `social_notifications` table
   - NotificationService calls PushNotificationService to send push
   - Passes notification type, recipient ID, and payload data

3. **Push Delivery**
   - PushNotificationService checks user's notification preferences
   - If push enabled for that notification type, retrieves device tokens
   - Sends push notification via FCM to all user's devices
   - Tracks delivery status

4. **User Receives Notification**
   - Device displays notification in system tray
   - User taps notification
   - App opens and navigates to appropriate screen
   - In-app notification marked as read

## Components and Interfaces

### 1. PushNotificationService (New)

**Responsibility:** Send push notifications via FCM for social events

**Interface:**
```typescript
interface PushNotificationService {
  // Send push notification for social event
  sendSocialNotification(
    userId: string,
    notificationType: NotificationType,
    payload: SocialNotificationPayload
  ): Promise<PushResult>;
  
  // Register device token
  registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android'
  ): Promise<void>;
  
  // Remove device token
  removeDeviceToken(token: string): Promise<void>;
  
  // Get user's device tokens
  getUserDeviceTokens(userId: string): Promise<DeviceToken[]>;
}

interface SocialNotificationPayload {
  title: string;
  body: string;
  data: {
    type: NotificationType;
    actorId?: string;
    referenceId?: string;
    navigationTarget: string;
    navigationParams?: Record<string, any>;
  };
  imageUrl?: string;
}

interface PushResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: PushError[];
}

interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  isActive: boolean;
  lastUsedAt: string;
}
```

### 2. FCMService (New)

**Responsibility:** Handle Firebase Cloud Messaging integration

**Interface:**
```typescript
interface FCMService {
  // Initialize FCM
  initialize(): Promise<void>;
  
  // Request permission
  requestPermission(): Promise<PermissionStatus>;
  
  // Get FCM token
  getToken(): Promise<string>;
  
  // Handle token refresh
  onTokenRefresh(callback: (token: string) => void): void;
  
  // Send notification to device
  sendToDevice(
    token: string,
    payload: NotificationPayload
  ): Promise<SendResult>;
  
  // Send notification to multiple devices
  sendToMultipleDevices(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<BatchSendResult>;
  
  // Handle foreground notifications
  onForegroundMessage(callback: (message: RemoteMessage) => void): void;
  
  // Handle background notifications
  setBackgroundMessageHandler(handler: (message: RemoteMessage) => Promise<void>): void;
}

interface NotificationPayload {
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data: Record<string, string>;
  android?: {
    channelId: string;
    priority: 'high' | 'default';
    sound?: string;
  };
  apns?: {
    payload: {
      aps: {
        sound?: string;
        badge?: number;
      };
    };
  };
}
```

### 3. NotificationHandler (New)

**Responsibility:** Handle incoming push notifications and navigation

**Interface:**
```typescript
interface NotificationHandler {
  // Handle notification tap
  handleNotificationTap(notification: RemoteMessage): Promise<void>;
  
  // Handle foreground notification
  handleForegroundNotification(notification: RemoteMessage): void;
  
  // Handle background notification
  handleBackgroundNotification(notification: RemoteMessage): Promise<void>;
  
  // Navigate based on notification type
  navigateFromNotification(
    type: NotificationType,
    params: Record<string, any>
  ): void;
}
```

### 4. DeviceTokenManager (New)

**Responsibility:** Manage device tokens in database

**Interface:**
```typescript
interface DeviceTokenManager {
  // Store device token
  storeToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android'
  ): Promise<void>;
  
  // Remove token
  removeToken(token: string): Promise<void>;
  
  // Get user tokens
  getUserTokens(userId: string): Promise<DeviceToken[]>;
  
  // Mark token as inactive
  deactivateToken(token: string): Promise<void>;
  
  // Clean up expired tokens
  cleanupExpiredTokens(): Promise<number>;
}
```

### 5. Updated NotificationService (Existing)

**Responsibility:** Create in-app notifications and trigger push notifications

**Updated Methods:**
```typescript
class NotificationService {
  // Existing method - now also sends push
  static async sendFriendRequestNotification(
    fromUserId: string,
    toUserId: string
  ): Promise<SocialNotification> {
    // Create in-app notification (existing code)
    const notification = await this.createInAppNotification(...);
    
    // NEW: Send push notification
    await PushNotificationService.sendSocialNotification(
      toUserId,
      'friend_request',
      {
        title: 'New Friend Request',
        body: `${senderName} sent you a friend request`,
        data: {
          type: 'friend_request',
          actorId: fromUserId,
          navigationTarget: 'FriendRequests',
        },
      }
    );
    
    return notification;
  }
  
  // Similar updates for other notification methods...
}
```

## Data Models

### Database Schema

#### device_tokens Table (New)
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_device_tokens_token ON device_tokens(token);
```

#### Existing Tables (No Changes)
- `social_notifications` - Already exists, stores in-app notifications
- `notification_preferences` - Already exists, stores user preferences
- `profiles` - Already exists, user accounts

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Device Token Storage Consistency
*For any* generated FCM device token, it should be stored in the database and associated with the correct user account.
**Validates: Requirements 1.5, 1.8**

### Property 2: Token Refresh Handling
*For any* expired or refreshed FCM token, the old token should be replaced with the new token in the database without losing user association.
**Validates: Requirements 1.6, 1.7**

### Property 3: Multi-Device Support
*For any* user with multiple devices, all device tokens should be stored and associated with that user's account.
**Validates: Requirements 1.10**

### Property 4: Logout Token Cleanup
*For any* user logout event, all device token associations for that user should be removed from active status.
**Validates: Requirements 1.9**

### Property 5: Permission Status Persistence
*For any* push permission status change, the new status should be immediately stored and retrievable.
**Validates: Requirements 2.3, 2.10**

### Property 6: Disabled Push Exclusion
*For any* user with push notifications disabled, they should not receive any push notifications regardless of event type.
**Validates: Requirements 2.5**

### Property 7: In-App Notification Creation
*For any* social event that triggers a notification, an in-app notification should be created in the database.
**Validates: Requirements 3.1, 4.1, 5.1**

### Property 8: Push Notification Sending
*For any* social event that triggers a notification, if the user has push enabled for that type, a push notification should be sent.
**Validates: Requirements 3.2, 4.2, 5.2**

### Property 9: Preference Respect
*For any* notification send, user preferences for that notification type should be respected.
**Validates: Requirements 3.8, 4.8, 5.8, 8.8**

### Property 10: Navigation Data Inclusion
*For any* push notification sent, it should include the necessary data to navigate to the appropriate screen when tapped.
**Validates: Requirements 3.6, 3.7, 4.6, 4.7, 5.6, 5.7**

### Property 11: Delivery Retry Logic
*For any* failed notification delivery, the system should retry up to 2 times before marking as permanently failed.
**Validates: Requirements 6.4**

### Property 12: Invalid Token Handling
*For any* invalid or expired device token encountered during delivery, it should be handled gracefully and removed from active tokens.
**Validates: Requirements 6.6, 6.7**

### Property 13: Notification Display in Tray
*For any* received notification, it should appear in the device's notification tray.
**Validates: Requirements 7.1**

### Property 14: Tap-to-Open Behavior
*For any* notification tapped by a user, the app should open and navigate to the appropriate screen.
**Validates: Requirements 7.2, 7.3**

### Property 15: App State Handling
*For any* notification received, it should be handled correctly regardless of app state (foreground, background, closed).
**Validates: Requirements 7.4, 7.5, 7.6**

### Property 16: Read Status Update
*For any* notification opened by a user, the corresponding in-app notification should be marked as read.
**Validates: Requirements 7.8**

### Property 17: Preference Sync
*For any* user preference change, it should be synced across all of that user's devices.
**Validates: Requirements 8.10**

### Property 18: Immediate Preference Save
*For any* user preference change, it should be saved to the database immediately.
**Validates: Requirements 8.9**

### Property 19: Polling Disabled When Push Enabled
*For any* user with push notifications enabled, the polling system should be disabled.
**Validates: Requirements 11.1**

### Property 20: Manual Refresh Availability
*For any* user, manual refresh functionality should remain available regardless of push status.
**Validates: Requirements 11.3, 11.9**

## Error Handling

### Error Categories

1. **Permission Errors**
   - User denied push permission
   - User permanently denied push permission
   
   **Handling:** Display clear error messages with instructions to enable in settings. Provide deep link to device settings. Fall back to in-app notifications only.

2. **Token Errors**
   - Invalid device token
   - Expired device token
   - Token not found
   
   **Handling:** Remove invalid tokens from database. Request token refresh. Log error for monitoring. Continue with other valid tokens.

3. **Delivery Errors**
   - FCM service unavailable
   - Network timeout
   - Rate limit exceeded
   
   **Handling:** Retry transient errors up to 2 times. Log permanent failures. In-app notification still created.

4. **Integration Errors**
   - Notification service failure
   - Database connection error
   - Invalid notification payload
   
   **Handling:** Log error with context. Create in-app notification even if push fails. Alert developers if error rate is high.

### Error Recovery Strategies

**Automatic Retry:**
- Network timeouts: Retry with exponential backoff (1s, 2s)
- FCM rate limits: Queue and retry after rate limit window
- Transient FCM errors: Retry up to 2 times

**Graceful Degradation:**
- If push fails, in-app notification still created
- If FCM is unavailable, fall back to in-app only
- If token is invalid, remove and continue with other tokens

**User Communication:**
- Permission denied: Show settings link
- Push unavailable: Explain in-app notifications still work
- Errors: Log for developers, don't show to users

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Token Management:**
- Test token storage and retrieval
- Test token refresh handling
- Test multi-device support
- Test logout token cleanup

**Permission Handling:**
- Test permission request flow
- Test permission denial handling
- Test permission status persistence

**Notification Sending:**
- Test push notification creation
- Test preference checking
- Test payload construction
- Test delivery to multiple devices

**Error Handling:**
- Test invalid token removal
- Test retry logic
- Test error categorization
- Test graceful degradation

### Property-Based Testing

Property tests will verify universal properties across all inputs using fast-check:

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: social-push-notifications, Property {number}: {property_text}`

**Key Properties to Test:**

1. **Token Management Properties:**
   - Property 1: Device Token Storage Consistency
   - Property 2: Token Refresh Handling
   - Property 3: Multi-Device Support
   - Property 4: Logout Token Cleanup

2. **Notification Properties:**
   - Property 7: In-App Notification Creation
   - Property 8: Push Notification Sending
   - Property 9: Preference Respect
   - Property 10: Navigation Data Inclusion

3. **Delivery Properties:**
   - Property 11: Delivery Retry Logic
   - Property 12: Invalid Token Handling

4. **Reception Properties:**
   - Property 13: Notification Display in Tray
   - Property 14: Tap-to-Open Behavior
   - Property 15: App State Handling
   - Property 16: Read Status Update

### Integration Testing

Integration tests will verify end-to-end flows:

**Friend Request Flow:**
1. User A sends friend request to User B
2. In-app notification created
3. Push notification sent to User B's devices
4. User B receives push
5. User B taps notification
6. App opens to friend requests screen

**Venue Share Flow:**
1. User A shares venue with User B
2. In-app notification created
3. Push notification sent to User B
4. User B receives push
5. User B taps notification
6. App opens to venue detail screen

**Permission Flow:**
1. App requests permission
2. User grants/denies
3. Status stored
4. Notifications respect status

### Testing Tools

- **Unit Tests:** Jest + React Native Testing Library
- **Property Tests:** fast-check (TypeScript property-based testing)
- **Integration Tests:** Detox (React Native E2E testing)
- **Manual Testing:** Firebase Console test notifications

## Implementation Notes

### Firebase Cloud Messaging Setup

**iOS Configuration:**
1. Create APNs certificate in Apple Developer Portal
2. Upload certificate to Firebase Console
3. Add Firebase SDK to iOS project
4. Configure Info.plist with notification permissions
5. Implement UNUserNotificationCenter delegate

**Android Configuration:**
1. Download google-services.json from Firebase Console
2. Add to android/app directory
3. Configure build.gradle with Firebase dependencies
4. Implement FirebaseMessagingService
5. Handle notification channels for Android 8+

### Integration Points

**Existing Services to Update:**
- `NotificationService.sendFriendRequestNotification()` - Add push call
- `NotificationService.sendFriendAcceptedNotification()` - Add push call
- `NotificationService.sendVenueShareNotification()` - Add push call
- `NotificationContext` - Remove polling, add push initialization
- `useSocialNotifications` - Remove pollInterval, keep refetch

**New Services to Create:**
- `PushNotificationService` - Main push service
- `FCMService` - FCM integration
- `NotificationHandler` - Handle incoming notifications
- `DeviceTokenManager` - Manage tokens in database

### Performance Considerations

- Cache device tokens for active users (in-memory, 5 minute TTL)
- Batch notifications when sending to multiple devices
- Use connection pooling for FCM requests
- Index device_tokens table for fast lookups
- Clean up expired tokens weekly

### Security Considerations

- Validate all notification payloads
- Encrypt device tokens at rest
- Use HTTPS for all API communication
- Rate limit notification sends per user
- Audit log all notification sends
- Handle user privacy data according to regulations

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Rich Notifications:**
   - Images and media attachments
   - Action buttons (Accept/Decline friend request)
   - Custom notification sounds

2. **Advanced Features:**
   - Notification grouping by type
   - Notification summary (e.g., "3 new friend requests")
   - Quiet hours support
   - Priority notifications

3. **Analytics:**
   - Track notification open rates
   - Track notification engagement
   - A/B test notification content

4. **Additional Notification Types:**
   - Collection follows
   - Collection updates
   - Activity likes
   - Activity comments
   - Friend check-ins nearby
   - Group outing invites

## Conclusion

The Social Push Notifications system replaces inefficient polling with real-time push notifications, providing instant updates for social interactions while reducing battery drain and API calls. The system integrates seamlessly with existing social features and provides a foundation for future notification enhancements.

Key design principles:
- **Real-time:** Instant notifications via FCM
- **Efficient:** No polling, minimal battery drain
- **Reliable:** Retry logic, error handling, graceful degradation
- **User-Controlled:** Comprehensive preference settings
- **Seamless Integration:** Works with existing social features
