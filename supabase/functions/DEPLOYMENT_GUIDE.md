# Flash Offer Push Backend - Deployment Guide

## Quick Start

### Prerequisites
- Supabase CLI installed
- PowerShell 5.1+ or PowerShell Core
- Supabase account and project
- Firebase service account credentials
- Logged in: `supabase login`

### One-Command Deployment

```powershell
cd supabase/functions/scripts
.\deploy-all.ps1 -ProjectRef <your-project-ref>
```

This deploys:
1. Database migrations (notification_preferences, flash_offer_rate_limits)
2. RLS policies (secure device_tokens access)
3. Edge Function (send-flash-offer-push)

## Configuration

### Set Required Secrets

```powershell
# Firebase service account (entire JSON)
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='eyJhbGc...'

# Supabase URL
supabase secrets set SUPABASE_URL='https://your-project.supabase.co'
```

## Testing

```powershell
# Test with dry-run
curl -X POST https://<project>.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "<offer-id>", "dryRun": true}'
```

## Documentation

- [Deployment Scripts](./scripts/README.md) - Detailed script documentation
- [Rollback Instructions](./ROLLBACK.md) - How to rollback if issues occur
- [Design Document](../../.kiro/specs/flash-offer-push-backend/design.md)
- [Requirements](../../.kiro/specs/flash-offer-push-backend/requirements.md)
