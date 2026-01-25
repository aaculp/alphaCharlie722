-- ============================================================================
-- INSTANT @ Search Test
-- ============================================================================
-- Copy this entire script and paste into Supabase SQL Editor
-- Click RUN to see if @ search will work with your current data
-- ============================================================================

-- Show current status
SELECT 
  '🎯 @ SEARCH FEATURE STATUS' AS "Check",
  '' AS "Result";

-- Count users
SELECT 
  '👥 Total Users' AS "Check",
  COUNT(*)::TEXT AS "Result"
FROM profiles;

-- Count users with usernames
SELECT 
  '✅ Users with Usernames (Searchable)' AS "Check",
  COUNT(*)::TEXT AS "Result"
FROM profiles
WHERE username IS NOT NULL;

-- Count users without usernames
SELECT 
  '❌ Users without Usernames (Not Searchable)' AS "Check",
  COUNT(*)::TEXT AS "Result"
FROM profiles
WHERE username IS NULL;

-- Show sample searchable users
SELECT 
  '📋 Sample Searchable Users' AS "Check",
  '' AS "Result";

SELECT 
  '   @' || username AS "Search Query",
  COALESCE(display_name, username) AS "Display Name"
FROM profiles
WHERE username IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Test actual search
SELECT 
  '🔍 Test Search Results' AS "Check",
  '' AS "Result";

-- Try searching for common terms
WITH search_tests AS (
  SELECT 'test' AS term
  UNION ALL SELECT 'user'
  UNION ALL SELECT 'admin'
  UNION ALL SELECT 'john'
)
SELECT 
  '   @' || st.term AS "Search Query",
  COUNT(p.id)::TEXT || ' results' AS "Result"
FROM search_tests st
LEFT JOIN profiles p ON (
  p.username ILIKE '%' || st.term || '%' 
  OR p.display_name ILIKE '%' || st.term || '%'
) AND p.username IS NOT NULL
GROUP BY st.term
ORDER BY st.term;

-- Final verdict
SELECT 
  '🎬 FINAL VERDICT' AS "Check",
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles WHERE username IS NOT NULL) > 0 
    THEN '✅ READY - @ search will work!'
    ELSE '⚠️ NO USERNAMES - Feature works but no results yet'
  END AS "Result";

-- Quick recommendations
SELECT 
  '💡 RECOMMENDATIONS' AS "Check",
  '' AS "Result";

SELECT 
  '   ' || 
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles WHERE username IS NOT NULL) = 0 
    THEN 'Create test users with usernames to test @ search'
    WHEN (SELECT COUNT(*) FROM profiles WHERE username IS NOT NULL) < 5
    THEN 'Add more users with usernames for better testing'
    ELSE 'You have enough test data - try @ search in the app!'
  END AS "Recommendation",
  '' AS "Result";
