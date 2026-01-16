# Implementation Plan: Social Push Notifications

## Overview

This plan outlines the step-by-step implementation of real-time push notifications for social interactions, replacing the current 30-second polling system. The approach is incremental, starting with Firebase setup and token management, then adding notification sending for each social event type, and finally removing the polling system.

## Tasks

- [x] 1. Firebase Cloud Messaging Setup
  - [x] 1.1 Install and configure Firebase SDK
    - Install @react-native-firebase/app and @react-native-firebase/messaging
    - Add google-services.json for Android
    - Configure Firebase in iOS project with GoogleService-Info.plist
    - Update build.gradle and Podfile with Firebase dependencies
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.2 Configure iOS APNs integration
    - Create APNs certificate in Apple Developer Portal
    - Upload certificate to Firebase Console
    - Configure Info.plist with notification permissions
    - Implement UNUserNotificationCenter delegate
    - _Requirements: 1.2_
  
  - [x] 1.3 Configure Android notification channels
    - Create notification channels for Android 8+
    - Configure channel importance and behavior
    - Handle notification icons and colors
    - _Requirements: 1.3_
  
  - [ ]* 1.4 Write unit tests for Firebase setup
    - Test FCM initialization
    - Test token generation
    - Test permission handling

- [x] 2. Device Token Management
  - [x] 2.1 Create device_tokens database table
    - Create device_tokens table with all fields
    - Add indexes for user_id, token, and is_active
    - Add foreign key to profiles table with cascade delete
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9_
  
  - [x] 2.2 Create DeviceTokenManager service
    - Implement storeToken() method
    - Implement removeToken() method
    - Implement getUserTokens() method
    - Implement deactivateToken() method
    - Implement cleanupExpiredTokens() method
    - _Requirements: 1.5, 1.8, 1.9, 1.10, 10.6, 10.7, 10.8_
  
  - [x] 2.3 Implement FCM token generation and storage
    - Generate FCM token on app launch
    - Store token in device_tokens table via DeviceTokenManager
    - Associate token with logged-in user
    - Handle token refresh events
    - Update last_used_at timestamp
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 10.6_
  
  - [x] 2.4 Implement logout token cleanup
    - Remove device tokens on user logout
    - Mark tokens as inactive instead of deleting
    - Clean up inactive tokens after 30 days
    - _Requirements: 1.9_
  
  - [ ]* 2.5 Write property tests for token management
    - **Property 1: Device Token Storage Consistency**
    - **Property 2: Token Refresh Handling**
    - **Property 3: Multi-Device Support**
    - **Property 4: Logout Token Cleanup**
    - **Validates: Requirements 1.5, 1.6, 1.7, 1.8, 1.9, 1.10**

- [x] 3. Push Permission Management
  - [x] 3.1 Create push permission service
    - Implement requestPermission() for iOS and Android
    - Implement checkPermissionStatus()
    - Handle permission states (authorized, denied, provisional)
    - Store permission status in user preferences
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7_
  
  - [x] 3.2 Add settings toggle for push notifications
    - Add push notification toggle to settings screen
    - Save preference to notification_preferences table
    - Sync preference across devices
    - Show current permission status
    - _Requirements: 2.4, 8.1, 8.2_
  
  - [x] 3.3 Implement permission denial handling
    - Show instructions for permanently denied permission
    - Provide deep link to device settings
    - Handle "never ask again" state on Android
    - Show fallback message about in-app notifications
    - _Requirements: 2.8, 2.9_
  
  - [ ]* 3.4 Write property tests for permission management
    - **Property 5: Permission Status Persistence**
    - **Property 6: Disabled Push Exclusion**
    - **Validates: Requirements 2.3, 2.5, 2.10**

- [x] 4. Core Push Notification Service
  - [x] 4.1 Create FCMService class
    - Implement initialize() method
    - Implement getToken() method
    - Implement onTokenRefresh() handler
    - Implement sendToDevice() method
    - Implement sendToMultipleDevices() method
    - Handle FCM errors and retries
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 4.2 Create PushNotificationService class
    - Implement sendSocialNotification() method
    - Implement registerDeviceToken() method
    - Implement removeDeviceToken() method
    - Implement getUserDeviceTokens() method
    - Check user preferences before sending
    - Handle delivery failures gracefully
    - _Requirements: 6.1, 6.2, 6.6, 6.7, 6.8, 6.9_
  
  - [x] 4.3 Implement notification payload construction
    - Build FCM payload with title, body, data
    - Include navigation target and params
    - Add platform-specific configuration (Android/iOS)
    - Include actor avatar URL when available
    - _Requirements: 3.3, 3.4, 3.7, 4.3, 4.4, 4.7, 5.4, 5.7_
  
  - [ ]* 4.4 Write unit tests for PushNotificationService
    - Test notification sending
    - Test preference checking
    - Test token retrieval
    - Test error handling

