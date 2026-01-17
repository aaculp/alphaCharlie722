# End-to-End Testing Guide: Flash Offer Push Notifications

## Overview

This guide provides step-by-step instructions for testing the complete flash offer push notification system, from offer creation to notification delivery. Follow these steps to verify all components are working correctly.

## Prerequisites

- Access to Supabase Dashboard
- Access to Firebase Console
- Two physical test devices (or emulators):
  - One for venue owner
  - One for customer
- Supabase CLI installed
- Edge Function deployed to staging/production

## Test Environment Setup

### 1. Verify Edge Function Deployment

```bash
# Check Edge Function is deployed
supabase functions list

# View recent logs
supabase functions logs send-flash-offer-push --limit 50
```

### 2. Verify Database Schema

```sql
-- Check notification_preferences table exists
SELECT * FROM notification_preferences LIMIT 1;

-- Check flash_offer_rate_limits table exists
SELECT * FROM flash_offer_rate_limits LIMIT 1;

-- Verify device_tokens RLS policies
SELECT * FROM pg_policies WHERE tablename = 'device_tokens';
```

### 3. Verify Secrets Configuration

```bash
# List configured secrets (values will be hidden)
supabase secrets list
```

Expected secrets:
- `FIREBASE_SERVICE_ACCOUNT`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

## Test Accounts Setup

### Test Account 1: Venue Owner

**Purpose**: Create and send flash offers

**Setup Steps**:
1. Install app on Device 1
2. Sign up as venue owner
3. Complete venue registration
4. Note down:
   - User ID: `_______________`
   - Venue ID: `_______________`
   - Device Token: `_______________`

### Test Account 2: Customer (Default Preferences)

**Purpose**: Test standard notification delivery

**Setup Steps**:
1. Install app on Device 2
2. Sign up as customer
3. Enable location permissions
4. Enable notification permissions
5. Note down:
   - User ID: `_______________`
   - Device Token: `_______________`

**Verify Default Preferences**:
```sql
SELECT * FROM notification_preferences WHERE user_id = '<customer_user_id>';
```

Expected:
- `flash_offers_enabled`: `true`
- `quiet_hours_start`: `NULL`
- `quiet_hours_end`: `NULL`
- `max_distance_miles`: `NULL`

### Test Account 3: Customer (Notifications Disabled)

**Purpose**: Test preference filtering

**Setup Steps**:
1. Create another customer account
2. Go to Settings → Notification Settings
3. Toggle "Flash Offer Notifications" OFF
4. Note down User ID: `_______________`

**Verify Preferences**:
```sql
SELECT * FROM notification_preferences WHERE user_id = '<customer_user_id>';
```

Expected:
- `flash_offers_enabled`: `false`

### Test Account 4: Customer (Quiet Hours)

**Purpose**: Test quiet hours filtering

**Setup Steps**:
1. Create another customer account
2. Go to Settings → Notification Settings
3. Set Quiet Hours: Start = Current Time - 1 hour, End = Current Time + 2 hours
4. Note down User ID: `_______________`

**Verify Preferences**:
```sql
SELECT * FROM notification_preferences WHERE user_id = '<customer_user_id>';
```

Expected:
- `quiet_hours_start`: Set to configured time
- `quiet_hours_end`: Set to configured time
- `timezone`: User's timezone

### Test Account 5: Customer (Distance Limit)

**Purpose**: Test distance filtering

**Setup Steps**:
1. Create another customer account
2. Go to Settings → Notification Settings
3. Set Maximum Distance: 5 miles
4. Position device far from test venue (>5 miles)
5. Note down User ID: `_______________`

## Test Scenarios

### Scenario 1: Happy Path - Successful Notification Delivery

**Objective**: Verify end-to-end flow works correctly

**Steps**:
1. Log in as venue owner (Test Account 1)
2. Navigate to Flash Offers screen
3. Create new flash offer:
   - Title: "E2E Test Offer 1"
   - Description: "Testing push notifications"
   - Discount: 20%
   - Quantity: 10
   - Expiration: 2 hours
   - Target: All users within 10 miles
   - Enable "Send Push Notification"
4. Submit offer

**Expected Results**:
- ✅ Offer created successfully
- ✅ Edge Function called (check logs)
- ✅ Customer (Test Account 2) receives notification on device
- ✅ Notification appears in notification tray
- ✅ Tapping notification opens app to offer detail
- ✅ Offer shows `push_sent = true` in database
- ✅ Analytics recorded in database

