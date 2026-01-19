-- ============================================================================
-- Verify Database Indexes for Reviews System
-- ============================================================================
-- This script checks query execution plans to ensure indexes are being used
-- Requirements: 14.8, 18.3

-- ============================================================================
-- 1. Verify Reviews Table Indexes
-- ============================================================================

-- Test 1: Query reviews by venue_id (should use idx_reviews_venue_id)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.reviews 
WHERE venue_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY created_at DESC
LIMIT 20;

-- Test 2: Query reviews by venue_id and rating (should use idx_reviews_venue_rating)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.reviews 
WHERE venue_id = '00000000-0000-0000-0000-000000000001'::uuid 
AND rating = 5
ORDER BY created_at DESC
LIMIT 20;

-- Test 3: Query reviews sorted by helpful_count (should use idx_reviews_venue_helpful)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.reviews 
WHERE venue_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY helpful_count DESC
LIMIT 20;

-- Test 4: Query verified reviews only (should use idx_reviews_verified)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.reviews 
WHERE venue_id = '00000000-0000-0000-0000-000000000001'::uuid 
AND is_verified = true
ORDER BY created_at DESC
LIMIT 20;

-- Test 5: Query user's reviews (should use idx_reviews_user_id)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.reviews 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY created_at DESC;

-- ============================================================================
-- 2. Verify Helpful Votes Table Indexes
-- ============================================================================

-- Test 6: Query helpful votes by review_id (should use idx_helpful_votes_review_id)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) FROM public.helpful_votes 
WHERE review_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Test 7: Check if user voted on review (should use unique constraint index)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.helpful_votes 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid 
AND review_id = '00000000-0000-0000-0000-000000000002'::uuid;

-- ============================================================================
-- 3. Verify Venue Responses Table Indexes
-- ============================================================================

-- Test 8: Query response by review_id (should use idx_venue_responses_review_id)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.venue_responses 
WHERE review_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Test 9: Query responses by venue_id (should use idx_venue_responses_venue_id)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.venue_responses 
WHERE venue_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 4. Verify Review Reports Table Indexes
-- ============================================================================

-- Test 10: Query pending reports (should use idx_review_reports_pending)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.review_reports 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Test 11: Query reports by review_id (should use idx_review_reports_review_id)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) FROM public.review_reports 
WHERE review_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- ============================================================================
-- 5. Verify Venues Table Indexes
-- ============================================================================

-- Test 12: Query venues sorted by rating (should use idx_venues_aggregate_rating)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, aggregate_rating, review_count 
FROM public.venues 
WHERE aggregate_rating >= 4.5
ORDER BY aggregate_rating DESC
LIMIT 20;

-- ============================================================================
-- 6. Index Usage Statistics
-- ============================================================================

-- Show index usage statistics for reviews table
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. Index Size and Bloat Check
-- ============================================================================

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 8. Missing Index Recommendations
-- ============================================================================

-- Check for sequential scans that might benefit from indexes
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / NULLIF(seq_scan, 0) as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
AND seq_scan > 0
ORDER BY seq_tup_read DESC;

-- ============================================================================
-- 9. Verify Unique Constraints (Act as Indexes)
-- ============================================================================

-- List all constraints that act as indexes
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 10. Performance Recommendations
-- ============================================================================

-- Summary of index coverage
SELECT 
    'reviews' as table_name,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as custom_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE '%pkey%') as primary_keys,
    COUNT(*) FILTER (WHERE indexname LIKE '%unique%') as unique_constraints
FROM pg_indexes
WHERE tablename = 'reviews'
UNION ALL
SELECT 
    'helpful_votes',
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%'),
    COUNT(*) FILTER (WHERE indexname LIKE '%pkey%'),
    COUNT(*) FILTER (WHERE indexname LIKE '%unique%')
FROM pg_indexes
WHERE tablename = 'helpful_votes'
UNION ALL
SELECT 
    'venue_responses',
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%'),
    COUNT(*) FILTER (WHERE indexname LIKE '%pkey%'),
    COUNT(*) FILTER (WHERE indexname LIKE '%unique%')
FROM pg_indexes
WHERE tablename = 'venue_responses'
UNION ALL
SELECT 
    'review_reports',
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%'),
    COUNT(*) FILTER (WHERE indexname LIKE '%pkey%'),
    COUNT(*) FILTER (WHERE indexname LIKE '%unique%')
FROM pg_indexes
WHERE tablename = 'review_reports';

-- ============================================================================
-- Expected Results
-- ============================================================================
-- 
-- For optimal performance, EXPLAIN plans should show:
-- - "Index Scan" or "Index Only Scan" instead of "Seq Scan"
-- - "Bitmap Index Scan" for queries with multiple conditions
-- - Low "cost" values (typically < 100 for small tables)
-- - High "idx_scan" values in pg_stat_user_indexes
-- 
-- If you see "Seq Scan" frequently:
-- 1. Check if the table has enough rows (indexes aren't used for tiny tables)
-- 2. Run ANALYZE to update statistics: ANALYZE public.reviews;
-- 3. Consider adding missing indexes based on query patterns
-- 
-- ============================================================================

SELECT '✓ Index verification complete. Review EXPLAIN plans above.' as status;
