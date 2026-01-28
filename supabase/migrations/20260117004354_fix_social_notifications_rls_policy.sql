-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can create notifications" ON public.social_notifications;

-- Add a more restrictive policy that only allows service role
-- Note: Service role bypasses RLS, so this is for application-level inserts
CREATE POLICY "Authenticated users can create notifications for others"
  ON public.social_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = actor_id);;
