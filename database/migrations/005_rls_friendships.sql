-- Migration: Implement RLS policies for friendships
-- Description: Row Level Security policies for friendship management
-- Requirements: 13.10

-- Enable RLS on friendships table
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own friendships
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Policy: Users can create friendships (via friend request acceptance)
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Policy: Users can update their close friend designation
DROP POLICY IF EXISTS "Users can update close friend designation" ON friendships;
CREATE POLICY "Users can update close friend designation"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Policy: Users can delete their own friendships
DROP POLICY IF EXISTS "Users can delete their own friendships" ON friendships;
CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Enable RLS on friend_requests table
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view friend requests involving them
DROP POLICY IF EXISTS "Users can view friend requests involving them" ON friend_requests;
CREATE POLICY "Users can view friend requests involving them"
  ON friend_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Policy: Users can create friend requests
DROP POLICY IF EXISTS "Users can create friend requests" ON friend_requests;
CREATE POLICY "Users can create friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Policy: Recipients can update friend requests
DROP POLICY IF EXISTS "Recipients can update friend requests" ON friend_requests;
CREATE POLICY "Recipients can update friend requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Policy: Users can delete their own sent requests
DROP POLICY IF EXISTS "Users can delete their own sent requests" ON friend_requests;
CREATE POLICY "Users can delete their own sent requests"
  ON friend_requests FOR DELETE
  USING (auth.uid() = from_user_id);
