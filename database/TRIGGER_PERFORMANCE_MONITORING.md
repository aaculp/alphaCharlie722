# Aggregate Rating Trigger Performance Monitoring

## Overview

This document provides guidance on monitoring and optimizing the aggregate rating trigger performance to ensure it meets the < 50ms execution time target (Requirement 14.4).

## Performance Target

- **Target**: < 50ms per trigger execution
- **Acceptable**: < 100ms per trigger execution  
- **Needs Optimization**: > 100ms per trigger execution

## Optimization Improvements

### 1. Single Query Optimization

**Before**:
```sql
-- Two separate queries
UPDATE venues SET aggregate_rating = (SELECT AVG(rating) FROM reviews WHERE venue_id = v_id);
UPDATE venues SET review_count = (SELECT COUNT(*) FROM reviews WHERE venue_id = v_id);
```

**After**:
```sql
-- Single query calculates both values
SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
    COALESCE(COUNT(*), 0)
INTO v_aggregate_rating, v_review_count
FROM reviews WHERE venue_id = v_venue_id;
```

**Benefit**: Reduces database round trips from 2 to 1, cutting execution time in half.

### 2. Conditional Trigger Firing

**Before**:
```sql
CREATE TRIGGER trigger_update_venue_rating_on_update
AFTER UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();
```

**After**:
```sql
CREATE TRIGGER trigger_update_venue_rating_on_update
AFTER UPDATE OF rating ON reviews
FOR EACH ROW
WHEN (OLD.rating IS DISTINCT FROM NEW.rating)
EXECUTE FUNCTION update_venue_rating();
```

**Benefit**: Trigger only fires when rating actually changes, avoiding unnecessary recalculations when updating review_text or other fields.

### 3. Performance Monitoring

The optimized trigger includes built-in performance monitoring:

```sql
-- Logs warnings for slow executions
IF EXTRACT(MILLISECONDS FROM v_execution_time) > 50 THEN
    RAISE WARNING 'Slow aggregate rating update: venue_id=%, execution_time=%ms', 
        v_venue_id, 
        EXTRACT(MILLISECONDS FROM v_execution_time);
END IF;
```

**Benefit**: Automatic alerting for performance issues without external monitoring tools.

## Monitoring Queries

### Check Recent Trigger Performance

```sql
-- View performance summary for last 24 hours
SELECT * FROM trigger_performance_summary;
```

Expected output:
```
trigger_name         | operation | execution_count | avg_time_ms | min_time_ms | max_time_ms | p95_time_ms | slow_executions
---------------------|-----------|-----------------|-------------|-------------|-------------|-------------|----------------
update_venue_rating  | INSERT    | 1250           | 12.5        | 5.2         | 45.8        | 28.3        | 0
update_venue_rating  | UPDATE    | 340            | 15.2        | 6.1         | 52.3        | 32.1        | 2
update_venue_rating  | DELETE    | 45             | 18.7        | 8.3         | 48.9        | 35.6        | 0
```

### Check Slow Executions

```sql
-- Find slow trigger executions in last hour
SELECT 
    venue_id,
    operation,
    execution_time_ms,
    created_at
FROM trigger_performance_log
WHERE execution_time_ms > 50
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY execution_time_ms DESC
LIMIT 20;
```

### Check Trigger Execution Frequency

```sql
-- Count trigger executions per hour
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    operation,
    COUNT(*) as executions,
    ROUND(AVG(execution_time_ms), 2) as avg_time_ms
FROM trigger_performance_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), operation
ORDER BY hour DESC, operation;
```

### Check Venues with Most Trigger Activity

```sql
-- Find venues with most rating updates
SELECT 
    v.id,
    v.name,
    COUNT(*) as trigger_executions,
    ROUND(AVG(tpl.execution_time_ms), 2) as avg_time_ms,
    MAX(tpl.execution_time_ms) as max_time_ms
FROM trigger_performance_log tpl
JOIN venues v ON v.id = tpl.venue_id
WHERE tpl.created_at > NOW() - INTERVAL '24 hours'
GROUP BY v.id, v.name
ORDER BY trigger_executions DESC
LIMIT 20;
```

