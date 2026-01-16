# Design Document: Push Notification System

## Overview

The Push Notification System is the core monetization feature of the OTW platform, enabling venue owners to send targeted promotional notifications to customers. This system leverages Firebase Cloud Messaging (FCM) to deliver real-time notifications to iOS and Android devices, with sophisticated targeting options including geo-location, user favorites, and custom filters.

The system is designed to be scalable, reliable, and compliant with platform guidelines while providing venues with powerful tools to drive foot traffic and measure campaign effectiveness.

**Tier-Based Access:**
- **Free ($0)**: No push notification access
- **Core ($79/month)**: 20 pushes/month, basic targeting, analytics
- **Pro ($179/month)**: 60 pushes/month, Flash Offers, advanced targeting
- **Revenue+ ($299/month)**: Unlimited pushes (fair use), automation, priority support

**Add-On Credits:** Available for purchase (3 for $25, 10 for $120, 25 for $299)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Venue Dashboard                          │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Create Push  │  │  Analytics   │                        │
│  │ Notification │  │  Dashboard   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Push Notification Service Layer                 │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Targeting   │  │  Analytics   │                        │
│  │   Engine     │  │   Tracker    │                        │
│  └──────────────┘  └──────────────┘                        │
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
│                    Customer Devices                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  iOS Device  │  │Android Device│  │  Notification│     │
│  │   (APNs)     │  │    (FCM)     │  │   Center     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Venue Owner Creates Notification**
   - Venue owner accesses dashboard
   - Fills out notification form (title, message, type)
   - Selects targeting options (all users, favorites, geo-radius)
   - Clicks "Send Now" to send immediately

2. **Targeting Engine Processes Request**
   - Queries database for eligible users
   - Applies filters (favorites, location, preferences)
   - Calculates estimated reach
   - Returns list of device tokens

3. **Notification Delivery**
   - Sends to FCM immediately
   - FCM delivers to devices (iOS via APNs, Android directly)
   - Tracks delivery status

4. **Analytics Tracking**
   - Records send, delivery, and open events
   - Tracks check-ins within 2 hours of notification
   - Calculates conversion metrics
   - Updates venue dashboard

## Components and Interfaces

### 1. Push Notification Service

**Responsibility:** Core service for creating, sending, and managing push notifications

**Interface:**
```typescript
interface PushNotificationService {
  // Create and send notification
  createNotification(request: CreateNotificationRequest): Promise<Notification>;
  sendNotification(notificationId: string): Promise<SendResult>;
  
  // Testing
  sendTestNotification(notificationId: string, deviceToken: string): Promise<void>;
  
  // History
  getNotificationHistory(venueId: string, filters: HistoryFilters): Promise<Notification[]>;
}

interface CreateNotificationRequest {
  venueId: string;
  title: string;
  message: string;
  type: 'general' | 'flash_offer' | 'event';
  targeting: TargetingOptions;
}

interface TargetingOptions {
  mode: 'all' | 'favorites' | 'geo';
  geoRadius?: number; // in miles
  combineFavorites?: boolean;
}

interface SendResult {
  notificationId: string;
  targetedUsers: number;
  sentCount: number;
  failedCount: number;
  errors: DeliveryError[];
}
```

### 2. FCM Integration Service

**Responsibility:** Handle Firebase Cloud Messaging integration and token management

**Interface:**
```typescript
interface FCMService {
  // Token management
  registerDeviceToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void>;
  refreshDeviceToken(oldToken: string, newToken: string): Promise<void>;
  removeDeviceToken(token: string): Promise<void>;
  getUserDeviceTokens(userId: string): Promise<string[]>;
  
  // Notification delivery
  sendToDevice(token: string, payload: NotificationPayload): Promise<DeliveryResult>;
  sendToMultipleDevices(tokens: string[], payload: NotificationPayload): Promise<BatchResult>;
  
  // Permission handling
  requestPermission(): Promise<PermissionStatus>;
  checkPermissionStatus(): Promise<PermissionStatus>;
}

interface NotificationPayload {
  title: string;
  body: string;
  data: {
    venueId: string;
    notificationId: string;
    type: string;
  };
  imageUrl?: string;
}
```


