-- Cleanup Sample Analytics Data Script (Fixed for Current Schema)
-- This script removes all sample data created by sample-venue-analytics-data-fixed.sql

-- Remove check-ins
DELETE FROM check_ins WHERE venue_id = 'sample-venue-001';

-- Remove reviews (if table exists)
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    DELETE FROM reviews WHERE venue_id = 'sample-venue-001';
  END IF;
END $;

-- Remove favorites (if table exists)
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
    DELETE FROM favorites WHERE venue_id = 'sample-venue-001';
  END IF;
END $;

-- Remove venue contributions (if table exists)
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'venue_contributions') THEN
    DELETE FROM venue_contributions WHERE venue_id = 'sample-venue-001';
  END IF;
END $;

-- Remove push notifications (if table exists)
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'venue_push_notifications') THEN
    DELETE FROM venue_push_notifications WHERE venue_id = 'sample-venue-001';
  END IF;
END $;

-- Remove venue business account (if table exists)
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'venue_business_accounts') THEN
    DELETE FROM venue_business_accounts WHERE venue_id = 'sample-venue-001';
  END IF;
END $;

-- Remove sample customer profiles
DELETE FROM profiles WHERE id LIKE 'customer-%';

-- Remove venue owner profile
DELETE FROM profiles WHERE id = 'sample-owner-001';

-- Remove venue
DELETE FROM venues WHERE id = 'sample-venue-001';

-- Note: We don't delete from auth.users as that might cause issues
-- The auth.users entry will remain but won't affect anything

SELECT '✅ Sample analytics data cleanup complete!' as message;