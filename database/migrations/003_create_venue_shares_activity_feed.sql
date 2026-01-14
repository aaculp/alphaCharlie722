-- Migration: Create venue_shares and activity_feed tables
-- Description: Implements venue sharing and social activity feed with privacy levels
-- Requirements: 4.1, 3.1

-- Venue Shares table
CREATE TABLE IF NOT EXISTS venue_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  message TEXT,
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_shares_to ON venue_shares(to_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_shares_from ON venue_shares(from_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_shares_venue ON venue_shares(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_shares_unviewed ON venue_shares(to_user_id) WHERE viewed = false;

-- Activity Feed table
-- Note: group_outing_id is stored as UUID but not constrained since group_outings table is post-MVP
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('checkin', 'favorite', 'collection_created', 'collection_updated', 'group_outing')),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  group_outing_id UUID, -- No FK constraint - group_outings table is post-MVP
  privacy_level VARCHAR(20) NOT NULL CHECK (privacy_level IN ('public', 'friends', 'close_friends', 'private')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_privacy ON activity_feed(privacy_level);
CREATE INDEX IF NOT EXISTS idx_activity_feed_venue ON activity_feed(venue_id);
