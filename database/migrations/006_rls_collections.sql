-- Migration: Implement RLS policies for collections
-- Description: Row Level Security policies with privacy level filtering
-- Requirements: 5.8, 13.10

-- Enable RLS on collections table
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view collections based on privacy level
DROP POLICY IF EXISTS "Users can view collections based on privacy" ON collections;
CREATE POLICY "Users can view collections based on privacy"
  ON collections FOR SELECT
  USING (
    -- Owner can always view their own collections
    user_id = auth.uid() OR
    -- Public collections are visible to everyone
    privacy_level = 'public' OR
    -- Friends-only collections are visible to friends
    (privacy_level = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = collections.user_id)
         OR (f.user_id_2 = auth.uid() AND f.user_id_1 = collections.user_id)
    )) OR
    -- Close friends collections are visible to close friends
    (privacy_level = 'close_friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = collections.user_id AND f.is_close_friend_2 = true)
         OR (f.user_id_2 = auth.uid() AND f.user_id_1 = collections.user_id AND f.is_close_friend_1 = true))
    ))
  );

-- Policy: Users can create their own collections
DROP POLICY IF EXISTS "Users can create their own collections" ON collections;
CREATE POLICY "Users can create their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own collections
DROP POLICY IF EXISTS "Users can update their own collections" ON collections;
CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own collections
DROP POLICY IF EXISTS "Users can delete their own collections" ON collections;
CREATE POLICY "Users can delete their own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on collection_venues table
ALTER TABLE collection_venues ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view collection venues if they can view the collection
DROP POLICY IF EXISTS "Users can view collection venues" ON collection_venues;
CREATE POLICY "Users can view collection venues"
  ON collection_venues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_venues.collection_id
        AND (
          c.user_id = auth.uid() OR
          c.privacy_level = 'public' OR
          (c.privacy_level = 'friends' AND EXISTS (
            SELECT 1 FROM friendships f
            WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = c.user_id)
               OR (f.user_id_2 = auth.uid() AND f.user_id_1 = c.user_id)
          )) OR
          (c.privacy_level = 'close_friends' AND EXISTS (
            SELECT 1 FROM friendships f
            WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = c.user_id AND f.is_close_friend_2 = true)
               OR (f.user_id_2 = auth.uid() AND f.user_id_1 = c.user_id AND f.is_close_friend_1 = true))
          ))
        )
    )
  );

-- Policy: Users can manage venues in their own collections
DROP POLICY IF EXISTS "Users can manage their collection venues" ON collection_venues;
CREATE POLICY "Users can manage their collection venues"
  ON collection_venues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_venues.collection_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_venues.collection_id
        AND c.user_id = auth.uid()
    )
  );
