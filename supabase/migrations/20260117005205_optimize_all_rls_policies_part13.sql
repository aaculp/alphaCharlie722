-- Part 13: flash_offer_events - Consolidate duplicate policies

-- FLASH_OFFER_EVENTS - Consolidate duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view their own events" ON public.flash_offer_events;
DROP POLICY IF EXISTS "Venue owners can view events for their offers" ON public.flash_offer_events;
CREATE POLICY "Users can view events"
  ON public.flash_offer_events
  FOR SELECT
  USING (
    -- Users can view their own events
    (SELECT auth.uid()) = user_id OR
    -- Venue owners can view events for their offers
    EXISTS (
      SELECT 1 FROM flash_offers fo
      JOIN venue_business_accounts vba ON vba.venue_id = fo.venue_id
      WHERE fo.id = flash_offer_events.offer_id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create events" ON public.flash_offer_events;
CREATE POLICY "Authenticated users can create events"
  ON public.flash_offer_events
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);;
