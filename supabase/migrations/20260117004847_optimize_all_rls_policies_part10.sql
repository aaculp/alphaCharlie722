-- Part 10: notification_reports

-- NOTIFICATION_REPORTS
DROP POLICY IF EXISTS "notification_reports_select_own" ON public.notification_reports;
CREATE POLICY "notification_reports_select_own"
  ON public.notification_reports
  FOR SELECT
  USING ((SELECT auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "notification_reports_insert_own" ON public.notification_reports;
CREATE POLICY "notification_reports_insert_own"
  ON public.notification_reports
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "notification_reports_update_own" ON public.notification_reports;
CREATE POLICY "notification_reports_update_own"
  ON public.notification_reports
  FOR UPDATE
  USING ((SELECT auth.uid()) = reporter_id);;
