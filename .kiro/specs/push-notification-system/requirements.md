# Requirements Document

## Introduction

This specification outlines the implementation of a push notification system that enables venue owners to send targeted promotional notifications to customers. This is the core monetization feature of the OTW platform, allowing venues to drive foot traffic through geo-targeted push notifications.

## Glossary

- **Push Notification**: A message sent from a venue to users' mobile devices via Firebase Cloud Messaging (FCM)
- **Venue Owner**: A business account user who can send push notifications to customers
- **Customer**: An end user who receives push notifications from venues
- **Geo-Targeting**: Filtering recipients based on their distance from the venue
- **Push Credit**: A purchasable unit representing one push notification send (available as add-on packs: 3 for $25, 10 for $120, 25 for $299)
- **FCM**: Firebase Cloud Messaging, the service used to deliver push notifications
- **Device Token**: A unique identifier for a user's device used by FCM to deliver notifications
- **Flash Offer**: A time-limited promotional push notification
- **Favorited User**: A customer who has marked a venue as a favorite
- **Delivery Status**: The state of a push notification (sent, delivered, opened, failed)
- **Geo-Radius**: The maximum distance from a venue for targeting users (e.g., 1 mile)

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

**User Story:** As a customer, I want to control whether I receive push notifications, so that I can manage my notification preferences.

#### Acceptance Criteria

1. THE System SHALL request push notification permission on first app launch
2. WHEN permission is denied, THE System SHALL provide a way to request again
3. THE System SHALL store the user's push permission status
4. THE System SHALL provide a settings toggle for push notifications
5. WHEN push notifications are disabled, THE System SHALL not send notifications to that user
6. THE System SHALL handle iOS notification permission states (authorized, denied, provisional)
7. THE System SHALL handle Android notification permission states (granted, denied)
8. WHEN permission is permanently denied, THE System SHALL show instructions to enable in device settings
9. THE System SHALL provide a deep link to device notification settings
10. THE System SHALL track permission status changes

### Requirement 3: Venue Push Notification Creation

**User Story:** As a venue owner, I want to create and send push notifications to customers, so that I can promote my business and drive foot traffic.

#### Acceptance Criteria

1. THE System SHALL provide a "Send Push Notification" interface in the venue dashboard
2. THE System SHALL allow venue owners to enter a notification title
3. THE System SHALL allow venue owners to enter a notification message body
4. THE System SHALL limit notification title to 50 characters
5. THE System SHALL limit notification message to 200 characters
6. THE System SHALL provide character count indicators
7. THE System SHALL validate that title and message are not empty
8. THE System SHALL provide a preview of how the notification will appear
9. THE System SHALL allow venue owners to select a notification type (General, Flash Offer, Event)
10. THE System SHALL save draft notifications for later editing

### Requirement 4: Push Notification Targeting

**User Story:** As a venue owner, I want to target specific customers with my push notifications, so that I can reach the most relevant audience.

#### Acceptance Criteria

1. THE System SHALL provide targeting options: All Users, Favorited Users, Geo-Targeted Users
2. WHEN "All Users" is selected, THE System SHALL send to all users with push enabled
3. WHEN "Favorited Users" is selected, THE System SHALL send only to users who favorited the venue
4. WHEN "Geo-Targeted" is selected, THE System SHALL provide radius options (0.5mi, 1mi, 2mi, 5mi)
5. THE System SHALL calculate user distance from venue using stored location data
6. THE System SHALL only target users who have location services enabled
7. THE System SHALL show estimated reach count before sending
8. THE System SHALL combine targeting filters (e.g., Favorited + Geo-Targeted)
9. THE System SHALL exclude users who have disabled push notifications
10. THE System SHALL exclude users who have blocked the venue

### Requirement 5: Push Notification Delivery

**User Story:** As a system, I want to reliably deliver push notifications to users' devices, so that venues can effectively reach their customers.

#### Acceptance Criteria

1. THE System SHALL send push notifications via Firebase Cloud Messaging
2. THE System SHALL batch notifications for efficient delivery
3. THE System SHALL handle FCM rate limits gracefully
4. THE System SHALL retry failed deliveries up to 3 times
5. THE System SHALL track delivery status for each notification
6. THE System SHALL record delivery timestamps
7. THE System SHALL handle device token errors (invalid, expired)
8. THE System SHALL remove invalid device tokens from the database
9. WHEN a notification fails permanently, THE System SHALL log the error
10. THE System SHALL deliver notifications within 30 seconds of sending

### Requirement 6: Push Notification Templates

**User Story:** As a venue owner, I want to use pre-built notification templates, so that I can quickly create effective promotions.

#### Acceptance Criteria

