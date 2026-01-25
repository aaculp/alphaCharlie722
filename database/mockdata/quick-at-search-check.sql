-- ============================================================================
-- QUICK @ Search Feature Data Check
-- ============================================================================
-- Purpose: Quick validation of data for @ search feature
-- Run this in Supabase SQL Editor for instant results
-- ============================================================================

-- 1. QUICK SUMMARY
SELECT 
  '📊 QUICK SUMMARY' AS section,
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE username IS NOT NULL) AS users_with_username,
  (SELECT COUNT(*) FROM profiles WHERE display_name IS NOT NULL) AS users_with_display_name,
  (SELECT COUNT(*) FROM venues) AS total_venues;

-- 2. SAMPLE USERS WITH USERNAMES (for testing @ search)
SELECT 
  '👤 SAMPLE SEARCHABLE USERS' AS section,
  '@' || username AS search_with_at,
  username,
  display_name,
  CASE 
    WHEN avatar_url IS NOT NULL THEN '✅ Has avatar'
    ELSE '❌ No avatar'
  END AS avatar_status
FROM profiles
WHERE username IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. USERS WITHOUT USERNAMES (not searchable via @)
SELECT 
  '⚠️ USERS WITHOUT USERNAMES' AS section,
  COUNT(*) AS count,
  'These users cannot be found via @ search' AS note
FROM profiles
WHERE username IS NULL;

-- 4. INVALID USERNAMES (if any)
SELECT 
  '❌ INVALID USERNAMES' AS section,
  username,
  CASE 
    WHEN LENGTH(username) < 3 THEN 'Too short (< 3 chars)'
    WHEN LENGTH(username) > 30 THEN 'Too long (> 30 chars)'
    WHEN username ~ '[A-Z]' THEN 'Contains uppercase'
    WHEN username ~ '[^a-z0-9_]' THEN 'Invalid characters'
  END AS issue
FROM profiles
WHERE username IS NOT NULL 
  AND username !~ '^[a-z0-9_]{3,30}$'
LIMIT 10;

-- 5. TEST SEARCH QUERY (simulate @ search)
SELECT 
  '🔍 TEST SEARCH: @test' AS section,
  id,
  username,
  display_name,
  avatar_url
FROM profiles
WHERE (username ILIKE '%test%' OR display_name ILIKE '%test%')
  AND username IS NOT NULL
LIMIT 5;

-- 6. DISPLAY NAMES THAT START WITH @ (potential confusion)
SELECT 
  '⚠️ DISPLAY NAMES WITH @' AS section,
  username,
  display_name,
  'Display name starts with @ - might confuse users' AS note
FROM profiles
WHERE display_name LIKE '@%'
LIMIT 10;

-- 7. READINESS CHECK
SELECT 
  '✅ FEATURE READINESS' AS section,
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles WHERE username IS NOT NULL AND username ~ '^[a-z0-9_]{3,30}$') > 0 
    THEN '✅ READY - Users can be searched via @'
    ELSE '❌ NOT READY - No valid usernames found'
  END AS status,
  (SELECT COUNT(*) FROM profiles WHERE username IS NOT NULL AND username ~ '^[a-z0-9_]{3,30}$') AS searchable_users;
