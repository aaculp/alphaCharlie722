# Production Monitoring Guide

## Overview

This guide provides comprehensive monitoring instructions for the Flash Offer Push Notification Backend in production. Proper monitoring ensures system health, early issue detection, and optimal performance.

---

## Table of Contents

1. [Key Metrics](#key-metrics)
2. [Monitoring Tools](#monitoring-tools)
3. [Alert Configuration](#alert-configuration)
4. [Log Analysis](#log-analysis)
5. [Performance Optimization](#performance-optimization)
6. [Troubleshooting](#troubleshooting)

---

## Key Metrics

### Edge Function Metrics

#### Invocation Count
- **What**: Number of times the Edge Function is called
- **Target**: Varies by usage, track trends
- **Alert**: Sudden drops (may indicate app issues) or spikes (may indicate abuse)
- **How to Check**: Supabase Dashboard → Functions → send-flash-offer-push → Metrics

#### Error Rate
- **What**: Percentage of requests that result in errors
- **Target**: < 5%
- **Alert**: > 5% over 5 minutes
- **How to Check**: 
  ```powershell
  # View error logs
  supabase functions logs send-flash-offer-push --project-ref <ref> | Select-String "ERROR"
  ```

#### Execution Time
- **What**: Time taken to process each request
- **Target**: 
  - p50: < 5 seconds
  - p95: < 10 seconds
  - p99: < 15 seconds
- **Alert**: p95 > 25 seconds
- **How to Check**: Supabase Dashboard → Functions → Metrics

#### Success Rate
- **What**: Percentage of requests that complete successfully
- **Target**: > 95%
- **Alert**: < 90% over 5 minutes
- **How to Check**: Calculate from logs or dashboard metrics

### FCM Metrics

#### FCM Success Rate
- **What**: Percentage of FCM messages successfully delivered
- **Target**: > 90%
- **Alert**: < 85% over 10 minutes
- **How to Check**: Parse Edge Function logs for FCM results

#### Invalid Token Rate
- **What**: Percentage of device tokens that are invalid
- **Target**: < 5%
- **Alert**: > 10% (may indicate app issue)
- **How to Check**: 
  ```sql
  SELECT 
    COUNT(*) FILTER (WHERE is_active = false) * 100.0 / COUNT(*) as inactive_percentage
  FROM device_tokens;
  ```

#### FCM Quota Usage
- **What**: Number of FCM messages sent vs. quota limit
- **Target**: < 80% of quota
- **Alert**: > 90% of quota
- **How to Check**: Firebase Console → Cloud Messaging → Usage

### Database Metrics

#### Rate Limit Violations
- **What**: Number of rate limit violations (venue or user)
- **Target**: < 50/hour (indicates normal usage)
- **Alert**: > 100/hour (may indicate abuse)
- **How to Check**:
  ```sql
  SELECT 
    limit_type,
    COUNT(*) as violation_count
  FROM flash_offer_rate_limits
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY limit_type;
  ```

#### Active Device Tokens
- **What**: Number of active device tokens
- **Target**: Track trends, should grow with user base
- **Alert**: Sudden drops (may indicate app issue)
- **How to Check**:
  ```sql
  SELECT COUNT(*) as active_tokens
  FROM device_tokens
  WHERE is_active = true;
  ```

#### Notification Preferences
- **What**: Distribution of user preferences
- **Target**: Track trends
- **Alert**: Sudden changes (may indicate app bug)
- **How to Check**:
  ```sql
  SELECT 
    flash_offers_enabled,
    COUNT(*) as user_count
  FROM notification_preferences
  GROUP BY flash_offers_enabled;
  ```

### Business Metrics

#### Notifications Sent per Day
- **What**: Total notifications sent in last 24 hours
- **Target**: Track trends
- **Alert**: Sudden drops or spikes
- **How to Check**:
  ```sql
  SELECT 
    DATE(created_at) as date,
    SUM(count) as total_sent
  FROM flash_offer_rate_limits
  WHERE limit_type = 'venue_send'
  AND created_at > NOW() - INTERVAL '7 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
  ```

#### Average Recipients per Offer
- **What**: Average number of users targeted per flash offer
- **Target**: Track trends
- **Alert**: Sudden drops (may indicate targeting issue)
- **How to Check**: Parse Edge Function logs or analytics data

#### Claim Rate
- **What**: Percentage of notifications that result in claims
- **Target**: Track trends, optimize over time
- **Alert**: Sudden drops (may indicate notification quality issue)
- **How to Check**: Query flash_offer_claims table

---

## Monitoring Tools

### Supabase Dashboard

**Access**: https://app.supabase.com/project/<your-project>/functions

**Features**:
- Real-time invocation count
- Error rate graphs
- Execution time distribution
- Recent logs

**How to Use**:
1. Navigate to Functions → send-flash-offer-push
2. View Metrics tab for graphs
3. View Logs tab for recent executions
4. Filter logs by error level

### Supabase CLI

**View Real-Time Logs**:
```powershell
# Tail logs (Ctrl+C to stop)
supabase functions logs send-flash-offer-push --project-ref <ref> --tail

# View last 100 logs
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 100

# Filter by error level
supabase functions logs send-flash-offer-push --project-ref <ref> | Select-String "ERROR"
```

**View Function Status**:
```powershell
# List all functions
supabase functions list --project-ref <ref>

# Check specific function
supabase functions inspect send-flash-offer-push --project-ref <ref>
```

### Database Queries

**Create Monitoring Views**:
```sql
-- View: Recent rate limit violations
CREATE OR REPLACE VIEW recent_rate_limit_violations AS
SELECT 
  limit_type,
  COUNT(*) as violation_count,
  MAX(created_at) as last_violation
FROM flash_offer_rate_limits
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY limit_type;

-- View: FCM token health
CREATE OR REPLACE VIEW device_token_health AS
SELECT 
  is_active,
  COUNT(*) as token_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM device_tokens
GROUP BY is_active;

-- View: Notification preferences distribution
CREATE OR REPLACE VIEW notification_preferences_stats AS
SELECT 
  flash_offers_enabled,
  COUNT(*) as user_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM notification_preferences
GROUP BY flash_offers_enabled;
```

**Query Monitoring Views**:
```sql
-- Check rate limit violations
SELECT * FROM recent_rate_limit_violations;

-- Check token health
SELECT * FROM device_token_health;

-- Check preferences
SELECT * FROM notification_preferences_stats;
```

### Firebase Console

**Access**: https://console.firebase.google.com/project/<your-project>/notification

**Features**:
- FCM quota usage
- Message delivery stats
- Error reports

**How to Use**:
1. Navigate to Cloud Messaging
2. View Usage tab for quota
3. View Reports for delivery stats

---

## Alert Configuration

### Recommended Alerts

#### Critical Alerts (Immediate Response)

1. **Edge Function Error Rate > 10%**
   - **Severity**: Critical
   - **Response Time**: Immediate
   - **Action**: Check logs, consider rollback

2. **Edge Function Unavailable**
   - **Severity**: Critical
   - **Response Time**: Immediate
   - **Action**: Check deployment status, redeploy if needed

3. **FCM Quota Exceeded**
   - **Severity**: Critical
   - **Response Time**: Immediate
   - **Action**: Contact Firebase support, implement throttling

4. **Database Connection Failures**
   - **Severity**: Critical
   - **Response Time**: Immediate
   - **Action**: Check Supabase status, verify credentials

#### Warning Alerts (Monitor Closely)

1. **Edge Function Error Rate > 5%**
   - **Severity**: Warning
   - **Response Time**: Within 1 hour
   - **Action**: Investigate logs, identify patterns

2. **Execution Time p95 > 15 seconds**
   - **Severity**: Warning
   - **Response Time**: Within 4 hours
   - **Action**: Optimize queries, check FCM performance

3. **FCM Success Rate < 90%**
   - **Severity**: Warning
   - **Response Time**: Within 4 hours
   - **Action**: Check invalid token rate, verify FCM configuration

4. **Rate Limit Violations > 100/hour**
   - **Severity**: Warning
   - **Response Time**: Within 4 hours
   - **Action**: Investigate for abuse, adjust limits if needed

#### Info Alerts (Track Trends)

1. **Invocation Count Spike (> 2x normal)**
   - **Severity**: Info
   - **Response Time**: Within 24 hours
   - **Action**: Verify legitimate usage, check for abuse

2. **Active Token Count Drop (> 10%)**
   - **Severity**: Info
   - **Response Time**: Within 24 hours
   - **Action**: Check app deployment, verify token registration

### Setting Up Alerts

**Using Supabase (if available)**:
- Configure alerts in Supabase Dashboard → Settings → Alerts
- Set thresholds based on recommendations above

**Using External Monitoring (recommended)**:
- Use tools like Datadog, New Relic, or Sentry
- Configure webhooks to receive Supabase logs
- Set up custom alerts based on log patterns

**Using PowerShell Scripts**:
```powershell
# Example: Check error rate and send alert
$logs = supabase functions logs send-flash-offer-push --project-ref <ref> --limit 100
$errorCount = ($logs | Select-String "ERROR").Count
$errorRate = $errorCount / 100.0

if ($errorRate -gt 0.05) {
    Write-Host "ALERT: Error rate is $($errorRate * 100)%" -ForegroundColor Red
    # Send email, Slack message, etc.
}
```

---

## Log Analysis

### Log Levels

- **[INFO]**: Normal operation, informational messages
- **[WARN]**: Warning conditions, potential issues
- **[ERROR]**: Error conditions, requires attention
- **[SECURITY]**: Security-related events

### Common Log Patterns

#### Successful Request
```
[INFO] Found 50 targeted users for offer abc123
[INFO] After preference filtering: 45 users
[INFO] After rate limit filtering: 40 users
[INFO] Sending to 40 devices
[INFO] FCM send complete: 38 succeeded, 2 failed
[INFO] Marked offer abc123 as push_sent
[INFO] Request completed in 3500ms
```

#### Rate Limit Exceeded
```
[WARN] Venue rate limit exceeded: offerId=abc123, venueId=xyz789, currentCount=5, limit=5
```

#### FCM Error
```
[ERROR] FCM send failed: offerId=abc123, error=quota_exceeded
```

#### Authentication Error
```
[ERROR] Invalid or expired authorization token
```

### Log Analysis Queries

**Find Recent Errors**:
```powershell
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "ERROR"
```

**Find Slow Requests**:
```powershell
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "Request completed" | Where-Object { $_ -match "(\d+)ms" -and [int]$matches[1] -gt 10000 }
```

**Find Rate Limit Violations**:
```powershell
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "rate limit exceeded"
```

**Count Errors by Type**:
```powershell
$logs = supabase functions logs send-flash-offer-push --project-ref <ref> --limit 1000
$errors = $logs | Select-String "ERROR"
$errors | Group-Object { ($_ -split "ERROR")[1].Trim().Split()[0] } | Sort-Object Count -Descending
```

---

## Performance Optimization

### Identifying Performance Issues

1. **Slow Database Queries**
   - **Symptom**: Execution time > 10 seconds
   - **Check**: Look for "Database error" in logs
   - **Solution**: Add indexes, optimize queries

2. **FCM Timeout**
   - **Symptom**: Execution time > 15 seconds with many users
   - **Check**: Look for "FCM send failed" with timeout errors
   - **Solution**: Increase batch size, optimize batching logic

3. **High Memory Usage**
   - **Symptom**: Function crashes or restarts
   - **Check**: Supabase Dashboard → Functions → Metrics
   - **Solution**: Reduce batch size, optimize data structures

### Optimization Strategies

#### Database Optimization

**Add Indexes**:
```sql
-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_prefs_enabled ON notification_preferences(flash_offers_enabled) WHERE flash_offers_enabled = true;
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON flash_offer_rate_limits(expires_at) WHERE expires_at > NOW();
```

**Optimize Queries**:
```sql
-- Use EXPLAIN ANALYZE to check query performance
EXPLAIN ANALYZE
SELECT dt.token
FROM device_tokens dt
JOIN notification_preferences np ON dt.user_id = np.user_id
WHERE dt.is_active = true
AND np.flash_offers_enabled = true;
```

#### Edge Function Optimization

**Reduce Batch Size** (if memory issues):
```typescript
// In fcm.ts, reduce batch size from 500 to 250
const BATCH_SIZE = 250;
```

**Increase Timeout** (if needed):
```typescript
// In index.ts, increase timeout from 30s to 45s
await withTimeout(
  handler(),
  45000, // 45 seconds
  'Edge Function execution timeout'
);
```

#### FCM Optimization

**Parallel Batch Sending**:
```typescript
// Send multiple batches in parallel (up to 10)
const MAX_PARALLEL_BATCHES = 10;
const batchPromises = batches.slice(0, MAX_PARALLEL_BATCHES).map(batch => sendBatch(batch));
const results = await Promise.all(batchPromises);
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: High Error Rate

**Symptoms**:
- Error rate > 5%
- Many ERROR logs

**Diagnosis**:
```powershell
# Check error types
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "ERROR" | Group-Object
```

**Solutions**:
- **Authentication errors**: Check JWT token generation in app
- **Database errors**: Check Supabase status, verify credentials
- **FCM errors**: Check Firebase configuration, verify service account
- **Rate limit errors**: Adjust rate limits or investigate abuse

#### Issue: Slow Performance

**Symptoms**:
- Execution time > 10 seconds
- Timeout errors

**Diagnosis**:
```powershell
# Find slow requests
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "Request completed" | Sort-Object
```

**Solutions**:
- Add database indexes
- Optimize queries
- Reduce batch size
- Increase timeout (if appropriate)
- Check FCM performance

#### Issue: Low FCM Success Rate

**Symptoms**:
- FCM success rate < 90%
- Many invalid token errors

**Diagnosis**:
```sql
-- Check invalid token rate
SELECT 
  is_active,
  COUNT(*) as count
FROM device_tokens
GROUP BY is_active;
```

**Solutions**:
- Clean up invalid tokens regularly
- Verify app token registration logic
- Check FCM configuration
- Verify service account permissions

#### Issue: Rate Limit Violations

**Symptoms**:
- Many rate limit exceeded errors
- Users complaining about not receiving notifications

**Diagnosis**:
```sql
-- Check rate limit violations
SELECT 
  limit_type,
  COUNT(*) as violation_count
FROM flash_offer_rate_limits
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY limit_type;
```

**Solutions**:
- Investigate for abuse patterns
- Adjust rate limits if legitimate usage
- Implement venue-specific limits
- Add user education about limits

---

## Monitoring Checklist

### Daily Checks
- [ ] Review error rate (should be < 5%)
- [ ] Check execution time (p95 should be < 10s)
- [ ] Verify FCM success rate (should be > 90%)
- [ ] Review rate limit violations (should be < 50/hour)
- [ ] Check for any critical alerts

### Weekly Checks
- [ ] Analyze performance trends
- [ ] Review invalid token rate
- [ ] Check database table sizes
- [ ] Verify cleanup functions running
- [ ] Review user feedback

### Monthly Checks
- [ ] Analyze usage patterns
- [ ] Optimize database queries
- [ ] Review and adjust rate limits
- [ ] Update monitoring thresholds
- [ ] Plan capacity scaling

---

## Related Documentation

- [Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Rollback Instructions](supabase/functions/ROLLBACK.md)
- [Design Document](.kiro/specs/flash-offer-push-backend/design.md)

