-- Migration: Create privacy_settings and social_notifications tables
-- Description: Implements 4-tier privacy system and social notifications
-- Requirements: 8.1-8.5, 9.1

-- Privacy Settings table
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  checkin_visibility VARCHAR(20) DEFAULT 'friends' CHECK (checkin_visibility IN ('public', 'friends', 'close_friends', 'private')),
  favorite_visibility VARCHAR(20) DEFAULT 'friends' CHECK (favorite_visibility IN ('public', 'friends', 'close_friends', 'private')),
  default_collection_visibility VARCHAR(20) DEFAULT 'friends' CHECK (default_collection_visibility IN ('public', 'friends', 'close_friends', 'private')),
  allow_follow_requests BOOLEAN DEFAULT true,
  show_activity_status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Notifications table
CREATE TABLE IF NOT EXISTS social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reference_id UUID,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_unread ON social_notifications(user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_social_notifications_type ON social_notifications(type);
CREATE INDEX IF NOT EXISTS idx_social_notifications_created ON social_notifications(created_at DESC);

-- Trigger to create default privacy settings for new users
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_create_default_privacy_settings ON profiles;
CREATE TRIGGER trigger_create_default_privacy_settings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_privacy_settings();
