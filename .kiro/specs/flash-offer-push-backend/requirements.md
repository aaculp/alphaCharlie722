# Requirements Document

## Introduction

This specification defines the backend infrastructure needed to send real push notifications for flash offers. Currently, the app has a complete push notification system with simulated sending. This backend will replace the simulation with actual Firebase Cloud Messaging (FCM) delivery using Supabase Edge Functions.

## Glossary

- **Edge_Function**: A Supabase serverless function (Deno-based) that runs on-demand
- **FCM**: Firebase Cloud Messaging - Google's push notification service
- **Firebase_Admin_SDK**: Server-side Firebase SDK with elevated privileges for sending notifications
- **Service_Role_Key**: Supabase admin key that bypasses Row Level Security (RLS)
- **Device_Token**: FCM registration token that identifies a specific device/app instance
- **Flash_Offer**: Time-limited promotional offer created by venue owners
- **Targeting**: Process of selecting which users should receive a notification based on location and preferences

## Requirements

### Requirement 1: Edge Function for Push Notification Sending

**User Story:** As a venue owner, I want my flash offer notifications to be delivered to customers' devices in real-time, so that they can see and claim my offers immediately.

#### Acceptance Criteria

1. WHEN a venue owner creates a flash offer with push notifications enabled, THE Edge_Function SHALL be invoked with the offer ID
2. WHEN the Edge_Function receives an offer ID, THE Edge_Function SHALL authenticate the request using Supabase JWT
3. WHEN the Edge_Function processes a request, THE Edge_Function SHALL query the database using the Service_Role_Key to bypass RLS
4. WHEN the Edge_Function retrieves targeted users, THE Edge_Function SHALL use the same targeting logic as the client (location-based, favorites-only option)
5. WHEN the Edge_Function has device tokens, THE Edge_Function SHALL send FCM messages using Firebase_Admin_SDK
6. WHEN FCM messages are sent, THE Edge_Function SHALL return success/failure counts to the client
7. WHEN the Edge_Function completes, THE Edge_Function SHALL mark the offer as push_sent in the database
8. IF the Edge_Function encounters an error, THEN THE Edge_Function SHALL return a descriptive error message and log details

### Requirement 2: Firebase Admin SDK Integration

**User Story:** As a system administrator, I want the Edge Function to use Firebase Admin SDK, so that push notifications are sent with proper authentication and reliability.

#### Acceptance Criteria

1. THE Edge_Function SHALL initialize Firebase_Admin_SDK with service account credentials
2. WHEN sending notifications, THE Edge_Function SHALL use Firebase_Admin_SDK's multicast messaging API
3. WHEN sending to multiple devices, THE Edge_Function SHALL batch requests in groups of 500 (FCM limit)
4. WHEN FCM returns errors, THE Edge_Function SHALL categorize them (invalid token, quota exceeded, etc.)
5. WHEN a device token is invalid, THE Edge_Function SHALL mark it as inactive in the database
6. THE Edge_Function SHALL include proper notification payload with title, body, data, and platform-specific options
7. THE Edge_Function SHALL set high priority for flash offer notifications

### Requirement 3: Secure Configuration Management

**User Story:** As a system administrator, I want sensitive credentials stored securely, so that the system remains secure and credentials are not exposed.

#### Acceptance Criteria

1. THE System SHALL store Firebase service account JSON in Supabase secrets (not in code)
2. THE System SHALL store Supabase service role key in Supabase secrets
3. WHEN the Edge_Function starts, THE Edge_Function SHALL load credentials from environment variables
4. THE Edge_Function SHALL NOT log or expose credentials in responses
5. THE Edge_Function SHALL validate that all required credentials are present before processing requests
6. IF credentials are missing, THEN THE Edge_Function SHALL return a 500 error with a generic message

### Requirement 4: Client Integration

**User Story:** As a developer, I want the React Native app to call the Edge Function instead of simulated backend, so that real notifications are sent.

#### Acceptance Criteria

1. THE FCMService SHALL have a method to call the Edge_Function endpoint
2. WHEN calling the Edge_Function, THE FCMService SHALL include the user's Supabase JWT token
3. WHEN calling the Edge_Function, THE FCMService SHALL pass the offer ID as a parameter
4. WHEN the Edge_Function responds, THE FCMService SHALL parse the response and return success/failure counts
5. IF the Edge_Function call fails, THEN THE FCMService SHALL retry once after 2 seconds
6. IF both attempts fail, THEN THE FCMService SHALL return an error to the caller
7. THE FCMService SHALL maintain backward compatibility with the existing notification flow

### Requirement 5: Database Security Updates

**User Story:** As a system administrator, I want proper RLS policies that allow the Edge Function to access device tokens, so that the system is secure in production.

#### Acceptance Criteria

1. THE System SHALL remove the permissive testing RLS policy on device_tokens table
2. THE Edge_Function SHALL use Service_Role_Key to bypass RLS when querying device_tokens
3. THE Client SHALL NOT have direct read access to other users' device tokens
4. THE Client SHALL only be able to read and write their own device tokens
5. THE Edge_Function SHALL be the only component that can read all device tokens

### Requirement 6: Analytics and Monitoring

**User Story:** As a venue owner, I want to see how many users received my push notification, so that I can measure the reach of my flash offers.

#### Acceptance Criteria

