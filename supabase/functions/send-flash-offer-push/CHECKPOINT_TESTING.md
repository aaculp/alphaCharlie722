# Checkpoint Testing Guide - Task 15

## Overview

This document provides comprehensive instructions for testing the `send-flash-offer-push` Edge Function locally as part of Task 15 checkpoint. The testing validates all implemented functionality including authentication, rate limiting, user targeting, FCM integration, and error handling.

## Prerequisites

### Required Tools

1. **Supabase CLI** (for local Edge Function deployment)
   ```bash
   npm install -g supabase
   ```

2. **Deno** (Edge Function runtime - installed automatically with Supabase CLI)
   ```bash
   # Verify Deno is available
   deno --version
   ```

3. **jq** (for JSON parsing in test scripts)
   ```bash
   # Windows (via Chocolatey)
   choco install jq
   
   # Or download from https://stedolan.github.io/jq/download/
   ```

### Required Credentials

1. **Firebase Service Account JSON**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file

2. **Supabase Service Role Key**
   - Go to Supabase Dashboard → Project Settings → API
   - Copy the "service_role" key

3. **Valid JWT Token**
   - Obtain from your React Native app after user login
   - Or generate using Supabase client

## Setup Instructions

### 1. Start Local Supabase Instance

```bash
# Navigate to project root
cd /path/to/alphaCharlie722

# Start local Supabase (includes PostgreSQL, Auth, Storage, etc.)
supabase start
```

**Expected Output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### 2. Configure Environment Variables

Create environment file for local testing:

```bash
# Navigate to Edge Function directory
cd supabase/functions/send-flash-offer-push

# Create .env.local file
cat > .env.local << 'EOF'
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=http://localhost:54321
EOF
```

**Important**: Replace the placeholder values with your actual credentials.

### 3. Deploy Edge Function Locally

```bash
# From project root
supabase functions deploy send-flash-offer-push --no-verify-jwt

# Verify deployment
supabase functions list
```

**Expected Output:**
```
┌──────────────────────────┬─────────┬─────────────────────┐
│ NAME                     │ STATUS  │ UPDATED AT          │
├──────────────────────────┼─────────┼─────────────────────┤
│ send-flash-offer-push    │ ACTIVE  │ 2024-01-17 10:30:00 │
└──────────────────────────┴─────────┴─────────────────────┘
```

## Test Scenarios

### Test 1: Dry-Run Mode (Requirement 8.4)

**Objective**: Validate all logic without actually sending FCM notifications.

**Command**:
```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "valid-offer-uuid",
    "dryRun": true
  }' | jq '.'
```

**Expected Response**:
```json
{
  "success": true,
  "targetedUserCount": 50,
  "sentCount": 50,
  "failedCount": 0,
  "errors": [],
  "dryRun": true
}
```

**Validation Checklist**:
- ✅ Status code is 200
- ✅ Response includes `dryRun: true`
- ✅ `targetedUserCount` reflects actual user targeting logic
- ✅ No actual FCM messages sent (check Firebase Console)
- ✅ Logs show "DRY RUN MODE: Skipping actual FCM send"

### Test 2: Valid Offer ID (Requirement 8.2)

**Objective**: Test successful notification sending with a valid offer.

**Setup**:
1. Create a test flash offer in your database
2. Ensure the offer has `push_sent = false`
3. Note the offer UUID

**Command**:
```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "your-test-offer-uuid"
  }' | jq '.'
```

**Expected Response**:
```json
{
  "success": true,
  "targetedUserCount": 50,
  "sentCount": 48,
  "failedCount": 2,
  "errors": [
    {
      "token": "invalid_token_1",
      "error": "messaging/invalid-registration-token"
    },
    {
      "token": "invalid_token_2",
      "error": "messaging/registration-token-not-registered"
    }
  ]
}
```

**Validation Checklist**:
- ✅ Status code is 200
- ✅ `sentCount + failedCount = targetedUserCount`
- ✅ Offer's `push_sent` flag is now `true` in database
- ✅ Analytics event recorded in database
- ✅ Rate limit counters incremented
- ✅ Test devices receive notifications

### Test 3: Missing JWT Token (Requirement 1.2)

**Objective**: Verify authentication is required.

**Command**:
```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "test-offer-uuid"
  }' | jq '.'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Missing authorization token",
  "code": "UNAUTHORIZED"
}
```

