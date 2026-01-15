# Requirements Document

## Introduction

This specification outlines the implementation of real-time push notifications for social interactions in the OTW platform. Currently, the app uses polling (every 30 seconds) to check for new social notifications, which drains battery, delays notifications, and wastes API calls. This system will replace polling with Firebase Cloud Messaging (FCM) to deliver instant notifications for friend requests, venue shares, and other social interactions.

## Glossary

- **Push Notification**: A message sent from the server to a user's mobile device via Firebase Cloud Messaging (FCM)
- **Social Notification**: A notification triggered by user-to-user interactions (friend requests, venue shares, etc.)
- **FCM**: Firebase Cloud Messaging, the service used to deliver push notifications
- **Device Token**: A unique identifier for a user's device used by FCM to deliver notifications
- **In-App Notification**: A notification stored in the database and displayed in the app's notification center
- **Push Payload**: The data sent with a push notification (title, body, navigation data)
- **Background Notification**: A notification received when the app is not in the foreground
- **Notification Preferences**: User settings controlling which types of social notifications they receive

## Requirements

### Requirement 1: Firebase Cloud Messaging Setup

**User Story:** As a system administrator, I want Firebase Cloud Messaging configured for both iOS and Android, so that the app can send and receive push notifications reliably.

#### Acceptance Criteria

1. THE System SHALL integrate Firebase Cloud Messaging SDK for React Native
2. THE System SHALL configure FCM for iOS with APNs certificates
3. THE System SHALL configure FCM for Android with google-services.json
4. THE System SHALL handle FCM token generation on app launch
5. THE System SHALL store FCM device tokens in the database
6. THE System SHALL refresh FCM tokens when they expire
7. THE System SHALL handle token refresh events
8. THE System SHALL associate device tokens with user accounts
9. WHEN a user logs out, THE System SHALL remove their device token association
10. THE System SHALL support multiple devices per user account

### Requirement 2: Push Permission Management

**User Story:** As a user, I want to control whether I receive push notifications, so that I can manage my notification preferences.

#### Acceptance Criteria

1. THE System SHALL request push notification permission on first app launch
2. WHEN permission is denied, THE System SHALL provide a way to request again
3. THE System SHALL store the user's push permission status
4. THE System SHALL provide a settings toggle for push notifications
5. WHEN push notifications are disabled, THE System SHALL not send push notifications to that user
6. THE System SHALL handle iOS notification permission states (authorized, denied, provisional)
7. THE System SHALL handle Android notification permission states (granted, denied)
8. WHEN permission is permanently denied, THE System SHALL show instructions to enable in device settings
9. THE System SHALL provide a deep link to device notification settings
10. THE System SHALL track permission status changes

### Requirement 3: Friend Request Push Notifications

**User Story:** As a user, I want to receive instant push notifications when someone sends me a friend request, so that I can respond quickly.

#### Acceptance Criteria

1. WHEN a user sends a friend request, THE System SHALL create an in-app notification
2. WHEN a user sends a friend request, THE System SHALL send a push notification to the recipient
3. THE Push_Notification SHALL include the sender's name in the title
4. THE Push_Notification SHALL include "sent you a friend request" in the body
5. WHEN the push notification is tapped, THE System SHALL open the app
6. WHEN the push notification is tapped, THE System SHALL navigate to the friend requests screen
7. THE System SHALL include the friend request ID in the notification payload
8. THE System SHALL respect the user's notification preferences for friend requests
9. WHEN friend request notifications are disabled, THE System SHALL create in-app notification but not send push
10. THE System SHALL handle push delivery failures gracefully

### Requirement 4: Friend Accepted Push Notifications

**User Story:** As a user, I want to receive instant push notifications when someone accepts my friend request, so that I know we're now connected.

#### Acceptance Criteria

1. WHEN a user accepts a friend request, THE System SHALL create an in-app notification for the requester
2. WHEN a user accepts a friend request, THE System SHALL send a push notification to the requester
3. THE Push_Notification SHALL include the accepter's name in the title
4. THE Push_Notification SHALL include "accepted your friend request" in the body
5. WHEN the push notification is tapped, THE System SHALL open the app
6. WHEN the push notification is tapped, THE System SHALL navigate to the accepter's profile
7. THE System SHALL include the accepter's user ID in the notification payload
8. THE System SHALL respect the user's notification preferences for friend accepted
9. WHEN friend accepted notifications are disabled, THE System SHALL create in-app notification but not send push
10. THE System SHALL handle push delivery failures gracefully

