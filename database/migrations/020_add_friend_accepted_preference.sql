-- Migration: Add friend_accepted notification preference
-- Description: Adds missing social notification columns to notification_preferences table
-- These columns were referenced in code but missing from the database schema

-- Add missing social notification preference columns
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS friend_accepted BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS follow_requests BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS new_followers BOOLEAN DEFAULT true;

-- Add comments for the new columns
COMMENT ON COLUMN notification_preferences.friend_accepted IS 'Receive notifications when someone accepts your friend request';
COMMENT ON COLUMN notification_preferences.follow_requests IS 'Receive notifications for follow requests';
COMMENT ON COLUMN notification_preferences.new_followers IS 'Receive notifications when someone follows you';
