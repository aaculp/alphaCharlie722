# Flash Offer Push Backend - Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Flash Offer Push Notification Backend to production. The deployment includes database migrations, RLS policy updates, Edge Function deployment, and app integration.

**Estimated Time**: 30-45 minutes  
**Downtime**: None (zero-downtime deployment)

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Prerequisites](#prerequisites)
3. [Configuration Setup](#configuration-setup)
4. [Deployment Steps](#deployment-steps)
5. [Verification](#verification)
6. [Monitoring](#monitoring)
7. [Rollback Plan](#rollback-plan)
8. [Post-Deployment](#post-deployment)

---

## Pre-Deployment Checklist

Before starting deployment, ensure you have:

### Required Items

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] PowerShell 5.1+ or PowerShell Core installed
- [ ] Supabase account with production project created
- [ ] Firebase project with Cloud Messaging enabled
- [ ] Firebase service account JSON credentials downloaded
- [ ] Supabase service role key (from project settings)
- [ ] Supabase project URL
- [ ] Git repository with all code committed
- [ ] Backup of current production database (recommended)

### Access Verification

- [ ] Logged into Supabase CLI (`supabase login`)
- [ ] Can access Supabase project dashboard
- [ ] Can access Firebase console
- [ ] Have admin access to production database

### Testing Verification

- [ ] All unit tests passing locally
- [ ] All property-based tests passing locally
- [ ] Edge Function tested locally with dry-run mode
- [ ] End-to-end tests completed successfully
- [ ] Code reviewed and approved

---

## Prerequisites

### 1. Install Supabase CLI

```powershell
# Install globally
npm install -g supabase

# Verify installation
supabase --version
```

### 2. Login to Supabase

```powershell
# Login (opens browser for authentication)
supabase login

# Verify login
supabase projects list
```

### 3. Get Your Project Reference

```powershell
# List your projects to find the project ref
supabase projects list

# Note your project ref (e.g., "abcdefghijklmnop")
```

---

## Configuration Setup

### Step 1: Obtain Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. **IMPORTANT**: Keep this file secure and never commit it to git

### Step 2: Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your production project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)
5. **IMPORTANT**: This key bypasses RLS - keep it secure

### Step 3: Set Supabase Secrets

```powershell
# Set your project ref
$ProjectRef = "your-project-ref-here"

# Set Firebase service account (entire JSON as string)
# Replace the path with your downloaded JSON file
$firebaseJson = Get-Content "path/to/firebase-service-account.json" -Raw
supabase secrets set FIREBASE_SERVICE_ACCOUNT="$firebaseJson" --project-ref $ProjectRef

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" --project-ref $ProjectRef

# Set Supabase URL
supabase secrets set SUPABASE_URL="https://your-project.supabase.co" --project-ref $ProjectRef
```

### Step 4: Validate Secrets

```powershell
# Navigate to scripts directory
cd supabase/functions/scripts

# Validate all secrets are configured
.\validate-secrets.ps1 -ProjectRef $ProjectRef
```

Expected output:
```
[OK] FIREBASE_SERVICE_ACCOUNT is configured
[OK] SUPABASE_SERVICE_ROLE_KEY is configured
[OK] SUPABASE_URL is configured

All required secrets are configured!
```

---

## Deployment Steps

### Option A: One-Command Deployment (Recommended)

```powershell
# Navigate to scripts directory
cd supabase/functions/scripts

# Run complete deployment
.\deploy-all.ps1 -ProjectRef your-project-ref-here
```

This will:
1. Validate all secrets are configured
2. Run database migrations
3. Update RLS policies
4. Deploy Edge Function

### Option B: Step-by-Step Deployment

If you prefer to deploy components individually:

#### Step 1: Run Database Migrations

```powershell
cd supabase/functions/scripts
.\run-migrations.ps1 -ProjectRef your-project-ref-here
```

This creates:
- `notification_preferences` table
- `flash_offer_rate_limits` table
- RLS policies for new tables
- Cleanup functions

#### Step 2: Update RLS Policies

```powershell
.\update-rls-policies.ps1 -ProjectRef your-project-ref-here
```

This:
- Removes testing policies from `device_tokens`
- Applies secure production policies
- Ensures users can only access their own tokens

#### Step 3: Deploy Edge Function

```powershell
.\deploy-edge-function.ps1 -ProjectRef your-project-ref-here
```

This:
- Validates secrets configuration
- Deploys `send-flash-offer-push` function
- Makes it available at `/functions/v1/send-flash-offer-push`

---

## Verification

### Step 1: Verify Database Schema

```powershell
# Check that new tables exist
supabase db execute --project-ref your-project-ref-here -c "
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
--------------------------
 flash_offer_rate_limits
 notification_preferences
```

### Step 2: Verify RLS Policies

```powershell
# Check RLS policies on device_tokens
supabase db execute --project-ref your-project-ref-here -c "
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'device_tokens'
ORDER BY policyname;
"
```

Expected output should show:
- `Users can manage own device tokens` policy
- NO testing policies

### Step 3: Test Edge Function with Dry-Run

```powershell
# Get a test JWT token from your app or Supabase dashboard
$jwt = "your-jwt-token-here"

# Get a test offer ID from your database
$offerId = "test-offer-id-here"

# Test with dry-run (doesn't send actual notifications)
curl -X POST "https://your-project.supabase.co/functions/v1/send-flash-offer-push" `
  -H "Authorization: Bearer $jwt" `
  -H "Content-Type: application/json" `
  -d "{\"offerId\": \"$offerId\", \"dryRun\": true}"
```

Expected response:
```json
{
  "success": true,
  "targetedUserCount": 10,
  "sentCount": 10,
  "failedCount": 0,
  "errors": [],
  "dryRun": true
}
```

### Step 4: Check Edge Function Logs

```powershell
# View recent logs
supabase functions logs send-flash-offer-push --project-ref your-project-ref-here

# View real-time logs (Ctrl+C to stop)
supabase functions logs send-flash-offer-push --project-ref your-project-ref-here --tail
```

Look for:
- No error messages
- Successful initialization
- Correct environment variable loading

---

## Monitoring

### Set Up Monitoring

1. **Edge Function Metrics**
   - Go to Supabase Dashboard → Functions → send-flash-offer-push
   - Monitor invocation count, error rate, execution time

2. **Database Monitoring**
   - Monitor `flash_offer_rate_limits` table growth
   - Set up alerts for unusual rate limit violations

3. **Log Monitoring**
   ```powershell
   # Monitor logs for errors
   supabase functions logs send-flash-offer-push --project-ref your-project-ref-here --tail
   ```

### Key Metrics to Watch

- **Error Rate**: Should be < 5%
- **Execution Time**: Should be < 10 seconds for most requests
- **FCM Success Rate**: Should be > 90%
- **Rate Limit Violations**: Monitor for abuse patterns

### Alert Thresholds

Set up alerts for:
- Error rate > 5% over 5 minutes
- Execution time > 25 seconds
- FCM failure rate > 10%
- Rate limit violations > 100/hour

---

## Rollback Plan

If issues occur, follow the [Rollback Instructions](supabase/functions/ROLLBACK.md).

### Quick Rollback (Emergency)

```powershell
# Delete Edge Function immediately
supabase functions delete send-flash-offer-push --project-ref your-project-ref-here
```

This stops all Edge Function processing while you investigate.

### Complete Rollback

See [ROLLBACK.md](supabase/functions/ROLLBACK.md) for detailed instructions on:
- Rolling back Edge Function
- Rolling back RLS policies
- Rolling back database migrations
- Reverting app changes

---

## Post-Deployment

### Step 1: Deploy App Updates

Now that the backend is deployed, update your React Native app:

1. **Update FCMService** to use Edge Function (should already be done)
2. **Test in staging** with real devices
3. **Deploy to production**:
   - iOS: Submit to App Store
   - Android: Submit to Google Play
   - Or use OTA update (Expo, CodePush)

### Step 2: Gradual Rollout (Recommended)

Consider a gradual rollout:

1. **Day 1**: Enable for 10% of users
2. **Day 2**: Monitor metrics, increase to 25%
3. **Day 3**: Monitor metrics, increase to 50%
4. **Day 4**: Monitor metrics, increase to 100%

Use feature flags to control rollout percentage.

### Step 3: Monitor for 48 Hours

Closely monitor for the first 48 hours:

- Check logs every 4 hours
- Monitor error rates
- Watch for user complaints
- Track FCM delivery rates
- Monitor rate limit violations

### Step 4: Create Default Preferences for Existing Users

Run a migration to create default notification preferences for existing users:

```sql
-- Create default preferences for users who don't have them
INSERT INTO notification_preferences (user_id, flash_offers_enabled)
SELECT id, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences);
```

### Step 5: Update Documentation

- [ ] Update internal documentation with deployment date
- [ ] Document any issues encountered and solutions
- [ ] Update runbooks with production-specific details
- [ ] Share deployment summary with team

---

## Troubleshooting

### Issue: Secrets Validation Fails

**Symptom**: `validate-secrets.ps1` reports missing secrets

**Solution**:
```powershell
# List current secrets
supabase secrets list --project-ref your-project-ref-here

# Set missing secrets
supabase secrets set SECRET_NAME="value" --project-ref your-project-ref-here
```

### Issue: Migration Fails

**Symptom**: `run-migrations.ps1` fails with SQL error

**Solution**:
1. Check if tables already exist
2. Review migration file for syntax errors
3. Check database logs for detailed error
4. If tables exist, migration may have already run

### Issue: Edge Function Deployment Fails

**Symptom**: `deploy-edge-function.ps1` fails

**Solution**:
```powershell
# Check if logged in
supabase login

# Verify project ref
supabase projects list

# Check for syntax errors in function code
cd supabase/functions/send-flash-offer-push
deno check index.ts
```

### Issue: Edge Function Returns 500 Error

**Symptom**: Test request returns 500 Internal Server Error

**Solution**:
1. Check Edge Function logs for error details
2. Verify all secrets are set correctly
3. Verify Firebase service account JSON is valid
4. Check database connectivity

### Issue: RLS Policy Blocks Edge Function

**Symptom**: Edge Function can't read device tokens

**Solution**:
- Edge Function should use service role key (bypasses RLS)
- Verify `SUPABASE_SERVICE_ROLE_KEY` secret is set correctly
- Check that Edge Function initializes Supabase client with service role key

---

## Success Criteria

Deployment is successful when:

- [ ] All deployment scripts complete without errors
- [ ] Database tables created successfully
- [ ] RLS policies applied correctly
- [ ] Edge Function deployed and accessible
- [ ] Dry-run test returns successful response
- [ ] No errors in Edge Function logs
- [ ] App can call Edge Function successfully
- [ ] Real notifications are delivered to test devices
- [ ] Rate limiting works correctly
- [ ] User preferences are respected
- [ ] Analytics are tracked correctly

---

## Next Steps

After successful deployment:

1. **Monitor Closely**: Watch logs and metrics for 48 hours
2. **Gather Feedback**: Collect user feedback on notification experience
3. **Optimize**: Adjust rate limits based on usage patterns
4. **Scale**: Monitor performance and scale if needed
5. **Iterate**: Plan next features (scheduled notifications, A/B testing, etc.)

---

## Support

If you encounter issues:

1. **Check Logs**: Review Edge Function and database logs
2. **Review Documentation**: Check design and requirements docs
3. **Rollback**: Use rollback instructions if needed
4. **Contact Support**: Reach out to Supabase support if needed

---

## Related Documentation

- [Deployment Scripts README](supabase/functions/scripts/README.md)
- [Rollback Instructions](supabase/functions/ROLLBACK.md)
- [Design Document](.kiro/specs/flash-offer-push-backend/design.md)
- [Requirements Document](.kiro/specs/flash-offer-push-backend/requirements.md)
- [Tasks Document](.kiro/specs/flash-offer-push-backend/tasks.md)

---

## Deployment History

Keep a record of deployments:

| Date | Version | Deployed By | Status | Notes |
|------|---------|-------------|--------|-------|
| YYYY-MM-DD | v1.0.0 | Your Name | Success | Initial production deployment |

