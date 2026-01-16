# Implementation Plan: Push Notification System

## Overview

This plan outlines the step-by-step implementation of the push notification system, which is the core monetization feature of the OTW platform. The approach is incremental, starting with Firebase setup and basic delivery, then adding targeting, analytics, and finally user preferences and testing. All notifications are sent immediately when created (no scheduling for MVP).

## Tasks

- [ ] 1. Firebase Cloud Messaging Setup
  - [ ] 1.1 Install and configure Firebase SDK
    - Install @react-native-firebase/app and @react-native-firebase/messaging
    - Add google-services.json for Android
    - Configure Firebase in iOS project with GoogleService-Info.plist
    - Update build.gradle and Podfile with Firebase dependencies
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 1.2 Configure iOS APNs integration
    - Create APNs certificate in Apple Developer Portal
    - Upload certificate to Firebase Console
    - Configure Info.plist with notification permissions
    - Implement UNUserNotificationCenter delegate
    - _Requirements: 1.2_
  
  - [ ] 1.3 Configure Android notification channels
    - Create notification channels for Android 8+
    - Configure channel importance and behavior
    - Handle notification icons and colors
    - _Requirements: 1.3_
  
  - [ ] 1.4 Implement FCM token generation and storage
    - Generate FCM token on app launch
    - Store token in device_tokens table
    - Associate token with user account
    - Handle token refresh events
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8_
  
  - [ ]* 1.5 Write property tests for token management
    - **Property 1: Device Token Storage Consistency**
    - **Property 2: Token Refresh Handling**
    - **Property 3: Multi-Device Support**
    - **Property 4: Logout Token Cleanup**
    - **Validates: Requirements 1.5, 1.6, 1.7, 1.8, 1.9, 1.10**

- [ ] 2. Push Permission Management
  - [ ] 2.1 Create push permission service
    - Implement requestPermission() for iOS and Android
    - Implement checkPermissionStatus()
    - Handle permission states (authorized, denied, provisional)
    - Store permission status in user preferences
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7_
  
  - [ ] 2.2 Add settings toggle for push notifications
    - Create notification preferences screen
    - Add toggle for enabling/disabling push
    - Save preference to database
    - Sync preference across devices
    - _Requirements: 2.4, 9.1, 9.2_
  
  - [ ] 2.3 Implement permission denial handling
    - Show instructions for permanently denied permission
    - Provide deep link to device settings
    - Handle "never ask again" state on Android
    - _Requirements: 2.8, 2.9_
  
  - [ ]* 2.4 Write property tests for permission management
    - **Property 5: Permission Denial Recovery**
    - **Property 6: Permission Status Persistence**
    - **Property 7: Disabled Push Exclusion**
    - **Property 8: Platform Permission Handling**
    - **Property 9: Permanently Denied Guidance**
    - **Validates: Requirements 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.10**


- [ ] 3. Database Schema Implementation
  - [ ] 3.1 Create push notifications table
    - Create push_notifications table with all fields
    - Add indexes for venue_id, status, scheduled_for
    - Add check constraints for type and status
    - _Requirements: 15.1_
  
  - [ ] 3.2 Create device tokens table
    - Create device_tokens table with user association
    - Add indexes for user_id and active status
    - Add unique constraint on token
    - _Requirements: 15.2_
  
  - [ ] 3.3 Create notification deliveries table
    - Create notification_deliveries table
    - Add indexes for notification_id, user_id, status
    - Track delivery timestamps
    - _Requirements: 15.3_
  
  - [ ] 3.4 Create notification analytics table
    - Create notification_analytics table
    - Add unique constraint on notification_id
    - Include calculated fields (delivery_rate, open_rate)
    - _Requirements: 15.4_
  
  - [ ] 3.5 Create user notification preferences table
    - Create user_notification_preferences table
    - Add unique constraint on user_id
    - Include muted_venues array and quiet hours
    - _Requirements: 15.5_
  
  - [ ] 3.6 Create push notification credits table
    - Create push_notification_credits table
    - Add unique constraint on venue_id + date
    - Track daily limits and usage
    - _Requirements: 15.6_

