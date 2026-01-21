-- Quick fix: Add missing collection_follows column to notification_preferences
-- Run this in Supabase SQL Editor

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS collection_follows BOOLEAN DEFAULT true;

COMMENT ON COLUMN notification_preferences.collection_follows IS 'Receive notifications when someone follows your collection';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' 
AND column_name = 'collection_follows';