**Verification Queries**:
```sql
-- Check offer was marked as sent
SELECT id, title, push_sent, created_at 
FROM flash_offers 
WHERE title = 'E2E Test Offer 1';

-- Check analytics were tracked
SELECT * FROM flash_offer_analytics 
WHERE offer_id = '<offer_id>' 
AND event_type = 'push_sent';

-- Check rate limit counter was created
SELECT * FROM flash_offer_rate_limits 
WHERE venue_id = '<venue_id>' 
AND limit_type = 'venue_send';
```

**Edge Function Logs**:
```bash
supabase functions logs send-flash-offer-push --tail
```

Look for:
- JWT authentication success
- Offer details retrieved
- Targeted users count
- FCM batch sending
- Success/failure counts
- Analytics tracking

### Scenario 2: Preference Filtering - Disabled Notifications

**Objective**: Verify users with disabled notifications are excluded

**Steps**:
1. Ensure Test Account 3 has `flash_offers_enabled = false`
2. Log in as venue owner
3. Create flash offer targeting all users
4. Submit offer

**Expected Results**:
- ✅ Test Account 2 receives notification
- ✅ Test Account 3 does NOT receive notification
- ✅ Edge Function logs show user excluded due to preferences
- ✅ Targeted user count excludes Test Account 3

**Verification**:
```sql
-- Check user preferences
SELECT user_id, flash_offers_enabled 
FROM notification_preferences 
WHERE user_id IN ('<account_2_id>', '<account_3_id>');
```

### Scenario 3: Quiet Hours Filtering

**Objective**: Verify users in quiet hours are excluded

**Steps**:
1. Ensure Test Account 4 is currently in quiet hours
2. Log in as venue owner
3. Create flash offer targeting all users
4. Submit offer

**Expected Results**:
- ✅ Test Account 2 receives notification
- ✅ Test Account 4 does NOT receive notification
- ✅ Edge Function logs show user excluded due to quiet hours
- ✅ Targeted user count excludes Test Account 4

**Verification**:
```sql
-- Check quiet hours configuration
SELECT user_id, quiet_hours_start, quiet_hours_end, timezone
FROM notification_preferences 
WHERE user_id = '<account_4_id>';

-- Verify current time is within quiet hours
SELECT 
  NOW() AT TIME ZONE timezone as current_time,
  quiet_hours_start,
  quiet_hours_end
FROM notification_preferences 
WHERE user_id = '<account_4_id>';
```

### Scenario 4: Distance Filtering

**Objective**: Verify users beyond max distance are excluded

**Steps**:
1. Ensure Test Account 5 is >5 miles from venue
2. Ensure Test Account 5 has `max_distance_miles = 5`
3. Log in as venue owner
4. Create flash offer targeting all users within 10 miles
5. Submit offer

**Expected Results**:
- ✅ Test Account 2 receives notification (within range)
- ✅ Test Account 5 does NOT receive notification (beyond max distance)
- ✅ Edge Function logs show user excluded due to distance
- ✅ Targeted user count excludes Test Account 5

### Scenario 5: Venue Rate Limiting

**Objective**: Verify venue daily offer limits are enforced

**Steps**:
1. Check venue's subscription tier and daily limit
2. Create offers until limit is reached:
   - Free tier: 3 offers
   - Core tier: 5 offers
   - Pro tier: 10 offers
3. Attempt to create one more offer

**Expected Results**:
- ✅ First N offers succeed (where N = tier limit)
- ✅ (N+1)th offer fails with rate limit error
- ✅ Error message shows: "Daily offer limit reached"
- ✅ Error message shows when venue can send next offer
- ✅ Edge Function returns 429 status code

**Verification**:
```sql
-- Check rate limit counter
SELECT venue_id, count, window_start, expires_at
FROM flash_offer_rate_limits 
WHERE venue_id = '<venue_id>' 
AND limit_type = 'venue_send'
AND expires_at > NOW();

-- Count offers sent in last 24 hours
SELECT COUNT(*) 
FROM flash_offers 
WHERE venue_id = '<venue_id>' 
AND created_at > NOW() - INTERVAL '24 hours'
AND push_sent = true;
```

### Scenario 6: User Rate Limiting

**Objective**: Verify users don't receive too many notifications

**Steps**:
1. Create 10 flash offers from different venues targeting Test Account 2
2. Attempt to send 11th notification to same user

**Expected Results**:
- ✅ First 10 notifications delivered
- ✅ 11th notification excludes Test Account 2
- ✅ Edge Function logs show user excluded due to rate limit
- ✅ Other users still receive 11th notification

