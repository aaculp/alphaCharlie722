# Deployment Scripts

This directory contains PowerShell scripts for deploying the Flash Offer Push Notification Backend to Supabase.

## Overview

The deployment consists of four main components:

1. **Secrets Configuration** - Firebase and Supabase credentials
2. **Database Migrations** - Tables for notification preferences and rate limits
3. **RLS Policies** - Security policies for database access
4. **Edge Function** - Serverless function for sending push notifications

## Prerequisites

Before running these scripts, ensure you have:

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- PowerShell 5.1 or later (Windows) or PowerShell Core (cross-platform)
- Supabase account and project created
- Firebase project with service account credentials
- Logged in to Supabase CLI: `supabase login`

## Quick Start

### Complete Deployment (Recommended)

Deploy everything in one command:

```powershell
cd supabase/functions/scripts
.\deploy-all.ps1 -ProjectRef <your-project-ref>
```

This will:
1. Validate all required secrets are configured
2. Run database migrations
3. Update RLS policies
4. Deploy the Edge Function

### Local Development

For local testing with Supabase local development:

```powershell
# Start local Supabase
supabase start

# Run migrations locally
.\run-migrations.ps1 -Local

# Update RLS policies locally
.\update-rls-policies.ps1 -Local

# Deploy Edge Function locally
.\deploy-edge-function.ps1 -Local -NoVerifyJWT
```

## Individual Scripts

### 1. validate-secrets.ps1

Validates that all required Supabase secrets are configured.

**Usage:**
```powershell
# Remote validation
.\validate-secrets.ps1 -ProjectRef <your-project-ref>

# Local validation (checks .env file)
.\validate-secrets.ps1 -Local
```

**Required Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_URL` - Supabase project URL

**Setting Secrets:**
```powershell
# Set Firebase service account (entire JSON as string)
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='eyJhbGc...'

# Set Supabase URL
supabase secrets set SUPABASE_URL='https://your-project.supabase.co'
```

### 2. run-migrations.ps1

Runs database migrations to create required tables and functions.

**Usage:**
```powershell
# Remote migration
.\run-migrations.ps1 -ProjectRef <your-project-ref>

# Local migration
.\run-migrations.ps1 -Local

# Custom migration file
.\run-migrations.ps1 -ProjectRef <your-project-ref> -MigrationFile "path/to/migration.sql"
```

**What it creates:**
- `notification_preferences` table - User notification settings
- `flash_offer_rate_limits` table - Rate limiting counters
- `cleanup_expired_rate_limits()` function - Cleanup expired counters
- `update_notification_preferences_updated_at()` function - Auto-update timestamp

### 3. update-rls-policies.ps1

Updates Row Level Security (RLS) policies for the device_tokens table.

**Usage:**
```powershell
# Remote update
.\update-rls-policies.ps1 -ProjectRef <your-project-ref>

# Local update
.\update-rls-policies.ps1 -Local
```

**What it does:**
- Removes permissive testing policy
- Creates secure policy: Users can only access their own tokens
- Edge Function uses service role key to bypass RLS

### 4. deploy-edge-function.ps1

Deploys the Edge Function to Supabase.

**Usage:**
```powershell
# Remote deployment
.\deploy-edge-function.ps1 -ProjectRef <your-project-ref>

# Local deployment
.\deploy-edge-function.ps1 -Local

# Skip secret validation (if already validated)
.\deploy-edge-function.ps1 -ProjectRef <your-project-ref> -SkipValidation

# Disable JWT verification (testing only)
.\deploy-edge-function.ps1 -Local -NoVerifyJWT
```

**Function Endpoint:**
- Remote: `https://<your-project>.supabase.co/functions/v1/send-flash-offer-push`
- Local: `http://localhost:54321/functions/v1/send-flash-offer-push`

### 5. deploy-all.ps1

Runs all deployment steps in order.

**Usage:**
```powershell
# Full deployment
.\deploy-all.ps1 -ProjectRef <your-project-ref>

# Skip specific steps
.\deploy-all.ps1 -ProjectRef <your-project-ref> -SkipMigrations
.\deploy-all.ps1 -ProjectRef <your-project-ref> -SkipRLS
.\deploy-all.ps1 -ProjectRef <your-project-ref> -SkipFunction
```

## Configuration

### Getting Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Copy the entire JSON content as a string for the secret

### Getting Supabase Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Project Settings → API
4. Copy the `service_role` key (NOT the `anon` key)
5. Use this key for the `SUPABASE_SERVICE_ROLE_KEY` secret

### Getting Project Reference

Your project reference is in the Supabase project URL:
```
https://app.supabase.com/project/<project-ref>
```

Or get it from the CLI:
```powershell
supabase projects list
```

## Testing

### Test Edge Function Locally

