-- Part 5: venues policies

-- VENUES - Consolidate duplicate policies and optimize
DROP POLICY IF EXISTS "venues_owner_insert" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can create venues" ON public.venues;
CREATE POLICY "Authenticated users can create venues"
  ON public.venues
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "venues_owner_update" ON public.venues;
DROP POLICY IF EXISTS "Venue owners can update their venues" ON public.venues;
CREATE POLICY "Venue owners can update their venues"
  ON public.venues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts vba
      WHERE vba.venue_id = venues.id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "venues_owner_delete" ON public.venues;
DROP POLICY IF EXISTS "Venue owners can delete their venues" ON public.venues;
CREATE POLICY "Venue owners can delete their venues"
  ON public.venues
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts vba
      WHERE vba.venue_id = venues.id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );;