**Verification**:
```sql
-- Check user rate limit counter
SELECT user_id, count, window_start, expires_at
FROM flash_offer_rate_limits 
WHERE user_id = '<account_2_id>' 
AND limit_type = 'user_receive'
AND expires_at > NOW();
```

### Scenario 7: Idempotency - Duplicate Requests

**Objective**: Verify duplicate requests don't send notifications twice

**Steps**:
1. Create flash offer with push enabled
2. Note the offer ID
3. Manually call Edge Function again with same offer ID:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "<offer_id>"}'
```

**Expected Results**:
- ✅ First call sends notifications
- ✅ Second call returns success without sending
- ✅ Edge Function logs show "push already sent"
- ✅ Users receive only ONE notification

### Scenario 8: Invalid Device Tokens

**Objective**: Verify invalid tokens are marked inactive

**Steps**:
1. Manually insert invalid device token in database:
```sql
INSERT INTO device_tokens (user_id, token, platform, is_active)
VALUES ('<test_user_id>', 'invalid_token_12345', 'android', true);
```
2. Create flash offer targeting that user
3. Submit offer

**Expected Results**:
- ✅ Edge Function attempts to send to invalid token
- ✅ FCM returns error for invalid token
- ✅ Token marked as `is_active = false` in database
- ✅ Edge Function logs show token deactivation
- ✅ Other valid tokens still receive notifications

**Verification**:
```sql
-- Check token was deactivated
SELECT token, is_active, updated_at 
FROM device_tokens 
WHERE token = 'invalid_token_12345';
```

Expected: `is_active = false`

### Scenario 9: Offer Not Found Error

**Objective**: Verify proper error handling for invalid offer ID

**Steps**:
1. Call Edge Function with non-existent offer ID:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "00000000-0000-0000-0000-000000000000"}'
```

**Expected Results**:
- ✅ Edge Function returns 404 status code
- ✅ Error response contains: `"code": "OFFER_NOT_FOUND"`
- ✅ Error message is descriptive
- ✅ No notifications sent

### Scenario 10: Missing JWT Token

**Objective**: Verify authentication is required

**Steps**:
1. Call Edge Function without Authorization header:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-flash-offer-push \
  -H "Content-Type: application/json" \
  -d '{"offerId": "<valid_offer_id>"}'
```

**Expected Results**:
- ✅ Edge Function returns 401 status code
- ✅ Error response contains: `"code": "UNAUTHORIZED"`
- ✅ No notifications sent

### Scenario 11: Dry Run Mode

**Objective**: Verify dry run validates without sending

**Steps**:
1. Create flash offer
2. Call Edge Function with `dryRun: true`:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "<offer_id>", "dryRun": true}'
```

**Expected Results**:
- ✅ Edge Function returns success
- ✅ Response shows targeted user count
- ✅ Response shows what would be sent
- ✅ NO actual notifications sent to devices
- ✅ Offer remains `push_sent = false`

### Scenario 12: Analytics Tracking

**Objective**: Verify all analytics are tracked correctly

**Steps**:
1. Create flash offer with 5 targeted users
2. Submit offer
3. Query analytics tables

**Expected Results**:
- ✅ `push_sent` event recorded
- ✅ Recipient count matches targeted users
- ✅ Success/failure counts are accurate
- ✅ Timestamp is correct
- ✅ Venue dashboard shows metrics

**Verification**:
```sql
-- Check analytics event
SELECT 
  offer_id,
  event_type,
  recipient_count,
  success_count,
  failure_count,
  created_at
FROM flash_offer_analytics 
WHERE offer_id = '<offer_id>';

-- Check venue dashboard data
SELECT 
  fo.id,
  fo.title,
  fo.push_sent,
  foa.recipient_count,
  foa.success_count,
  foa.failure_count
FROM flash_offers fo
LEFT JOIN flash_offer_analytics foa ON fo.id = foa.offer_id
WHERE fo.venue_id = '<venue_id>'
ORDER BY fo.created_at DESC
LIMIT 10;
```

## Performance Testing

### Test 1: Large User Base (1000+ users)

**Steps**:
1. Create 1000 test customer accounts with device tokens
2. Create flash offer targeting all users
3. Measure execution time

**Expected Results**:
- ✅ Edge Function completes within 10 seconds
- ✅ All users receive notifications
- ✅ No timeout errors
- ✅ Logs show batching (2 batches of 500)

### Test 2: Concurrent Offers

**Steps**:
1. Create 5 flash offers simultaneously from different venues
2. Monitor Edge Function logs