**Validation Checklist**:
- ✅ Status code is 401
- ✅ Error code is "UNAUTHORIZED"
- ✅ Error message is descriptive

### Test 4: Invalid JWT Token (Requirement 1.2)

**Objective**: Verify JWT validation works.

**Command**:
```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer invalid_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "test-offer-uuid"
  }' | jq '.'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Invalid or expired authorization token",
  "code": "UNAUTHORIZED"
}
```

**Validation Checklist**:
- ✅ Status code is 401
- ✅ Error code is "UNAUTHORIZED"

### Test 5: Offer Not Found (Requirement 7.4)

**Objective**: Verify 404 error for non-existent offers.

**Command**:
```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "00000000-0000-0000-0000-000000000000"
  }' | jq '.'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Flash offer not found",
  "code": "OFFER_NOT_FOUND"
}
```

**Validation Checklist**:
- ✅ Status code is 404
- ✅ Error code is "OFFER_NOT_FOUND"

### Test 6: Invalid Offer ID Format (Requirement 3.4)

**Objective**: Verify input validation and sanitization.

**Command**:
```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "not-a-uuid"
  }' | jq '.'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Invalid offer ID format. Expected UUID.",
  "code": "INVALID_REQUEST"
}
```

**Validation Checklist**:
- ✅ Status code is 400
- ✅ Error code is "INVALID_REQUEST"

### Test 7: Rate Limit Exceeded (Requirements 11.1, 11.2)

**Objective**: Verify venue rate limiting works.

**Setup**:
1. Create multiple test offers for the same venue
2. Send push notifications until rate limit is reached

**Command**:
```bash
# Send multiple requests in succession
for i in {1..6}; do
  curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"offerId\": \"offer-uuid-$i\"}"
  echo ""
done
```

**Expected Response (after limit reached)**:
```json
{
  "success": false,
  "error": "Rate limit exceeded. You have sent 5 of 5 allowed offers in the last 24 hours.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "currentCount": 5,
    "limit": 5,
    "resetsAt": "2024-01-18T10:30:00Z"
  }
}
```

**Validation Checklist**:
- ✅ Status code is 429
- ✅ Error code is "RATE_LIMIT_EXCEEDED"
- ✅ Response includes `Retry-After` header
- ✅ Rate limit counter in database is accurate

### Test 8: Idempotency (Requirement 7.5)

**Objective**: Verify calling the function twice for the same offer doesn't send twice.

**Command**:
```bash
# First call
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "test-offer-uuid"
  }' | jq '.'

# Second call (should be idempotent)
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "test-offer-uuid"
  }' | jq '.'
```

**Expected Response (second call)**:
```json
{
  "success": true,
  "targetedUserCount": 0,
  "sentCount": 0,
  "failedCount": 0,
  "errors": [],
  "message": "Push notification already sent for this offer"
}
```

**Validation Checklist**:
- ✅ Second call returns success without sending
- ✅ No duplicate notifications sent
- ✅ Logs show "Push already sent for offer"

### Test 9: Missing Environment Variables (Requirements 3.5, 3.6)

**Objective**: Verify graceful failure when credentials are missing.

**Setup**:
```bash
# Temporarily remove environment variable
supabase secrets unset FIREBASE_SERVICE_ACCOUNT

# Redeploy function
supabase functions deploy send-flash-offer-push --no-verify-jwt
```

**Command**:
```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "test-offer-uuid"
  }' | jq '.'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Server configuration error",
  "code": "INTERNAL_ERROR"
}
```

