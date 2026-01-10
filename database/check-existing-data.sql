-- Check what data already exists for testing

-- 1. Check existing venues
SELECT 'VENUES' as table_name, COUNT(*) as count FROM venues
UNION ALL
SELECT 'PROFILES' as table_name, COUNT(*) as count FROM profiles  
UNION ALL
SELECT 'CHECK_INS' as table_name, COUNT(*) as count FROM check_ins;

-- 2. Show existing venues with their IDs
SELECT 
  id,
  name,
  category,
  rating,
  review_count
FROM venues 
ORDER BY name
LIMIT 10;

-- 3. Check if any venues have check-ins
SELECT 
  v.name,
  v.id,
  COUNT(c.id) as checkin_count,
  COUNT(CASE WHEN c.is_active THEN 1 END) as active_checkins
FROM venues v
LEFT JOIN check_ins c ON v.id = c.venue_id
GROUP BY v.id, v.name
ORDER BY checkin_count DESC
LIMIT 10;