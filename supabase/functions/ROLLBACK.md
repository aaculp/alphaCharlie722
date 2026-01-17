# Rollback Instructions

This document provides step-by-step instructions for rolling back the Flash Offer Push Notification Backend deployment if issues occur.

## Table of Contents

1. [Quick Rollback (Emergency)](#quick-rollback-emergency)
2. [Selective Rollback](#selective-rollback)
3. [Complete Rollback](#complete-rollback)
4. [Verification Steps](#verification-steps)
5. [Common Issues](#common-issues)

---

## Quick Rollback (Emergency)

If you need to immediately stop the Edge Function from processing requests:

### Option 1: Disable the Edge Function

```powershell
# Delete the Edge Function (can be redeployed later)
supabase functions delete send-flash-offer-push --project-ref <your-project-ref>
```

### Option 2: Revert to Previous Version

```powershell
# Checkout previous commit
git checkout <previous-commit-hash>

# Redeploy the previous version
cd supabase/functions/scripts
.\deploy-edge-function.ps1 -ProjectRef <your-project-ref>
```

### Option 3: Use Feature Flag (if implemented)

If your React Native app has a feature flag for the Edge Function:

1. Disable the feature flag in your app configuration
2. Deploy an OTA update to revert to simulated backend
3. This allows immediate rollback without backend changes

---

## Selective Rollback

Roll back specific components while keeping others deployed.

### Rollback Edge Function Only

```powershell
# 1. Checkout previous Edge Function code
git checkout <previous-commit-hash> -- supabase/functions/send-flash-offer-push/

# 2. Redeploy the previous version
cd supabase/functions/scripts
.\deploy-edge-function.ps1 -ProjectRef <your-project-ref>

# 3. Verify deployment
supabase functions logs send-flash-offer-push --project-ref <your-project-ref>
```

### Rollback RLS Policies Only

```powershell
# Create a SQL file to restore testing policy
$rollbackSql = @"
-- Restore testing policy for device_tokens
DROP POLICY IF EXISTS "Users can manage own device tokens" ON device_tokens;

CREATE POLICY "Allow reading device tokens for push notifications (TESTING)"
ON device_tokens
FOR SELECT
USING (true);
"@

# Save to file
$rollbackSql | Out-File -FilePath rollback_rls.sql -Encoding UTF8

# Execute rollback
supabase db execute -f rollback_rls.sql --project-ref <your-project-ref>

# Clean up
Remove-Item rollback_rls.sql
```

### Rollback Database Migrations Only

**WARNING**: Rolling back migrations may cause data loss if users have already created notification preferences or rate limit data.

```powershell
# Create rollback migration
$rollbackMigration = @"
-- Rollback notification preferences and rate limits

-- Drop triggers
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;

-- Drop functions
DROP FUNCTION IF EXISTS update_notification_preferences_updated_at();
DROP FUNCTION IF EXISTS cleanup_expired_rate_limits();

-- Drop policies
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "No direct access to rate limits" ON flash_offer_rate_limits;

-- Drop tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS flash_offer_rate_limits;
DROP TABLE IF EXISTS notification_preferences;
"@

# Save to file
$rollbackMigration | Out-File -FilePath rollback_migration.sql -Encoding UTF8

# Execute rollback
supabase db execute -f rollback_migration.sql --project-ref <your-project-ref>

# Clean up
Remove-Item rollback_migration.sql
```

---

## Complete Rollback

Roll back all components to pre-deployment state.

### Step 1: Disable Edge Function

```powershell
# Delete the Edge Function
supabase functions delete send-flash-offer-push --project-ref <your-project-ref>
```

### Step 2: Restore RLS Policies

```powershell
# Run the RLS rollback script from "Rollback RLS Policies Only" section above
```

### Step 3: Rollback Database Migrations

```powershell
# Run the migration rollback script from "Rollback Database Migrations Only" section above
```

### Step 4: Verify Rollback

```powershell
# Check that Edge Function is deleted
supabase functions list --project-ref <your-project-ref>

# Check database tables
supabase db execute --project-ref <your-project-ref> -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notification_preferences', 'flash_offer_rate_limits');
"

# Check RLS policies
supabase db execute --project-ref <your-project-ref> -c "
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'device_tokens';
"
```

### Step 5: Revert App Changes

If you deployed React Native app changes:

1. Revert the FCMService changes that call the Edge Function
2. Restore the simulated backend code
3. Deploy app update (OTA or app store)

---

## Verification Steps

After rollback, verify the system is working correctly:

### 1. Test Flash Offer Creation

```powershell
# Create a test flash offer in the app
# Verify it uses the simulated backend (if rolled back completely)
# Check that no errors occur
```

### 2. Check Database State

```powershell
# Verify tables exist or don't exist as expected
supabase db execute --project-ref <your-project-ref> -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"
```

### 3. Check RLS Policies

```powershell
# Verify RLS policies are correct
supabase db execute --project-ref <your-project-ref> -c "
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename IN ('device_tokens', 'notification_preferences', 'flash_offer_rate_limits')
ORDER BY tablename, policyname;
"
```

### 4. Monitor Logs

```powershell
# Check for any errors in Supabase logs
supabase logs --project-ref <your-project-ref>

# If Edge Function still exists, check its logs
supabase functions logs send-flash-offer-push --project-ref <your-project-ref>
```

---

## Common Issues

### Issue: Edge Function Still Receiving Requests After Deletion

**Cause**: Client apps still have the old code that calls the Edge Function.

**Solution**:
1. Deploy an app update that reverts to simulated backend
2. Use OTA update for immediate rollback
3. Monitor error logs to ensure no more requests

### Issue: RLS Policy Prevents Users from Managing Tokens

**Cause**: Incorrect RLS policy after rollback.

**Solution**:
```sql
-- Ensure users can manage their own tokens
DROP POLICY IF EXISTS "Users can manage own device tokens" ON device_tokens;

CREATE POLICY "Users can manage own device tokens"
ON device_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Issue: Migration Rollback Fails Due to Dependencies

**Cause**: Other tables or functions depend on the tables being dropped.

**Solution**:
```sql
-- Drop with CASCADE to remove dependencies
DROP TABLE IF EXISTS flash_offer_rate_limits CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
```

### Issue: Data Loss After Migration Rollback

**Cause**: Dropping tables deletes all data.

**Solution**:
1. **Before rollback**: Export data
   ```sql
   COPY notification_preferences TO '/tmp/notification_preferences_backup.csv' CSV HEADER;
   COPY flash_offer_rate_limits TO '/tmp/flash_offer_rate_limits_backup.csv' CSV HEADER;
   ```

2. **After rollback**: If you need to restore, recreate tables and import data

### Issue: Edge Function Deployment Fails After Rollback

**Cause**: Cached deployment state or syntax errors.

**Solution**:
1. Clear local cache: `supabase functions delete send-flash-offer-push --project-ref <your-project-ref>`
2. Verify code syntax: Check for TypeScript errors
3. Redeploy: `.\deploy-edge-function.ps1 -ProjectRef <your-project-ref>`

---

## Rollback Checklist

Use this checklist to ensure complete rollback:

- [ ] Edge Function deleted or reverted
- [ ] RLS policies restored to previous state
- [ ] Database migrations rolled back (if needed)
- [ ] App code reverted to use simulated backend
- [ ] App update deployed (OTA or store)
- [ ] Database state verified
- [ ] RLS policies verified
- [ ] No errors in logs
- [ ] Test flash offer creation works
- [ ] Monitor for 24 hours to ensure stability

---

## Getting Help

If you encounter issues during rollback:

1. **Check Logs**: Review Supabase logs for error details
2. **Database State**: Verify database schema and policies
3. **App State**: Ensure app is using correct backend
4. **Documentation**: Review deployment documentation
5. **Support**: Contact Supabase support if needed

---

## Prevention

To minimize the need for rollbacks in the future:

1. **Test Locally First**: Always test deployments locally before production
2. **Use Staging**: Deploy to staging environment first
3. **Gradual Rollout**: Use feature flags for gradual rollout
4. **Monitor Closely**: Watch logs and metrics for first 48 hours
5. **Backup Data**: Export critical data before migrations
6. **Document Changes**: Keep detailed deployment notes
7. **Version Control**: Tag releases for easy rollback

---

## Related Documentation

- [Deployment Scripts](./scripts/README.md)
- [Design Document](../.kiro/specs/flash-offer-push-backend/design.md)
- [Requirements Document](../.kiro/specs/flash-offer-push-backend/requirements.md)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
