-- Migration: Create database helper functions
-- Description: Helper functions for relationship checks and queries
-- Requirements: 10.3

-- Function: Check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id_1 = LEAST(user1_id, user2_id) AND user_id_2 = GREATEST(user1_id, user2_id))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user1 marked user2 as close friend
CREATE OR REPLACE FUNCTION is_close_friend(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_close BOOLEAN;
BEGIN
  SELECT CASE
    WHEN user_id_1 = user1_id THEN is_close_friend_1
    WHEN user_id_2 = user1_id THEN is_close_friend_2
    ELSE false
  END INTO is_close
  FROM friendships
  WHERE (user_id_1 = LEAST(user1_id, user2_id) AND user_id_2 = GREATEST(user1_id, user2_id));
  
  RETURN COALESCE(is_close, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get mutual friends between two users
CREATE OR REPLACE FUNCTION get_mutual_friends(user1_id UUID, user2_id UUID)
RETURNS TABLE(user_id UUID, name TEXT, avatar_url TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id, p.name, p.avatar_url
  FROM profiles p
  WHERE p.id IN (
    -- Friends of user1
    SELECT CASE 
      WHEN f1.user_id_1 = user1_id THEN f1.user_id_2
      ELSE f1.user_id_1
    END
    FROM friendships f1
    WHERE user1_id IN (f1.user_id_1, f1.user_id_2)
    
    INTERSECT
    
    -- Friends of user2
    SELECT CASE 
      WHEN f2.user_id_1 = user2_id THEN f2.user_id_2
      ELSE f2.user_id_1
    END
    FROM friendships f2
    WHERE user2_id IN (f2.user_id_1, f2.user_id_2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get activity feed for a user with privacy filtering
CREATE OR REPLACE FUNCTION get_activity_feed(
  viewer_id UUID,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  activity_type VARCHAR,
  venue_id UUID,
  collection_id UUID,
  group_outing_id UUID,
  privacy_level VARCHAR,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id,
    af.user_id,
    af.activity_type,
    af.venue_id,
    af.collection_id,
    af.group_outing_id,
    af.privacy_level,
    af.metadata,
    af.created_at
  FROM activity_feed af
  WHERE 
    -- Privacy filtering
    (
      af.user_id = viewer_id OR
      af.privacy_level = 'public' OR
      (af.privacy_level = 'friends' AND are_friends(viewer_id, af.user_id)) OR
      (af.privacy_level = 'close_friends' AND is_close_friend(af.user_id, viewer_id))
    )
  ORDER BY af.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get friend count for a user
CREATE OR REPLACE FUNCTION get_friend_count(for_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM friendships
  WHERE for_user_id IN (user_id_1, user_id_2);
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get all friends for a user
CREATE OR REPLACE FUNCTION get_friends(for_user_id UUID)
RETURNS TABLE(
  friend_id UUID,
  is_close_friend BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user_id_1 = for_user_id THEN f.user_id_2
      ELSE f.user_id_1
    END AS friend_id,
    CASE 
      WHEN f.user_id_1 = for_user_id THEN f.is_close_friend_1
      ELSE f.is_close_friend_2
    END AS is_close_friend,
    f.created_at
  FROM friendships f
  WHERE for_user_id IN (f.user_id_1, f.user_id_2)
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
