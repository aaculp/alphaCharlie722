-- ============================================================================
-- Optimized Aggregate Rating Trigger
-- ============================================================================
-- This script provides an optimized version of the aggregate rating trigger
-- with performance monitoring and efficiency improvements
-- Requirements: 14.4

-- ============================================================================
-- 1. Optimized Trigger Function
-- ============================================================================

-- Drop existing function to replace it
DROP FUNCTION IF EXISTS update_venue_rating() CASCADE;

-- Create optimized version with better performance
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $
DECLARE
    v_venue_id UUID;
    v_aggregate_rating NUMERIC(2,1);
    v_review_count INTEGER;
    v_start_time TIMESTAMP;
    v_execution_time INTERVAL;
BEGIN
    -- Record start time for performance monitoring
    v_start_time := clock_timestamp();
    
    -- Get the venue_id from NEW or OLD record
    v_venue_id := COALESCE(NEW.venue_id, OLD.venue_id);
    
    -- Only update if venues table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'venues') THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate aggregate rating and count in a single query (more efficient)
    -- Using COALESCE to handle case when no reviews exist
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
        COALESCE(COUNT(*), 0)
    INTO v_aggregate_rating, v_review_count
    FROM public.reviews 
    WHERE venue_id = v_venue_id;
    
    -- Update venue with calculated values
    UPDATE public.venues
    SET 
        aggregate_rating = v_aggregate_rating,
        review_count = v_review_count
    WHERE id = v_venue_id;
    
    -- Calculate execution time
    v_execution_time := clock_timestamp() - v_start_time;
    
    -- Log slow executions (> 50ms) for monitoring
    IF EXTRACT(MILLISECONDS FROM v_execution_time) > 50 THEN
        RAISE WARNING 'Slow aggregate rating update: venue_id=%, execution_time=%ms', 
            v_venue_id, 
            EXTRACT(MILLISECONDS FROM v_execution_time);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Add comment explaining optimization
COMMENT ON FUNCTION update_venue_rating() IS 
'Optimized trigger function to update venue aggregate rating and review count. 
Calculates both values in a single query for efficiency. 
Logs warnings for executions > 50ms.';

-- ============================================================================
-- 2. Recreate Triggers with Optimized Function
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_insert ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_update ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_delete ON public.reviews;

-- Recreate triggers with optimized function
CREATE TRIGGER trigger_update_venue_rating_on_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER trigger_update_venue_rating_on_update
AFTER UPDATE OF rating ON public.reviews
FOR EACH ROW
WHEN (OLD.rating IS DISTINCT FROM NEW.rating)  -- Only fire when rating actually changes
EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER trigger_update_venue_rating_on_delete
AFTER DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

-- ============================================================================
-- 3. Create Trigger Performance Monitoring Table
-- ============================================================================

-- Table to track trigger execution times
CREATE TABLE IF NOT EXISTS public.trigger_performance_log (
    id BIGSERIAL PRIMARY KEY,
    trigger_name TEXT NOT NULL,
    venue_id UUID,
    execution_time_ms NUMERIC(10,2),
    operation TEXT, -- INSERT, UPDATE, DELETE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying recent performance
CREATE INDEX IF NOT EXISTS idx_trigger_perf_created 
ON public.trigger_performance_log(created_at DESC);

-- Index for querying by venue
CREATE INDEX IF NOT EXISTS idx_trigger_perf_venue 
ON public.trigger_performance_log(venue_id);

-- ============================================================================
-- 4. Enhanced Trigger Function with Detailed Logging (Optional)
-- ============================================================================

-- This version logs all executions to the performance table
-- Use this for detailed monitoring, but be aware it adds overhead
CREATE OR REPLACE FUNCTION update_venue_rating_with_logging()
RETURNS TRIGGER AS $
DECLARE
    v_venue_id UUID;
    v_aggregate_rating NUMERIC(2,1);
    v_review_count INTEGER;
    v_start_time TIMESTAMP;
    v_execution_time_ms NUMERIC(10,2);
    v_operation TEXT;
BEGIN
    v_start_time := clock_timestamp();
    v_venue_id := COALESCE(NEW.venue_id, OLD.venue_id);
    
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        v_operation := 'INSERT';
    ELSIF TG_OP = 'UPDATE' THEN
        v_operation := 'UPDATE';
    ELSIF TG_OP = 'DELETE' THEN
        v_operation := 'DELETE';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'venues') THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate aggregate rating and count
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
        COALESCE(COUNT(*), 0)
    INTO v_aggregate_rating, v_review_count
    FROM public.reviews 
    WHERE venue_id = v_venue_id;
    
    -- Update venue
    UPDATE public.venues
    SET 
        aggregate_rating = v_aggregate_rating,
        review_count = v_review_count
    WHERE id = v_venue_id;
    
    -- Calculate execution time in milliseconds
    v_execution_time_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time));
    
    -- Log to performance table
    INSERT INTO public.trigger_performance_log 
        (trigger_name, venue_id, execution_time_ms, operation)
    VALUES 
        ('update_venue_rating', v_venue_id, v_execution_time_ms, v_operation);
    
    -- Raise warning for slow executions
    IF v_execution_time_ms > 50 THEN
        RAISE WARNING 'Slow aggregate rating update: venue_id=%, operation=%, execution_time=%ms', 
            v_venue_id, v_operation, v_execution_time_ms;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_venue_rating_with_logging() IS 