- [x] 5. Friend Request Push Notifications
  - [x] 5.1 Update sendFriendRequestNotification method
    - Keep existing in-app notification creation
    - Add call to PushNotificationService.sendSocialNotification()
    - Pass friend request notification payload
    - Handle push delivery failures
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_
  
  - [ ]* 5.2 Write property tests for friend request notifications
    - **Property 7: In-App Notification Creation**
    - **Property 8: Push Notification Sending**
    - **Property 9: Preference Respect**
    - **Property 10: Navigation Data Inclusion**
    - **Validates: Requirements 3.1, 3.2, 3.8**

- [x] 6. Friend Accepted Push Notifications
  - [x] 6.1 Update sendFriendAcceptedNotification method
    - Keep existing in-app notification creation
    - Add call to PushNotificationService.sendSocialNotification()
    - Pass friend accepted notification payload
    - Handle push delivery failures
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  
  - [ ]* 6.2 Write property tests for friend accepted notifications
    - **Property 7: In-App Notification Creation**
    - **Property 8: Push Notification Sending**
    - **Property 9: Preference Respect**
    - **Property 10: Navigation Data Inclusion**
    - **Validates: Requirements 4.1, 4.2, 4.8**

- [x] 7. Venue Share Push Notifications
  - [x] 7.1 Update sendVenueShareNotification method
    - Keep existing in-app notification creation
    - Add call to PushNotificationService.sendSocialNotification()
    - Pass venue share notification payload
    - Handle push delivery failures
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_
  
  - [x] 7.2 Write property tests for venue share notifications

    - **Property 7: In-App Notification Creation**
    - **Property 8: Push Notification Sending**
    - **Property 9: Preference Respect**
    - **Property 10: Navigation Data Inclusion**
    - **Validates: Requirements 5.1, 5.2, 5.8**

- [x] 8. Notification Reception and Handling
  - [x] 8.1 Create NotificationHandler class
    - Implement handleNotificationTap() method
    - Implement handleForegroundNotification() method
    - Implement handleBackgroundNotification() method
    - Implement navigateFromNotification() method
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 8.2 Implement foreground notification handling
    - Register onForegroundMessage handler
    - Display in-app notification banner
    - Update notification center badge
    - Play notification sound
    - _Requirements: 7.4_
  
  - [x] 8.3 Implement background notification handling
    - Register setBackgroundMessageHandler
    - Update notification center badge
    - Track notification receipt
    - _Requirements: 7.5, 7.6_
  
  - [x] 8.4 Implement notification tap navigation
    - Navigate to friend requests screen for friend_request type
    - Navigate to user profile for friend_accepted type
    - Navigate to venue detail for venue_share type
    - Mark in-app notification as read
    - Track notification open event
    - _Requirements: 7.2, 7.3, 7.7, 7.8_
  
  - [x] 8.5 Add notification grouping and avatars
    - Show user avatar in notification when available
    - Group multiple notifications by type
    - _Requirements: 7.9, 7.10_
  
  - [x] 8.6 Write property tests for notification handling

    - **Property 13: Notification Display in Tray**
    - **Property 14: Tap-to-Open Behavior**
    - **Property 15: App State Handling**
    - **Property 16: Read Status Update**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8**

- [x] 9. Notification Preferences UI
  - [x] 9.1 Add notification type toggles to settings
    - Add toggle for friend request notifications
    - Add toggle for friend accepted notifications
    - Add toggle for venue share notifications
    - Add toggle for collection follow notifications
    - Add toggle for activity like notifications
    - Add toggle for activity comment notifications
    - Save preferences to notification_preferences table
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 9.2 Implement preference enforcement
    - Check preferences in PushNotificationService before sending
    - Respect user preferences for each notification type
    - Still create in-app notification even if push disabled
    - _Requirements: 8.8_
  
  - [x] 9.3 Implement cross-device preference sync
    - Save preferences to database immediately
    - Sync preferences when user logs in on new device
    - Update preferences in real-time across devices
    - _Requirements: 8.9, 8.10_
  
  - [x] 9.4 Write property tests for preferences

    - **Property 17: Preference Sync**
    - **Property 18: Immediate Preference Save**
    - **Validates: Requirements 8.9, 8.10**

- [x] 10. Remove Polling System
  - [x] 10.1 Update NotificationContext to disable polling
    - Remove pollInterval from useSocialNotifications call
    - Keep manual refetch functionality
    - Initialize push notifications on mount
    - Register device token on login
    - _Requirements: 11.1, 11.2, 11.3, 11.9_
  
  - [x] 10.2 Add fallback for push disabled
    - Check if push is enabled
    - Fall back to manual refresh if push disabled
    - Show message about enabling push for real-time updates
    - _Requirements: 11.4_
  
  - [x] 10.3 Clean up polling-related code
    - Remove unused polling interval code
    - Update documentation
    - Add logging for push vs polling mode
    - _Requirements: 11.5, 11.6, 11.7, 11.8_
  
  - [ ]* 10.4 Write property tests for polling removal
    - **Property 19: Polling Disabled When Push Enabled**
    - **Property 20: Manual Refresh Availability**
    - **Validates: Requirements 11.1, 11.3, 11.9**

