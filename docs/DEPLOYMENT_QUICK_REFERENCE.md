# Production Deployment - Quick Reference Card

## 🚀 One-Command Deployment

```powershell
cd supabase/functions/scripts
.\deploy-all.ps1 -ProjectRef <your-project-ref>
```

---

## 📋 Prerequisites Checklist

- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Logged in: `supabase login`
- [ ] Project ref ready: `supabase projects list`
- [ ] Firebase service account JSON downloaded
- [ ] Supabase service role key copied

---

## 🔐 Set Secrets

```powershell
$ProjectRef = "your-project-ref"

# Firebase service account
$firebaseJson = Get-Content "path/to/firebase-service-account.json" -Raw
supabase secrets set FIREBASE_SERVICE_ACCOUNT="$firebaseJson" --project-ref $ProjectRef

# Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-key" --project-ref $ProjectRef

# Supabase URL
supabase secrets set SUPABASE_URL="https://your-project.supabase.co" --project-ref $ProjectRef

# Validate
cd supabase/functions/scripts
.\validate-secrets.ps1 -ProjectRef $ProjectRef
```

---

## ✅ Verify Deployment

### 1. Check Database
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notification_preferences', 'flash_offer_rate_limits');
```

### 2. Check RLS Policies
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'device_tokens';
```

### 3. Test Edge Function (Dry-Run)
```powershell
curl -X POST "https://<project>.supabase.co/functions/v1/send-flash-offer-push" `
  -H "Authorization: Bearer <jwt>" `
  -H "Content-Type: application/json" `
  -d "{\"offerId\": \"<offer-id>\", \"dryRun\": true}"
```

### 4. View Logs
```powershell
supabase functions logs send-flash-offer-push --project-ref <ref> --tail
```

---

## 📊 Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Error Rate | < 5% | > 5% |
| Execution Time (p95) | < 10s | > 25s |
| FCM Success Rate | > 90% | < 85% |
| Rate Limit Violations | < 50/hr | > 100/hr |

---

## 🔄 Quick Rollback

```powershell
# Emergency: Delete Edge Function
supabase functions delete send-flash-offer-push --project-ref <ref>

# Full rollback: See ROLLBACK.md
```

---

## 📚 Documentation

- **Complete Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Checklist**: `PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- **Monitoring**: `PRODUCTION_MONITORING_GUIDE.md`
- **Rollback**: `supabase/functions/ROLLBACK.md`
- **Summary**: `PRODUCTION_DEPLOYMENT_SUMMARY.md`

---

## 🆘 Troubleshooting

### Secrets Validation Fails
```powershell
supabase secrets list --project-ref <ref>
# Re-set any missing secrets
```

### Migration Fails
```powershell
# Check if tables already exist
supabase db execute --project-ref <ref> -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

### Edge Function Deployment Fails
```powershell
# Check login status
supabase login

# Verify project ref
supabase projects list

# Check for syntax errors
cd supabase/functions/send-flash-offer-push
deno check index.ts
```

### Edge Function Returns 500
```powershell
# Check logs for details
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 50

# Verify secrets are set
supabase secrets list --project-ref <ref>
```

---

## ⏱️ Timeline

- **Pre-Deployment**: 15 minutes
- **Deployment**: 10 minutes
- **Verification**: 15 minutes
- **Monitoring**: 48 hours

**Total Active Time**: ~40 minutes

---

## 📞 Support

1. Check logs: `supabase functions logs send-flash-offer-push --project-ref <ref>`
2. Review documentation in this repository
3. Contact Supabase support if needed

---

## ✨ Success Criteria

- [ ] All scripts complete without errors
- [ ] Database tables created
- [ ] RLS policies applied
- [ ] Edge Function deployed
- [ ] Dry-run test successful
- [ ] Real notification delivered
- [ ] No errors in logs
- [ ] Analytics tracked
- [ ] Rate limiting works

---

**Ready to deploy? Start with `PRODUCTION_DEPLOYMENT_GUIDE.md`**