- [ ] 4. Push Notification Service Layer
  - [ ] 4.1 Create PushNotificationService class
    - Implement createNotification() method
    - Implement sendNotification() method
    - Implement getNotificationHistory() method
    - Add validation for title and message length
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1_
  
  - [ ] 4.2 Create FCMService class
    - Implement sendToDevice() method
    - Implement sendToMultipleDevices() with batching
    - Implement token management methods
    - Handle FCM errors and retries
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 4.3 Implement notification validation
    - Validate title length (max 50 chars)
    - Validate message length (max 200 chars)
    - Validate empty content
    - Validate targeting options
    - _Requirements: 3.4, 3.5, 3.7_
  
  - [ ]* 4.4 Write property tests for validation
    - **Property 10: Title Length Validation**
    - **Property 11: Message Length Validation**
    - **Property 12: Empty Content Validation**
    - **Validates: Requirements 3.4, 3.5, 3.7**
  
  - [ ]* 4.5 Write unit tests for PushNotificationService
    - Test notification creation
    - Test validation errors
    - Test send success and failure
    - _Requirements: 3.1, 3.7_

- [ ] 5. Targeting Engine Implementation
  - [ ] 5.1 Create TargetingEngine class
    - Implement getTargetedUsers() method
    - Implement estimateReach() method
    - Apply user preference filters
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 5.2 Implement geo-targeting
    - Use existing LocationService for distance calculation
    - Implement getUsersWithinRadius() method
    - Filter users by geo-radius (0.5mi, 1mi, 2mi, 5mi)
    - Handle users without location data
    - _Requirements: 4.4, 4.5, 4.6, 12.1, 12.5, 12.6, 12.7_
  
  - [ ] 5.3 Implement favorites filtering
    - Query favorites table for venue
    - Filter users who favorited the venue
    - Combine with other filters
    - _Requirements: 4.3, 4.8_
  
  - [ ] 5.4 Implement exclusion filters
    - Exclude users with push disabled
    - Exclude users who muted the venue
    - Exclude users in quiet hours
    - _Requirements: 4.9, 4.10, 9.6, 9.10_
  
  - [ ]* 5.5 Write property tests for targeting
    - **Property 14: All Users Targeting**
    - **Property 15: Favorites-Only Targeting**
    - **Property 16: Distance Calculation Accuracy**
    - **Property 17: Geo-Targeting Location Requirement**
    - **Property 18: Combined Filter Intersection**
    - **Property 19: Push Disabled Exclusion**
    - **Property 20: Blocked Venue Exclusion**
    - **Validates: Requirements 4.2, 4.3, 4.5, 4.6, 4.8, 4.9, 4.10**

- [ ] 6. Venue Dashboard UI
  - [ ] 6.1 Create "Send Push Notification" screen
    - Add navigation to push notification screen
    - Create form with title and message inputs
    - Add character count indicators
    - Show notification preview
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.8_
  
  - [ ] 6.2 Add notification type selector
    - Create dropdown for General, Flash Offer, Event
    - Load appropriate template based on type
    - _Requirements: 3.9, 7.1, 7.2, 7.3_
  
  - [ ] 6.3 Add targeting options UI
    - Create radio buttons for All Users, Favorites, Geo
    - Add geo-radius slider (0.5mi - 5mi)
    - Show estimated reach count
    - Add "combine with favorites" checkbox
    - _Requirements: 4.1, 4.4, 4.7_
  
  - [ ] 6.4 Add send button
    - Create "Send Now" button
    - Validate notification before sending
    - Show confirmation dialog before sending
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 6.5 Write unit tests for dashboard UI
    - Test form validation
    - Test character count
    - Test targeting selection
    - Test schedule validation

- [ ] 7. Notification Templates
  - [ ] 7.1 Create template system
    - Define template interface
    - Create Flash Offer template
    - Create Event template
    - Create General template
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 7.2 Implement template auto-population
    - Auto-fill venue name in templates
    - Pre-populate common fields
    - Allow customization of template content
    - _Requirements: 7.7, 7.8_
  
  - [ ] 7.3 Add template preview
    - Show how notification will appear on device
    - Include venue logo and branding
    - _Requirements: 7.10_
  
  - [ ] 7.4 Implement custom template saving
    - Allow venues to save custom templates
    - Store templates in database
    - Load saved templates for reuse
    - _Requirements: 7.9_
  
  - [ ]* 7.5 Write property tests for templates
    - **Property 26: Template Auto-Population**
    - **Property 27: Custom Template Persistence**
    - **Validates: Requirements 7.7, 7.9**

