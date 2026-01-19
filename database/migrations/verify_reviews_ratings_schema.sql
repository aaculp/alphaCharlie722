-- Verification Script: Venue Reviews & Ratings System Schema
-- Run this script to verify that all tables, indexes, triggers, and RLS policies are correctly set up

-- ============================================================================
-- Verify Tables Exist
-- ============================================================================

SELECT 'Checking if tables exist...' as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') 
        THEN '✓ reviews table exists'
        ELSE '✗ reviews table MISSING'
    END as reviews_table;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'helpful_votes') 
        THEN '✓ helpful_votes table exists'
        ELSE '✗ helpful_votes table MISSING'
    END as helpful_votes_table;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venue_responses') 
        THEN '✓ venue_responses table exists'
        ELSE '✗ venue_responses table MISSING'
    END as venue_responses_table;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_reports') 
        THEN '✓ review_reports table exists'
        ELSE '✗ review_reports table MISSING'
    END as review_reports_table;

-- ============================================================================
-- Verify Venues Table Columns
-- ============================================================================

SELECT 'Checking venues table columns...' as status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'venues' 
            AND column_name = 'aggregate_rating'
        ) 
        THEN '✓ venues.aggregate_rating column exists'
        ELSE '✗ venues.aggregate_rating column MISSING'
    END as aggregate_rating_column;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'venues' 
            AND column_name = 'review_count'
        ) 
        THEN '✓ venues.review_count column exists'
        ELSE '✗ venues.review_count column MISSING'
    END as review_count_column;

-- ============================================================================
-- Verify Indexes
-- ============================================================================

SELECT 'Checking indexes...' as status;

SELECT 
    indexname,
    tablename,
    '✓ Index exists' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports', 'venues')
AND indexname LIKE '%review%'
ORDER BY tablename, indexname;

-- ============================================================================
-- Verify Triggers
-- ============================================================================

SELECT 'Checking triggers...' as status;

SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation,
    '✓ Trigger exists' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('reviews', 'helpful_votes', 'venue_responses')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- Verify Functions
-- ============================================================================

SELECT 'Checking functions...' as status;

SELECT 
    routine_name,
    '✓ Function exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_venue_rating',
    'update_helpful_count',
    'set_verified_status',
    'update_reviews_updated_at'
)
ORDER BY routine_name;

-- ============================================================================
-- Verify RLS Policies
-- ============================================================================

SELECT 'Checking RLS policies...' as status;

SELECT 
    tablename,
    policyname,
    cmd as command,
    '✓ Policy exists' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tablename, policyname;

-- ============================================================================
-- Verify RLS is Enabled
-- ============================================================================

SELECT 'Checking RLS enabled status...' as status;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✓ RLS enabled'
        ELSE '✗ RLS DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tablename;

-- ============================================================================
-- Verify Constraints
-- ============================================================================

SELECT 'Checking constraints...' as status;

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    '✓ Constraint exists' as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- Summary
-- ============================================================================

SELECT 'Schema verification complete!' as status;
SELECT 'If all checks show ✓, the schema is correctly set up.' as note;
