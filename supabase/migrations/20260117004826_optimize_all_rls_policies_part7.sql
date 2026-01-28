-- Part 7: collections, collection_venues

-- COLLECTIONS
DROP POLICY IF EXISTS "Users can view collections based on privacy" ON public.collections;
CREATE POLICY "Users can view collections based on privacy"
  ON public.collections
  FOR SELECT
  USING (
    privacy_level = 'public' OR
    user_id = (SELECT auth.uid()) OR
    (privacy_level = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id_1 = (SELECT auth.uid()) AND f.user_id_2 = collections.user_id)
         OR (f.user_id_2 = (SELECT auth.uid()) AND f.user_id_1 = collections.user_id)
    )) OR
    (privacy_level = 'close_friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE ((f.user_id_1 = (SELECT auth.uid()) AND f.user_id_2 = collections.user_id AND f.is_close_friend_1)
         OR (f.user_id_2 = (SELECT auth.uid()) AND f.user_id_1 = collections.user_id AND f.is_close_friend_2))
    ))
  );

DROP POLICY IF EXISTS "Users can create their own collections" ON public.collections;
CREATE POLICY "Users can create their own collections"
  ON public.collections
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;
CREATE POLICY "Users can update their own collections"
  ON public.collections
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own collections" ON public.collections;
CREATE POLICY "Users can delete their own collections"
  ON public.collections
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- COLLECTION_VENUES - Consolidate duplicate policies
DROP POLICY IF EXISTS "Users can view collection venues" ON public.collection_venues;
DROP POLICY IF EXISTS "Users can manage their collection venues" ON public.collection_venues;
CREATE POLICY "Users can view and manage collection venues"
  ON public.collection_venues
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_venues.collection_id
      AND (
        c.privacy_level = 'public' OR
        c.user_id = (SELECT auth.uid()) OR
        (c.privacy_level = 'friends' AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user_id_1 = (SELECT auth.uid()) AND f.user_id_2 = c.user_id)
             OR (f.user_id_2 = (SELECT auth.uid()) AND f.user_id_1 = c.user_id)
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_venues.collection_id
      AND c.user_id = (SELECT auth.uid())
    )
  );;