### 3. Targeting Engine

**Responsibility:** Filter and select users based on targeting criteria

**Interface:**
```typescript
interface TargetingEngine {
  // Calculate eligible users
  getTargetedUsers(venueId: string, options: TargetingOptions): Promise<TargetedUser[]>;
  estimateReach(venueId: string, options: TargetingOptions): Promise<number>;
  
  // Geo-targeting
  getUsersWithinRadius(venueId: string, radiusMiles: number): Promise<User[]>;
  calculateUserDistance(userId: string, venueId: string): Promise<number>;
  
  // Filter application
  applyFavoritesFilter(users: User[], venueId: string): Promise<User[]>;
  applyPreferencesFilter(users: User[], notificationType: string): Promise<User[]>;
  applyQuietHoursFilter(users: User[]): Promise<User[]>;
}

interface TargetedUser {
  userId: string;
  deviceTokens: string[];
  distance?: number;
  isFavorite: boolean;
}
```

### 4. Analytics Tracker

**Responsibility:** Track notification performance and user engagement

**Interface:**
```typescript
interface AnalyticsTracker {
  // Event tracking
  trackNotificationSent(notificationId: string, recipientCount: number): Promise<void>;
  trackNotificationDelivered(notificationId: string, deviceToken: string): Promise<void>;
  trackNotificationOpened(notificationId: string, userId: string): Promise<void>;
  trackCheckInAfterNotification(notificationId: string, userId: string, venueId: string): Promise<void>;
  
  // Analytics retrieval
  getNotificationAnalytics(notificationId: string): Promise<NotificationAnalytics>;
  getVenueAnalytics(venueId: string, dateRange: DateRange): Promise<VenueNotificationAnalytics>;
}

interface NotificationAnalytics {
  notificationId: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  deliveryRate: number;
  openRate: number;
  checkInsWithin2Hours: number;
  conversionRate: number;
}
```

### 5. User Preferences Service

**Responsibility:** Manage user notification preferences and quiet hours

**Interface:**
```typescript
interface UserPreferencesService {
  // Preference management
  getUserPreferences(userId: string): Promise<NotificationPreferences>;
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void>;
  
  // Venue muting
  muteVenue(userId: string, venueId: string): Promise<void>;
  unmuteVenue(userId: string, venueId: string): Promise<void>;
  getMutedVenues(userId: string): Promise<string[]>;
  
  // Quiet hours
  setQuietHours(userId: string, start: string, end: string): Promise<void>;
  isInQuietHours(userId: string): Promise<boolean>;
}

interface NotificationPreferences {
  pushEnabled: boolean;
  flashOffersEnabled: boolean;
  eventsEnabled: boolean;
  generalEnabled: boolean;
  mutedVenues: string[];
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;
}
```

## Data Models

### Database Schema

#### push_notifications Table
```sql
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  title VARCHAR(50) NOT NULL,
  message VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('general', 'flash_offer', 'event')),
  targeting_mode VARCHAR(20) NOT NULL CHECK (targeting_mode IN ('all', 'favorites', 'geo')),
  geo_radius DECIMAL(5,2), -- in miles
  combine_favorites BOOLEAN DEFAULT false,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_push_notifications_venue ON push_notifications(venue_id);
CREATE INDEX idx_push_notifications_status ON push_notifications(status);
```

#### device_tokens Table
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
```

#### notification_deliveries Table
```sql
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES push_notifications(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  device_token VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_user ON notification_deliveries(user_id);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status);
```

#### notification_analytics Table
```sql
CREATE TABLE notification_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES push_notifications(id) UNIQUE,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  delivery_rate DECIMAL(5,2),
  open_rate DECIMAL(5,2),
  checkins_within_2h INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_analytics_notification ON notification_analytics(notification_id);
```

#### user_notification_preferences Table
```sql
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  flash_offers_enabled BOOLEAN DEFAULT true,
  events_enabled BOOLEAN DEFAULT true,
  general_enabled BOOLEAN DEFAULT true,
  muted_venues UUID[] DEFAULT '{}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_notification_preferences_user ON user_notification_preferences(user_id);
