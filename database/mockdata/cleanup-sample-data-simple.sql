-- Cleanup Sample Analytics Data Script (Simple Version)
-- This script removes all sample data created by sample-venue-analytics-data-simple.sql

-- Remove check-ins
DELETE FROM check_ins WHERE venue_id = 'sample-venue-001';

-- Remove sample customer profiles
DELETE FROM profiles WHERE id LIKE 'customer-%';

-- Remove venue owner profile
DELETE FROM profiles WHERE id = 'sample-owner-001';

-- Remove venue
DELETE FROM venues WHERE id = 'sample-venue-001';

-- Success message
SELECT '✅ Sample analytics data cleanup complete!' as message;