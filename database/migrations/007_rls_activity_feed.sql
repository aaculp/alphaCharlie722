-- Migration: Implement RLS policies for activity_feed
-- Description: Row Level Security with privacy and relationship filtering
-- Requirements: 3.6, 13.10

-- Enable RLS on activity_feed table
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activity feed based on privacy and relationships
DROP POLICY IF EXISTS "Users can view activity based on privacy" ON activity_feed;
CREATE POLICY "Users can view activity based on privacy"
  ON activity_feed FOR SELECT
  USING (
    -- Owner can always view their own activities
    user_id = auth.uid() OR
    -- Public activities are visible to everyone
    privacy_level = 'public' OR
    -- Friends-only activities are visible to friends
    (privacy_level = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = activity_feed.user_id)
         OR (f.user_id_2 = auth.uid() AND f.user_id_1 = activity_feed.user_id)
    )) OR
    -- Close friends activities are visible to close friends
    (privacy_level = 'close_friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = activity_feed.user_id AND f.is_close_friend_2 = true)
         OR (f.user_id_2 = auth.uid() AND f.user_id_1 = activity_feed.user_id AND f.is_close_friend_1 = true))
    ))
  );

-- Policy: Users can create their own activities
DROP POLICY IF EXISTS "Users can create their own activities" ON activity_feed;
CREATE POLICY "Users can create their own activities"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on venue_shares table
ALTER TABLE venue_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shares they sent or received
DROP POLICY IF EXISTS "Users can view their venue shares" ON venue_shares;
CREATE POLICY "Users can view their venue shares"
  ON venue_shares FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Policy: Users can create venue shares
DROP POLICY IF EXISTS "Users can create venue shares" ON venue_shares;
CREATE POLICY "Users can create venue shares"
  ON venue_shares FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Policy: Recipients can update shares (mark as viewed)
DROP POLICY IF EXISTS "Recipients can update venue shares" ON venue_shares;
CREATE POLICY "Recipients can update venue shares"
  ON venue_shares FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Enable RLS on privacy_settings table
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own privacy settings
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON privacy_settings;
CREATE POLICY "Users can view their own privacy settings"
  ON privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own privacy settings
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON privacy_settings;
CREATE POLICY "Users can update their own privacy settings"
  ON privacy_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on social_notifications table
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON social_notifications;
CREATE POLICY "Users can view their own notifications"
  ON social_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON social_notifications;
CREATE POLICY "Users can update their own notifications"
  ON social_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System can create notifications for users
DROP POLICY IF EXISTS "System can create notifications" ON social_notifications;
CREATE POLICY "System can create notifications"
  ON social_notifications FOR INSERT
  WITH CHECK (true);