'Enhanced trigger function with detailed performance logging. 
Logs all executions to trigger_performance_log table. 
Use for monitoring, but adds overhead.';

-- ============================================================================
-- 5. Trigger Performance Monitoring Queries
-- ============================================================================

-- Query to check average trigger execution time
CREATE OR REPLACE VIEW trigger_performance_summary AS
SELECT 
    trigger_name,
    operation,
    COUNT(*) as execution_count,
    ROUND(AVG(execution_time_ms), 2) as avg_time_ms,
    ROUND(MIN(execution_time_ms), 2) as min_time_ms,
    ROUND(MAX(execution_time_ms), 2) as max_time_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms), 2) as p95_time_ms,
    COUNT(*) FILTER (WHERE execution_time_ms > 50) as slow_executions
FROM public.trigger_performance_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY trigger_name, operation
ORDER BY avg_time_ms DESC;

COMMENT ON VIEW trigger_performance_summary IS 
'Summary of trigger performance over the last 24 hours';

-- ============================================================================
-- 6. Cleanup Old Performance Logs
-- ============================================================================

-- Function to clean up old performance logs (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_trigger_performance_logs()
RETURNS void AS $
BEGIN
    DELETE FROM public.trigger_performance_log
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Test Trigger Performance
-- ============================================================================

-- Test script to measure trigger execution time
DO $
DECLARE
    v_test_venue_id UUID;
    v_test_user_id UUID;
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_execution_time INTERVAL;
BEGIN
    -- Create test venue if it doesn't exist
    INSERT INTO public.venues (id, name, address, city, state, zip_code, latitude, longitude)
    VALUES (
        '00000000-0000-0000-0000-000000000099'::uuid,
        'Test Venue for Trigger Performance',
        '123 Test St',
        'Test City',
        'TS',
        '12345',
        0.0,
        0.0
    )
    ON CONFLICT (id) DO NOTHING;
    
    v_test_venue_id := '00000000-0000-0000-0000-000000000099'::uuid;
    v_test_user_id := '00000000-0000-0000-0000-000000000098'::uuid;
    
    -- Measure INSERT trigger performance
    v_start_time := clock_timestamp();
    
    INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
    VALUES (v_test_venue_id, v_test_user_id, 5, 'Test review for trigger performance')
    ON CONFLICT (user_id, venue_id) DO UPDATE SET rating = 5;
    
    v_end_time := clock_timestamp();
    v_execution_time := v_end_time - v_start_time;
    
    RAISE NOTICE 'Trigger execution time: %ms', EXTRACT(MILLISECONDS FROM v_execution_time);
    
    -- Clean up test data
    DELETE FROM public.reviews WHERE venue_id = v_test_venue_id;
    DELETE FROM public.venues WHERE id = v_test_venue_id;
    
    IF EXTRACT(MILLISECONDS FROM v_execution_time) < 50 THEN
        RAISE NOTICE '✓ Trigger performance is optimal (< 50ms)';
    ELSIF EXTRACT(MILLISECONDS FROM v_execution_time) < 100 THEN
        RAISE NOTICE '⚠ Trigger performance is acceptable (50-100ms)';
    ELSE
        RAISE WARNING '✗ Trigger performance needs optimization (> 100ms)';
    END IF;
END $;

-- ============================================================================
-- 8. Optimization Recommendations
-- ============================================================================

/*
OPTIMIZATION CHECKLIST:

1. ✓ Single query for AVG and COUNT (reduces database round trips)
2. ✓ COALESCE for NULL handling (avoids separate NULL checks)
3. ✓ Conditional trigger firing (WHEN clause on UPDATE)
4. ✓ Performance monitoring (warnings for slow executions)
5. ✓ Proper indexing (idx_reviews_venue_id for fast aggregation)

ADDITIONAL OPTIMIZATIONS IF NEEDED:

1. Materialized View Approach:
   - Create materialized view for aggregate ratings
   - Refresh on schedule instead of trigger
   - Trade-off: Slightly stale data vs. better write performance

2. Async Update Approach:
   - Queue rating updates instead of immediate calculation
   - Process queue in background job
   - Trade-off: Eventual consistency vs. real-time updates

3. Denormalization:
   - Store review count in separate counter table
   - Use atomic increment/decrement
   - Trade-off: More complex logic vs. faster updates

4. Partitioning:
   - Partition reviews table by venue_id or created_at
   - Reduces scan size for aggregate calculation
   - Trade-off: More complex schema vs. better performance at scale

CURRENT PERFORMANCE TARGET:
- Target: < 50ms per trigger execution
- Acceptable: < 100ms per trigger execution
- Needs optimization: > 100ms per trigger execution

MONITORING:
- Check trigger_performance_summary view regularly
- Alert if p95_time_ms > 100ms
- Investigate slow_executions > 5% of total
*/

-- ============================================================================
-- Success Message
-- ============================================================================

SELECT '✓ Aggregate rating trigger optimized successfully!' as status,
       'Run: SELECT * FROM trigger_performance_summary; to monitor performance' as next_step;