```

#### push_notification_credits Table
```sql
CREATE TABLE push_notification_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  month DATE NOT NULL, -- First day of the month
  monthly_limit INTEGER NOT NULL,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(venue_id, month)
);

CREATE INDEX idx_push_notification_credits_venue_month ON push_notification_credits(venue_id, month);
```


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

### Property 5: Permission Denial Recovery
*For any* push permission denial, the system should provide a mechanism to request permission again.
**Validates: Requirements 2.2**

### Property 6: Permission Status Persistence
*For any* push permission status change, the new status should be immediately stored and retrievable.
**Validates: Requirements 2.3, 2.10**

### Property 7: Disabled Push Exclusion
*For any* user with push notifications disabled, they should not receive any push notifications regardless of targeting.
**Validates: Requirements 2.5**

### Property 8: Platform Permission Handling
*For any* iOS or Android permission state, the system should handle it correctly and store the appropriate status.
**Validates: Requirements 2.6, 2.7**

### Property 9: Permanently Denied Guidance
*For any* permanently denied permission state, the system should display instructions for enabling in device settings.
**Validates: Requirements 2.8**

### Property 10: Title Length Validation
*For any* notification title input, the system should enforce a maximum length of 50 characters.
**Validates: Requirements 3.4**

### Property 11: Message Length Validation
*For any* notification message input, the system should enforce a maximum length of 200 characters.
**Validates: Requirements 3.5**

### Property 12: Empty Content Validation
*For any* notification submission attempt, empty title or message should be rejected with a validation error.
**Validates: Requirements 3.7**

### Property 13: Draft Notification Persistence
*For any* draft notification, it should be saveable to the database and retrievable for later editing.
**Validates: Requirements 3.10**

### Property 14: All Users Targeting
*For any* notification with "All Users" targeting, it should be sent to all users who have push notifications enabled.
**Validates: Requirements 4.2**

### Property 15: Favorites-Only Targeting
*For any* notification with "Favorited Users" targeting, it should only be sent to users who have favorited that venue.
**Validates: Requirements 4.3**

### Property 16: Distance Calculation Accuracy
*For any* user with location data and any venue, the distance calculation should use the Haversine formula and return accurate results.
**Validates: Requirements 4.5**

### Property 17: Geo-Targeting Location Requirement
*For any* geo-targeted notification, only users with location services enabled should be included in the target audience.
**Validates: Requirements 4.6**

### Property 18: Combined Filter Intersection
*For any* notification with multiple targeting filters (e.g., Favorites + Geo), only users matching ALL filters should be targeted.
**Validates: Requirements 4.8**

### Property 19: Push Disabled Exclusion
*For any* notification send, users who have disabled push notifications should be excluded from the target audience.
**Validates: Requirements 4.9**

### Property 20: Blocked Venue Exclusion
*For any* notification send, users who have blocked/muted the venue should be excluded from the target audience.
**Validates: Requirements 4.10**

### Property 21: Delivery Retry Logic
*For any* failed notification delivery, the system should retry up to 3 times before marking as permanently failed.
**Validates: Requirements 6.4**

### Property 28: Delivery Status Tracking
*For any* notification sent, the delivery status (sent, delivered, opened, failed) should be tracked and stored.
**Validates: Requirements 6.5**

### Property 29: Delivery Timestamp Recording
*For any* delivered notification, the delivery timestamp should be recorded in the database.
**Validates: Requirements 6.6**

### Property 30: Invalid Token Handling
*For any* invalid or expired device token encountered during delivery, it should be handled gracefully and removed from active tokens.
**Validates: Requirements 6.7, 6.8**

### Property 31: Permanent Failure Logging
*For any* notification that fails permanently after retries, an error should be logged with details.
**Validates: Requirements 6.9**

### Property 32: Template Auto-Population
*For any* notification template, the venue name should be automatically populated in the appropriate fields.
**Validates: Requirements 7.7**

### Property 33: Custom Template Persistence
*For any* custom template created by a venue, it should be saved and retrievable for future use.
**Validates: Requirements 7.9**

### Property 34: Send Count Tracking
*For any* notification sent, the total number of send attempts should be tracked and stored.
**Validates: Requirements 8.1**

### Property 35: Delivery Count Tracking
*For any* notification, the number of successful deliveries should be tracked separately from sends.
**Validates: Requirements 8.2**

### Property 36: Open Count Tracking
*For any* notification, the number of times it was opened by users should be tracked.
**Validates: Requirements 8.3**

### Property 37: Delivery Rate Calculation
*For any* notification, the delivery rate should be calculated as (delivered / sent) * 100.
**Validates: Requirements 8.4**

### Property 38: Open Rate Calculation
*For any* notification, the open rate should be calculated as (opened / delivered) * 100.
**Validates: Requirements 8.5**

### Property 39: Check-In Attribution Window
*For any* check-in that occurs within 2 hours of a notification being opened, it should be attributed to that notification.
**Validates: Requirements 8.6, 8.7**

### Property 40: Venue Muting
*For any* venue muted by a user, that user should not receive notifications from that venue.
**Validates: Requirements 9.6**

### Property 41: Preference Respect
*For any* notification send, user preferences (type filters, muted venues) should be respected in targeting.
**Validates: Requirements 9.7**

### Property 42: Immediate Preference Save
*For any* user preference change, it should be saved to the database immediately.
**Validates: Requirements 9.8**

### Property 43: Cross-Device Preference Sync
*For any* user preference change, it should be synced across all of that user's devices.
**Validates: Requirements 9.9**

### Property 44: Quiet Hours Enforcement
*For any* notification scheduled during a user's quiet hours, it should not be sent to that user.
**Validates: Requirements 9.10**

### Property 45: History Date Range Filter
*For any* date range filter applied to notification history, only notifications within that range should be returned.
**Validates: Requirements 10.5**

### Property 46: History Type Filter
*For any* notification type filter, only notifications of that type should be returned.
**Validates: Requirements 10.6**

### Property 47: History Status Filter
*For any* status filter (sent, scheduled, failed), only notifications with that status should be returned.
**Validates: Requirements 10.7**

### Property 48: Notification Duplication
*For any* past notification, duplicating it should create a new notification with the same content but a new ID.
**Validates: Requirements 10.9**

### Property 49: Notification Display in Tray
*For any* received notification, it should appear in the device's notification tray.
**Validates: Requirements 11.1**

### Property 50: Tap-to-Open Behavior
*For any* notification tapped by a user, the app should open and navigate to the venue detail screen.
**Validates: Requirements 11.2, 11.3**

### Property 51: Venue Branding in Notification
*For any* notification, it should include the venue name and logo in the notification display.
**Validates: Requirements 11.4**

### Property 52: App State Handling
*For any* notification received, it should be handled correctly regardless of app state (foreground, background, closed).
**Validates: Requirements 11.5, 11.6, 11.7**

### Property 53: Open Event Tracking
*For any* notification opened by a user, the open event should be tracked with a timestamp.
**Validates: Requirements 11.8**

### Property 54: Read Status Update
*For any* notification opened by a user, it should be marked as read in the notification center.
**Validates: Requirements 11.9**

### Property 55: Location Storage
*For any* location update from a user, the last known location should be stored in the database.
**Validates: Requirements 12.3**

### Property 56: Location Update on App Open
*For any* app open event, the user's location should be updated if location services are enabled.
**Validates: Requirements 12.4**

### Property 57: Distance Calculation for Targeting
*For any* user and venue pair, the distance should be calculated using the Haversine formula for geo-targeting.
**Validates: Requirements 12.5**

### Property 58: Geo-Radius Filtering
*For any* geo-targeted notification with a specified radius, only users within that radius should be targeted.
**Validates: Requirements 12.6**

### Property 59: No-Location Graceful Handling
*For any* user without location data, they should be excluded from geo-targeted notifications without causing errors.
**Validates: Requirements 12.7**

### Property 60: Location Privacy Respect
*For any* user with location services disabled, they should be excluded from geo-targeted notifications.
**Validates: Requirements 12.8, 12.9**

### Property 55: Daily Quota Enforcement
*For any* venue on the Free tier, they should not have access to push notifications.
**Validates: Requirements 12.1**

### Property 56: Tier-Based Limits
*For any* venue, the notification limit should match their subscription tier (Free: no access, Core: 20/month, Pro: 60/month, Revenue+: unlimited with fair use).
**Validates: Requirements 12.2**

### Property 63: Quota Exceeded Prevention
*For any* venue that has exceeded their daily quota, attempts to send notifications should be prevented with an error.
**Validates: Requirements 13.4**

### Property 58: Daily Quota Reset
*For any* venue, their monthly notification quota should reset on the first day of each month.
**Validates: Requirements 12.5**

### Property 65: Send Tracking Per Venue
*For any* notification send, it should be tracked against the venue's daily quota.
**Validates: Requirements 13.6**

### Property 66: Quota Limit Error Message
*For any* attempt to send when quota is exceeded, a clear error message should be displayed.
**Validates: Requirements 13.7**

### Property 67: Send Audit Logging
*For any* notification send, it should be logged for audit purposes with timestamp and details.
**Validates: Requirements 13.9**

### Property 68: Failure Error Logging
*For any* notification send failure, the error should be logged with categorization and details.
**Validates: Requirements 14.1**

### Property 69: Failure Error Display
*For any* notification failure, an error message should be shown to the venue owner.
**Validates: Requirements 14.2**

### Property 70: Error Categorization
*For any* error encountered, it should be categorized (invalid token, network error, permission denied, etc.).
**Validates: Requirements 14.3**

### Property 71: Transient Error Retry
*For any* transient error (network timeout, temporary FCM issue), the system should automatically retry.
**Validates: Requirements 14.5**

### Property 72: Permanent Error No-Retry
*For any* permanent error (invalid token, permission denied), the system should not retry.
**Validates: Requirements 14.6**

### Property 73: Venue Error Rate Tracking
*For any* venue, the error rate of their notifications should be tracked over time.
**Validates: Requirements 14.7**

### Property 74: High Error Rate Alert
*For any* venue with an error rate above a threshold, an alert should be sent to the venue owner.
**Validates: Requirements 14.8**

### Property 75: Test Notification Owner-Only
*For any* test notification, it should only be sent to the venue owner's registered devices.
**Validates: Requirements 17.2**

### Property 76: Test Notification Credit Exemption
*For any* test notification sent, it should not consume push credits from the venue's quota.
**Validates: Requirements 17.3**

### Property 77: Test Notification Analytics Exclusion
*For any* test notification, it should not be counted in the venue's analytics or statistics.
**Validates: Requirements 17.4**

### Property 78: Test Notification Labeling
*For any* test notification, it should be clearly labeled as a test in the notification content or metadata.
**Validates: Requirements 17.5**

### Property 79: Test Notification Feedback
*For any* test notification sent, feedback on success or failure should be provided to the venue owner.
**Validates: Requirements 17.10**


## Error Handling

### Error Categories

1. **Permission Errors**
   - User denied push permission
   - User permanently denied push permission
   - Location permission denied for geo-targeting
   
   **Handling:** Display clear error messages with instructions to enable in settings. Provide deep link to device settings.

2. **Token Errors**
   - Invalid device token
   - Expired device token
   - Token not found
   
   **Handling:** Remove invalid tokens from database. Request token refresh. Log error for monitoring.

3. **Delivery Errors**
   - FCM service unavailable
   - Network timeout
   - Rate limit exceeded
   
   **Handling:** Retry transient errors up to 3 times with exponential backoff. Log permanent failures. Alert venue owner if error rate is high.

4. **Validation Errors**
   - Empty title or message
   - Title/message too long
   - Invalid targeting options
   - Scheduled time in the past
   
   **Handling:** Display validation errors inline in the form. Prevent submission until errors are fixed.

5. **Quota Errors**
   - Daily notification limit exceeded
   - Insufficient push credits
   
   **Handling:** Display clear error message with remaining quota. Offer upgrade options or credit purchase.

6. **Targeting Errors**
   - No users match targeting criteria
   - Location data unavailable for geo-targeting
   
   **Handling:** Display warning with estimated reach of 0. Suggest alternative targeting options.

### Error Recovery Strategies

**Automatic Retry:**
- Network timeouts: Retry with exponential backoff (1s, 2s, 4s)
- FCM rate limits: Queue and retry after rate limit window
- Transient FCM errors: Retry up to 3 times

**Manual Intervention:**
- Permission denied: User must enable in device settings
- Quota exceeded: Venue must upgrade or purchase credits
- Invalid content: Venue must fix validation errors

**Graceful Degradation:**
- If geo-targeting fails, fall back to favorites-only targeting
- If FCM is unavailable, queue notifications for later delivery
- If analytics tracking fails, still deliver notification

### Error Logging and Monitoring

All errors should be logged with:
- Error type and category
- Timestamp
- User/venue context
- Stack trace (for system errors)
- Attempted recovery actions

Critical errors should trigger alerts:
- FCM service unavailable for > 5 minutes
- Error rate > 10% for any venue
- Background job failures
- Database connection issues

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Permission Handling:**
- Test permission request on first launch
- Test permission denial handling
- Test deep link to settings
- Test permission status persistence

**Validation:**
- Test title length limit (50 chars)
- Test message length limit (200 chars)
- Test empty content rejection
- Test scheduled time validation

**Targeting:**
- Test "All Users" targeting
- Test "Favorites Only" targeting
- Test geo-radius filtering
- Test combined filters

**Analytics:**
- Test delivery rate calculation
- Test open rate calculation
- Test check-in attribution
- Test aggregate statistics

**Error Handling:**
- Test invalid token removal
- Test retry logic for transient errors
- Test no-retry for permanent errors
- Test error categorization

### Property-Based Testing

Property tests will verify universal properties across all inputs using a property-based testing library (e.g., fast-check for TypeScript):

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: push-notification-system, Property {number}: {property_text}`

