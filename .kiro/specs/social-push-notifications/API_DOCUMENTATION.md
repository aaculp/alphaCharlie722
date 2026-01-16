# Push Notification Services API Documentation

This document provides comprehensive API documentation for the push notification services, including method signatures, parameters, return types, error handling, and usage examples.

## Table of Contents

1. [PushNotificationService](#pushnotificationservice)
2. [FCMService](#fcmservice)
3. [NotificationHandler](#notificationhandler)
4. [DeviceTokenManager](#devicetokenmanager)
5. [FCMTokenService](#fcmtokenservice)
6. [Common Types](#common-types)
7. [Error Handling](#error-handling)
8. [Usage Examples](#usage-examples)

---

## PushNotificationService

High-level service for sending push notifications for social events. Handles user preference checking, device token retrieval, and notification delivery.

**Requirements:** 6.1, 6.2, 6.6, 6.7, 6.8, 6.9

### Methods

#### `sendSocialNotification()`

Send push notification for a social event. Checks user preferences and sends to all active devices.

**Signature:**
```typescript
static async sendSocialNotification(
  userId: string,
  notificationType: NotificationType,
  payload: SocialNotificationPayload
): Promise<PushResult>
```

**Parameters:**
- `userId` (string): ID of the user to send notification to
- `notificationType` (NotificationType): Type of social notification (e.g., 'friend_request', 'venue_share')
- `payload` (SocialNotificationPayload): Notification payload with title, body, and data

**Returns:** `Promise<PushResult>`
- `success` (boolean): Whether at least one notification was sent successfully
- `sentCount` (number): Number of devices that received the notification
- `failedCount` (number): Number of devices that failed to receive
- `errors` (PushError[]): Array of errors for failed deliveries

**Throws:** Does not throw - returns error information in result

**Features:**
- Checks user notification preferences before sending
- Retrieves all active device tokens for the user
- Sends to multiple devices in parallel
- Tracks delivery performance metrics
- Enforces rate limits to prevent abuse
- Handles errors gracefully


**Example:**
```typescript
import { PushNotificationService } from './services/PushNotificationService';

// Send friend request notification
const result = await PushNotificationService.sendSocialNotification(
  'user-123',
  'friend_request',
  {
    title: 'New Friend Request',
    body: 'John Doe sent you a friend request',
    data: {
      type: 'friend_request',
      actorId: 'user-456',
      navigationTarget: 'FriendRequests',
    },
  }
);

console.log(`Sent to ${result.sentCount} devices`);
if (result.errors.length > 0) {
  console.log('Errors:', result.errors);
}
```

---

#### `registerDeviceToken()`

Register a device token for push notifications.

**Signature:**
```typescript
static async registerDeviceToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<void>
```

**Parameters:**
- `userId` (string): User ID to associate with the token
- `token` (string): FCM device token
- `platform` ('ios' | 'android'): Device platform

**Returns:** `Promise<void>`

**Throws:** `Error` if registration fails

**Example:**
```typescript
await PushNotificationService.registerDeviceToken(
  'user-123',
  'fcm-token-abc123...',
  'ios'
);
```

---

#### `removeDeviceToken()`

Remove a device token.

**Signature:**
```typescript
static async removeDeviceToken(token: string): Promise<void>
```

**Parameters:**
- `token` (string): FCM device token to remove

**Returns:** `Promise<void>`

**Throws:** `Error` if removal fails

**Example:**
```typescript
await PushNotificationService.removeDeviceToken('fcm-token-abc123...');
```

---

#### `getUserDeviceTokens()`

Get all active device tokens for a user.

**Signature:**
```typescript
static async getUserDeviceTokens(userId: string): Promise<DeviceToken[]>
```

**Parameters:**
- `userId` (string): User ID to get tokens for

**Returns:** `Promise<DeviceToken[]>` - Array of active device tokens

**Throws:** Does not throw - returns empty array on error

**Example:**
```typescript
const tokens = await PushNotificationService.getUserDeviceTokens('user-123');
console.log(`User has ${tokens.length} active devices`);
```

---

## FCMService

Core Firebase Cloud Messaging service for sending push notifications. Handles FCM initialization, token management, and notification delivery.

**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5

### Methods

#### `initialize()`

Initialize FCM service. Should be called once on app launch.

**Signature:**
```typescript
static async initialize(): Promise<void>
```

**Returns:** `Promise<void>`

**Throws:** `PushNotificationError` if initialization fails

**Example:**
```typescript
import { FCMService } from './services/FCMService';

// In App.tsx or index.js
await FCMService.initialize();
```

---

#### `getToken()`

Get the current FCM token for this device.

**Signature:**
```typescript
static async getToken(): Promise<string | null>
```

**Returns:** `Promise<string | null>` - FCM token or null if unavailable

**Throws:** Does not throw - returns null on error

**Example:**
```typescript
const token = await FCMService.getToken();
if (token) {
  console.log('FCM token:', token);
} else {
  console.log('No FCM token available');
}
```

---

#### `onTokenRefresh()`

Set up token refresh listener. Automatically handles token refresh events.

**Signature:**
```typescript
static onTokenRefresh(callback: (token: string) => void): void
```

**Parameters:**
- `callback` (function): Function to call when token refreshes

**Returns:** `void`

**Example:**
```typescript
FCMService.onTokenRefresh(async (newToken) => {
  console.log('Token refreshed:', newToken);
  // Store new token in database
  await DeviceTokenManager.storeToken(userId, newToken, Platform.OS);
});
```

---

#### `sendToDevice()`

Send push notification to a single device. Includes retry logic for transient errors.

**Signature:**
```typescript
static async sendToDevice(
  token: string,
  payload: NotificationPayload,
  retryCount?: number
): Promise<SendResult>
```

**Parameters:**
- `token` (string): FCM device token
- `payload` (NotificationPayload): Notification payload
- `retryCount` (number, optional): Current retry attempt (internal use)

**Returns:** `Promise<SendResult>`
- `success` (boolean): Whether notification was sent successfully
- `token` (string): The device token
- `error` (string, optional): Error message if failed
- `errorCode` (string, optional): Error category code

**Retry Logic:**
- Retries up to 2 times for transient errors
- Uses exponential backoff (1s, 2s)
- Does not retry permanent errors (invalid token, etc.)

**Example:**
```typescript
const result = await FCMService.sendToDevice(
  'fcm-token-abc123...',
  {
    notification: {
      title: 'New Message',
      body: 'You have a new message',
    },
    data: {
      type: 'message',
      messageId: 'msg-123',
    },
    android: {
      channelId: 'social_notifications',
      priority: 'high',
    },
  }
);

if (result.success) {
  console.log('Notification sent successfully');
} else {
  console.log('Failed:', result.error);
}
```

---

#### `sendToMultipleDevices()`

Send push notification to multiple devices. Batches requests for efficiency (max 500 per batch).

**Signature:**
```typescript
static async sendToMultipleDevices(
  tokens: string[],
  payload: NotificationPayload
): Promise<BatchSendResult>
```

**Parameters:**
- `tokens` (string[]): Array of FCM device tokens
- `payload` (NotificationPayload): Notification payload

**Returns:** `Promise<BatchSendResult>`
- `successCount` (number): Number of successful sends
- `failureCount` (number): Number of failed sends
- `results` (SendResult[]): Individual results for each token

**Features:**
- Automatically batches tokens (500 per batch as per FCM limits)
- Processes batches in parallel for efficiency
- Returns individual results for each token

**Example:**
```typescript
const tokens = ['token1', 'token2', 'token3'];
const result = await FCMService.sendToMultipleDevices(tokens, payload);

console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`);
```

---

#### `onForegroundMessage()`

Register foreground message handler. Handles notifications received while app is in foreground.

**Signature:**
```typescript
static onForegroundMessage(
  handler: (message: FirebaseMessagingTypes.RemoteMessage) => void
): void
```

**Parameters:**
- `handler` (function): Function to call when foreground message received

**Returns:** `void`

**Example:**
```typescript
FCMService.onForegroundMessage((message) => {
  console.log('Foreground notification:', message);
  // Display in-app banner
  showNotificationBanner(message);
});
```

---

#### `setBackgroundMessageHandler()`

Set background message handler. Handles notifications received while app is in background or closed.

**Signature:**
```typescript
static setBackgroundMessageHandler(
  handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>
): void
```

**Parameters:**
- `handler` (async function): Async function to call when background message received

**Returns:** `void`

**Example:**
```typescript
FCMService.setBackgroundMessageHandler(async (message) => {
  console.log('Background notification:', message);
  // Update badge count
  await updateBadgeCount();
});
```

---

## NotificationHandler

Handles incoming push notifications and manages navigation. Processes notifications in different app states (foreground, background, closed).

**Requirements:** 7.2, 7.3, 7.4, 7.5, 7.6

### Methods

#### `setNavigationHandler()`

Set the navigation handler. Should be called once during app initialization with navigation reference.

**Signature:**
```typescript
static setNavigationHandler(handler: NavigationHandler): void
```

**Parameters:**
- `handler` (NavigationHandler): Function to handle navigation

**Type Definition:**
```typescript
type NavigationHandler = (
  screen: string,
  params?: Record<string, any>
) => void;
```

**Returns:** `void`

**Example:**
```typescript
import { NotificationHandler } from './services/NotificationHandler';
import { navigationRef } from './navigation/AppNavigator';

// In App.tsx
NotificationHandler.setNavigationHandler((screen, params) => {
  navigationRef.current?.navigate(screen, params);
});
```

---

#### `handleNotificationTap()`

Handle notification tap. Called when user taps on a notification in the system tray.

**Signature:**
```typescript
static async handleNotificationTap(
  notification: FirebaseMessagingTypes.RemoteMessage
): Promise<void>
```

**Parameters:**
- `notification` (RemoteMessage): FCM remote message

**Returns:** `Promise<void>`

**Features:**
- Parses notification data
- Marks in-app notification as read
- Tracks notification open event
- Navigates to appropriate screen

**Example:**
```typescript
import messaging from '@react-native-firebase/messaging';

// Set up notification tap handler
messaging().onNotificationOpenedApp((remoteMessage) => {
  NotificationHandler.handleNotificationTap(remoteMessage);
});

// Check if app was opened from a notification
messaging()
  .getInitialNotification()
  .then((remoteMessage) => {
    if (remoteMessage) {
      NotificationHandler.handleNotificationTap(remoteMessage);
    }
  });
```

---

#### `handleForegroundNotification()`

Handle foreground notification. Called when notification is received while app is in foreground.

**Signature:**
```typescript
static handleForegroundNotification(
  notification: FirebaseMessagingTypes.RemoteMessage
): void
```

**Parameters:**
- `notification` (RemoteMessage): FCM remote message

**Returns:** `void`

**Features:**
- Displays in-app notification banner
- Updates notification center badge
- Plays notification sound (handled by FCM)

**Example:**
```typescript
FCMService.onForegroundMessage((message) => {
  NotificationHandler.handleForegroundNotification(message);
});
```

---

#### `handleBackgroundNotification()`

Handle background notification. Called when notification is received while app is in background or closed.

**Signature:**
```typescript
static async handleBackgroundNotification(
  notification: FirebaseMessagingTypes.RemoteMessage
): Promise<void>
```

**Parameters:**
- `notification` (RemoteMessage): FCM remote message

**Returns:** `Promise<void>`

**Features:**
- Updates notification center badge
- Tracks notification receipt

**Example:**
```typescript
FCMService.setBackgroundMessageHandler(async (message) => {
  await NotificationHandler.handleBackgroundNotification(message);
});
```

---

#### `navigateFromNotification()`

Navigate to appropriate screen based on notification type.

**Signature:**
```typescript
static navigateFromNotification(
  type: NotificationType,
  params: Record<string, any>
): void
```

**Parameters:**
- `type` (NotificationType): Notification type
- `params` (object): Navigation parameters

**Returns:** `void`

**Navigation Mapping:**
- `friend_request` → FriendRequests screen
- `friend_accepted` → Profile screen (with userId)
- `venue_share` → VenueDetail screen (with venueId)
- `collection_follow` → CollectionDetail screen (with collectionId)
- `activity_like` → ActivityDetail screen (with activityId)
- `group_outing_invite` → GroupOutingDetail screen (with outingId)

**Example:**
```typescript
NotificationHandler.navigateFromNotification('venue_share', {
  venueId: 'venue-123',
  venueName: 'Cool Bar',
});
```

---

## DeviceTokenManager

Manages FCM device tokens for push notification delivery. Handles token storage, retrieval, deactivation, and cleanup.

**Requirements:** 1.5, 1.8, 1.9, 1.10, 10.6, 10.7, 10.8

### Methods

#### `initialize()`

Initialize the DeviceTokenManager. Starts periodic cache cleanup.

**Signature:**
```typescript
static initialize(): void
```

**Returns:** `void`

**Example:**
```typescript
// In App.tsx
DeviceTokenManager.initialize();
```

---

#### `shutdown()`

Shutdown the DeviceTokenManager. Stops periodic cache cleanup.

**Signature:**
```typescript
static shutdown(): void
```

**Returns:** `void`

**Example:**
```typescript
// On app unmount
DeviceTokenManager.shutdown();
```

---

#### `storeToken()`

Store a device token for a user. If token already exists, updates the user association and reactivates it.

**Signature:**
```typescript
static async storeToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<void>
```

**Parameters:**
- `userId` (string): User ID to associate with the token
- `token` (string): FCM device token
- `platform` ('ios' | 'android'): Device platform

**Returns:** `Promise<void>`

**Throws:** `PushNotificationError` if storage fails

**Features:**
- Upserts token (insert or update)
- Reactivates inactive tokens
- Invalidates cache on update

**Example:**
```typescript
await DeviceTokenManager.storeToken(
  'user-123',
  'fcm-token-abc123...',
  'ios'
);
```

---

#### `removeToken()`

Remove a device token. Marks the token as inactive instead of deleting it.

**Signature:**
```typescript
static async removeToken(token: string): Promise<void>
```

**Parameters:**
- `token` (string): FCM device token to remove

**Returns:** `Promise<void>`

**Throws:** `PushNotificationError` if removal fails

**Example:**
```typescript
await DeviceTokenManager.removeToken('fcm-token-abc123...');
```

---

#### `getUserTokens()`

Get all active device tokens for a user. Uses in-memory cache with 5-minute TTL.

**Signature:**
```typescript
static async getUserTokens(userId: string): Promise<DeviceToken[]>
```

**Parameters:**
- `userId` (string): User ID to get tokens for

**Returns:** `Promise<DeviceToken[]>` - Array of active device tokens

**Throws:** `PushNotificationError` if retrieval fails

**Features:**
- Uses in-memory cache (5-minute TTL)
- Returns only active tokens
- Ordered by last_used_at (most recent first)

**Example:**
```typescript
const tokens = await DeviceTokenManager.getUserTokens('user-123');
tokens.forEach(token => {
  console.log(`${token.platform}: ${token.token.substring(0, 20)}...`);
});
```

---

#### `deactivateToken()`

Deactivate a specific device token.

**Signature:**
```typescript
static async deactivateToken(token: string): Promise<void>
```

**Parameters:**
- `token` (string): FCM device token to deactivate

**Returns:** `Promise<void>`

**Throws:** `PushNotificationError` if deactivation fails

**Example:**
```typescript
// Deactivate invalid token
await DeviceTokenManager.deactivateToken('fcm-token-abc123...');
```

---

#### `cleanupExpiredTokens()`

Clean up expired tokens (inactive for more than 30 days).

**Signature:**
```typescript
static async cleanupExpiredTokens(): Promise<number>
```

**Returns:** `Promise<number>` - Number of tokens cleaned up

**Throws:** `PushNotificationError` if cleanup fails

**Example:**
```typescript
// Run cleanup job (e.g., daily cron)
const count = await DeviceTokenManager.cleanupExpiredTokens();
console.log(`Cleaned up ${count} expired tokens`);
```

---

#### `updateLastUsed()`

Update the last_used_at timestamp for a token. Called when a notification is successfully sent to a device.

**Signature:**
```typescript
static async updateLastUsed(token: string): Promise<void>
```

**Parameters:**
- `token` (string): FCM device token

**Returns:** `Promise<void>`

**Throws:** Does not throw - logs error on failure

**Example:**
```typescript
// Called automatically by FCMService after successful send
await DeviceTokenManager.updateLastUsed('fcm-token-abc123...');
```

---

## FCMTokenService

Handles FCM token generation, storage, and refresh events. Integrates with DeviceTokenManager to persist tokens to the database.

**Requirements:** 1.4, 1.5, 1.6, 1.7, 1.8, 10.6

### Methods

#### `initialize()`

Initialize FCM and request permission. Should be called on app launch.

**Signature:**
```typescript
static async initialize(): Promise<void>
```

**Returns:** `Promise<void>`

**Throws:** `Error` if initialization fails

**Example:**
```typescript
// In App.tsx
await FCMTokenService.initialize();
```

---

#### `generateAndStoreToken()`

Generate and store FCM token for the current user.

**Signature:**
```typescript
static async generateAndStoreToken(userId: string): Promise<string>
```

**Parameters:**
- `userId` (string): User ID to associate with the token

**Returns:** `Promise<string>` - The generated FCM token

**Throws:** `Error` if token generation or storage fails

**Example:**
```typescript
// After user login
const token = await FCMTokenService.generateAndStoreToken('user-123');
console.log('Token generated:', token);
```

---

#### `setupTokenRefreshListener()`

Set up token refresh listener. Automatically updates the token in the database when it refreshes.

**Signature:**
```typescript
static setupTokenRefreshListener(userId: string): void
```

**Parameters:**
- `userId` (string): User ID to associate with refreshed tokens

**Returns:** `void`

**Example:**
```typescript
// After user login
FCMTokenService.setupTokenRefreshListener('user-123');
```

---

#### `removeTokenRefreshListener()`

Remove token refresh listener. Should be called on logout.

**Signature:**
```typescript
static removeTokenRefreshListener(): void
```

**Returns:** `void`

**Example:**
```typescript
// On user logout
FCMTokenService.removeTokenRefreshListener();
```

---

#### `getCurrentToken()`

Get the current FCM token.

**Signature:**
```typescript
static async getCurrentToken(): Promise<string | null>
```

**Returns:** `Promise<string | null>` - The current FCM token or null if not available

**Example:**
```typescript
const token = await FCMTokenService.getCurrentToken();
```

---

#### `deleteToken()`

Delete the current FCM token. Should be called on logout.

**Signature:**
```typescript
static async deleteToken(): Promise<void>
```

**Returns:** `Promise<void>`

**Throws:** `Error` if deletion fails

**Example:**
```typescript
// On user logout
await FCMTokenService.deleteToken();
```

---

## Common Types

### NotificationType

```typescript
type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'venue_share'
  | 'collection_follow'
  | 'collection_update'
  | 'activity_like'
  | 'activity_comment'
  | 'group_outing_invite'
  | 'group_outing_response'
  | 'group_outing_reminder'
  | 'friend_checkin_nearby';
```

### SocialNotificationPayload

```typescript
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
```

### NotificationPayload

```typescript
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
    tag?: string;
    group?: string;
  };
  apns?: {
    payload: {
      aps: {
        sound?: string;
        badge?: number;
        threadId?: string;
      };
    };
  };
}
```

### DeviceToken

```typescript
interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  isActive: boolean;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

### PushResult

```typescript
interface PushResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: PushError[];
}
```

### PushError

```typescript
interface PushError {
  token: string;
  error: string;
  errorCode?: string;
}
```

### SendResult

```typescript
interface SendResult {
  success: boolean;
  token: string;
  error?: string;
  errorCode?: string;
}
```

### BatchSendResult

```typescript
interface BatchSendResult {
  successCount: number;
  failureCount: number;
  results: SendResult[];
}
```

---

## Error Handling

All services use the `PushNotificationError` class for comprehensive error handling.

### PushErrorCategory

```typescript
enum PushErrorCategory {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### Error Handling Example

```typescript
try {
  await PushNotificationService.sendSocialNotification(
    userId,
    'friend_request',
    payload
  );
} catch (error) {
  if (error instanceof PushNotificationError) {
    console.log('Error category:', error.category);
    console.log('Is retryable:', error.isRetryable);
    console.log('Severity:', error.severity);
    
    if (error.category === PushErrorCategory.RATE_LIMIT_EXCEEDED) {
      // Handle rate limit
      console.log('Rate limit exceeded, try again later');
    }
  }
}
```

---

## Usage Examples

### Complete Integration Example

```typescript
import { FCMService } from './services/FCMService';
import { FCMTokenService } from './services/FCMTokenService';
import { PushNotificationService } from './services/PushNotificationService';
import { NotificationHandler } from './services/NotificationHandler';
import { DeviceTokenManager } from './services/DeviceTokenManager';
import messaging from '@react-native-firebase/messaging';

// 1. Initialize services on app launch
async function initializePushNotifications() {
  // Initialize device token manager
  DeviceTokenManager.initialize();
  
  // Initialize FCM
  await FCMService.initialize();
  await FCMTokenService.initialize();
  
  // Set up navigation handler
  NotificationHandler.setNavigationHandler((screen, params) => {
    navigationRef.current?.navigate(screen, params);
  });
  
  // Set up foreground message handler
  FCMService.onForegroundMessage((message) => {
    NotificationHandler.handleForegroundNotification(message);
  });
  
  // Set up background message handler
  FCMService.setBackgroundMessageHandler(async (message) => {
    await NotificationHandler.handleBackgroundNotification(message);
  });
  
  // Set up notification tap handler
  messaging().onNotificationOpenedApp((remoteMessage) => {
    NotificationHandler.handleNotificationTap(remoteMessage);
  });
  
  // Check if app was opened from a notification
  const initialNotification = await messaging().getInitialNotification();
  if (initialNotification) {
    NotificationHandler.handleNotificationTap(initialNotification);
  }
}

// 2. Register device token after user login
async function onUserLogin(userId: string) {
  // Generate and store token
  const token = await FCMTokenService.generateAndStoreToken(userId);
  console.log('Device registered for push notifications');
  
  // Set up token refresh listener
  FCMTokenService.setupTokenRefreshListener(userId);
}

// 3. Send notification when social event occurs
async function onFriendRequestSent(fromUserId: string, toUserId: string) {
  // Create in-app notification (existing code)
  const notification = await NotificationService.createNotification({
    userId: toUserId,
    type: 'friend_request',
    actorId: fromUserId,
  });
  
  // Send push notification
  const result = await PushNotificationService.sendSocialNotification(
    toUserId,
    'friend_request',
    {
      title: 'New Friend Request',
      body: `${senderName} sent you a friend request`,
      data: {
        type: 'friend_request',
        actorId: fromUserId,
        referenceId: notification.id,
        navigationTarget: 'FriendRequests',
      },
    }
  );
  
  console.log(`Push sent to ${result.sentCount} devices`);
}

// 4. Clean up on user logout
async function onUserLogout() {
  // Remove token refresh listener
  FCMTokenService.removeTokenRefreshListener();
  
  // Delete FCM token
  await FCMTokenService.deleteToken();
  
  // Remove device token from database
  const token = await FCMTokenService.getCurrentToken();
  if (token) {
    await DeviceTokenManager.removeToken(token);
  }
}

// 5. Periodic cleanup (run daily)
async function dailyCleanup() {
  const count = await DeviceTokenManager.cleanupExpiredTokens();
  console.log(`Cleaned up ${count} expired tokens`);
}
```

### Sending Different Notification Types

```typescript
// Friend request
await PushNotificationService.sendSocialNotification(
  userId,
  'friend_request',
  {
    title: 'New Friend Request',
    body: `${senderName} sent you a friend request`,
    data: {
      type: 'friend_request',
      actorId: senderId,
      navigationTarget: 'FriendRequests',
    },
  }
);

// Friend accepted
await PushNotificationService.sendSocialNotification(
  userId,
  'friend_accepted',
  {
    title: 'Friend Request Accepted',
    body: `${accepterName} accepted your friend request`,
    data: {
      type: 'friend_accepted',
      actorId: accepterId,
      navigationTarget: 'Profile',
      navigationParams: { userId: accepterId },
    },
    imageUrl: accepterAvatarUrl,
  }
);

// Venue share
await PushNotificationService.sendSocialNotification(
  userId,
  'venue_share',
  {
    title: 'Venue Shared',
    body: `${sharerName} shared ${venueName} with you`,
    data: {
      type: 'venue_share',
      actorId: sharerId,
      referenceId: venueId,
      navigationTarget: 'VenueDetail',
      navigationParams: { venueId, venueName },
    },
  }
);
```

### Testing Notifications

```typescript
// Send test notification to specific device
const testToken = 'fcm-token-abc123...';
const result = await FCMService.sendToDevice(testToken, {
  notification: {
    title: 'Test Notification',
    body: 'This is a test',
  },
  data: {
    type: 'test',
    navigationTarget: 'Home',
  },
  android: {
    channelId: 'social_notifications',
    priority: 'high',
  },
});

console.log('Test result:', result);
```

---

## Best Practices

1. **Always initialize services on app launch**
   - Call `FCMService.initialize()` and `DeviceTokenManager.initialize()` early

2. **Register device tokens after login**
   - Generate and store token immediately after user authentication
   - Set up token refresh listener

3. **Clean up on logout**
   - Remove token refresh listener
   - Delete FCM token
   - Remove device token from database

4. **Handle errors gracefully**
   - Check `PushResult.errors` for failed deliveries
   - Log errors for monitoring
   - Don't throw errors to users

5. **Respect user preferences**
   - Always check preferences before sending
   - Create in-app notification even if push is disabled

6. **Use caching wisely**
   - DeviceTokenManager caches tokens for 5 minutes
   - Cache is automatically invalidated on updates

7. **Monitor performance**
   - Track delivery latency
   - Monitor error rates
   - Set up alerts for high error rates

8. **Test thoroughly**
   - Test foreground, background, and closed states
   - Test navigation from notifications
   - Test with multiple devices

9. **Run periodic cleanup**
   - Clean up expired tokens regularly (daily recommended)
   - Monitor cleanup results

10. **Follow platform guidelines**
    - Comply with APNs and FCM guidelines
    - Don't send spam or unsolicited notifications
    - Provide clear notification settings

---

## Related Documentation

- [Testing Guide](./TESTING_GUIDE.md) - How to test push notifications
- [Firebase Console Guide](./FIREBASE_CONSOLE_GUIDE.md) - Using Firebase Console for testing
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Requirements](./requirements.md) - Detailed requirements
- [Design](./design.md) - System design and architecture

