# Monitoring and Alerting Setup

This document describes the monitoring and alerting infrastructure for the Flash Offer Push Notification Backend.

## Overview

The monitoring system tracks key metrics and triggers alerts when thresholds are exceeded:

- **Error Rate**: Alert when > 5%
- **Execution Time**: Alert when > 25 seconds
- **FCM Failure Rate**: Alert when > 10%
- **Rate Limit Violations**: Alert when > 100 per hour

## Components

### 1. Monitoring Module (`monitoring.ts`)

TypeScript module that provides in-memory metric tracking and alert triggering within the Edge Function.

**Features**:
- Records metrics for each request
- Checks alert thresholds automatically
- Logs alerts with appropriate severity levels
- Provides summary statistics

**Usage in Edge Function**:
```typescript
import { monitoringService } from './monitoring.ts';

// Record execution time
monitoringService.recordMetric('execution_time', executionTimeMs, {
  offerId: offerId,
});

// Record error
monitoringService.recordMetric('error_rate', 1, {
  errorType: 'database_error',
});

// Record FCM failure rate
monitoringService.recordMetric('fcm_failure_rate', failureRate, {
  successCount: successCount,
  failureCount: failureCount,
});

// Record rate limit violation
monitoringService.recordMetric('rate_limit_violations', 1, {
  venueId: venueId,
  limitType: 'venue_send',
});
```

### 2. PowerShell Monitoring Script (`monitor-edge-function.ps1`)

Script for monitoring the Edge Function from the command line.

**Features**:
- Fetches and analyzes Edge Function logs
- Calculates metrics (error rate, execution time, etc.)
- Displays color-coded alerts
- Supports continuous monitoring mode

**Usage**:
```powershell
# Single check
.\monitor-edge-function.ps1 -ProjectRef "your-project-ref"

# Continuous monitoring (every 60 seconds)
.\monitor-edge-function.ps1 -ProjectRef "your-project-ref" -Continuous -IntervalSeconds 60

# Custom log limit
.\monitor-edge-function.ps1 -ProjectRef "your-project-ref" -LogLimit 1000
```

**Parameters**:
- `-ProjectRef`: Supabase project reference (required)
- `-LogLimit`: Number of logs to fetch (default: 500)
- `-Continuous`: Enable continuous monitoring mode
- `-IntervalSeconds`: Interval between checks in continuous mode (default: 60)


### 3. Database Monitoring Views (`edge_function_monitoring.sql`)

SQL views and functions for database-level monitoring.

**Views**:
- `recent_rate_limit_violations`: Rate limit violations in the last hour
- `device_token_health`: Distribution of active/inactive tokens
- `notification_preferences_stats`: User preference distribution
- `daily_notification_volume`: Daily notification counts

**Functions**:
- `check_error_rate_threshold()`: Check if error rate exceeds threshold
- `check_rate_limit_violations()`: Check if violations exceed threshold
- `get_monitoring_summary()`: Get comprehensive monitoring summary
- `get_alert_summary()`: Get active alerts

**Usage**:
```sql
-- Get monitoring summary
SELECT * FROM get_monitoring_summary();

-- Check for active alerts
SELECT * FROM get_alert_summary();

-- View recent rate limit violations
SELECT * FROM recent_rate_limit_violations;

-- View device token health
SELECT * FROM device_token_health;
```

## Alert Thresholds

### Error Rate
- **Threshold**: 5%
- **Severity**: Warning
- **Action**: Investigate logs, identify error patterns
- **Calculation**: (Error count / Total requests) over 5-minute window

### Execution Time
- **Threshold**: 25 seconds
- **Severity**: Warning
- **Action**: Optimize queries, check FCM performance
- **Calculation**: Individual request execution time

### FCM Failure Rate
- **Threshold**: 10%
- **Severity**: Warning
- **Action**: Check invalid token rate, verify FCM configuration
- **Calculation**: (FCM failures / Total FCM sends) over 10-minute window

### Rate Limit Violations
- **Threshold**: 100 per hour
- **Severity**: Warning
- **Action**: Investigate for abuse, adjust limits if needed
- **Calculation**: Count of rate limit violations in last hour

## Setup Instructions

### 1. Deploy Monitoring Module

The monitoring module is automatically included in the Edge Function deployment.

```bash
# Deploy Edge Function (includes monitoring.ts)
supabase functions deploy send-flash-offer-push --project-ref <your-project-ref>
```

### 2. Install Database Monitoring Views

```bash
# Run the monitoring SQL script
supabase db execute -f database/monitoring/edge_function_monitoring.sql --project-ref <your-project-ref>
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `database/monitoring/edge_function_monitoring.sql`
3. Execute the script

### 3. Set Up PowerShell Monitoring

```powershell
# Navigate to scripts directory
cd supabase/functions/scripts

