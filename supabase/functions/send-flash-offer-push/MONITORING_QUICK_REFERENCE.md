# Monitoring Quick Reference

Quick commands and queries for monitoring the Flash Offer Push Notification Backend.

## Alert Thresholds

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Error Rate | > 5% | Warning | Investigate logs |
| Execution Time | > 25s | Warning | Optimize queries |
| FCM Failure Rate | > 10% | Warning | Check tokens |
| Rate Limit Violations | > 100/hour | Warning | Check for abuse |

## Quick Commands

### Check Current Status
```powershell
# Run monitoring script (single check)
.\supabase\functions\scripts\monitor-edge-function.ps1 -ProjectRef "your-project-ref"
```

### Continuous Monitoring
```powershell
# Monitor every 60 seconds
.\supabase\functions\scripts\monitor-edge-function.ps1 -ProjectRef "your-project-ref" -Continuous -IntervalSeconds 60
```

### View Recent Logs
```powershell
# Last 100 logs
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 100

# Real-time logs
supabase functions logs send-flash-offer-push --project-ref <ref> --tail
```

### Filter Logs
```powershell
# Errors only
supabase functions logs send-flash-offer-push --project-ref <ref> | Select-String "ERROR"

# Alerts only
supabase functions logs send-flash-offer-push --project-ref <ref> | Select-String "\[ALERT\]"

# Slow requests (> 10s)
supabase functions logs send-flash-offer-push --project-ref <ref> | Select-String "completed in" | Where-Object { $_ -match "(\d+)ms" -and [int]$matches[1] -gt 10000 }
```

## Database Queries

### Get Monitoring Summary
```sql
SELECT * FROM get_monitoring_summary();
```

### Check Active Alerts
```sql
SELECT * FROM get_alert_summary();
```

### Rate Limit Violations (Last Hour)
```sql
SELECT * FROM recent_rate_limit_violations;
```

### Device Token Health
```sql
SELECT * FROM device_token_health;
```

### Notification Preferences
```sql
SELECT * FROM notification_preferences_stats;
```

### Daily Volume
```sql
SELECT * FROM daily_notification_volume;
```

## Common Issues

### High Error Rate
```powershell
# Check error types
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "ERROR" | Group-Object
```

### Slow Performance
```powershell
# Find slow requests
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "Request completed" | Where-Object { $_ -match "(\d+)ms" -and [int]$matches[1] -gt 25000 }
```

### FCM Failures
```sql
-- Check invalid token rate
SELECT 
  is_active,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM device_tokens
GROUP BY is_active;
```

### Rate Limit Issues
```sql
-- Check violation patterns
SELECT 
  limit_type,
  COUNT(*) as violation_count,
  DATE_TRUNC('hour', created_at) as hour
FROM flash_offer_rate_limits
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY limit_type, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

## Alert Response

### When Error Rate > 5%
1. Check recent error logs
2. Identify error patterns
3. Check database connectivity
4. Verify FCM configuration
5. Review recent deployments

### When Execution Time > 25s
1. Check number of targeted users
2. Review database query performance
3. Check FCM response times
4. Verify network connectivity
5. Consider optimization

### When FCM Failure Rate > 10%
1. Check invalid token percentage
2. Verify FCM service account
3. Review app token registration
4. Check Firebase quota
5. Clean up invalid tokens

### When Rate Limits > 100/hour
1. Check for abuse patterns
2. Review venue activity
3. Verify rate limit configuration
4. Check for legitimate spikes
5. Adjust limits if needed

## Related Documentation

- [Full Monitoring Setup](MONITORING_SETUP.md)
- [Production Monitoring Guide](../../../PRODUCTION_MONITORING_GUIDE.md)
- [Deployment Scripts](../scripts/README.md)
