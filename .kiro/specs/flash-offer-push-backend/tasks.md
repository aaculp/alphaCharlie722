# Implementation Plan: Flash Offer Push Notification Backend

## Overview

This implementation plan breaks down the backend infrastructure for real push notifications into discrete coding tasks. The implementation follows a bottom-up approach: database schema → Edge Function core → client integration → user preferences → rate limiting → testing.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create notification_preferences table
  - Create flash_offer_rate_limits table
  - Update device_tokens RLS policies
  - Add indexes for performance
  - Create cleanup function for expired rate limits
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.6, 12.1_

- [x] 1.1 Write property test for RLS policies

  - **Property 15: Client Token Access Restriction**
  - **Validates: Requirements 5.3**

- [x] 1.2 Write property test for user own token access

  - **Property 16: User Own Token Access**
  - **Validates: Requirements 5.4**

- [x] 2. Create Supabase Edge Function project structure
  - Initialize Edge Function with Supabase CLI
  - Set up TypeScript configuration
  - Install dependencies (Firebase Admin SDK, Supabase client)
  - Create main handler function skeleton
  - Set up environment variable loading
  - _Requirements: 1.1, 2.1, 3.3, 3.5, 3.6_

- [x] 2.1 Write unit test for environment variable validation

  - Test that function fails gracefully when credentials are missing
  - _Requirements: 3.5, 3.6_

- [x] 3. Implement JWT authentication middleware
  - Extract JWT from Authorization header
  - Validate JWT signature using Supabase
  - Return 401 for missing/invalid tokens
  - Pass authenticated user context to handler
  - _Requirements: 1.2_

- [x] 3.1 Write property test for JWT authentication


  - **Property 1: JWT Authentication Required**
  - **Validates: Requirements 1.2**

- [x] 4. Implement Firebase Admin SDK initialization
  - Load service account credentials from environment
  - Initialize Firebase Admin SDK
  - Handle initialization errors gracefully
  - Export initialized admin instance
  - _Requirements: 2.1, 3.1, 3.3_

- [x]* 4.1 Write unit test for Firebase initialization
  - Test successful initialization with valid credentials
  - Test failure handling with invalid credentials
  - _Requirements: 2.1, 7.3_

- [x] 5. Implement database query functions with service role
  - Create Supabase client with service role key
  - Implement getOfferDetails(offerId)
  - Implement getVenueDetails(venueId)
  - Implement getTargetedUsers(venueId, lat, lon, radius, favoritesOnly)
  - Implement getUserPreferences(userIds)
  - _Requirements: 1.3, 1.4_

- [x]* 5.1 Write property test for targeting logic consistency
  - **Property 2: Targeting Logic Consistency**
  - **Validates: Requirements 1.4**

- [x] 6. Implement user preference filtering
  - Filter out users with flash_offers_enabled = false
  - Filter out users in quiet hours (timezone-aware)
  - Filter out users beyond their max_distance preference
  - Filter out users with OS permissions disabled
  - _Requirements: 12.4, 12.5, 12.6, 12.8, 12.9_

- [x]* 6.1 Write property test for disabled notification exclusion
  - **Property 31: Disabled Notification Exclusion**
  - **Validates: Requirements 12.4**

- [x]* 6.2 Write property test for quiet hours exclusion
  - **Property 34: Quiet Hours Exclusion**
  - **Validates: Requirements 12.8**

- [x]* 6.3 Write property test for timezone-aware quiet hours
  - **Property 35: Timezone-Aware Quiet Hours**
  - **Validates: Requirements 12.9**

- [x] 7. Implement rate limiting logic
  - Implement checkVenueRateLimit(venueId, tier)
  - Implement checkUserRateLimit(userId)
  - Implement incrementVenueRateLimit(venueId)
  - Implement incrementUserRateLimits(userIds)
  - Return appropriate error codes when limits exceeded
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8_

- [x]* 7.1 Write property test for venue rate limit checking
  - **Property 23: Venue Rate Limit Checking**
  - **Validates: Requirements 11.1**

- [x]* 7.2 Write property test for venue rate limit enforcement
  - **Property 24: Venue Rate Limit Enforcement**
  - **Validates: Requirements 11.2**

- [x]* 7.3 Write property test for user notification rate checking
  - **Property 25: User Notification Rate Checking**
  - **Validates: Requirements 11.3**

- [x]* 7.4 Write property test for user rate limit exclusion
  - **Property 26: User Notification Rate Limit Exclusion**
  - **Validates: Requirements 11.4**