- [ ] 8. Notification Delivery and Tracking
  - [ ] 8.1 Implement delivery tracking
    - Track sent status when notification is queued
    - Track delivered status from FCM callback
    - Track opened status when user taps notification
    - Record timestamps for each status
    - _Requirements: 6.5, 6.6_
  
  - [ ] 8.2 Implement retry logic
    - Retry failed deliveries up to 3 times
    - Use exponential backoff (1s, 2s, 4s)
    - Don't retry permanent errors
    - Log all retry attempts
    - _Requirements: 6.4, 14.5, 14.6_
  
  - [ ] 8.3 Handle invalid device tokens
    - Detect invalid/expired tokens from FCM errors
    - Remove invalid tokens from database
    - Log token removal for monitoring
    - _Requirements: 6.7, 6.8_
  
  - [ ] 8.4 Implement error logging
    - Log all delivery failures
    - Categorize errors (token, network, permission)
    - Store error details in database
    - _Requirements: 6.9, 14.1, 14.3_
  
  - [ ]* 8.5 Write property tests for delivery
    - **Property 21: Delivery Retry Logic**
    - **Property 22: Delivery Status Tracking**
    - **Property 23: Delivery Timestamp Recording**
    - **Property 24: Invalid Token Handling**
    - **Property 25: Permanent Failure Logging**
    - **Validates: Requirements 6.4, 6.5, 6.6, 6.7, 6.8, 6.9**

- [ ] 9. Customer Notification Handling
  - [ ] 9.1 Implement notification reception
    - Handle notifications in foreground
    - Handle notifications in background
    - Handle notifications when app is closed
    - Display notification in device tray
    - _Requirements: 11.1, 11.5, 11.6, 11.7_
  
  - [ ] 9.2 Implement notification tap handling
    - Open app when notification is tapped
    - Navigate to venue detail screen
    - Pass venue ID from notification data
    - Track notification open event
    - _Requirements: 11.2, 11.3, 11.8_
  
  - [ ] 9.3 Add venue branding to notifications
    - Include venue name in notification
    - Include venue logo/image
    - Use venue colors if available
    - _Requirements: 11.4_
  
  - [ ] 9.4 Create in-app notification center
    - Show list of received notifications
    - Mark notifications as read when opened
    - Allow clearing old notifications
    - _Requirements: 11.9, 11.10_
  
  - [ ]* 9.5 Write property tests for notification handling
    - **Property 43: Notification Display in Tray**
    - **Property 44: Tap-to-Open Behavior**
    - **Property 45: Venue Branding in Notification**
    - **Property 46: App State Handling**
    - **Property 47: Open Event Tracking**
    - **Property 48: Read Status Update**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9**


- [ ] 10. Analytics Implementation
  - [ ] 10.1 Create AnalyticsTracker class
    - Implement trackNotificationSent() method
    - Implement trackNotificationDelivered() method
    - Implement trackNotificationOpened() method
    - Implement trackCheckInAfterNotification() method
    - _Requirements: 8.1, 8.2, 8.3, 8.6_
  
  - [ ] 10.2 Implement analytics calculations
    - Calculate delivery rate (delivered / sent)
    - Calculate open rate (opened / delivered)
    - Track check-ins within 2 hours of notification
    - Calculate conversion rate
    - _Requirements: 8.4, 8.5, 8.7_
  
  - [ ] 10.3 Create analytics dashboard UI
    - Show per-notification analytics
    - Show aggregate analytics for venue
    - Display charts for delivery and open rates
    - Show check-in attribution
    - _Requirements: 8.8, 8.9, 8.10_
  
  - [ ]* 10.4 Write property tests for analytics
    - **Property 28: Send Count Tracking**
    - **Property 29: Delivery Count Tracking**
    - **Property 30: Open Count Tracking**
    - **Property 31: Delivery Rate Calculation**
    - **Property 32: Open Rate Calculation**
    - **Property 33: Check-In Attribution Window**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

- [ ] 11. User Notification Preferences
  - [ ] 11.1 Create UserPreferencesService class
    - Implement getUserPreferences() method
    - Implement updatePreferences() method
    - Implement muteVenue() and unmuteVenue() methods
    - Implement setQuietHours() method
    - _Requirements: 9.1, 9.6, 9.10_
  
  - [ ] 11.2 Create notification preferences UI
    - Add toggle for all push notifications
    - Add toggles for Flash Offers, Events, General
    - Add venue muting interface
    - Add quiet hours time picker
    - _Requirements: 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 11.3 Implement preference enforcement
    - Check preferences before sending notifications
    - Exclude users based on type preferences
    - Exclude users in quiet hours
    - Exclude users who muted venue
    - _Requirements: 9.7_
  
  - [ ] 11.4 Implement cross-device preference sync
    - Save preferences to database
    - Sync preferences when user logs in on new device
    - Update preferences immediately on change
    - _Requirements: 9.8, 9.9_
  
  - [ ]* 11.5 Write property tests for preferences
    - **Property 34: Venue Muting**
    - **Property 35: Preference Respect**
    - **Property 36: Immediate Preference Save**
    - **Property 37: Cross-Device Preference Sync**
    - **Property 38: Quiet Hours Enforcement**
    - **Validates: Requirements 9.6, 9.7, 9.8, 9.9, 9.10**