### Requirement 5: Venue Share Push Notifications

**User Story:** As a user, I want to receive instant push notifications when a friend shares a venue with me, so that I can check it out.

#### Acceptance Criteria

1. WHEN a user shares a venue, THE System SHALL create an in-app notification for the recipient
2. WHEN a user shares a venue, THE System SHALL send a push notification to the recipient
3. THE Push_Notification SHALL include the sender's name and venue name in the body
4. THE Push_Notification SHALL use format: "[Name] shared [Venue] with you"
5. WHEN the push notification is tapped, THE System SHALL open the app
6. WHEN the push notification is tapped, THE System SHALL navigate to the venue detail screen
7. THE System SHALL include the venue ID in the notification payload
8. THE System SHALL respect the user's notification preferences for venue shares
9. WHEN venue share notifications are disabled, THE System SHALL create in-app notification but not send push
10. THE System SHALL handle push delivery failures gracefully

### Requirement 6: Push Notification Delivery

**User Story:** As a system, I want to reliably deliver push notifications to users' devices, so that users receive timely social updates.

#### Acceptance Criteria

1. THE System SHALL send push notifications via Firebase Cloud Messaging
2. THE System SHALL send push notifications immediately when social events occur
3. THE System SHALL handle FCM rate limits gracefully
4. THE System SHALL retry failed deliveries up to 2 times
5. THE System SHALL track delivery status for each notification
6. THE System SHALL handle device token errors (invalid, expired)
7. THE System SHALL remove invalid device tokens from the database
8. WHEN a notification fails permanently, THE System SHALL log the error
9. THE System SHALL deliver notifications within 5 seconds of the triggering event
10. THE System SHALL batch multiple notifications if needed for efficiency

### Requirement 7: Push Notification Reception

**User Story:** As a user, I want to receive and interact with push notifications, so that I can stay updated on social interactions.

#### Acceptance Criteria

1. WHEN a notification is received, THE System SHALL display it in the device notification tray
2. WHEN a notification is tapped, THE System SHALL open the app
3. WHEN a notification is tapped, THE System SHALL navigate to the appropriate screen
4. THE System SHALL handle notifications when app is in foreground
5. THE System SHALL handle notifications when app is in background
6. THE System SHALL handle notifications when app is closed
7. THE System SHALL track when a notification is opened
8. THE System SHALL mark in-app notifications as read after opening
9. THE System SHALL show user avatar in notification when available
10. THE System SHALL group multiple notifications by type when possible

### Requirement 8: Social Notification Preferences

**User Story:** As a user, I want to control which types of social notifications I receive, so that I only get updates I care about.

#### Acceptance Criteria

1. THE System SHALL provide notification preference settings
2. THE System SHALL allow users to enable/disable friend request notifications
3. THE System SHALL allow users to enable/disable friend accepted notifications
4. THE System SHALL allow users to enable/disable venue share notifications
5. THE System SHALL allow users to enable/disable collection follow notifications
6. THE System SHALL allow users to enable/disable activity like notifications
7. THE System SHALL allow users to enable/disable activity comment notifications
8. THE System SHALL respect user preferences when sending push notifications
9. THE System SHALL save preference changes immediately
10. THE System SHALL sync preferences across user devices

### Requirement 9: Integration with Existing Social Features

**User Story:** As a developer, I want push notifications to integrate seamlessly with existing social features, so that the user experience is cohesive.

#### Acceptance Criteria

1. THE System SHALL integrate with the existing NotificationService
2. THE System SHALL use existing social_notifications table for in-app notifications
3. THE System SHALL use existing notification_preferences table for user preferences
4. THE System SHALL trigger push notifications from existing social event handlers
5. THE System SHALL use existing FriendsService for friend request notifications
6. THE System SHALL use existing VenueShareService for venue share notifications
7. THE System SHALL use existing theme and styling for notification UI
8. THE System SHALL follow existing navigation patterns
9. THE System SHALL use existing error handling patterns
10. THE System SHALL maintain consistency with existing notification center

### Requirement 10: Push Notification Database Schema