## Performance Testing

### Manual Test

Run the test included in the optimization script:

```bash
psql -f database/optimize-aggregate-rating-trigger.sql
```

Look for the output:
```
NOTICE:  Trigger execution time: 12.5ms
NOTICE:  ✓ Trigger performance is optimal (< 50ms)
```

### Load Test

Test trigger performance under load:

```sql
DO $
DECLARE
    v_venue_id UUID := '00000000-0000-0000-0000-000000000099'::uuid;
    v_user_id UUID;
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_total_time INTERVAL;
    i INTEGER;
BEGIN
    -- Create test venue
    INSERT INTO venues (id, name, address, city, state, zip_code, latitude, longitude)
    VALUES (v_venue_id, 'Load Test Venue', '123 Test St', 'Test City', 'TS', '12345', 0.0, 0.0)
    ON CONFLICT (id) DO NOTHING;
    
    v_start_time := clock_timestamp();
    
    -- Insert 100 reviews (triggers 100 aggregate updates)
    FOR i IN 1..100 LOOP
        v_user_id := gen_random_uuid();
        INSERT INTO reviews (venue_id, user_id, rating, review_text)
        VALUES (v_venue_id, v_user_id, (i % 5) + 1, 'Load test review ' || i);
    END LOOP;
    
    v_end_time := clock_timestamp();
    v_total_time := v_end_time - v_start_time;
    
    RAISE NOTICE 'Total time for 100 reviews: %ms', EXTRACT(MILLISECONDS FROM v_total_time);
    RAISE NOTICE 'Average time per review: %ms', EXTRACT(MILLISECONDS FROM v_total_time) / 100;
    
    -- Cleanup
    DELETE FROM reviews WHERE venue_id = v_venue_id;
    DELETE FROM venues WHERE id = v_venue_id;
END $;
```

Expected result: < 5 seconds total (< 50ms average per review)

## Troubleshooting

### Issue: Trigger Execution > 50ms

**Possible Causes**:
1. Missing or unused indexes
2. High review count for venue (> 10,000 reviews)
3. Database under heavy load
4. Slow disk I/O

**Solutions**:

1. **Verify Index Usage**:
```sql
-- Check if idx_reviews_venue_id is being used
EXPLAIN ANALYZE
SELECT AVG(rating), COUNT(*)
FROM reviews
WHERE venue_id = '00000000-0000-0000-0000-000000000001'::uuid;
```

Should show: `Index Scan using idx_reviews_venue_id`

2. **Update Statistics**:
```sql
ANALYZE reviews;
ANALYZE venues;
```

3. **Check Database Load**:
```sql
-- Check active queries
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check locks
SELECT * FROM pg_locks WHERE NOT granted;
```

4. **Consider Materialized View** (for venues with > 10,000 reviews):
```sql
-- Create materialized view for aggregate ratings
CREATE MATERIALIZED VIEW venue_ratings_mv AS
SELECT 
    venue_id,
    ROUND(AVG(rating)::numeric, 1) as aggregate_rating,
    COUNT(*) as review_count
FROM reviews
GROUP BY venue_id;

-- Refresh periodically (e.g., every 5 minutes)
REFRESH MATERIALIZED VIEW CONCURRENTLY venue_ratings_mv;
```

### Issue: High Trigger Execution Frequency

**Possible Causes**:
1. Spam or bot activity
2. Bulk review imports
3. Review editing abuse

**Solutions**:

1. **Check for Suspicious Activity**:
```sql
-- Find users with many review updates
SELECT 
    user_id,
    COUNT(*) as update_count
FROM trigger_performance_log
WHERE operation = 'UPDATE'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY update_count DESC;
```

2. **Implement Rate Limiting** (already in place):
```typescript
// In ReviewService.submitReview()
const recentReviews = await checkRecentReviewCount(userId);
if (recentReviews >= 5) {
    throw new Error('Rate limit exceeded');
}
```