- [ ] 12. Notification History
  - [ ] 12.1 Create notification history UI
    - Display list of all sent notifications
    - Show title, message, send date
    - Show targeting criteria
    - Show delivery statistics
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 12.2 Implement history filtering
    - Add date range filter
    - Add notification type filter
    - Add status filter (sent, failed)
    - Apply filters to query
    - _Requirements: 10.5, 10.6, 10.7_
  
  - [ ] 12.3 Add notification detail view
    - Show full notification details
    - Show complete analytics
    - Show list of recipients
    - Allow duplicating notification
    - _Requirements: 10.8, 10.9_
  
  - [ ]* 12.4 Write property tests for history
    - **Property 39: History Date Range Filter**
    - **Property 40: History Type Filter**
    - **Property 41: History Status Filter**
    - **Property 42: Notification Duplication**
    - **Validates: Requirements 10.5, 10.6, 10.7, 10.9**

- [ ] 13. Location Integration
  - [ ] 13.1 Integrate with existing LocationService
    - Use existing location permission handling
    - Use existing distance calculation
    - Store user's last known location
    - Update location on app open
    - _Requirements: 12.1, 12.3, 12.4_
  
  - [ ] 13.2 Implement geo-targeting location queries
    - Query users within specified radius
    - Calculate distance for each user
    - Filter users without location data
    - Respect location privacy settings
    - _Requirements: 12.5, 12.6, 12.7, 12.8, 12.9_
  
  - [ ] 13.3 Add radius reach estimator
    - Show count of users within each radius option
    - Update count when radius changes
    - Display on targeting UI
    - _Requirements: 12.10_
  
  - [ ]* 13.4 Write property tests for location integration
    - **Property 49: Location Storage**
    - **Property 50: Location Update on App Open**
    - **Property 51: Distance Calculation for Targeting**
    - **Property 52: Geo-Radius Filtering**
    - **Property 53: No-Location Graceful Handling**
    - **Property 54: Location Privacy Respect**
    - **Validates: Requirements 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9**

- [ ] 14. Rate Limiting and Quotas
  - [ ] 14.1 Implement monthly quota system
    - Create quota tracking in push_notification_credits table
    - Set monthly limits based on subscription tier (Free: no access, Core: 20, Pro: 60, Revenue+: unlimited)
    - Track notification sends against quota
    - Reset quotas on first day of each month
    - _Requirements: 12.1, 12.2, 12.5, 12.6_
  
  - [ ] 14.2 Implement quota enforcement
    - Check quota before allowing send
    - Block Free tier venues from accessing push notifications
    - Prevent sending when quota exceeded for paid tiers
    - Show clear error message
    - Display remaining quota in dashboard
    - _Requirements: 12.3, 12.4, 12.7_
  
  - [ ] 14.3 Implement audit logging
    - Log all notification sends
    - Include timestamp, venue, recipient count
    - Store for compliance and monitoring
    - _Requirements: 12.9_
  
  - [ ]* 14.4 Write property tests for quotas
    - **Property 55: Daily Quota Enforcement**
    - **Property 56: Tier-Based Limits**
    - **Property 57: Quota Exceeded Prevention**
    - **Property 58: Daily Quota Reset**
    - **Property 59: Send Tracking Per Venue**
    - **Property 60: Quota Limit Error Message**
    - **Property 61: Send Audit Logging**
    - **Validates: Requirements 12.1, 12.2, 12.4, 12.5, 12.6, 12.7, 12.9**

