# Emulator Testing Checklist for Flash Offer Push Notifications

## Overview
This checklist covers all testing you can do with emulators to validate your push notification system before deploying to physical devices.

## ✅ What You CAN Test on Emulators

### 1. Edge Function Logic (100% Testable)

#### Test 1.1: JWT Authentication
```bash
# Test without JWT (should fail with 401)
curl -X POST https://cznhaaigowjhqdjtfeyz.supabase.co/functions/v1/send-flash-offer-push \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-id"}'

# Expected: 401 Unauthorized
```

#### Test 1.2: Offer Not Found
```bash
# Test with invalid offer ID (should fail with 404)
curl -X POST https://cznhaaigowjhqdjtfeyz.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "00000000-0000-0000-0000-000000000000"}'

# Expected: 404 Offer Not Found
```

#### Test 1.3: Dry Run Mode
```bash
# Test with dry run (validates without sending)
curl -X POST https://cznhaaigowjhqdjtfeyz.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "VALID_OFFER_ID", "dryRun": true}'

# Expected: 200 OK with targetedUserCount, sentCount, etc.
# No actual FCM messages sent
```

### 2. Database Operations (100% Testable)

#### Test 2.1: Device Token Storage
- [ ] Create user account on emulator
- [ ] Verify FCM token is stored in `device_tokens` table
- [ ] Verify `is_active = true`
- [ ] Verify `platform` is correct (android/ios)

```sql
SELECT * FROM device_tokens WHERE user_id = 'YOUR_USER_ID';
```

#### Test 2.2: Notification Preferences
- [ ] Create user account
- [ ] Verify default preferences created
- [ ] Update preferences in app
- [ ] Verify database reflects changes

```sql
SELECT * FROM notification_preferences WHERE user_id = 'YOUR_USER_ID';
```

#### Test 2.3: RLS Policies
- [ ] Try to query other users' device tokens (should fail)
- [ ] Query own device tokens (should succeed)

```sql
-- As User A, try to see User B's tokens (should return empty)
SELECT * FROM device_tokens WHERE user_id = 'USER_B_ID';
```

### 3. Targeting Logic (100% Testable)

#### Test 3.1: Location-Based Targeting
- [ ] Create venue at specific coordinates
- [ ] Create users at various distances
- [ ] Create offer with 5-mile radius
- [ ] Verify Edge Function targets correct users

**Setup**:
```sql
-- Venue at (28.5383, -81.3792) - Orlando, FL
-- User 1 at (28.5400, -81.3800) - ~0.5 miles away
-- User 2 at (28.6000, -81.4000) - ~5.5 miles away
```

**Expected**: User 1 targeted, User 2 excluded

#### Test 3.2: Favorites-Only Targeting
- [ ] Create venue
- [ ] User 1 favorites venue
- [ ] User 2 does not favorite venue
- [ ] Create offer with "favorites only" enabled
- [ ] Verify only User 1 targeted

### 4. Preference Filtering (100% Testable)

#### Test 4.1: Disabled Notifications
- [ ] User disables flash offer notifications
- [ ] Create offer targeting that user
- [ ] Verify user excluded from targeting

```sql
-- Disable notifications
UPDATE notification_preferences 
SET flash_offers_enabled = false 
WHERE user_id = 'USER_ID';
```

#### Test 4.2: Quiet Hours
- [ ] Set quiet hours: 10 PM - 8 AM
- [ ] Create offer during quiet hours
- [ ] Verify user excluded

```sql
-- Set quiet hours
UPDATE notification_preferences 
SET quiet_hours_start = '22:00:00',
    quiet_hours_end = '08:00:00',
    timezone = 'America/New_York'
WHERE user_id = 'USER_ID';
```

#### Test 4.3: Distance Limit
- [ ] Set max distance to 5 miles
- [ ] Create offer from venue 10 miles away
- [ ] Verify user excluded

```sql
-- Set distance limit
UPDATE notification_preferences 
SET max_distance_miles = 5.0 
WHERE user_id = 'USER_ID';
```

### 5. Rate Limiting (100% Testable)

#### Test 5.1: Venue Rate Limit
- [ ] Create venue with "free" tier (3 offers/day)
- [ ] Create 3 offers successfully
- [ ] Attempt 4th offer (should fail with 429)
- [ ] Verify error message shows limit and reset time

```sql
-- Check rate limit counter
SELECT * FROM flash_offer_rate_limits 
WHERE venue_id = 'VENUE_ID' 
AND limit_type = 'venue_send';
```

#### Test 5.2: User Rate Limit
- [ ] Create 10 offers targeting same user
- [ ] Attempt 11th offer
- [ ] Verify user excluded from 11th offer

```sql
-- Check user rate limit
SELECT * FROM flash_offer_rate_limits 
WHERE user_id = 'USER_ID' 
AND limit_type = 'user_receive';
```

### 6. Idempotency (100% Testable)

#### Test 6.1: Duplicate Requests
- [ ] Create offer and send push
- [ ] Call Edge Function again with same offer ID
- [ ] Verify second call returns success without sending
- [ ] Verify `push_sent` flag remains true

