# Production Deployment Checklist

Use this checklist to ensure all steps are completed for production deployment of the Flash Offer Push Notification Backend.

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Project Ref**: _______________

---

## Pre-Deployment Phase

### Environment Setup
- [ ] Supabase CLI installed and updated to latest version
- [ ] PowerShell 5.1+ or PowerShell Core available
- [ ] Git repository is up to date with latest code
- [ ] All code changes committed and pushed
- [ ] Created deployment branch or tag (e.g., `v1.0.0-production`)

### Access & Credentials
- [ ] Logged into Supabase CLI (`supabase login`)
- [ ] Can access Supabase production project dashboard
- [ ] Can access Firebase console
- [ ] Have Firebase service account JSON file downloaded
- [ ] Have Supabase service role key copied
- [ ] Have Supabase project URL noted
- [ ] Project reference ID confirmed: _______________

### Testing Verification
- [ ] All unit tests passing locally
- [ ] All property-based tests passing locally
- [ ] Edge Function tested locally with `supabase start`
- [ ] Dry-run mode tested successfully
- [ ] End-to-end tests completed
- [ ] Code review completed and approved
- [ ] No known critical bugs

### Backup & Safety
- [ ] Production database backup created
- [ ] Rollback plan reviewed and understood
- [ ] Team notified of deployment window
- [ ] Monitoring dashboard prepared
- [ ] Support team on standby (if applicable)

---

## Configuration Phase

### Secrets Configuration
- [ ] Firebase service account JSON obtained
- [ ] `FIREBASE_SERVICE_ACCOUNT` secret set in Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret set in Supabase
- [ ] `SUPABASE_URL` secret set in Supabase
- [ ] Secrets validated with `validate-secrets.ps1`
- [ ] All secrets confirmed working

### Verification
```powershell
# Run this command and check all boxes above
cd supabase/functions/scripts
.\validate-secrets.ps1 -ProjectRef <your-project-ref>
```

---

## Deployment Phase

### Database Migrations
- [ ] Migration file reviewed: `017_notification_preferences_and_rate_limits.sql`
- [ ] Migration executed: `.\run-migrations.ps1 -ProjectRef <ref>`
- [ ] Migration completed without errors
- [ ] `notification_preferences` table created
- [ ] `flash_offer_rate_limits` table created
- [ ] Indexes created successfully
- [ ] Functions created successfully
- [ ] Migration verified in database

### RLS Policy Updates
- [ ] RLS policy script reviewed: `update-rls-policies.ps1`
- [ ] RLS policies executed: `.\update-rls-policies.ps1 -ProjectRef <ref>`
- [ ] Testing policy removed from `device_tokens`
- [ ] Secure policy applied to `device_tokens`
- [ ] RLS policies verified in database
- [ ] No RLS policy errors in logs

### Edge Function Deployment
- [ ] Edge Function code reviewed
- [ ] Edge Function deployed: `.\deploy-edge-function.ps1 -ProjectRef <ref>`
- [ ] Deployment completed without errors
- [ ] Function appears in Supabase dashboard
- [ ] Function URL accessible
- [ ] Function logs show successful initialization

### Complete Deployment (Alternative)
If using one-command deployment:
- [ ] Complete deployment executed: `.\deploy-all.ps1 -ProjectRef <ref>`
- [ ] All steps completed successfully
- [ ] No errors in deployment output

---

## Verification Phase

### Database Verification
- [ ] `notification_preferences` table exists
- [ ] `flash_offer_rate_limits` table exists
- [ ] RLS policies correct on `device_tokens`
- [ ] RLS policies correct on `notification_preferences`
- [ ] RLS policies correct on `flash_offer_rate_limits`
- [ ] Indexes created on all tables
- [ ] Functions exist and are callable

```sql
-- Run these queries to verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notification_preferences', 'flash_offer_rate_limits');

SELECT policyname FROM pg_policies WHERE tablename = 'device_tokens';
```

### Edge Function Verification
- [ ] Function listed in `supabase functions list`
- [ ] Function URL accessible
- [ ] Function logs show no errors
- [ ] Environment variables loaded correctly
- [ ] Firebase Admin SDK initialized successfully

### Dry-Run Test
- [ ] Test JWT token obtained
- [ ] Test offer ID obtained
- [ ] Dry-run request sent successfully
- [ ] Response received with correct format
- [ ] No errors in response
- [ ] Logs show successful dry-run execution

```powershell
# Test command
curl -X POST "https://<project>.supabase.co/functions/v1/send-flash-offer-push" `
  -H "Authorization: Bearer <jwt>" `
  -H "Content-Type: application/json" `
  -d "{\"offerId\": \"<offer-id>\", \"dryRun\": true}"