- [x] 11. Error Handling and Monitoring
  - [x] 11.1 Implement comprehensive error handling
    - Categorize all error types
    - Provide actionable error messages
    - Log errors with context
    - Handle FCM service unavailability
    - _Requirements: 12.1, 12.2, 12.3, 12.7_
  
  - [x] 11.2 Implement retry logic
    - Retry failed deliveries up to 2 times
    - Use exponential backoff (1s, 2s)
    - Don't retry permanent errors
    - Log all retry attempts
    - _Requirements: 12.4, 12.5, 6.4_
  
  - [x] 11.3 Implement error rate tracking
    - Track error rate for monitoring
    - Alert administrators if error rate exceeds threshold
    - _Requirements: 12.6, 12.10_
  
  - [x] 11.4 Handle invalid device tokens
    - Detect invalid/expired tokens from FCM errors
    - Remove invalid tokens from database
    - Log token removal for monitoring
    - _Requirements: 6.6, 6.7, 12.8_
  
  - [ ]* 11.5 Write property tests for error handling
    - **Property 11: Delivery Retry Logic**
    - **Property 12: Invalid Token Handling**
    - **Validates: Requirements 6.4, 6.6, 6.7**

- [x] 12. Testing and Debugging
  - [x] 12.1 Implement test notification feature
    - Add debug screen for sending test notifications
    - Allow testing with specific device tokens
    - Log all test notification sends
    - Provide feedback on delivery status
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 12.2 Add debug mode for verbose logging
    - Log all FCM events
    - Log all notification sends
    - Log all token operations
    - Log all navigation events
    - _Requirements: 13.8_
  
  - [x] 12.3 Test different app states
    - Test foreground notifications
    - Test background notifications
    - Test notifications when app is closed
    - Test notification tap navigation
    - _Requirements: 13.5, 13.6, 13.7_
  
  - [x] 12.4 Document testing procedures
    - Document how to test push notifications
    - Document how to use Firebase Console for testing
    - Document common issues and solutions
    - _Requirements: 13.10_

- [x] 13. Performance Optimization
  - [x] 13.1 Implement token caching
    - Cache device tokens in memory (5 minute TTL)
    - Invalidate cache on token updates
    - _Requirements: 14.3_
  
  - [x] 13.2 Optimize database queries
    - Add indexes to device_tokens table
    - Use connection pooling
    - Batch FCM requests when possible
    - _Requirements: 14.2, 14.4, 14.8_
  
  - [x] 13.3 Implement monitoring
    - Monitor notification delivery latency
    - Monitor delivery success rate
    - Alert on performance degradation
    - _Requirements: 14.5, 14.6, 14.9_
  
  - [x] 13.4 Handle high-volume sends
    - Batch notifications to multiple devices
    - Use connection pooling for FCM
    - Implement rate limiting if needed
    - _Requirements: 14.7, 6.10_

- [-] 14. Integration and Documentation
  - [x] 14.1 Verify integration with existing features
    - Test with FriendsService
    - Test with VenueShareService
    - Test with NotificationContext
    - Test with existing notification center UI
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.10_
  
  - [x] 14.2 Apply existing theme and styling
    - Use existing theme colors
    - Use existing fonts (Poppins, Inter)
    - Follow existing component patterns
    - Maintain UI consistency
    - _Requirements: 9.7, 9.8, 9.9_
  
  - [x] 14.3 Write API documentation
    - Document PushNotificationService methods
    - Document FCMService methods
    - Document NotificationHandler methods
    - Include usage examples
  
  - [x] 14.4 Write user documentation
    - Document how to enable push notifications
    - Document notification preferences
    - Document troubleshooting steps

- [x] 15. Compliance and Security
  - [x] 15.1 Implement compliance measures
    - Comply with Apple Push Notification Service guidelines
    - Comply with Firebase Cloud Messaging guidelines
    - Implement rate limiting to prevent abuse
    - Log all notifications for audits
    - _Requirements: 15.1, 15.2, 15.7, 15.8_
  
  - [x] 15.2 Implement user controls
    - Respect user opt-out preferences
    - Provide clear notification settings
    - Allow users to report inappropriate notifications
    - _Requirements: 15.4, 15.5, 15.9_
  
  - [x] 15.3 Implement security measures
    - Validate all notification payloads
    - Encrypt device tokens at rest
    - Use HTTPS for all API communication
    - Handle user privacy data according to regulations
    - _Requirements: 15.6, 15.10_

- [x] 16. Final checkpoint - Social push notifications complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (20 properties total)
- Unit tests validate specific examples and edge cases
- Firebase setup requires external configuration (APNs certificates, google-services.json)
- This spec focuses on social notifications only (friend requests, venue shares)
- Venue promotional push notifications are covered in a separate spec
- Polling system will be removed once push notifications are working
- Manual refresh (pull-to-refresh) will remain available