```sql
-- Check offer status
SELECT id, push_sent, updated_at 
FROM flash_offers 
WHERE id = 'OFFER_ID';
```

### 7. Analytics (100% Testable)

#### Test 7.1: Analytics Tracking
- [ ] Create offer with 5 targeted users
- [ ] Verify analytics record created
- [ ] Verify counts are accurate

```sql
-- Check analytics
SELECT * FROM flash_offer_analytics 
WHERE offer_id = 'OFFER_ID';
```

### 8. Error Handling (100% Testable)

#### Test 8.1: Invalid Token Deactivation
- [ ] Insert invalid token in database
- [ ] Create offer targeting that user
- [ ] Verify token marked as `is_active = false`

```sql
-- Insert invalid token
INSERT INTO device_tokens (user_id, token, platform, is_active)
VALUES ('USER_ID', 'invalid_token_12345', 'android', true);

-- After offer sent, check token status
SELECT token, is_active FROM device_tokens WHERE token = 'invalid_token_12345';
-- Expected: is_active = false
```

#### Test 8.2: Database Retry Logic
- [ ] Monitor Edge Function logs
- [ ] Look for retry attempts on transient errors
- [ ] Verify retries succeed

### 9. Client Integration (100% Testable)

#### Test 9.1: FCMService.sendViaEdgeFunction()
- [ ] Create offer in app
- [ ] Verify Edge Function called
- [ ] Verify JWT token included
- [ ] Verify offer ID passed correctly
- [ ] Verify response parsed correctly

#### Test 9.2: Retry Logic
- [ ] Simulate network error (airplane mode)
- [ ] Create offer
- [ ] Verify retry after 2 seconds
- [ ] Re-enable network
- [ ] Verify second attempt succeeds

### 10. Performance (Testable with Simulated Data)

#### Test 10.1: Large User Base
- [ ] Create 1000 test users with device tokens
- [ ] Create offer targeting all users
- [ ] Measure Edge Function execution time
- [ ] Verify completes within 10 seconds

```sql
-- Create test users (run in loop)
INSERT INTO device_tokens (user_id, token, platform, is_active)
VALUES (gen_random_uuid(), 'test_token_' || generate_series, 'android', true);
```

#### Test 10.2: Concurrent Offers
- [ ] Create 5 offers simultaneously
- [ ] Verify all process successfully
- [ ] Verify no race conditions
- [ ] Verify rate limits tracked correctly

## ❌ What You CANNOT Test on Emulators

### 1. Actual FCM Delivery
- Cannot verify notification appears on device
- Cannot verify notification sound/vibration
- Cannot verify notification tap opens app
- Cannot verify background notification handling

### 2. Platform-Specific Behavior
- Cannot verify iOS notification grouping
- Cannot verify Android notification channels
- Cannot verify notification priority behavior
- Cannot verify battery optimization impact

### 3. Network Conditions
- Cannot fully test poor network conditions
- Cannot test cellular vs WiFi behavior
- Cannot test notification delivery delays

## 📊 Test Results Template

| Test Category | Test Case | Status | Notes |
|---------------|-----------|--------|-------|
| **Edge Function** | JWT Auth | ⬜ | |
| | Offer Not Found | ⬜ | |
| | Dry Run Mode | ⬜ | |
| **Database** | Token Storage | ⬜ | |
| | Preferences | ⬜ | |
| | RLS Policies | ⬜ | |
| **Targeting** | Location-Based | ⬜ | |
| | Favorites-Only | ⬜ | |
| **Preferences** | Disabled Notifications | ⬜ | |
| | Quiet Hours | ⬜ | |
| | Distance Limit | ⬜ | |
| **Rate Limiting** | Venue Limit | ⬜ | |
| | User Limit | ⬜ | |
| **Idempotency** | Duplicate Requests | ⬜ | |
| **Analytics** | Tracking | ⬜ | |
| **Error Handling** | Invalid Token | ⬜ | |
| | Database Retry | ⬜ | |
| **Client** | Edge Function Call | ⬜ | |
| | Retry Logic | ⬜ | |
| **Performance** | 1000+ Users | ⬜ | |
| | Concurrent Offers | ⬜ | |

## 🎯 Confidence Level After Emulator Testing

If all tests pass, you can be **90% confident** the system will work on physical devices.

The remaining 10% is:
- FCM message delivery (Google's responsibility)
- Platform-specific notification display (tested by Firebase)
- Network reliability (tested by Firebase)

## 🚀 Next Steps

After completing emulator testing:
1. ✅ Deploy to staging environment
2. ✅ Run all tests on staging
3. ✅ Get 1-2 physical devices for final validation
4. ✅ Deploy to production with monitoring
5. ✅ Gradual rollout (10% → 25% → 50% → 100%)

## 📝 Notes

- All database tests can be run via Supabase Dashboard SQL Editor
- All Edge Function tests can be run via curl or Postman
- All client tests can be run on Android/iOS emulators
- Use dry-run mode extensively to validate logic without sending

**Tested By**: _______________  
**Date**: _______________  
**Overall Status**: ☐ Pass  ☐ Fail  
**Ready for Physical Device Testing**: ☐ Yes  ☐ No
