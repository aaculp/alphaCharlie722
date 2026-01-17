-- Verification Script for Flash Offers Migration
-- Run this script after applying migrations to verify everything is set up correctly

-- ============================================================================
-- Check Tables Exist
-- ============================================================================

SELECT 
  'Checking tables...' as step,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events');
-- Expected: 3 tables

-- ============================================================================
-- Check flash_offers Table Structure
-- ============================================================================

SELECT 
  'flash_offers columns' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'flash_offers'
ORDER BY ordinal_position;

-- ============================================================================
-- Check flash_offer_claims Table Structure
-- ============================================================================

SELECT 
  'flash_offer_claims columns' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'flash_offer_claims'
ORDER BY ordinal_position;

-- ============================================================================
-- Check flash_offer_events Table Structure
-- ============================================================================

SELECT 
  'flash_offer_events columns' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'flash_offer_events'
ORDER BY ordinal_position;

-- ============================================================================
-- Check Indexes
-- ============================================================================

SELECT 
  'Indexes' as check_type,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events')
ORDER BY tablename, indexname;

-- ============================================================================
-- Check Constraints
-- ============================================================================

SELECT 
  'Constraints' as check_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- Check Foreign Keys
-- ============================================================================

SELECT 
  'Foreign Keys' as check_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- Check RLS is Enabled
-- ============================================================================

SELECT 
  'RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events')
ORDER BY tablename;
-- Expected: rls_enabled = true for all tables

-- ============================================================================
-- Check RLS Policies
-- ============================================================================

SELECT 
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events')
ORDER BY tablename, policyname;

-- ============================================================================
-- Check Helper Functions
-- ============================================================================

SELECT 
  'Helper Functions' as check_type,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'expire_flash_offers',
  'expire_flash_offer_claims',
  'mark_full_flash_offers',
  'activate_scheduled_flash_offers',
  'update_flash_offers_updated_at'
)
ORDER BY routine_name;
-- Expected: 5 functions

-- ============================================================================
-- Check Triggers
-- ============================================================================

SELECT 
  'Triggers' as check_type,
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('flash_offers', 'flash_offer_claims')
ORDER BY event_object_table, trigger_name;
-- Expected: 2 triggers (one for each table)

-- ============================================================================
-- Summary Report
-- ============================================================================

SELECT 
  '=== VERIFICATION SUMMARY ===' as summary;

SELECT 
  'Tables Created' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 3 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events');

SELECT 
  'Indexes Created' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 15 THEN '✓ PASS' ELSE '⚠ CHECK' END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events');

SELECT 
  'RLS Enabled' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 3 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events')
AND rowsecurity = true;

SELECT 
  'RLS Policies Created' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 10 THEN '✓ PASS' ELSE '⚠ CHECK' END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('flash_offers', 'flash_offer_claims', 'flash_offer_events');

SELECT 
  'Helper Functions Created' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 5 THEN '✓ PASS' ELSE '⚠ CHECK' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'expire_flash_offers',
  'expire_flash_offer_claims',
  'mark_full_flash_offers',
  'activate_scheduled_flash_offers',
  'update_flash_offers_updated_at'
);

SELECT 
  'Triggers Created' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 2 THEN '✓ PASS' ELSE '⚠ CHECK' END as status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('flash_offers', 'flash_offer_claims');

SELECT 
  '=== END VERIFICATION ===' as summary;

-- ============================================================================
-- Quick Test (Optional - Uncomment to run)
-- ============================================================================

-- Test that we can query the tables (should return 0 rows)
-- SELECT 'Test Query: flash_offers' as test, COUNT(*) as row_count FROM flash_offers;
-- SELECT 'Test Query: flash_offer_claims' as test, COUNT(*) as row_count FROM flash_offer_claims;
-- SELECT 'Test Query: flash_offer_events' as test, COUNT(*) as row_count FROM flash_offer_events;