```powershell
# Start local Supabase
supabase start

# Deploy function locally
.\deploy-edge-function.ps1 -Local -NoVerifyJWT

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push `
  -H "Content-Type: application/json" `
  -d '{"offerId": "test-offer-id", "dryRun": true}'
```

### Test Edge Function Remotely

```powershell
# Get a JWT token from your app or Supabase dashboard

# Test with dry-run
curl -X POST https://<your-project>.supabase.co/functions/v1/send-flash-offer-push `
  -H "Authorization: Bearer <jwt-token>" `
  -H "Content-Type: application/json" `
  -d '{"offerId": "<real-offer-id>", "dryRun": true}'
```

### View Logs

```powershell
# View Edge Function logs
supabase functions logs send-flash-offer-push --project-ref <your-project-ref>

# Tail logs in real-time
supabase functions logs send-flash-offer-push --project-ref <your-project-ref> --tail

# View database logs
supabase logs --project-ref <your-project-ref>
```

## Troubleshooting

### "Not logged in" Error

```powershell
# Login to Supabase
supabase login
```

### "Project not found" Error

```powershell
# List your projects to get the correct project ref
supabase projects list

# Link to the correct project
supabase link --project-ref <your-project-ref>
```

### "Secret not found" Error

```powershell
# List current secrets
supabase secrets list --project-ref <your-project-ref>

# Set missing secrets
supabase secrets set SECRET_NAME='value' --project-ref <your-project-ref>
```

### "Migration already applied" Error

This is usually safe to ignore if the tables already exist. To verify:

```powershell
# Check if tables exist
supabase db execute --project-ref <your-project-ref> -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notification_preferences', 'flash_offer_rate_limits');
"
```

### "Function deployment failed" Error

Check for syntax errors in the function code:

```powershell
# View detailed error logs
supabase functions logs send-flash-offer-push --project-ref <your-project-ref>

# Verify function code compiles
deno check supabase/functions/send-flash-offer-push/index.ts
```

## Rollback

If deployment fails or issues occur, see [ROLLBACK.md](../ROLLBACK.md) for detailed rollback instructions.

Quick rollback:
```powershell
# Delete the Edge Function
supabase functions delete send-flash-offer-push --project-ref <your-project-ref>
```

## Monitoring

After deployment, monitor the system using the dedicated monitoring script:

### 6. monitor-edge-function.ps1

Monitors Edge Function metrics and triggers alerts when thresholds are exceeded.

**Usage:**
```powershell
# Single check
.\monitor-edge-function.ps1 -ProjectRef <your-project-ref>

# Continuous monitoring (every 60 seconds)
.\monitor-edge-function.ps1 -ProjectRef <your-project-ref> -Continuous -IntervalSeconds 60

# Custom log limit
.\monitor-edge-function.ps1 -ProjectRef <your-project-ref> -LogLimit 1000
```

**Monitored Metrics:**
- Error rate (threshold: 5%)
- Execution time (threshold: 25 seconds)
- FCM failure rate (threshold: 10%)
- Rate limit violations (threshold: 100 per hour)

**Alert Levels:**
- `[INFO]` - Informational messages
- `[WARNING]` - Threshold exceeded, requires attention
- `[CRITICAL]` - Critical issue, immediate action required

### Manual Monitoring

```powershell
# Watch Edge Function logs
supabase functions logs send-flash-offer-push --project-ref <your-project-ref> --tail

# Check for errors
supabase logs --project-ref <your-project-ref> | Select-String "ERROR"

# Check for alerts
supabase functions logs send-flash-offer-push --project-ref <your-project-ref> | Select-String "\[ALERT\]"

# Monitor execution time
supabase functions logs send-flash-offer-push --project-ref <your-project-ref> | Select-String "completed in"
```

For detailed monitoring setup, see [MONITORING_SETUP.md](../send-flash-offer-push/MONITORING_SETUP.md)

## Best Practices

1. **Test Locally First**: Always test deployments locally before production
2. **Use Dry-Run**: Test Edge Function with `dryRun: true` before real sends
3. **Monitor Closely**: Watch logs for first 24-48 hours after deployment
4. **Backup Data**: Export critical data before running migrations
5. **Version Control**: Tag releases for easy rollback
6. **Gradual Rollout**: Use feature flags for gradual rollout to users

## Related Documentation

- [Rollback Instructions](../ROLLBACK.md)
- [Design Document](../../../.kiro/specs/flash-offer-push-backend/design.md)
- [Requirements Document](../../../.kiro/specs/flash-offer-push-backend/requirements.md)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Edge Functions Documentation](https://supabase.com/docs/guides/functions)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [ROLLBACK.md](../ROLLBACK.md) for rollback procedures
3. Check Supabase logs for detailed error messages
4. Consult [Supabase Documentation](https://supabase.com/docs)
5. Contact Supabase support if needed
