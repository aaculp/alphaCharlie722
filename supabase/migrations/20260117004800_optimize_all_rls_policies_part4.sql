-- Part 4: venue_business_accounts, venue_push_notifications

-- VENUE_BUSINESS_ACCOUNTS
DROP POLICY IF EXISTS "Venue owners can view their own business accounts" ON public.venue_business_accounts;
CREATE POLICY "Venue owners can view their own business accounts"
  ON public.venue_business_accounts
  FOR SELECT
  USING ((SELECT auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Venue owners can update their own business accounts" ON public.venue_business_accounts;
CREATE POLICY "Venue owners can update their own business accounts"
  ON public.venue_business_accounts
  FOR UPDATE
  USING ((SELECT auth.uid()) = owner_user_id);

-- VENUE_PUSH_NOTIFICATIONS
DROP POLICY IF EXISTS "Venue owners can manage their own push notifications" ON public.venue_push_notifications;
CREATE POLICY "Venue owners can manage their own push notifications"
  ON public.venue_push_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts vba
      WHERE vba.id = venue_push_notifications.venue_business_account_id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );;