**User Story:** As a system, I want a database schema for push notification device tokens, so that tokens are stored reliably.

#### Acceptance Criteria

1. THE System SHALL create a device_tokens table
2. THE device_tokens table SHALL store user_id, token, platform, and timestamps
3. THE System SHALL establish foreign key relationship to profiles table
4. THE System SHALL index the user_id column for fast lookups
5. THE System SHALL index the token column with unique constraint
6. THE System SHALL track when each token was last used
7. THE System SHALL mark tokens as active or inactive
8. THE System SHALL allow multiple tokens per user (multiple devices)
9. THE System SHALL cascade delete tokens when user is deleted
10. THE System SHALL store platform information (ios or android)

### Requirement 11: Remove Polling System

**User Story:** As a developer, I want to remove the polling system once push notifications are working, so that we reduce battery drain and API calls.

#### Acceptance Criteria

1. WHEN push notifications are enabled, THE System SHALL disable polling
2. THE System SHALL remove the 30-second polling interval from NotificationContext
3. THE System SHALL keep manual refresh functionality for pull-to-refresh
4. THE System SHALL fall back to manual refresh if push is disabled
5. THE System SHALL log when polling is disabled
6. THE System SHALL provide a way to re-enable polling for debugging
7. THE System SHALL update documentation to reflect push-first approach
8. THE System SHALL remove unused polling-related code
9. THE System SHALL keep the refetch() method for manual updates
10. THE System SHALL test that notifications work without polling

### Requirement 12: Push Notification Error Handling

**User Story:** As a developer, I want comprehensive error handling for push notifications, so that failures are logged and handled gracefully.

#### Acceptance Criteria

1. WHEN a push notification fails to send, THE System SHALL log the error
2. THE System SHALL categorize errors (invalid token, network error, permission denied)
3. THE System SHALL provide actionable error messages
4. THE System SHALL retry transient errors automatically
5. THE System SHALL not retry permanent errors
6. THE System SHALL track error rates for monitoring
7. THE System SHALL handle FCM service unavailability gracefully
8. THE System SHALL handle token refresh failures
9. THE System SHALL handle permission denial gracefully
10. THE System SHALL alert administrators if error rate exceeds threshold

### Requirement 13: Push Notification Testing

**User Story:** As a developer, I want to test push notifications during development, so that I can verify they work correctly.

#### Acceptance Criteria

1. THE System SHALL provide a way to send test notifications
2. THE System SHALL allow testing notifications to specific device tokens
3. THE System SHALL log all test notification sends
4. THE System SHALL provide feedback on test notification delivery
5. THE System SHALL allow testing different notification types
6. THE System SHALL allow testing with different payloads
7. THE System SHALL allow testing foreground/background/closed states
8. THE System SHALL provide a debug mode for verbose logging
9. THE System SHALL allow testing without affecting production users
10. THE System SHALL document testing procedures

### Requirement 14: Push Notification Performance

**User Story:** As a system, I want push notifications to be delivered quickly and efficiently, so that users receive timely updates.

#### Acceptance Criteria

1. THE System SHALL deliver notifications within 5 seconds of triggering event
2. THE System SHALL use connection pooling for FCM requests
3. THE System SHALL cache device tokens for active users
4. THE System SHALL batch notifications when appropriate
5. THE System SHALL monitor notification delivery latency
6. THE System SHALL alert on performance degradation
7. THE System SHALL handle high-volume notification sends
8. THE System SHALL optimize database queries for token lookups
9. THE System SHALL maintain 99% delivery success rate
10. THE System SHALL log performance metrics for monitoring

### Requirement 15: Push Notification Compliance

**User Story:** As a system administrator, I want push notifications to comply with platform guidelines, so that the app is not rejected or banned.

#### Acceptance Criteria

1. THE System SHALL comply with Apple Push Notification Service guidelines
2. THE System SHALL comply with Firebase Cloud Messaging guidelines
3. THE System SHALL not send spam or unsolicited notifications
4. THE System SHALL respect user opt-out preferences
5. THE System SHALL provide clear notification settings
6. THE System SHALL not send notifications with misleading content
7. THE System SHALL implement rate limiting to prevent abuse
8. THE System SHALL log all notifications for compliance audits
9. THE System SHALL allow users to report inappropriate notifications
10. THE System SHALL handle user privacy data according to regulations