```

### Real Notification Test
- [ ] Test user account created
- [ ] Test device token registered
- [ ] Test flash offer created
- [ ] Real notification sent (not dry-run)
- [ ] Notification received on test device
- [ ] Analytics tracked correctly
- [ ] Rate limits working correctly
- [ ] No errors in logs

---

## Post-Deployment Phase

### Monitoring Setup
- [ ] Edge Function metrics dashboard opened
- [ ] Database monitoring enabled
- [ ] Log monitoring configured
- [ ] Alert thresholds configured:
  - [ ] Error rate > 5%
  - [ ] Execution time > 25s
  - [ ] FCM failure rate > 10%
  - [ ] Rate limit violations > 100/hour

### Initial Monitoring (First Hour)
- [ ] No errors in Edge Function logs
- [ ] No database errors
- [ ] No RLS policy violations
- [ ] FCM success rate > 90%
- [ ] Execution time < 10 seconds average
- [ ] No user complaints

### App Deployment
- [ ] React Native app updated to use Edge Function
- [ ] App tested in staging environment
- [ ] App deployed to production:
  - [ ] iOS App Store (if applicable)
  - [ ] Google Play Store (if applicable)
  - [ ] OTA update (if applicable)
- [ ] App update verified working
- [ ] Users receiving notifications correctly

### Data Migration
- [ ] Default preferences created for existing users
- [ ] All existing users have notification preferences
- [ ] No users blocked from receiving notifications
- [ ] Preferences UI working correctly

```sql
-- Create default preferences for existing users
INSERT INTO notification_preferences (user_id, flash_offers_enabled)
SELECT id, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences);
```

---

## Monitoring Phase (First 48 Hours)

### Hour 1-4
- [ ] Logs checked for errors
- [ ] Metrics reviewed
- [ ] No critical issues
- [ ] Notes: _______________

### Hour 4-8
- [ ] Logs checked for errors
- [ ] Metrics reviewed
- [ ] No critical issues
- [ ] Notes: _______________

### Hour 8-12
- [ ] Logs checked for errors
- [ ] Metrics reviewed
- [ ] No critical issues
- [ ] Notes: _______________

### Hour 12-24
- [ ] Logs checked for errors
- [ ] Metrics reviewed
- [ ] No critical issues
- [ ] Notes: _______________

### Hour 24-48
- [ ] Logs checked for errors
- [ ] Metrics reviewed
- [ ] No critical issues
- [ ] Notes: _______________

### Key Metrics (Record at each checkpoint)

| Time | Invocations | Error Rate | Avg Exec Time | FCM Success Rate | Notes |
|------|-------------|------------|---------------|------------------|-------|
| +1h  |             |            |               |                  |       |
| +4h  |             |            |               |                  |       |
| +8h  |             |            |               |                  |       |
| +12h |             |            |               |                  |       |
| +24h |             |            |               |                  |       |
| +48h |             |            |               |                  |       |

---

## Issue Tracking

### Issues Encountered

| Time | Issue | Severity | Resolution | Status |
|------|-------|----------|------------|--------|
|      |       |          |            |        |
|      |       |          |            |        |
|      |       |          |            |        |

### Rollback Performed?
- [ ] No rollback needed
- [ ] Partial rollback performed
- [ ] Complete rollback performed

If rollback performed, document:
- **Reason**: _______________
- **Components rolled back**: _______________
- **Time to rollback**: _______________
- **Impact**: _______________

---

## Documentation Phase

### Documentation Updates
- [ ] Deployment date recorded in documentation
- [ ] Issues and resolutions documented
- [ ] Runbooks updated with production details
- [ ] Team notified of successful deployment
- [ ] Deployment summary shared
- [ ] Lessons learned documented

### Knowledge Transfer
- [ ] Support team briefed on new features
- [ ] Troubleshooting guide updated
- [ ] Monitoring procedures documented
- [ ] Escalation procedures updated

---

## Sign-Off

### Deployment Team

**Deployed By**: _______________  
**Date**: _______________  
**Signature**: _______________

**Reviewed By**: _______________  
**Date**: _______________  
**Signature**: _______________

### Deployment Status

- [ ] **SUCCESS** - All checks passed, system operating normally
- [ ] **SUCCESS WITH ISSUES** - Deployed but minor issues noted
- [ ] **PARTIAL** - Some components deployed, others rolled back
- [ ] **FAILED** - Deployment rolled back completely

### Final Notes

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

---

## Next Steps

- [ ] Continue monitoring for 7 days
- [ ] Gather user feedback
- [ ] Optimize based on metrics
- [ ] Plan next iteration
- [ ] Schedule retrospective meeting

---

## Appendix: Quick Reference Commands

### View Logs
```powershell
supabase functions logs send-flash-offer-push --project-ref <ref> --tail
```

### Check Function Status
```powershell
supabase functions list --project-ref <ref>
```

### Test Edge Function
```powershell
curl -X POST "https://<project>.supabase.co/functions/v1/send-flash-offer-push" `
  -H "Authorization: Bearer <jwt>" `
  -H "Content-Type: application/json" `
  -d "{\"offerId\": \"<offer-id>\", \"dryRun\": true}"
```

### Emergency Rollback
```powershell
supabase functions delete send-flash-offer-push --project-ref <ref>
```

### Check Database Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check RLS Policies
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('device_tokens', 'notification_preferences', 'flash_offer_rate_limits')
ORDER BY tablename, policyname;
```

---

**End of Checklist**

