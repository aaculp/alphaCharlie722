-- Part 8: venue_shares, activity_feed

-- VENUE_SHARES
DROP POLICY IF EXISTS "Users can view their venue shares" ON public.venue_shares;
CREATE POLICY "Users can view their venue shares"
  ON public.venue_shares
  FOR SELECT
  USING ((SELECT auth.uid()) IN (from_user_id, to_user_id));

DROP POLICY IF EXISTS "Users can create venue shares" ON public.venue_shares;
CREATE POLICY "Users can create venue shares"
  ON public.venue_shares
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = from_user_id);

DROP POLICY IF EXISTS "Recipients can update venue shares" ON public.venue_shares;
CREATE POLICY "Recipients can update venue shares"
  ON public.venue_shares
  FOR UPDATE
  USING ((SELECT auth.uid()) = to_user_id);

-- ACTIVITY_FEED
DROP POLICY IF EXISTS "Users can view activity based on privacy" ON public.activity_feed;
CREATE POLICY "Users can view activity based on privacy"
  ON public.activity_feed
  FOR SELECT
  USING (
    privacy_level = 'public' OR
    user_id = (SELECT auth.uid()) OR
    (privacy_level = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id_1 = (SELECT auth.uid()) AND f.user_id_2 = activity_feed.user_id)
         OR (f.user_id_2 = (SELECT auth.uid()) AND f.user_id_1 = activity_feed.user_id)
    )) OR
    (privacy_level = 'close_friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE ((f.user_id_1 = (SELECT auth.uid()) AND f.user_id_2 = activity_feed.user_id AND f.is_close_friend_1)
         OR (f.user_id_2 = (SELECT auth.uid()) AND f.user_id_1 = activity_feed.user_id AND f.is_close_friend_2))
    ))
  );

DROP POLICY IF EXISTS "Users can create their own activities" ON public.activity_feed;
CREATE POLICY "Users can create their own activities"
  ON public.activity_feed
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);;
