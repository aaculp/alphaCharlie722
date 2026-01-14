-- Migration: Create friendships and friend_requests tables
-- Description: Implements bidirectional friendship system with close friend designation
-- Requirements: 1.2, 1.8, 1.9

-- Friendships table (bidirectional)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_close_friend_1 BOOLEAN DEFAULT false,
  is_close_friend_2 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure user_id_1 < user_id_2 for consistent ordering
  CONSTRAINT friendship_order CHECK (user_id_1 < user_id_2),
  CONSTRAINT no_self_friendship CHECK (user_id_1 != user_id_2),
  UNIQUE(user_id_1, user_id_2)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friendships_close1 ON friendships(user_id_1) WHERE is_close_friend_1 = true;
CREATE INDEX IF NOT EXISTS idx_friendships_close2 ON friendships(user_id_2) WHERE is_close_friend_2 = true;

-- Friend Requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_request CHECK (from_user_id != to_user_id),
  UNIQUE(from_user_id, to_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id);