# Run monitoring script
.\monitor-edge-function.ps1 -ProjectRef "your-project-ref"
```

For continuous monitoring, set up a scheduled task or run in a terminal:
```powershell
.\monitor-edge-function.ps1 -ProjectRef "your-project-ref" -Continuous -IntervalSeconds 300
```

## Integration with External Monitoring

### Datadog Integration

1. Configure Supabase to send logs to Datadog
2. Create Datadog monitors for each alert threshold
3. Set up notification channels (email, Slack, PagerDuty)

**Example Datadog Monitor**:
```
Alert: Edge Function Error Rate
Query: logs("service:send-flash-offer-push [ERROR]").rollup("count").last("5m") / logs("service:send-flash-offer-push").rollup("count").last("5m") > 0.05
Notification: @slack-alerts @pagerduty-critical
```

### New Relic Integration

1. Configure Supabase to send logs to New Relic
2. Create NRQL alerts for each threshold
3. Set up notification policies

**Example NRQL Alert**:
```sql
SELECT percentage(count(*), WHERE message LIKE '%ERROR%') 
FROM Log 
WHERE service = 'send-flash-offer-push' 
SINCE 5 minutes ago
```

### Sentry Integration

1. Add Sentry SDK to Edge Function
2. Configure error tracking
3. Set up alert rules

```typescript
import * as Sentry from "https://deno.land/x/sentry/index.ts";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  environment: "production",
});
```


## Viewing Logs

### Supabase Dashboard

1. Go to https://app.supabase.com/project/<your-project>/functions
2. Click on `send-flash-offer-push`
3. View Logs tab
4. Filter by severity: INFO, WARN, ERROR

### Supabase CLI

```powershell
# View real-time logs
supabase functions logs send-flash-offer-push --project-ref <ref> --tail

# View last 100 logs
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 100

# Filter by error level
supabase functions logs send-flash-offer-push --project-ref <ref> | Select-String "ERROR"

# Filter by alert level
supabase functions logs send-flash-offer-push --project-ref <ref> | Select-String "\[ALERT\]"
```

## Alert Log Format

Alerts are logged in JSON format for easy parsing:

```json
{
  "severity": "warning",
  "type": "error_rate",
  "message": "Error rate exceeded 5%",
  "value": 0.08,
  "threshold": 0.05,
  "timestamp": "2024-01-17T12:34:56.789Z",
  "metadata": {
    "offerId": "abc123",
    "errorType": "database_error"
  }
}
```

## Troubleshooting

### High Error Rate

**Symptoms**: Error rate > 5%

**Diagnosis**:
```powershell
# Check error types
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "ERROR" | Group-Object
```

**Common Causes**:
- Database connection issues
- Invalid JWT tokens
- FCM configuration errors
- Rate limit exceeded

### Slow Execution Time

**Symptoms**: Execution time > 25 seconds

**Diagnosis**:
```powershell
# Find slow requests
supabase functions logs send-flash-offer-push --project-ref <ref> --limit 500 | Select-String "Request completed" | Where-Object { $_ -match "(\d+)ms" -and [int]$matches[1] -gt 25000 }
```

**Common Causes**:
- Large number of targeted users
- Slow database queries
- FCM timeout
- Network latency

### High FCM Failure Rate

**Symptoms**: FCM failure rate > 10%

**Diagnosis**:
```sql
-- Check invalid token rate
SELECT 
  is_active,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM device_tokens
GROUP BY is_active;
```

**Common Causes**:
- Many invalid device tokens
- FCM configuration issues
- App not properly registering tokens
- Users uninstalling app

### High Rate Limit Violations

**Symptoms**: Rate limit violations > 100/hour

**Diagnosis**:
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

**Common Causes**:
- Venue sending too many offers
- Users receiving too many notifications
- Abuse or spam
- Rate limits set too low

## Best Practices

1. **Monitor Continuously**: Run the monitoring script continuously in production
2. **Set Up Alerts**: Configure external monitoring tools for critical alerts
3. **Review Daily**: Check monitoring summary daily
4. **Investigate Trends**: Look for patterns in metrics over time
5. **Optimize Proactively**: Address warnings before they become critical
6. **Document Incidents**: Keep a log of alerts and resolutions
7. **Test Alerts**: Periodically test alert triggers to ensure they work

## Related Documentation

- [Production Monitoring Guide](../../../PRODUCTION_MONITORING_GUIDE.md)
- [Production Deployment Guide](../../../PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Design Document](../../../.kiro/specs/flash-offer-push-backend/design.md)
- [Requirements Document](../../../.kiro/specs/flash-offer-push-backend/requirements.md)