- [x]* 7.5 Write property test for tier-based rate limits
  - **Property 29: Tier-Based Rate Limits**
  - **Validates: Requirements 11.8**

- [x] 8. Implement FCM notification payload builder
  - Create buildNotificationPayload(offer, venueName) function
  - Include title, body, data fields
  - Add platform-specific options (Android channelId, iOS aps)
  - Set high priority for all notifications
  - _Requirements: 2.6, 2.7_

- [x]* 8.1 Write property test for notification payload completeness
  - **Property 9: Notification Payload Completeness**
  - **Validates: Requirements 2.6**

- [x]* 8.2 Write property test for high priority notifications
  - **Property 10: High Priority Notifications**
  - **Validates: Requirements 2.7**

- [x] 9. Implement FCM batch sending logic
  - Create splitIntoBatches(tokens, batchSize) function
  - Implement sendBatch(tokens, payload) using Firebase Admin SDK multicast
  - Handle FCM errors and categorize them
  - Mark invalid tokens as inactive in database
  - Return success/failure counts per batch
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x]* 9.1 Write property test for FCM batch size limit
  - **Property 6: FCM Batch Size Limit**
  - **Validates: Requirements 2.3**

- [x]* 9.2 Write property test for FCM error categorization
  - **Property 7: FCM Error Categorization**
  - **Validates: Requirements 2.4**

- [x]* 9.3 Write property test for invalid token deactivation
  - **Property 8: Invalid Token Deactivation**
  - **Validates: Requirements 2.5**

- [x]* 9.4 Write property test for batch request minimization
  - **Property 22: Batch Request Minimization**
  - **Validates: Requirements 9.2**

- [x] 10. Implement main Edge Function handler
  - Parse and validate request body (offerId, dryRun)
  - Call authentication middleware
  - Check rate limits (venue and users)
  - Query offer and venue details
  - Get targeted users with preferences filtering
  - Build notification payload
  - Send via FCM in batches
  - Mark offer as push_sent
  - Track analytics
  - Return success/failure counts
  - Handle all error cases with appropriate status codes
  - _Requirements: 1.1, 1.5, 1.6, 1.7, 1.8, 6.1, 6.2_

- [x]* 10.1 Write property test for response format accuracy
  - **Property 3: Response Format Accuracy**
  - **Validates: Requirements 1.6**

- [x]* 10.2 Write property test for push sent flag update
  - **Property 4: Push Sent Flag Update**
  - **Validates: Requirements 1.7**

- [x]* 10.3 Write property test for error messages
  - **Property 5: Error Messages Are Descriptive**
  - **Validates: Requirements 1.8**

- [x]* 10.4 Write property test for idempotent push sending
  - **Property 21: Idempotent Push Sending**
  - **Validates: Requirements 7.5**

- [x] 11. Implement analytics tracking
  - Create trackPushSent(offerId, recipientCount) function
  - Store success/failure counts in analytics table
  - Log failure reasons for debugging
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x]* 11.1 Write property test for success count tracking
  - **Property 17: Success Count Tracking**
  - **Validates: Requirements 6.1**

- [x]* 11.2 Write property test for analytics event recording
  - **Property 18: Analytics Event Recording**
  - **Validates: Requirements 6.2**

- [x]* 11.3 Write property test for recipient count storage
  - **Property 19: Recipient Count Storage**
  - **Validates: Requirements 6.3**

- [x]* 11.4 Write property test for failure reason logging
  - **Property 20: Failure Reason Logging**
  - **Validates: Requirements 6.5**

- [x] 12. Implement dry-run mode
  - Check for dryRun flag in request
  - Execute all logic except FCM sending
  - Return what would have been sent
  - _Requirements: 8.4_

- [x] 13. Add comprehensive error handling
  - Handle offer not found (404)
  - Handle venue not found (404)
  - Handle rate limit exceeded (429)
  - Handle FCM quota exceeded (429)
  - Handle database errors (500)
  - Handle Firebase init errors (500)
  - Add timeout handling (30 seconds)
  - Log all errors with context
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x]* 13.1 Write unit test for offer not found error
  - Test that 404 is returned for non-existent offer
  - _Requirements: 7.4_

- [x] 14. Add security measures
  - Validate no credentials in logs
  - Validate no credentials in responses
  - Sanitize all user inputs
  - Validate offer ID format (UUID)
  - _Requirements: 3.4_

- [x]* 14.1 Write property test for no credential exposure
  - **Property 11: No Credential Exposure**
  - **Validates: Requirements 3.4**