1. THE System SHALL provide a "Flash Offer" template
2. THE System SHALL provide an "Event Announcement" template
3. THE System SHALL provide a "General Promotion" template
4. THE Flash Offer template SHALL include fields for: offer description, expiration time
5. THE Event template SHALL include fields for: event name, date, time
6. THE General template SHALL include fields for: custom title, custom message
7. THE System SHALL auto-populate venue name in templates
8. THE System SHALL allow customization of template content
9. THE System SHALL save custom templates for reuse
10. THE System SHALL provide template preview before sending

### Requirement 7: Push Notification Analytics

**User Story:** As a venue owner, I want to see analytics for my push notifications, so that I can measure their effectiveness.

#### Acceptance Criteria

1. THE System SHALL track the number of notifications sent
2. THE System SHALL track the number of notifications delivered
3. THE System SHALL track the number of notifications opened
4. THE System SHALL calculate delivery rate (delivered / sent)
5. THE System SHALL calculate open rate (opened / delivered)
6. THE System SHALL track check-ins within 2 hours of notification
7. THE System SHALL attribute check-ins to specific notifications
8. THE System SHALL show analytics per notification
9. THE System SHALL show aggregate analytics for all notifications
10. THE System SHALL display analytics in the venue dashboard

### Requirement 8: Customer Push Notification Preferences

**User Story:** As a customer, I want to control which types of notifications I receive, so that I only get relevant updates.

#### Acceptance Criteria

1. THE System SHALL provide notification preference settings
2. THE System SHALL allow users to enable/disable all push notifications
3. THE System SHALL allow users to enable/disable Flash Offer notifications
4. THE System SHALL allow users to enable/disable Event notifications
5. THE System SHALL allow users to enable/disable General notifications
6. THE System SHALL allow users to mute specific venues
7. THE System SHALL respect user preferences when sending notifications
8. THE System SHALL save preference changes immediately
9. THE System SHALL sync preferences across user devices
10. THE System SHALL provide a "Quiet Hours" setting (no notifications during specified times)

### Requirement 9: Push Notification History

**User Story:** As a venue owner, I want to view my notification history, so that I can track what I've sent and when.

#### Acceptance Criteria

1. THE System SHALL display a list of all sent notifications
2. THE System SHALL show notification title, message, and send date
3. THE System SHALL show targeting criteria used
4. THE System SHALL show delivery statistics (sent, delivered, opened)
5. THE System SHALL allow filtering by date range
6. THE System SHALL allow filtering by notification type
7. THE System SHALL allow filtering by status (sent, failed)
8. THE System SHALL allow venue owners to view notification details
9. THE System SHALL allow venue owners to duplicate past notifications
10. THE System SHALL paginate notification history for performance

### Requirement 10: Push Notification Received Experience

**User Story:** As a customer, I want to receive and interact with push notifications, so that I can discover promotions and events.

#### Acceptance Criteria

1. WHEN a notification is received, THE System SHALL display it in the device notification tray
2. WHEN a notification is tapped, THE System SHALL open the app
3. WHEN a notification is tapped, THE System SHALL navigate to the venue detail screen
4. THE System SHALL show venue name and logo in the notification
5. THE System SHALL handle notifications when app is in foreground
6. THE System SHALL handle notifications when app is in background
7. THE System SHALL handle notifications when app is closed
8. THE System SHALL track when a notification is opened
9. THE System SHALL mark notifications as read after opening
10. THE System SHALL provide an in-app notification center for viewing past notifications

### Requirement 11: Geo-Location for Push Targeting

**User Story:** As a venue owner, I want to target customers based on their proximity to my venue, so that I can reach people who can actually visit.

#### Acceptance Criteria

1. THE System SHALL use the existing location service for geo-targeting
2. THE System SHALL request location permission for push targeting
3. THE System SHALL store user's last known location
4. THE System SHALL update location when app is opened
5. THE System SHALL calculate distance between user and venue
6. THE System SHALL filter recipients based on geo-radius setting
7. THE System SHALL handle users without location data gracefully
8. THE System SHALL respect user's location privacy settings
9. THE System SHALL not send geo-targeted pushes to users with location disabled
10. THE System SHALL show venue owners how many users are within each radius

### Requirement 12: Push Notification Rate Limiting

**User Story:** As a system administrator, I want to prevent spam and abuse, so that users have a positive experience with notifications.

#### Acceptance Criteria

