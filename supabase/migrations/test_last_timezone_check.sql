-- Test script for last_timezone_check migration
-- This script verifies the migration was applied correctly

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

-- Test 1: Verify column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' 
  AND column_name = 'last_timezone_check';

-- Expected result: 
-- column_name: last_timezone_check
-- data_type: timestamp with time zone
-- is_nullable: YES
-- column_default: NULL

-- Test 2: Verify column comment exists
SELECT 
  col_description('notification_preferences'::regclass, 
    (SELECT ordinal_position 
     FROM information_schema.columns 
     WHERE table_name = 'notification_preferences' 
       AND column_name = 'last_timezone_check')) AS column_comment;

-- Expected result: Should show the comment about timezone change detection

-- Test 3: Verify index exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'notification_preferences'
  AND indexname = 'idx_notification_prefs_last_tz_check';

-- Expected result: Should show the index definition

-- Test 4: Verify existing rows have NULL value
SELECT 
  COUNT(*) as total_rows,
  COUNT(last_timezone_check) as rows_with_value,
  COUNT(*) - COUNT(last_timezone_check) as rows_with_null
FROM notification_preferences;

-- Expected result: All existing rows should have NULL for last_timezone_check

-- Test 5: Test inserting a new row with last_timezone_check
DO $
BEGIN
  -- Create a test user if not exists (for testing only)
  -- In production, this would be done through the app
  
  -- Test insert with NULL (default)
  INSERT INTO notification_preferences (user_id, timezone)
  VALUES (gen_random_uuid(), 'America/New_York')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Test insert with explicit timestamp
  INSERT INTO notification_preferences (user_id, timezone, last_timezone_check)
  VALUES (gen_random_uuid(), 'Europe/London', NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Test inserts completed successfully';
END $;

-- Test 6: Test updating last_timezone_check
DO $
DECLARE
  test_user_id UUID;
BEGIN
  -- Get a user ID to test with
  SELECT user_id INTO test_user_id
  FROM notification_preferences
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Update the last_timezone_check
    UPDATE notification_preferences
    SET last_timezone_check = NOW()
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Test update completed successfully for user: %', test_user_id;
  ELSE
    RAISE NOTICE 'No users found to test update';
  END IF;
END $;

-- Test 7: Verify no data corruption
SELECT 
  user_id,
  timezone,
  quiet_hours_start,
  quiet_hours_end,
  last_timezone_check,
  created_at,
  updated_at
FROM notification_preferences
LIMIT 5;

-- Expected result: All existing columns should have their original values

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
  'Migration Verification Complete' as status,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'notification_preferences' 
     AND column_name = 'last_timezone_check') as column_exists,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE tablename = 'notification_preferences' 
     AND indexname = 'idx_notification_prefs_last_tz_check') as index_exists,
  (SELECT COUNT(*) FROM notification_preferences) as total_rows;

-- Expected result:
-- status: Migration Verification Complete
-- column_exists: 1
-- index_exists: 1
-- total_rows: (number of existing notification preference rows)
