-- Migration: Add last_timezone_check column to notification_preferences table
-- Date: 2026-01-25
-- Requirements: 5.7
-- Description: Adds a timestamp column to track when timezone was last checked for change detection

-- Add last_timezone_check column to notification_preferences table
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS last_timezone_check TIMESTAMPTZ DEFAULT NULL;

-- Add comment explaining the column purpose
COMMENT ON COLUMN notification_preferences.last_timezone_check IS 
  'Timestamp of last timezone change detection check. Used to implement 7-day cooldown period for timezone change prompts. NULL indicates timezone has never been checked.';

-- Create index for efficient queries on last_timezone_check
-- This helps when checking if enough time has passed since last check
CREATE INDEX IF NOT EXISTS idx_notification_prefs_last_tz_check 
  ON notification_preferences(last_timezone_check) 
  WHERE last_timezone_check IS NOT NULL;
