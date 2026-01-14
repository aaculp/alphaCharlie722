-- Check if there are any check-ins in the database
-- Run this in Supabase SQL Editor to see if you have check-in data

-- ============================================
-- STEP 1: Check if check_ins table exists
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'check_ins'
) as table_exists;

-- ============================================
-- STEP 2: Count total check-ins
-- ============================================
SELECT COUNT(*) as total_checkins
FROM check_ins;

-- ============================================
-- STEP 3: Check recent check-ins (last 30 days)
-- ============================================
SELECT 
  ci.id,
  ci.user_id,
  ci.venue_id,
  ci.checked_in_at,
  ci.checked_out_at,
  v.name as venue_name,
  EXTRACT(DAY FROM (NOW() - ci.checked_in_at)) as days_ago
FROM check_ins ci
LEFT JOIN venues v ON ci.venue_id = v.id
WHERE ci.checked_in_at >= NOW() - INTERVAL '30 days'
ORDER BY ci.checked_in_at DESC
LIMIT 20;

-- ============================================
-- STEP 4: Check check-ins by user
-- ============================================
SELECT 
  user_id,
  COUNT(*) as checkin_count,
  MAX(checked_in_at) as last_checkin
FROM check_ins
WHERE checked_in_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY checkin_count DESC;

-- ============================================
-- STEP 5: Check if current user has check-ins
-- ============================================
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- You can find your user ID by running: SELECT id, email FROM auth.users;

-- First, show all users
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Then check check-ins for a specific user (uncomment and replace USER_ID)
-- SELECT 
--   ci.id,
--   ci.checked_in_at,
--   v.name as venue_name,
--   v.category
-- FROM check_ins ci
-- LEFT JOIN venues v ON ci.venue_id = v.id
-- WHERE ci.user_id = 'YOUR_USER_ID_HERE'
--   AND ci.checked_in_at >= NOW() - INTERVAL '30 days'
-- ORDER BY ci.checked_in_at DESC;