**Expected Results**:
- ✅ All offers processed successfully
- ✅ No race conditions
- ✅ Rate limits tracked correctly per venue
- ✅ No database deadlocks

## Error Recovery Testing

### Test 1: Database Connection Failure

**Steps**:
1. Temporarily disable database connection
2. Attempt to create flash offer
3. Re-enable database

**Expected Results**:
- ✅ Edge Function returns 500 error
- ✅ Error logged with context
- ✅ Client shows error message
- ✅ Retry succeeds after database restored

### Test 2: Firebase Quota Exceeded

**Steps**:
1. Simulate FCM quota exceeded (may require Firebase Console)
2. Attempt to send notifications

**Expected Results**:
- ✅ Edge Function returns 429 error
- ✅ Error code: `FCM_QUOTA_EXCEEDED`
- ✅ Error logged
- ✅ Client shows appropriate message

## Security Testing

### Test 1: RLS Policy Enforcement

**Steps**:
1. Log in as customer (Test Account 2)
2. Attempt to query other users' device tokens:
```sql
SELECT * FROM device_tokens WHERE user_id != '<current_user_id>';
```

**Expected Results**:
- ✅ Query returns empty result or RLS error
- ✅ User can only see their own tokens

### Test 2: Credential Exposure

**Steps**:
1. Create flash offer
2. Check Edge Function response
3. Check Edge Function logs

**Expected Results**:
- ✅ No Firebase credentials in response
- ✅ No Supabase service role key in response
- ✅ No credentials in logs
- ✅ Only sanitized data exposed

## Test Results Summary

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Happy Path | ⬜ | |
| 2. Disabled Notifications | ⬜ | |
| 3. Quiet Hours | ⬜ | |
| 4. Distance Filtering | ⬜ | |
| 5. Venue Rate Limiting | ⬜ | |
| 6. User Rate Limiting | ⬜ | |
| 7. Idempotency | ⬜ | |
| 8. Invalid Tokens | ⬜ | |
| 9. Offer Not Found | ⬜ | |
| 10. Missing JWT | ⬜ | |
| 11. Dry Run Mode | ⬜ | |
| 12. Analytics Tracking | ⬜ | |
| Performance: 1000+ users | ⬜ | |
| Performance: Concurrent | ⬜ | |
| Error: DB Failure | ⬜ | |
| Error: FCM Quota | ⬜ | |
| Security: RLS | ⬜ | |
| Security: Credentials | ⬜ | |

## Troubleshooting

### Issue: Notifications Not Received

**Checklist**:
- [ ] Device has notification permissions enabled
- [ ] Device token is valid and active in database
- [ ] User preferences allow flash offer notifications
- [ ] User is not in quiet hours
- [ ] User is within distance limit
- [ ] Edge Function executed successfully (check logs)
- [ ] FCM send succeeded (check Edge Function response)
- [ ] Firebase project is configured correctly

### Issue: Edge Function Timeout

**Checklist**:
- [ ] Check number of targeted users (>10K may timeout)
- [ ] Check database query performance
- [ ] Check FCM batch sending performance
- [ ] Review Edge Function logs for bottlenecks

### Issue: Rate Limit Not Working

**Checklist**:
- [ ] Check rate limit table has entries
- [ ] Check expires_at is in future
- [ ] Check venue tier is correct
- [ ] Check rate limit logic in Edge Function

### Issue: Analytics Not Tracked

**Checklist**:
- [ ] Check analytics table exists
- [ ] Check Edge Function has permissions
- [ ] Check analytics service is called
- [ ] Review Edge Function logs for errors

## Cleanup

After testing, clean up test data:

```sql
-- Delete test offers
DELETE FROM flash_offers WHERE title LIKE 'E2E Test%';

-- Delete test rate limits
DELETE FROM flash_offer_rate_limits WHERE created_at > NOW() - INTERVAL '1 hour';

-- Delete test analytics
DELETE FROM flash_offer_analytics WHERE created_at > NOW() - INTERVAL '1 hour';

-- Reset test user preferences
UPDATE notification_preferences 
SET flash_offers_enabled = true,
    quiet_hours_start = NULL,
    quiet_hours_end = NULL,
    max_distance_miles = NULL
WHERE user_id IN ('<test_user_ids>');
```

## Sign-Off

**Tested By**: _______________  
**Date**: _______________  
**Environment**: ☐ Staging  ☐ Production  
**Overall Status**: ☐ Pass  ☐ Fail  

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**Ready for Production**: ☐ Yes  ☐ No  

**Approver**: _______________  
**Date**: _______________
