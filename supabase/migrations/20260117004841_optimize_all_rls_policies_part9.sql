-- Part 9: privacy_settings, social_notifications

-- PRIVACY_SETTINGS - Consolidate duplicate policies
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can manage their own privacy settings"
  ON public.privacy_settings
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- SOCIAL_NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.social_notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.social_notifications
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.social_notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.social_notifications
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated users can create notifications for others" ON public.social_notifications;
CREATE POLICY "Authenticated users can create notifications for others"
  ON public.social_notifications
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = actor_id);;
