# Flash Offer Push Notification Backend - Complete Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Firebase Service Account Credentials](#getting-firebase-service-account-credentials)
4. [Configuring Supabase Secrets](#configuring-supabase-secrets)
5. [Deployment Steps](#deployment-steps)
6. [Testing Procedures](#testing-procedures)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides complete instructions for deploying the Flash Offer Push Notification Backend to Supabase. The system consists of:

- **Supabase Edge Function**: Serverless function that sends push notifications via Firebase Cloud Messaging (FCM)
- **Database Schema**: Tables for notification preferences and rate limiting
- **RLS Policies**: Security policies for database access
- **Firebase Integration**: FCM for actual push notification delivery

**Deployment Time**: ~15-30 minutes  
**Downtime**: None (zero-downtime deployment)

---

## Prerequisites

Before starting deployment, ensure you have:

### Required Tools

- **Supabase CLI** (v1.0.0 or later)
  ```powershell
  # Install via npm
  npm install -g supabase
  
  # Verify installation
  supabase --version
  ```

- **PowerShell** (5.1+ on Windows, or PowerShell Core for cross-platform)
  ```powershell
  # Check version
  $PSVersionTable.PSVersion
  ```

- **curl** (for testing endpoints)
  ```powershell
  # Check if available
  curl --version
  ```

### Required Accounts & Access


- **Supabase Account**: With an existing project
- **Firebase Account**: With a project configured for your app
- **Admin Access**: To both Supabase and Firebase consoles
- **Supabase CLI Login**: Run `supabase login` before starting

### Verify Prerequisites

```powershell
# Login to Supabase
supabase login

# List your projects
supabase projects list

# Link to your project
supabase link --project-ref <your-project-ref>
```

---

## Getting Firebase Service Account Credentials

**Requirement 10.3**: This section provides step-by-step instructions for obtaining Firebase service account credentials.

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Select your project (or create one if needed)

### Step 2: Navigate to Service Accounts

1. Click the **gear icon** (⚙️) in the left sidebar
2. Select **Project settings**
3. Click the **Service accounts** tab

### Step 3: Generate Private Key

1. Scroll down to the **Firebase Admin SDK** section
2. Select **Node.js** as the language (the JSON format is the same)
3. Click **Generate new private key**
4. A dialog will appear warning you to keep the key secure
5. Click **Generate key**

### Step 4: Download and Secure the JSON File


A JSON file will be downloaded with a name like:
```
your-project-name-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
```

**⚠️ SECURITY WARNING**: This file contains sensitive credentials. Never commit it to version control!

### Step 5: Prepare the JSON for Supabase

The JSON file will look like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

You'll need to convert this to a single-line string for the Supabase secret. See [Configuring Supabase Secrets](#configuring-supabase-secrets) below.

### Troubleshooting Firebase Service Account

**Issue**: "Generate new private key" button is disabled

**Solution**: You may not have sufficient permissions. Ensure you have:
- Owner or Editor role on the Firebase project
- Service Account Admin role in Google Cloud Console

**Issue**: Downloaded JSON file is empty or corrupted

**Solution**: 
1. Try downloading again
2. Check your browser's download folder
3. Ensure pop-ups are not blocked

---

## Configuring Supabase Secrets

**Requirement 10.4**: This section provides step-by-step instructions for configuring Supabase secrets.


The Edge Function requires three secrets to be configured in Supabase:

1. `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON
2. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
3. `SUPABASE_URL` - Your Supabase project URL

### Secret 1: FIREBASE_SERVICE_ACCOUNT

**Format**: Entire JSON file as a single-line string

**Method 1: Using PowerShell (Recommended)**

```powershell
# Read the JSON file
$firebaseJson = Get-Content -Path "path/to/your-firebase-adminsdk.json" -Raw

# Remove newlines and extra spaces (optional, but cleaner)
$firebaseJson = $firebaseJson -replace '\s+', ' '

# Set the secret
supabase secrets set FIREBASE_SERVICE_ACCOUNT="$firebaseJson" --project-ref <your-project-ref>
```

**Method 2: Manual Copy-Paste**

1. Open the Firebase JSON file in a text editor
2. Copy the entire contents
3. Run:
   ```powershell
   supabase secrets set FIREBASE_SERVICE_ACCOUNT='<paste-json-here>' --project-ref <your-project-ref>
   ```

**Method 3: Using the Supabase Dashboard**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Project Settings** → **Edge Functions**
4. Scroll to **Secrets**
5. Click **Add secret**
6. Name: `FIREBASE_SERVICE_ACCOUNT`
7. Value: Paste the entire JSON content
8. Click **Save**

### Secret 2: SUPABASE_SERVICE_ROLE_KEY

**Format**: JWT token string (starts with `eyJhbGc...`)

**Step 1: Get the Service Role Key**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Project Settings** → **API**
4. Scroll to **Project API keys**
5. Find the **service_role** key (NOT the anon key!)
6. Click the **eye icon** to reveal the key
7. Click **Copy** to copy it to clipboard


**⚠️ SECURITY WARNING**: The service_role key bypasses Row Level Security. Never expose it to clients!

**Step 2: Set the Secret**

```powershell
# Set the secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='<paste-service-role-key-here>' --project-ref <your-project-ref>
```

### Secret 3: SUPABASE_URL

**Format**: HTTPS URL (e.g., `https://abcdefgh.supabase.co`)

**Step 1: Get Your Project URL**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Project Settings** → **API**
4. Find **Project URL** under **Configuration**
5. Copy the URL (format: `https://<project-ref>.supabase.co`)

**Step 2: Set the Secret**

```powershell
# Set the secret
supabase secrets set SUPABASE_URL='https://<your-project-ref>.supabase.co' --project-ref <your-project-ref>
```

### Verify All Secrets Are Set

```powershell
# List all secrets (values are hidden for security)
supabase secrets list --project-ref <your-project-ref>
```

Expected output:
```
NAME                          VALUE
FIREBASE_SERVICE_ACCOUNT      [hidden]
SUPABASE_SERVICE_ROLE_KEY     [hidden]
SUPABASE_URL                  [hidden]
```

### Validate Secrets (Automated)

Use the validation script to ensure all secrets are properly configured:

```powershell
cd supabase/functions/scripts
.\validate-secrets.ps1 -ProjectRef <your-project-ref>
```

Expected output:
```
✓ FIREBASE_SERVICE_ACCOUNT is set
✓ SUPABASE_SERVICE_ROLE_KEY is set
✓ SUPABASE_URL is set
All required secrets are configured!
```

---

## Deployment Steps


This section provides the complete deployment process.

### Option 1: Automated Deployment (Recommended)

Deploy everything with a single command:

```powershell
cd supabase/functions/scripts
.\deploy-all.ps1 -ProjectRef <your-project-ref>
```

This script will:
1. ✓ Validate all secrets are configured
2. ✓ Run database migrations
3. ✓ Update RLS policies
4. ✓ Deploy the Edge Function

**Expected Duration**: 2-5 minutes

### Option 2: Manual Step-by-Step Deployment

If you prefer to deploy components individually:

#### Step 1: Validate Secrets

```powershell
cd supabase/functions/scripts
.\validate-secrets.ps1 -ProjectRef <your-project-ref>
```

#### Step 2: Run Database Migrations

```powershell
.\run-migrations.ps1 -ProjectRef <your-project-ref>
```

This creates:
- `notification_preferences` table
- `flash_offer_rate_limits` table
- Helper functions for cleanup and timestamps

#### Step 3: Update RLS Policies

```powershell
.\update-rls-policies.ps1 -ProjectRef <your-project-ref>
```

This updates:
- Removes permissive testing policy on `device_tokens`
- Adds secure policy: users can only access their own tokens

#### Step 4: Deploy Edge Function

```powershell
.\deploy-edge-function.ps1 -ProjectRef <your-project-ref>
```

This deploys the Edge Function to:
```
https://<your-project-ref>.supabase.co/functions/v1/send-flash-offer-push
```

### Verify Deployment


#### Check Edge Function Status

```powershell
# List deployed functions
supabase functions list --project-ref <your-project-ref>
```

Expected output:
```
NAME                      VERSION    STATUS
send-flash-offer-push     1          ACTIVE
```

#### Check Database Tables

```powershell
supabase db execute --project-ref <your-project-ref> -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notification_preferences', 'flash_offer_rate_limits')
ORDER BY table_name;
"
```

Expected output:
```
table_name
flash_offer_rate_limits
notification_preferences
```

#### Check RLS Policies

```powershell
supabase db execute --project-ref <your-project-ref> -c "
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'device_tokens'
ORDER BY policyname;
"
```

Expected output should include:
```
policyname                              cmd
Users can manage own device tokens      ALL
```

---

## Testing Procedures

**Requirement 8.5**: This section provides complete end-to-end testing procedures.

### Local Testing (Development)

#### Step 1: Start Local Supabase

```powershell
# Start local Supabase instance
supabase start
```

This starts:
- PostgreSQL database (port 54322)
- Edge Functions runtime (port 54321)
- Studio UI (port 54323)

#### Step 2: Deploy Locally

```powershell
cd supabase/functions/scripts

# Run migrations locally
.\run-migrations.ps1 -Local

# Update RLS policies locally
.\update-rls-policies.ps1 -Local

# Deploy Edge Function locally (without JWT verification for testing)
.\deploy-edge-function.ps1 -Local -NoVerifyJWT
```


#### Step 3: Test with Dry-Run Mode

```powershell
# Test without sending actual notifications
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push `
  -H "Content-Type: application/json" `
  -d '{
    "offerId": "test-offer-id",
    "dryRun": true
  }'
```

Expected response:
```json
{
  "success": true,
  "targetedUserCount": 0,
  "sentCount": 0,
  "failedCount": 0,
  "errors": []
}
```

### Remote Testing (Staging/Production)

#### Test 1: Dry-Run Mode

**Objective**: Validate all logic without sending actual notifications

**Prerequisites**:
- Valid JWT token from your app
- Existing flash offer in database

**Steps**:

1. Get a JWT token:
   ```powershell
   # Option 1: From Supabase Dashboard
   # Go to Authentication → Users → Select a user → Copy JWT
   
   # Option 2: From your React Native app
   # Log in and extract the session token
   ```

2. Test the Edge Function:
   ```powershell
   curl -X POST https://<your-project-ref>.supabase.co/functions/v1/send-flash-offer-push `
     -H "Authorization: Bearer <your-jwt-token>" `
     -H "Content-Type: application/json" `
     -d '{
       "offerId": "<real-offer-id>",
       "dryRun": true
     }'
   ```

3. Verify response:
   ```json
   {
     "success": true,
     "targetedUserCount": 5,
     "sentCount": 0,
     "failedCount": 0,
     "errors": []
   }
   ```

**Expected Behavior**:
- ✓ Returns targeted user count
- ✓ Does NOT send actual FCM notifications
- ✓ Does NOT mark offer as push_sent
- ✓ Logs show "DRY RUN MODE" message


#### Test 2: Real Notification Send

**Objective**: Send actual push notifications to test devices

**Prerequisites**:
- Test venue owner account
- Test customer accounts with device tokens registered
- Test devices with app installed and notifications enabled

**Steps**:

1. Create test accounts:
   ```sql
   -- Create test venue owner
   INSERT INTO venues (id, name, latitude, longitude, owner_id)
   VALUES (
     gen_random_uuid(),
     'Test Venue',
     40.7128,
     -74.0060,
     '<venue-owner-user-id>'
   );
   
   -- Create test customers with notification preferences
   INSERT INTO notification_preferences (user_id, flash_offers_enabled)
   VALUES 
     ('<customer-1-user-id>', true),
     ('<customer-2-user-id>', true);
   ```

2. Create a flash offer via the app:
   - Log in as venue owner
   - Navigate to Flash Offer creation
   - Fill in offer details
   - Enable "Send Push Notification"
   - Submit

3. Verify Edge Function was called:
   ```powershell
   # Check Edge Function logs
   supabase functions logs send-flash-offer-push --project-ref <your-project-ref> --tail
   ```

4. Verify notifications received:
   - Check test devices for push notifications
   - Verify notification content matches offer details
   - Tap notification and verify it opens the app to offer details

5. Verify analytics:
   ```sql
   -- Check that push_sent flag is set
   SELECT id, title, push_sent 
   FROM flash_offers 
   WHERE id = '<offer-id>';
   
   -- Check analytics data
   SELECT * FROM flash_offer_analytics 
   WHERE offer_id = '<offer-id>' 
   AND event_type = 'push_sent';
   ```

**Expected Behavior**:
- ✓ Notifications appear on test devices within 5 seconds
- ✓ Notification title and body match offer details
- ✓ Tapping notification opens app to offer detail screen
- ✓ offer.push_sent = true in database
- ✓ Analytics record created with recipient count


#### Test 3: Rate Limiting

**Objective**: Verify venue and user rate limits work correctly

**Steps**:

1. Test venue rate limit:
   ```powershell
   # Create 5 offers in quick succession (assuming free tier = 3/day)
   # The 4th offer should be rejected with RATE_LIMIT_EXCEEDED
   ```

2. Verify rate limit error:
   ```json
   {
     "success": false,
     "error": "Venue has exceeded daily offer limit",
     "code": "RATE_LIMIT_EXCEEDED"
   }
   ```

3. Test user rate limit:
   ```sql
   -- Manually insert rate limit records to simulate 10 notifications
   INSERT INTO flash_offer_rate_limits (user_id, limit_type, count)
   VALUES ('<user-id>', 'user_receive', 10);
   
   -- Create new offer - this user should be excluded from targeting
   ```

4. Verify user exclusion:
   - Check Edge Function logs
   - Verify user was filtered out due to rate limit
   - Verify other users still received notification

**Expected Behavior**:
- ✓ Venue rate limit prevents excessive offers
- ✓ User rate limit prevents notification fatigue
- ✓ Clear error messages returned
- ✓ Rate limit counters expire after 24 hours

#### Test 4: User Preferences

**Objective**: Verify notification preferences are respected

**Steps**:

1. Disable notifications for a test user:
   ```sql
   UPDATE notification_preferences 
   SET flash_offers_enabled = false 
   WHERE user_id = '<user-id>';
   ```

2. Create a flash offer

3. Verify user was excluded:
   - Check Edge Function logs
   - Verify user did NOT receive notification
   - Verify other users still received notification

4. Test quiet hours:
   ```sql
   UPDATE notification_preferences 
   SET 
     quiet_hours_start = '22:00:00',
     quiet_hours_end = '08:00:00',
     timezone = 'America/New_York'
   WHERE user_id = '<user-id>';
   ```

5. Create offer during quiet hours (e.g., 11 PM EST)

6. Verify user was excluded due to quiet hours

**Expected Behavior**:
- ✓ Users with flash_offers_enabled = false don't receive notifications
- ✓ Users in quiet hours are excluded
- ✓ Timezone-aware quiet hours work correctly
- ✓ Preferences take effect immediately


#### Test 5: Error Handling

**Objective**: Verify error cases are handled gracefully

**Test Cases**:

1. **Missing JWT Token**:
   ```powershell
   curl -X POST https://<project>.supabase.co/functions/v1/send-flash-offer-push `
     -H "Content-Type: application/json" `
     -d '{"offerId": "test"}'
   ```
   Expected: 401 Unauthorized

2. **Invalid Offer ID**:
   ```powershell
   curl -X POST https://<project>.supabase.co/functions/v1/send-flash-offer-push `
     -H "Authorization: Bearer <jwt>" `
     -H "Content-Type: application/json" `
     -d '{"offerId": "non-existent-id"}'
   ```
   Expected: 404 Not Found

3. **Already Sent**:
   ```powershell
   # Send to same offer twice
   # First call succeeds, second call returns success without re-sending
   ```
   Expected: 200 OK with message "Push already sent"

**Expected Behavior**:
- ✓ All errors return appropriate HTTP status codes
- ✓ Error messages are descriptive
- ✓ No sensitive information in error responses
- ✓ Errors are logged for debugging

### End-to-End Testing Checklist

Use this checklist to verify complete functionality:

- [ ] Secrets are configured correctly
- [ ] Database migrations applied successfully
- [ ] RLS policies updated correctly
- [ ] Edge Function deployed and accessible
- [ ] Dry-run mode works without sending notifications
- [ ] Real notifications are received on test devices
- [ ] Notification content is correct (title, body, data)
- [ ] Tapping notification opens app to correct screen
- [ ] Analytics are tracked correctly
- [ ] Venue rate limiting works
- [ ] User rate limiting works
- [ ] User preferences are respected (enabled/disabled)
- [ ] Quiet hours work correctly
- [ ] Timezone-aware quiet hours work
- [ ] Error cases return appropriate responses
- [ ] Invalid tokens are marked inactive
- [ ] Idempotency works (calling twice doesn't re-send)
- [ ] Logs show detailed information for debugging
- [ ] No errors in Supabase logs
- [ ] Performance is acceptable (< 10s for 1000 users)

---

## Rollback Procedures


**Requirement 10.6**: Complete rollback instructions are provided in [ROLLBACK.md](./ROLLBACK.md).

### Quick Rollback (Emergency)

If you need to immediately stop the Edge Function:

```powershell
# Delete the Edge Function
supabase functions delete send-flash-offer-push --project-ref <your-project-ref>
```

This immediately stops all push notification sending. The app will fall back to simulated backend (if implemented) or show an error.

### Selective Rollback

Roll back specific components:

**Rollback Edge Function Only**:
```powershell
# Checkout previous version
git checkout <previous-commit> -- supabase/functions/send-flash-offer-push/

# Redeploy
cd supabase/functions/scripts
.\deploy-edge-function.ps1 -ProjectRef <your-project-ref>
```

**Rollback RLS Policies Only**:
```powershell
# Restore testing policy
supabase db execute --project-ref <your-project-ref> -c "
DROP POLICY IF EXISTS 'Users can manage own device tokens' ON device_tokens;

CREATE POLICY 'Allow reading device tokens for push notifications (TESTING)'
ON device_tokens FOR SELECT USING (true);
"
```

**Rollback Database Migrations**:
```powershell
# WARNING: This will delete all notification preferences and rate limit data
supabase db execute --project-ref <your-project-ref> -c "
DROP TABLE IF EXISTS flash_offer_rate_limits CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
"
```

### Complete Rollback

For a full rollback to pre-deployment state, see the detailed instructions in [ROLLBACK.md](./ROLLBACK.md).

### Rollback Verification

After rollback, verify:

```powershell
# Check Edge Function status
supabase functions list --project-ref <your-project-ref>

# Check database tables
supabase db execute --project-ref <your-project-ref> -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"

# Check RLS policies
supabase db execute --project-ref <your-project-ref> -c "
SELECT policyname FROM pg_policies 
WHERE tablename = 'device_tokens';
"

# Test flash offer creation in app
# Verify no errors occur
```

---

## Monitoring and Maintenance


### Viewing Logs

**Real-time logs**:
```powershell
# Tail Edge Function logs
supabase functions logs send-flash-offer-push --project-ref <your-project-ref> --tail

# Tail all logs
supabase logs --project-ref <your-project-ref> --tail
```

**Recent logs**:
```powershell
# Last 100 Edge Function logs
supabase functions logs send-flash-offer-push --project-ref <your-project-ref> --limit 100

# Filter for errors
supabase functions logs send-flash-offer-push --project-ref <your-project-ref> | Select-String "ERROR"
```

### Key Metrics to Monitor

Monitor these metrics for the first 48 hours after deployment:

1. **Edge Function Invocation Count**
   - Expected: Matches number of flash offers created
   - Alert if: Zero invocations (integration issue)

2. **Edge Function Error Rate**
   - Expected: < 1%
   - Alert if: > 5%

3. **Edge Function Execution Time**
   - Expected: < 5 seconds for typical offers
   - Alert if: > 25 seconds (approaching timeout)

4. **FCM Send Success Rate**
   - Expected: > 95%
   - Alert if: < 90%

5. **Rate Limit Violations**
   - Expected: < 10 per day
   - Alert if: > 100 per hour

6. **Invalid Token Count**
   - Expected: < 5% of total tokens
   - Alert if: > 20% (indicates token cleanup issue)

### Database Maintenance

**Clean up expired rate limits** (runs automatically, but can be triggered manually):
```sql
SELECT cleanup_expired_rate_limits();
```

**Check rate limit table size**:
```sql
SELECT 
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_records
FROM flash_offer_rate_limits;
```

**Check notification preferences**:
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE flash_offers_enabled = true) as enabled_users,
  COUNT(*) FILTER (WHERE flash_offers_enabled = false) as disabled_users
FROM notification_preferences;
```

### Performance Optimization

If you notice slow performance:

1. **Check database indexes**:
   ```sql
   SELECT * FROM pg_indexes 
   WHERE tablename IN ('notification_preferences', 'flash_offer_rate_limits', 'device_tokens');
   ```

2. **Analyze query performance**:
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM device_tokens 
   WHERE user_id IN (SELECT user_id FROM notification_preferences WHERE flash_offers_enabled = true);
   ```

3. **Monitor connection pool**:
   - Supabase handles connection pooling automatically
   - Check for connection errors in logs

---

## Troubleshooting


### Common Issues and Solutions

#### Issue: "Not logged in" Error

**Symptoms**: Deployment scripts fail with authentication error

**Solution**:
```powershell
# Login to Supabase
supabase login

# Verify login
supabase projects list
```

#### Issue: "Secret not found" Error

**Symptoms**: Edge Function fails to initialize, logs show missing credentials

**Solution**:
```powershell
# List current secrets
supabase secrets list --project-ref <your-project-ref>

# Set missing secrets (see "Configuring Supabase Secrets" section)
supabase secrets set SECRET_NAME='value' --project-ref <your-project-ref>

# Redeploy Edge Function to pick up new secrets
cd supabase/functions/scripts
.\deploy-edge-function.ps1 -ProjectRef <your-project-ref>
```

#### Issue: "Firebase initialization failed" Error

**Symptoms**: Edge Function returns 500 error, logs show Firebase init error

**Possible Causes**:
1. Invalid Firebase service account JSON
2. Malformed JSON (missing quotes, extra commas)
3. Wrong project credentials

**Solution**:
```powershell
# Re-download Firebase service account JSON
# Verify JSON is valid
Get-Content -Path "firebase-adminsdk.json" | ConvertFrom-Json

# Re-set the secret
$firebaseJson = Get-Content -Path "firebase-adminsdk.json" -Raw
supabase secrets set FIREBASE_SERVICE_ACCOUNT="$firebaseJson" --project-ref <your-project-ref>

# Redeploy
cd supabase/functions/scripts
.\deploy-edge-function.ps1 -ProjectRef <your-project-ref>
```

#### Issue: "RLS policy violation" Error

**Symptoms**: Edge Function can't read device tokens, returns 500 error

**Solution**:
```powershell
# Verify Edge Function is using service role key
supabase secrets list --project-ref <your-project-ref>

# Re-run RLS policy update
cd supabase/functions/scripts
.\update-rls-policies.ps1 -ProjectRef <your-project-ref>

# Verify policies
supabase db execute --project-ref <your-project-ref> -c "
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'device_tokens';
"
```

#### Issue: Notifications Not Received

**Symptoms**: Edge Function succeeds but devices don't receive notifications

**Debugging Steps**:

1. **Check FCM credentials**:
   ```powershell
   # Verify Firebase project matches app configuration
   # Check that service account has FCM permissions
   ```

2. **Check device tokens**:
   ```sql
   SELECT COUNT(*) FROM device_tokens WHERE is_active = true;
   ```

3. **Check FCM response**:
   ```powershell
   # View Edge Function logs for FCM errors
   supabase functions logs send-flash-offer-push --project-ref <your-project-ref>
   ```

4. **Test with Firebase Console**:
   - Go to Firebase Console → Cloud Messaging
   - Send a test notification to a specific device token
   - If this fails, issue is with Firebase/device configuration

5. **Check app notification permissions**:
   - Verify app has notification permissions enabled
   - Check device notification settings


#### Issue: High Error Rate

**Symptoms**: Many Edge Function invocations fail

**Debugging Steps**:

1. **Check error patterns**:
   ```powershell
   supabase functions logs send-flash-offer-push --project-ref <your-project-ref> | Select-String "ERROR"
   ```

2. **Common error patterns**:
   - "Offer not found" → Invalid offer IDs being passed
   - "Rate limit exceeded" → Expected behavior, not an error
   - "FCM quota exceeded" → Firebase quota issue
   - "Database error" → Database connectivity or query issue

3. **Check database connectivity**:
   ```powershell
   supabase db execute --project-ref <your-project-ref> -c "SELECT 1;"
   ```

4. **Check Firebase quota**:
   - Go to Firebase Console → Usage and billing
   - Verify FCM quota hasn't been exceeded

#### Issue: Slow Performance

**Symptoms**: Edge Function takes > 10 seconds to complete

**Debugging Steps**:

1. **Check execution time in logs**:
   ```powershell
   supabase functions logs send-flash-offer-push --project-ref <your-project-ref> | Select-String "completed in"
   ```

2. **Identify bottleneck**:
   - Database queries: Check query execution time
   - FCM sending: Check batch sizes and parallel execution
   - Network latency: Check Supabase region vs Firebase region

3. **Optimize database queries**:
   ```sql
   -- Add indexes if missing
   CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active 
   ON device_tokens(user_id, is_active);
   
   CREATE INDEX IF NOT EXISTS idx_notification_prefs_enabled 
   ON notification_preferences(flash_offers_enabled);
   ```

4. **Check for large result sets**:
   - If targeting > 10,000 users, consider pagination
   - Monitor memory usage in logs

#### Issue: Rate Limit Not Working

**Symptoms**: Venues can send unlimited offers

**Debugging Steps**:

1. **Check rate limit table**:
   ```sql
   SELECT * FROM flash_offer_rate_limits 
   WHERE venue_id = '<venue-id>' 
   AND limit_type = 'venue_send'
   ORDER BY created_at DESC;
   ```

2. **Check venue tier**:
   ```sql
   SELECT id, name, subscription_tier FROM venues WHERE id = '<venue-id>';
   ```

3. **Verify rate limit logic**:
   - Check Edge Function logs for rate limit checks
   - Verify tier-based limits are correct

4. **Manual cleanup if needed**:
   ```sql
   DELETE FROM flash_offer_rate_limits WHERE expires_at < NOW();
   ```

---

## Additional Resources

### Documentation

- [Deployment Scripts README](./scripts/README.md) - Detailed script documentation
- [Rollback Instructions](./ROLLBACK.md) - Complete rollback procedures
- [Design Document](../../.kiro/specs/flash-offer-push-backend/design.md) - System architecture
- [Requirements Document](../../.kiro/specs/flash-offer-push-backend/requirements.md) - Feature requirements

### External Documentation

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

### Support

If you encounter issues not covered in this guide:

1. Check [Troubleshooting](#troubleshooting) section
2. Review Edge Function logs for detailed error messages
3. Consult [Supabase Documentation](https://supabase.com/docs)
4. Check [Firebase Documentation](https://firebase.google.com/docs)
5. Contact Supabase support
6. Contact Firebase support

---

## Deployment Checklist

Use this checklist to ensure complete deployment:

### Pre-Deployment

- [ ] Supabase CLI installed and updated
- [ ] PowerShell 5.1+ or PowerShell Core installed
- [ ] Logged in to Supabase CLI (`supabase login`)
- [ ] Project linked (`supabase link --project-ref <ref>`)
- [ ] Firebase service account JSON downloaded
- [ ] Supabase service role key obtained
- [ ] All secrets configured and validated

### Deployment

- [ ] Database migrations applied successfully
- [ ] RLS policies updated successfully
- [ ] Edge Function deployed successfully
- [ ] Deployment verified (function listed, tables exist, policies correct)

### Testing

- [ ] Dry-run mode tested successfully
- [ ] Real notification sent to test device
- [ ] Notification content verified
- [ ] Analytics tracked correctly
- [ ] Rate limiting tested
- [ ] User preferences tested
- [ ] Error cases tested
- [ ] Performance acceptable

### Post-Deployment

- [ ] Monitoring set up
- [ ] Logs reviewed for errors
- [ ] Metrics tracked for 48 hours
- [ ] Team notified of deployment
- [ ] Documentation updated if needed
- [ ] Rollback plan reviewed and ready

---

## Conclusion

This deployment guide provides complete instructions for deploying the Flash Offer Push Notification Backend. Follow the steps carefully, test thoroughly, and monitor closely after deployment.

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or consult the additional resources.

**Next Steps After Deployment**:
1. Monitor logs and metrics for 48 hours
2. Gather user feedback on notification experience
3. Optimize based on performance data
4. Plan for future enhancements (see design document)

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Development Team