**Key Properties to Test:**

1. **Token Management Properties:**
   - Property 1: Device Token Storage Consistency
   - Property 2: Token Refresh Handling
   - Property 3: Multi-Device Support
   - Property 4: Logout Token Cleanup

2. **Targeting Properties:**
   - Property 14: All Users Targeting
   - Property 15: Favorites-Only Targeting
   - Property 16: Distance Calculation Accuracy
   - Property 18: Combined Filter Intersection

3. **Validation Properties:**
   - Property 10: Title Length Validation
   - Property 11: Message Length Validation
   - Property 12: Empty Content Validation

4. **Scheduling Properties:**
   - Property 21: Delivery Retry Logic
   - Property 22: Delivery Status Tracking
   - Property 23: Delivery Timestamp Recording

5. **Analytics Properties:**
   - Property 31: Delivery Rate Calculation
   - Property 32: Open Rate Calculation
   - Property 33: Check-In Attribution Window

6. **Quota Properties:**
   - Property 55: Daily Quota Enforcement
   - Property 56: Tier-Based Limits
   - Property 58: Daily Quota Reset

### Integration Testing

Integration tests will verify end-to-end flows:

**Notification Send Flow:**
1. Venue creates notification
2. System targets users
3. FCM delivers to devices
4. Analytics tracks delivery
5. User opens notification
6. App navigates to venue

