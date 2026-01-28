-- Part 11: flash_offers - Consolidate duplicate policies

-- FLASH_OFFERS - Consolidate duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view active offers" ON public.flash_offers;
DROP POLICY IF EXISTS "Venue owners can view their own offers" ON public.flash_offers;
CREATE POLICY "Users can view offers"
  ON public.flash_offers
  FOR SELECT
  USING (
    -- Users can view active offers
    (status = 'active' AND (SELECT auth.uid()) IS NOT NULL) OR
    -- Venue owners can view their own offers
    EXISTS (
      SELECT 1 FROM venue_business_accounts vba
      WHERE vba.venue_id = flash_offers.venue_id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Venue owners can create offers" ON public.flash_offers;
CREATE POLICY "Venue owners can create offers"
  ON public.flash_offers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_business_accounts vba
      WHERE vba.venue_id = flash_offers.venue_id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Venue owners can update their own offers" ON public.flash_offers;
CREATE POLICY "Venue owners can update their own offers"
  ON public.flash_offers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts vba
      WHERE vba.venue_id = flash_offers.venue_id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Venue owners can delete their own offers" ON public.flash_offers;
CREATE POLICY "Venue owners can delete their own offers"
  ON public.flash_offers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts vba
      WHERE vba.venue_id = flash_offers.venue_id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );;