1. THE System SHALL not allow push notifications for Free tier venues
2. THE System SHALL enforce tier-based notification limits (Core: 20/month, Pro: 60/month, Revenue+: unlimited with fair use)
3. THE System SHALL show remaining notification quota in venue dashboard
4. WHEN quota is exceeded, THE System SHALL prevent sending
5. THE System SHALL reset monthly quotas on the first day of each month
6. THE System SHALL track notification sends per venue per month
7. THE System SHALL provide clear error messages when limits are reached
8. THE System SHALL allow system administrators to adjust limits
9. THE System SHALL log all notification sends for audit purposes
10. THE System SHALL implement fair use policies for Revenue+ tier (unlimited standard pushes)

### Requirement 13: Push Notification Error Handling

**User Story:** As a venue owner, I want to be notified when push notifications fail, so that I can take corrective action.

#### Acceptance Criteria

1. WHEN a notification fails to send, THE System SHALL log the error
2. WHEN a notification fails, THE System SHALL show an error message to the venue owner
3. THE System SHALL categorize errors (invalid token, network error, permission denied)
4. THE System SHALL provide actionable error messages
5. THE System SHALL retry transient errors automatically
6. THE System SHALL not retry permanent errors
7. THE System SHALL track error rates per venue
8. WHEN error rate is high, THE System SHALL alert the venue owner
9. THE System SHALL provide troubleshooting guidance for common errors
10. THE System SHALL allow venue owners to report notification issues

### Requirement 14: Push Notification Database Schema

**User Story:** As a system, I want a robust database schema for push notifications, so that all notification data is stored reliably.

#### Acceptance Criteria

1. THE System SHALL create a push_notifications table
2. THE System SHALL create a device_tokens table
3. THE System SHALL create a notification_deliveries table
4. THE System SHALL create a notification_analytics table
5. THE System SHALL create a user_notification_preferences table
6. THE System SHALL establish foreign key relationships between tables
7. THE System SHALL index frequently queried columns
8. THE System SHALL store notification content (title, message, type)
9. THE System SHALL store targeting criteria (radius, user filters)
10. THE System SHALL store delivery metadata (sent_at, delivered_at, opened_at)

### Requirement 15: Push Notification Testing

**User Story:** As a venue owner, I want to test push notifications before sending to all users, so that I can verify they work correctly.

#### Acceptance Criteria

1. THE System SHALL provide a "Send Test Notification" option
2. THE System SHALL send test notifications only to the venue owner's device
3. THE System SHALL not consume push credits for test notifications
4. THE System SHALL not count test notifications in analytics
5. THE System SHALL clearly label test notifications
6. THE System SHALL allow multiple test sends
7. THE System SHALL show test notification delivery status
8. THE System SHALL allow testing different notification types
9. THE System SHALL allow testing different targeting options
10. THE System SHALL provide feedback on test notification success/failure

### Requirement 16: Push Notification Compliance

**User Story:** As a system administrator, I want to ensure push notifications comply with platform guidelines, so that the app is not rejected or banned.

#### Acceptance Criteria

1. THE System SHALL comply with Apple Push Notification Service guidelines
2. THE System SHALL comply with Firebase Cloud Messaging guidelines
3. THE System SHALL not send spam or unsolicited notifications
4. THE System SHALL respect user opt-out preferences
5. THE System SHALL provide clear unsubscribe options
6. THE System SHALL not send notifications with misleading content
7. THE System SHALL not send notifications with prohibited content
8. THE System SHALL implement content moderation for notification text
9. THE System SHALL log all notifications for compliance audits
10. THE System SHALL allow users to report inappropriate notifications

### Requirement 17: Push Notification Performance

**User Story:** As a system, I want push notifications to be delivered quickly and efficiently, so that users receive timely updates.

#### Acceptance Criteria

1. THE System SHALL deliver notifications within 30 seconds of sending
2. THE System SHALL batch notifications for efficient processing
3. THE System SHALL optimize database queries for notification targeting
4. THE System SHALL cache frequently accessed data
5. THE System SHALL use connection pooling for FCM requests
6. THE System SHALL monitor notification delivery latency
7. THE System SHALL alert on performance degradation
8. THE System SHALL handle high-volume notification sends
9. THE System SHALL scale horizontally for increased load
10. THE System SHALL maintain 99.9% delivery success rate

### Requirement 18: Push Notification Integration with Existing Features

**User Story:** As a developer, I want push notifications to integrate seamlessly with existing app features, so that the user experience is cohesive.

#### Acceptance Criteria

1. THE System SHALL integrate with the existing venue dashboard
2. THE System SHALL use existing location services for geo-targeting
3. THE System SHALL use existing user authentication
4. THE System SHALL use existing venue data (name, location, etc.)
5. THE System SHALL integrate with the favorites system
6. THE System SHALL integrate with the check-in system
7. THE System SHALL use existing theme and styling
8. THE System SHALL follow existing navigation patterns
9. THE System SHALL use existing error handling patterns
10. THE System SHALL maintain consistency with existing UI components