**Scheduling Flow:**
1. Venue creates notification
2. System targets users immediately
3. Notification is sent
4. Venue views analytics

**Permission Flow:**
1. App requests permission
2. User grants/denies
3. Status is stored
4. Targeting respects status

### End-to-End Testing

E2E tests will verify complete user journeys:

**Venue Owner Journey:**
1. Log in to venue dashboard
2. Create push notification
3. Select targeting options
4. Preview notification
5. Send or schedule
6. View analytics

**Customer Journey:**
1. Receive push notification
2. Tap notification
3. App opens to venue detail
4. Check in to venue
5. Check-in is attributed to notification

### Performance Testing

Performance tests will verify system scalability:

**Load Testing:**
- Send 1,000 notifications simultaneously
- Target 10,000 users with geo-filtering
- Process 100 scheduled notifications per minute

**Latency Testing:**
- Notification delivery within 30 seconds
- Analytics update within 5 seconds
- Targeting calculation within 2 seconds

**Stress Testing:**
- Handle FCM rate limits gracefully
- Process notifications during peak hours
- Recover from database connection issues

### Testing Tools

- **Unit Tests:** Jest + React Native Testing Library
- **Property Tests:** fast-check (TypeScript property-based testing)
- **Integration Tests:** Detox (React Native E2E testing)
- **API Tests:** Supertest (HTTP assertions)
- **Performance Tests:** Artillery (load testing)

