-- Part 2: user_tags, tag_likes, check_ins

-- USER_TAGS
DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.user_tags;
CREATE POLICY "Authenticated users can create tags"
  ON public.user_tags
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own tags" ON public.user_tags;
CREATE POLICY "Users can update own tags"
  ON public.user_tags
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own tags" ON public.user_tags;
CREATE POLICY "Users can delete own tags"
  ON public.user_tags
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- TAG_LIKES
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.tag_likes;
CREATE POLICY "Authenticated users can create likes"
  ON public.tag_likes
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.tag_likes;
CREATE POLICY "Users can delete own likes"
  ON public.tag_likes
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- CHECK_INS
DROP POLICY IF EXISTS "Authenticated users can create check ins" ON public.check_ins;
CREATE POLICY "Authenticated users can create check ins"
  ON public.check_ins
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own check ins" ON public.check_ins;
CREATE POLICY "Users can update own check ins"
  ON public.check_ins
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own check ins" ON public.check_ins;
CREATE POLICY "Users can delete own check ins"
  ON public.check_ins
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);;
