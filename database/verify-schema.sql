-- Quick Schema Verification
-- Run this with: supabase db execute --file database/verify-schema.sql

\echo '========================================'
\echo 'Schema Verification'
\echo '========================================'
\echo ''

\echo 'TEST 1: Check if review tables exist'
SELECT 
    tablename,
    '✅' as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tablename;

\echo ''
\echo 'TEST 2: Check venues table columns'
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'venues'
    AND column_name IN ('aggregate_rating', 'review_count')
ORDER BY column_name;

\echo ''
\echo 'TEST 3: Check database triggers'
SELECT 
    tgname as trigger_name
FROM pg_trigger 
WHERE tgname LIKE '%review%' OR tgname LIKE '%helpful%'
ORDER BY tgname;

\echo ''
\echo 'TEST 4: Check RLS policies'
SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
ORDER BY tablename, policyname;

\echo ''
\echo 'TEST 5: Get test venue'
SELECT 
    id,
    name,
    COALESCE(aggregate_rating, 0) as aggregate_rating,
    COALESCE(review_count, 0) as review_count
FROM venues 
LIMIT 1;

\echo ''
\echo 'TEST 6: Check existing reviews'
SELECT 
    COUNT(*) as total_reviews,
    COUNT(DISTINCT venue_id) as venues_with_reviews,
    COUNT(DISTINCT user_id) as users_who_reviewed
FROM reviews;

\echo ''
\echo '========================================'
\echo 'Verification Complete!'
\echo '========================================'