- [ ] 15. Error Handling and Monitoring
  - [ ] 15.1 Implement comprehensive error handling
    - Categorize all error types
    - Provide actionable error messages
    - Log errors with context
    - Display errors to venue owners
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [ ] 15.2 Implement error rate tracking
    - Track error rate per venue
    - Calculate error percentage
    - Alert when error rate is high
    - _Requirements: 14.7, 14.8_
  
  - [ ] 15.3 Add troubleshooting guidance
    - Provide help text for common errors
    - Link to documentation
    - Allow reporting issues
    - _Requirements: 14.9, 14.10_
  
  - [ ]* 15.4 Write property tests for error handling
    - **Property 62: Failure Error Logging**
    - **Property 63: Failure Error Display**
    - **Property 64: Error Categorization**
    - **Property 65: Transient Error Retry**
    - **Property 66: Permanent Error No-Retry**
    - **Property 67: Venue Error Rate Tracking**
    - **Property 68: High Error Rate Alert**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.5, 14.6, 14.7, 14.8**

- [ ] 16. Test Notifications
  - [ ] 16.1 Implement test notification feature
    - Add "Send Test" button to notification form
    - Send test only to venue owner's devices
    - Don't consume push credits for tests
    - Don't count tests in analytics
    - Label tests clearly
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  
  - [ ] 16.2 Add test notification feedback
    - Show delivery status for test
    - Display success/failure message
    - Allow multiple test sends
    - _Requirements: 17.6, 17.7, 17.10_
  
  - [ ] 16.3 Allow testing different options
    - Test different notification types
    - Test different targeting options
    - Preview how notification appears
    - _Requirements: 17.8, 17.9_
  
  - [ ]* 16.4 Write property tests for test notifications
    - **Property 69: Test Notification Owner-Only**
    - **Property 70: Test Notification Credit Exemption**
    - **Property 71: Test Notification Analytics Exclusion**
    - **Property 72: Test Notification Labeling**
    - **Property 73: Test Notification Feedback**
    - **Validates: Requirements 17.2, 17.3, 17.4, 17.5, 17.10**

- [ ] 17. Checkpoint - Core functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Integration with Existing Features
  - [ ] 18.1 Integrate with venue dashboard
    - Add "Push Notifications" tab to dashboard
    - Show notification stats in overview
    - Link to notification history
    - _Requirements: 20.1_
  
  - [ ] 18.2 Integrate with favorites system
    - Use existing favorites table for targeting
    - Update targeting when favorites change
    - _Requirements: 20.5_
  
  - [ ] 18.3 Integrate with check-in system
    - Track check-ins after notifications
    - Attribute check-ins to notifications
    - Show attribution in analytics
    - _Requirements: 20.6_
  
  - [ ] 18.4 Apply existing theme and styling
    - Use existing theme colors
    - Use existing fonts (Poppins, Inter)
    - Follow existing component patterns
    - Maintain UI consistency
    - _Requirements: 20.7, 20.8, 20.10_

- [ ] 19. Performance Optimization
  - [ ] 19.1 Implement caching strategy
    - Cache device tokens (Redis, 1 hour TTL)
    - Cache user preferences (Redis, 1 hour TTL)
    - Cache venue locations (Redis, 24 hour TTL)
    - Invalidate cache on updates
  
  - [ ] 19.2 Optimize database queries
    - Add indexes to frequently queried columns
    - Use connection pooling
    - Batch FCM requests (500 devices per batch)
    - Use read replicas for analytics
  
  - [ ] 19.3 Implement monitoring
    - Monitor delivery rate (target > 95%)
    - Monitor open rate (target > 10%)
    - Monitor FCM error rate (target < 5%)
    - Monitor API response time (target < 500ms)
    - Alert on anomalies

- [ ] 20. Documentation and Testing
  - [ ] 20.1 Write API documentation
    - Document all service methods
    - Include request/response examples
    - Document error codes
    - Add usage examples
  
  - [ ] 20.2 Write user documentation
    - Create venue owner guide
    - Create customer guide
    - Document notification best practices
    - Add troubleshooting guide
  
  - [ ]* 20.3 Write integration tests
    - Test complete notification send flow
    - Test permission flow
    - Test analytics tracking
  
  - [ ]* 20.4 Write E2E tests
    - Test venue owner journey (create, send, view analytics)
    - Test customer journey (receive, tap, check-in)
    - Test error scenarios

- [ ] 21. Final checkpoint - Push notification system complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (73 properties total)
- Unit tests validate specific examples and edge cases
- Integration and E2E tests validate complete user flows
- Firebase setup requires external configuration (APNs certificates, google-services.json)
- Caching requires Redis or similar key-value store
- Monitoring requires logging infrastructure (e.g., Sentry, DataDog)
