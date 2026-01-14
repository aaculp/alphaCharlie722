-- TROUBLESHOOTING: New Venues Spotlight Not Showing
-- Run this script in Supabase SQL Editor to diagnose the issue

-- ============================================
-- STEP 1: Check if venue_business_accounts table exists
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'venue_business_accounts'
) as table_exists;

-- ============================================
-- STEP 2: Check table structure
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'venue_business_accounts'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: Count total venues with business accounts
-- ============================================
SELECT 
  COUNT(DISTINCT v.id) as total_venues,
  COUNT(DISTINCT vba.venue_id) as venues_with_accounts,
  COUNT(DISTINCT CASE 
    WHEN vba.created_at >= NOW() - INTERVAL '30 days' 
    THEN vba.venue_id 
  END) as venues_within_30_days
FROM venues v
LEFT JOIN venue_business_accounts vba ON v.id = vba.venue_id;

-- ============================================
-- STEP 4: Check test venues specifically
-- ============================================
SELECT 
  v.id,
  v.name,
  v.category,
  vba.created_at as signup_date,
  EXTRACT(DAY FROM (NOW() - vba.created_at)) as days_ago,
  vba.account_status,
  vba.verification_status,
  CASE 
    WHEN vba.venue_id IS NULL THEN '❌ No business account'
    WHEN vba.created_at < NOW() - INTERVAL '30 days' THEN '❌ Too old (>30 days)'
    WHEN vba.account_status != 'active' THEN '❌ Not active'
    WHEN vba.verification_status != 'verified' THEN '❌ Not verified'
    ELSE '✅ Should appear'
  END as status
FROM venues v
LEFT JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE v.name IN (
  'The Fresh Brew',
  'Neon Nights Club',
  'Sunrise Yoga Studio',
  'Burger Bliss',
  'The Craft Tap Room',
  'Sushi Zen',
  'The Game Lounge',
  'Vegan Vibes',
  'The Rooftop Lounge',
  'Morning Glory Cafe'
)
ORDER BY vba.created_at DESC;

-- ============================================
-- STEP 5: Simulate the exact API query
-- ============================================
SELECT 
  v.*,
  vba.created_at as signup_date,
  vba.account_status,
  vba.verification_status
FROM venues v
INNER JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE vba.created_at >= NOW() - INTERVAL '30 days'
  AND vba.account_status = 'active'
  AND vba.verification_status = 'verified'
ORDER BY vba.created_at DESC
LIMIT 10;

-- ============================================
-- STEP 6: Check RLS policies on venue_business_accounts
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'venue_business_accounts';

-- ============================================
-- STEP 7: Check if RLS is enabled
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'venue_business_accounts';
