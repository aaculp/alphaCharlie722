-- Migration: Add social notification preference columns
-- Description: Extends notification_preferences table with social notification settings
-- Requirements: Social friend system notification preferences

-- Add social notification preference columns to notification_preferences table
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS friend_requests BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS venue_shares BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS collection_updates BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activity_likes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activity_comments BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS group_outing_invites BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS group_outing_reminders BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS friend_checkins_nearby BOOLEAN DEFAULT true;

-- Add comments for new columns
COMMENT ON COLUMN notification_preferences.friend_requests IS 'Receive notifications for friend requests';
COMMENT ON COLUMN notification_preferences.venue_shares IS 'Receive notifications when friends share venues';
COMMENT ON COLUMN notification_preferences.collection_updates IS 'Receive notifications for collection updates from followed users';
COMMENT ON COLUMN notification_preferences.activity_likes IS 'Receive notifications when someone likes your activity';
COMMENT ON COLUMN notification_preferences.activity_comments IS 'Receive notifications for comments on your activity';
COMMENT ON COLUMN notification_preferences.group_outing_invites IS 'Receive notifications for group outing invitations';
COMMENT ON COLUMN notification_preferences.group_outing_reminders IS 'Receive notifications for group outing reminders';
COMMENT ON COLUMN notification_preferences.friend_checkins_nearby IS 'Receive notifications when friends check in nearby';