- [x] 15. Checkpoint - Test Edge Function locally
  - Deploy Edge Function to local Supabase
  - Test with dry-run mode
  - Test with valid offer ID
  - Test error cases
  - Verify logs and responses
  - _Requirements: 8.1, 8.2_

- [x] 16. Update FCMService in React Native app
  - Add sendViaEdgeFunction(offerId) method
  - Include Supabase JWT token in request headers
  - Pass offer ID in request body
  - Parse Edge Function response
  - Implement retry logic (once after 2 seconds)
  - Handle errors and return to caller
  - Maintain backward compatibility
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 16.1 Write property test for JWT token inclusion

  - **Property 12: JWT Token Inclusion**
  - **Validates: Requirements 4.2**

- [x] 16.2 Write property test for offer ID parameter inclusion

  - **Property 13: Offer ID Parameter Inclusion**
  - **Validates: Requirements 4.3**


- [x] 16.3 Write property test for response parsing accuracy

  - **Property 14: Response Parsing Accuracy**
  - **Validates: Requirements 4.4**


- [x] 16.4 Write unit test for retry logic

  - Test that failed calls are retried once after 2 seconds
  - _Requirements: 4.5, 4.6_

- [x] 17. Update FlashOfferNotificationService to use Edge Function
  - Replace simulated backend call with FCMService.sendViaEdgeFunction()
  - Keep existing error handling
  - Keep existing analytics tracking
  - _Requirements: 4.1_

- [x] 18. Create notification preferences service
  - Implement getPreferences(userId)
  - Implement updatePreferences(userId, preferences)
  - Implement createDefaultPreferences(userId)
  - _Requirements: 12.1, 12.2_

- [x] 18.1 Write property test for default preferences creation

  - **Property 30: Default Preferences Creation**
  - **Validates: Requirements 12.2**

- [x] 19. Create NotificationSettingsScreen UI
  - Add toggle for flash offer notifications
  - Add time pickers for quiet hours start/end
  - Add timezone dropdown
  - Add distance slider (1-50 miles or "No Limit")
  - Wire up to notification preferences service
  - _Requirements: 12.3, 12.7, 12.10_

- [x] 19.1 Write unit test for notification toggle

  - Test that toggle updates preferences correctly
  - _Requirements: 12.3_

- [x] 20. Update user registration flow
  - Call createDefaultPreferences() when user signs up
  - Ensure preferences are created before first use
  - _Requirements: 12.2_

- [x] 21. Add rate limit error handling to UI
  - Display clear message when venue is rate limited
  - Show when venue can send next offer
  - Show tier-specific limits in UI
  - _Requirements: 11.7_

- [x] 22. Update venue dashboard to show push metrics
  - Display sent count for each flash offer
  - Display delivery rate (sent / targeted)
  - Show rate limit status (X of Y offers sent today)
  - _Requirements: 6.4_

- [x] 23. Create deployment scripts
  - Create script to validate Supabase secrets are configured
  - Create script to deploy Edge Function
  - Create script to run database migrations
  - Create script to update RLS policies
  - Add rollback instructions to README
  - _Requirements: 10.1, 10.2, 10.5, 10.6_

- [x] 24. Create deployment documentation
  - Document how to get Firebase service account credentials
  - Document how to configure Supabase secrets
  - Document deployment steps
  - Document testing procedures
  - Document rollback procedures
  - _Requirements: 10.3, 10.4, 10.6, 8.5_

- [x] 25. Checkpoint - End-to-end testing
  - Create test venue owner account
  - Create test customer accounts with various preferences
  - Create flash offer via app
  - Verify Edge Function is called
  - Verify notifications are received on test devices
  - Verify analytics are tracked
  - Verify rate limits work
  - Test all error scenarios
  - _Requirements: 8.2, 8.3_

- [x] 26. Deploy to production
  - Set up Supabase secrets in production
  - Deploy Edge Function to production
  - Run database migrations
  - Update RLS policies
  - Deploy app update with Edge Function integration
  - Monitor logs and metrics
  - _Requirements: 10.1, 10.2, 10.5_

- [x] 27. Set up monitoring and alerts
  - Configure Edge Function log monitoring
  - Set up alerts for error rate > 5%
  - Set up alerts for execution time > 25s
  - Set up alerts for FCM failure rate > 10%
  - Set up alerts for rate limit violations > 100/hour
  - _Requirements: 6.5, 9.6_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each property test should run minimum 100 iterations
- Use `fast-check` library for property-based testing in TypeScript
- Test Edge Function locally before deploying to production
- Keep the simulated backend as fallback during initial rollout
- Monitor closely for first 48 hours after production deployment