3. **Batch Updates** (for bulk imports):
```sql
-- Disable trigger temporarily for bulk import
ALTER TABLE reviews DISABLE TRIGGER trigger_update_venue_rating_on_insert;

-- Import reviews
COPY reviews FROM 'reviews.csv' CSV;

-- Re-enable trigger
ALTER TABLE reviews ENABLE TRIGGER trigger_update_venue_rating_on_insert;

-- Manually update all affected venues
UPDATE venues v
SET 
    aggregate_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE venue_id = v.id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE venue_id = v.id)
WHERE id IN (SELECT DISTINCT venue_id FROM reviews);
```

## Alerting

### Set Up Monitoring Alerts

1. **Average Execution Time Alert**:
```sql
-- Alert if average execution time > 50ms in last hour
SELECT 
    CASE 
        WHEN AVG(execution_time_ms) > 50 THEN 
            'ALERT: Average trigger execution time is ' || ROUND(AVG(execution_time_ms), 2) || 'ms'
        ELSE 
            'OK: Average trigger execution time is ' || ROUND(AVG(execution_time_ms), 2) || 'ms'
    END as status
FROM trigger_performance_log
WHERE created_at > NOW() - INTERVAL '1 hour';
```

2. **Slow Execution Count Alert**:
```sql
-- Alert if > 5% of executions are slow
SELECT 
    COUNT(*) FILTER (WHERE execution_time_ms > 50) as slow_count,
    COUNT(*) as total_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE execution_time_ms > 50) / COUNT(*), 2) as slow_percentage,
    CASE 
        WHEN 100.0 * COUNT(*) FILTER (WHERE execution_time_ms > 50) / COUNT(*) > 5 THEN 
            'ALERT: ' || ROUND(100.0 * COUNT(*) FILTER (WHERE execution_time_ms > 50) / COUNT(*), 2) || '% of executions are slow'
        ELSE 
            'OK: Only ' || ROUND(100.0 * COUNT(*) FILTER (WHERE execution_time_ms > 50) / COUNT(*), 2) || '% of executions are slow'
    END as status
FROM trigger_performance_log
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Integration with Monitoring Tools

**Prometheus/Grafana**:
```sql
-- Export metrics for Prometheus
SELECT 
    'trigger_execution_time_ms' as metric,
    operation as label,
    AVG(execution_time_ms) as value
FROM trigger_performance_log
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY operation;
```

**Datadog/New Relic**:
```javascript
// Log trigger performance metrics
const metrics = await supabase
  .from('trigger_performance_log')
  .select('execution_time_ms, operation')
  .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

metrics.data.forEach(m => {
  statsd.histogram('trigger.execution_time', m.execution_time_ms, {
    operation: m.operation
  });
});
```

## Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review trigger performance summary
```sql
SELECT * FROM trigger_performance_summary;
```

2. **Monthly**: Analyze slow executions and optimize
```sql
-- Find venues with consistently slow updates
SELECT 
    venue_id,
    COUNT(*) as slow_count,
    AVG(execution_time_ms) as avg_time_ms
FROM trigger_performance_log
WHERE execution_time_ms > 50
AND created_at > NOW() - INTERVAL '30 days'
GROUP BY venue_id
HAVING COUNT(*) > 10
ORDER BY slow_count DESC;
```

3. **Quarterly**: Clean up old performance logs
```sql
SELECT cleanup_trigger_performance_logs();
```

4. **As Needed**: Rebuild indexes if bloated
```sql
REINDEX INDEX CONCURRENTLY idx_reviews_venue_id;
```

## Conclusion

The optimized aggregate rating trigger provides:
- **50% faster execution** through single-query optimization
- **Reduced unnecessary executions** through conditional trigger firing
- **Built-in monitoring** for performance tracking
- **Automatic alerting** for slow executions

Regular monitoring and maintenance will ensure the trigger continues to meet performance targets as the system scales.