**Validation Checklist**:
- ✅ Status code is 500
- ✅ Error message is generic (doesn't expose which variable is missing)
- ✅ Server logs show specific missing variables (for debugging)

### Test 10: User Preference Filtering (Requirements 12.4, 12.8)

**Objective**: Verify users with notifications disabled or in quiet hours are excluded.

**Setup**:
1. Create test users with various notification preferences
2. Set some users to have `flash_offers_enabled = false`
3. Set some users to be in quiet hours

**Command**:
```bash
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "test-offer-uuid",
    "dryRun": true
  }' | jq '.'
```

**Validation Checklist**:
- ✅ Users with `flash_offers_enabled = false` are excluded
- ✅ Users in quiet hours are excluded
- ✅ `targetedUserCount` reflects filtered count
- ✅ Logs show filtering details

## Viewing Logs

### Real-Time Logs

```bash
# View logs as they happen
supabase functions logs send-flash-offer-push --tail
```

### Recent Logs

```bash
# View last 100 log entries
supabase functions logs send-flash-offer-push --limit 100
```

### Log Analysis

Look for these key log entries:

1. **Successful Request**:
   ```
   [INFO] Found 50 targeted users for offer abc-123
   [INFO] After preference filtering: 45 users
   [INFO] After rate limit filtering: 43 users
   [INFO] Sending to 43 devices
   [INFO] FCM send complete: 41 succeeded, 2 failed
   [INFO] Request completed in 3500ms
   ```

2. **Rate Limit Hit**:
   ```
   [WARN] Venue rate limit exceeded: venueId=xyz, currentCount=5, limit=5
   ```

3. **Error Handling**:
   ```
   [ERROR] Offer not found: offerId=invalid-uuid
   ```

4. **Security Validation**:
   ```
   [SECURITY] Response contains credentials: violations=[...]
   ```

## Automated Test Script

Use the provided test script for comprehensive testing:

```bash
# Make script executable
chmod +x supabase/functions/test-function.sh

# Run all tests
./supabase/functions/test-function.sh local YOUR_JWT_TOKEN test-offer-uuid
```

## Database Verification

After running tests, verify database state:

### Check Offer Status

```sql
SELECT id, push_sent, updated_at
FROM flash_offers
WHERE id = 'your-test-offer-uuid';
```

**Expected**: `push_sent = true`

### Check Rate Limits

```sql
SELECT venue_id, limit_type, count, expires_at
FROM flash_offer_rate_limits
WHERE venue_id = 'your-venue-uuid'
ORDER BY created_at DESC;
```

**Expected**: Counter incremented for venue

### Check Analytics

```sql
SELECT event_type, offer_id, metadata
FROM analytics_events
WHERE offer_id = 'your-test-offer-uuid'
ORDER BY created_at DESC;
```

**Expected**: `push_sent` event recorded

### Check Invalid Tokens

```sql
SELECT device_token, is_active, updated_at
FROM device_tokens
WHERE is_active = false
ORDER BY updated_at DESC;
```

**Expected**: Invalid tokens marked as inactive

## Performance Validation

### Execution Time

Monitor execution time in logs:
- ✅ Should complete in < 10 seconds for 1000 users
- ✅ Should log warning if > 25 seconds
- ✅ Should timeout at 30 seconds

### FCM Batching

Verify batching logic:
- ✅ Tokens split into batches of 500
- ✅ Batches sent in parallel
- ✅ Total API calls = ceiling(token_count / 500)

## Troubleshooting

### Issue: "Connection refused"

**Solution**: Ensure Supabase is running:
```bash
supabase status
# If not running:
supabase start
```

### Issue: "Firebase initialization failed"

**Solution**: Verify Firebase service account JSON is valid:
```bash
# Check if secret is set
supabase secrets list

# Verify JSON format
echo $FIREBASE_SERVICE_ACCOUNT | jq '.'
```

### Issue: "Database error"

**Solution**: Check database connection:
```bash
# Test database connection
supabase db ping

# View database logs
supabase db logs
```

### Issue: "No users targeted"

**Solution**: Verify test data exists:
```sql
-- Check if users have device tokens
SELECT COUNT(*) FROM device_tokens WHERE is_active = true;

-- Check if users are within radius
SELECT COUNT(*) FROM users WHERE location IS NOT NULL;
```

## Success Criteria

Task 15 is complete when:

- ✅ All 10 test scenarios pass
- ✅ Logs show expected behavior for each scenario
- ✅ Database state is correct after tests
- ✅ No credential exposure in responses or logs
- ✅ Performance meets requirements (< 10s for 1000 users)
- ✅ Error handling works for all error cases
- ✅ Dry-run mode works correctly
- ✅ Idempotency is maintained

## Next Steps

After checkpoint testing passes:
1. Proceed to Task 16: Update FCMService in React Native app
2. Integrate Edge Function with client-side notification flow
3. Test end-to-end flow from app to device
4. Deploy to production (Task 26)

## References

- Requirements: 8.1, 8.2 in requirements.md
- Design: Testing Strategy section in design.md
- Test Documentation: TEST_README.md
