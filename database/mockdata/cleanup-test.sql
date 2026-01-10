-- Cleanup Test Data
-- This removes all test data created by the simple test scripts

-- Remove test check-ins
DELETE FROM check_ins 
WHERE venue_id IN (
  SELECT id FROM venues WHERE name = 'Test Analytics Cafe'
);

-- Remove test profiles
DELETE FROM profiles WHERE email LIKE 'testuser%@example.com';

-- Remove test venue
DELETE FROM venues WHERE name = 'Test Analytics Cafe';

SELECT '✅ Test data cleanup complete!' as message;