### Test Coverage Goals

- Unit test coverage: > 80%
- Property test coverage: All critical properties (79 properties)
- Integration test coverage: All major user flows
- E2E test coverage: Critical user journeys

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

### Background Job Processing

No background job processing is required for MVP. All notifications are sent immediately when created.

### Rate Limiting Strategy

Implement rate limiting at multiple levels:
- **Per Venue:** Enforce tier-based daily limits
- **Per User:** Prevent spam (max 10 notifications per day from all venues)
- **System-Wide:** Respect FCM rate limits (1 million messages per minute)

### Caching Strategy

Cache frequently accessed data:
- User device tokens (Redis, 1 hour TTL)
- User preferences (Redis, 1 hour TTL)
- Venue locations (Redis, 24 hour TTL)
- Favorites lists (Redis, 1 hour TTL)

Invalidate cache on:
- User preference changes
- Device token updates
- Favorites changes

### Security Considerations

- Validate all user input (title, message, targeting options)
- Sanitize notification content to prevent XSS
- Rate limit API endpoints to prevent abuse
- Encrypt device tokens at rest
- Use HTTPS for all API communication
- Implement CSRF protection for web dashboard
- Audit log all notification sends

### Scalability Considerations

- Use connection pooling for database queries
- Batch FCM requests (up to 500 devices per request)
- Implement horizontal scaling for background jobs
- Use read replicas for analytics queries
- Partition notification_deliveries table by date
- Archive old notifications after 90 days

