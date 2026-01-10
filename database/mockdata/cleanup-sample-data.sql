-- Cleanup Sample Venue Analytics Data
-- Run this script to remove all the sample data created by sample-venue-analytics-data.sql

-- Remove venue contributions
DELETE FROM venue_contributions WHERE venue_id = 'sample-venue-001';

-- Remove push notifications
DELETE FROM venue_push_notifications WHERE venue_id = 'sample-venue-001';

-- Remove favorites
DELETE FROM favorites WHERE venue_id = 'sample-venue-001';

-- Remove reviews
DELETE FROM reviews WHERE venue_id = 'sample-venue-001';

-- Remove check-ins
DELETE FROM check_ins WHERE venue_id = 'sample-venue-001';

-- Remove venue business account
DELETE FROM venue_business_accounts WHERE id = 'sample-business-001';

-- Remove sample customers (profiles)
DELETE FROM profiles WHERE id LIKE 'customer-%';

-- Remove venue owner profile
DELETE FROM profiles WHERE id = 'sample-owner-001';

-- Remove venue
DELETE FROM venues WHERE id = 'sample-venue-001';

-- Note: We don't delete from auth.users as that might cause issues
-- The auth.users entry will remain but won't affect anything

SELECT 'Sample venue analytics data cleaned up successfully!' as result;