1. WHEN the Edge_Function sends notifications, THE Edge_Function SHALL track the count of successful sends
2. WHEN the Edge_Function completes, THE Edge_Function SHALL call the analytics service to record push_sent event
3. THE Analytics_Service SHALL store the recipient count for each flash offer
4. THE Venue_Dashboard SHALL display push notification metrics (sent count, delivery rate)
5. WHEN notifications fail, THE Edge_Function SHALL log failure reasons for debugging

### Requirement 7: Error Handling and Resilience

**User Story:** As a system administrator, I want the Edge Function to handle errors gracefully, so that temporary failures don't break the notification system.

#### Acceptance Criteria

1. WHEN FCM quota is exceeded, THE Edge_Function SHALL return a specific error code
2. WHEN the database is unavailable, THE Edge_Function SHALL retry the query once
3. WHEN Firebase_Admin_SDK initialization fails, THE Edge_Function SHALL log the error and return 500
4. WHEN an offer is not found, THE Edge_Function SHALL return a 404 error
5. WHEN push has already been sent for an offer, THE Edge_Function SHALL return success without re-sending
6. THE Edge_Function SHALL have a timeout of 30 seconds maximum
7. IF the Edge_Function times out, THEN THE Client SHALL receive a timeout error

### Requirement 8: Testing and Validation

**User Story:** As a developer, I want to test the Edge Function locally and in staging, so that I can verify it works before deploying to production.

#### Acceptance Criteria

1. THE Edge_Function SHALL be testable locally using Supabase CLI
2. THE System SHALL provide a test script that creates a test offer and triggers the Edge_Function
3. THE Test_Script SHALL verify that notifications are received on test devices
4. THE Edge_Function SHALL support a dry-run mode that validates logic without sending notifications
5. THE System SHALL provide documentation for testing the complete flow end-to-end

### Requirement 9: Performance and Scalability

**User Story:** As a system administrator, I want the Edge Function to handle high load efficiently, so that the system can scale as the user base grows.

#### Acceptance Criteria

1. WHEN sending to 1000+ users, THE Edge_Function SHALL complete within 10 seconds
2. THE Edge_Function SHALL batch FCM requests to minimize API calls
3. THE Edge_Function SHALL use connection pooling for database queries
4. WHEN multiple venues create offers simultaneously, THE Edge_Function SHALL handle concurrent requests
5. THE Edge_Function SHALL have a maximum execution time of 30 seconds
6. IF execution exceeds 25 seconds, THEN THE Edge_Function SHALL log a warning

### Requirement 10: Deployment and Configuration

**User Story:** As a developer, I want clear deployment instructions, so that I can deploy the Edge Function to Supabase without issues.

#### Acceptance Criteria

1. THE System SHALL provide a deployment script that uploads the Edge_Function to Supabase
2. THE Deployment_Script SHALL validate that all required secrets are configured
3. THE System SHALL provide instructions for obtaining Firebase service account credentials
4. THE System SHALL provide instructions for configuring Supabase secrets
5. THE Edge_Function SHALL be deployed to a named endpoint (e.g., /send-flash-offer-push)
6. THE System SHALL provide rollback instructions in case of deployment issues

### Requirement 11: Rate Limiting and Abuse Prevention

**User Story:** As a system administrator, I want to prevent venues from spamming users with excessive notifications, so that users have a positive experience and don't uninstall the app.

#### Acceptance Criteria

1. WHEN a venue creates a flash offer, THE System SHALL check how many offers the venue has sent in the last 24 hours
2. IF a venue has sent 5 or more offers in the last 24 hours, THEN THE System SHALL reject the new offer with a rate limit error
3. WHEN a user would receive a notification, THE System SHALL check how many flash offer notifications the user has received in the last 24 hours
4. IF a user has received 10 or more flash offer notifications in the last 24 hours, THEN THE System SHALL exclude that user from targeting
5. THE Edge_Function SHALL log rate limit violations for monitoring
6. THE System SHALL store rate limit counters in the database with automatic expiration
7. WHEN a venue is rate limited, THE Client SHALL display a clear message explaining the limit and when they can send again
8. THE Rate_Limits SHALL be configurable per subscription tier (free: 3/day, core: 5/day, pro: 10/day, revenue: unlimited)

### Requirement 12: User Notification Preferences

**User Story:** As a user, I want to control which types of notifications I receive, so that I only get notifications that are relevant to me.

#### Acceptance Criteria

1. THE System SHALL provide a notification_preferences table to store user preferences
2. WHEN a user installs the app, THE System SHALL create default preferences (all notifications enabled)
3. THE User_Settings_Screen SHALL allow users to toggle flash offer notifications on/off
4. WHEN the Edge_Function targets users, THE Edge_Function SHALL exclude users who have disabled flash offer notifications
5. THE System SHALL respect the device-level notification permissions (if disabled at OS level, don't attempt to send)
6. WHEN a user disables flash offer notifications, THE System SHALL immediately stop sending them notifications
7. THE User_Settings_Screen SHALL allow users to set quiet hours (e.g., 10 PM - 8 AM)
8. WHEN the Edge_Function sends notifications, THE Edge_Function SHALL exclude users currently in their quiet hours
9. THE System SHALL store quiet hours in the user's local timezone
10. THE User_Settings_Screen SHALL allow users to set maximum distance for flash offer notifications (e.g., only within 5 miles)
