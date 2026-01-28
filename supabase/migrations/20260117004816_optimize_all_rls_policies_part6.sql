-- Part 6: friendships, friend_requests

-- FRIENDSHIPS
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships"
  ON public.friendships
  FOR SELECT
  USING ((SELECT auth.uid()) IN (user_id_1, user_id_2));

DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships"
  ON public.friendships
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IN (user_id_1, user_id_2));

DROP POLICY IF EXISTS "Users can update close friend designation" ON public.friendships;
CREATE POLICY "Users can update close friend designation"
  ON public.friendships
  FOR UPDATE
  USING ((SELECT auth.uid()) IN (user_id_1, user_id_2));

DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;
CREATE POLICY "Users can delete their own friendships"
  ON public.friendships
  FOR DELETE
  USING ((SELECT auth.uid()) IN (user_id_1, user_id_2));

-- FRIEND_REQUESTS
DROP POLICY IF EXISTS "Users can view friend requests involving them" ON public.friend_requests;
CREATE POLICY "Users can view friend requests involving them"
  ON public.friend_requests
  FOR SELECT
  USING ((SELECT auth.uid()) IN (from_user_id, to_user_id));

DROP POLICY IF EXISTS "Users can create friend requests" ON public.friend_requests;
CREATE POLICY "Users can create friend requests"
  ON public.friend_requests
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = from_user_id);

DROP POLICY IF EXISTS "Recipients can update friend requests" ON public.friend_requests;
CREATE POLICY "Recipients can update friend requests"
  ON public.friend_requests
  FOR UPDATE
  USING ((SELECT auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "Users can delete their own sent requests" ON public.friend_requests;
CREATE POLICY "Users can delete their own sent requests"
  ON public.friend_requests
  FOR DELETE
  USING ((SELECT auth.uid()) = from_user_id);;