### Monitoring and Alerting

Monitor key metrics:
- Notification delivery rate (target: > 95%)
- Notification open rate (target: > 10%)
- FCM error rate (target: < 5%)
- API response time (target: < 500ms)

Alert on:
- Delivery rate drops below 90%
- Error rate exceeds 10%
- FCM service unavailable
- Database connection issues

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Rich Notifications:**
   - Images and media attachments
   - Action buttons (e.g., "Reserve Table", "View Menu")
   - Custom notification sounds

2. **Advanced Targeting:**
   - Behavioral targeting (frequent visitors, lapsed customers)
   - Demographic targeting (age, gender)
   - Time-based targeting (lunch crowd, happy hour)
   - Weather-based targeting (rainy day promotions)

3. **A/B Testing:**
   - Test different notification content
   - Test different send times
   - Measure conversion rates
   - Automatic winner selection

4. **Automation Rules:**
   - Auto-send when capacity drops below threshold
   - Auto-send during slow hours
   - Auto-send to lapsed customers
   - Recurring notifications (weekly specials)

5. **Advanced Analytics:**
   - Revenue attribution
   - Customer lifetime value impact
   - Cohort analysis
   - Predictive analytics

6. **Multi-Language Support:**
   - Detect user language preference
   - Send notifications in user's language
   - Template translations

7. **Notification Templates Marketplace:**
   - Pre-built templates for common use cases
   - Community-contributed templates
   - Industry-specific templates

8. **Integration with Other Channels:**
   - SMS fallback for critical notifications
   - Email notifications
   - In-app messaging
   - Social media cross-posting

## Conclusion

The Push Notification System is the core monetization feature of the OTW platform, enabling venues to drive foot traffic through targeted, timely notifications. The system is designed to be reliable, scalable, and compliant with platform guidelines while providing venues with powerful tools to measure campaign effectiveness.

Key design principles:
- **Reliability:** Retry logic, error handling, and monitoring ensure high delivery rates
- **Scalability:** Batching, caching, and horizontal scaling support high-volume sends
- **User Experience:** Respect user preferences, quiet hours, and provide clear opt-out options
- **Compliance:** Follow platform guidelines, implement fair use policies, and audit all sends
- **Analytics:** Track delivery, opens, and conversions to measure ROI

The system integrates seamlessly with existing OTW features (favorites, check-ins, location services) and provides a foundation for future enhancements like automation rules, A/B testing, and advanced targeting.
