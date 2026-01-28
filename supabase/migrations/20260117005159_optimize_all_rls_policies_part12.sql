-- Part 12: flash_offer_claims - Consolidate duplicate policies

-- FLASH_OFFER_CLAIMS - Consolidate duplicate SELECT and UPDATE policies
DROP POLICY IF EXISTS "Users can view their own claims" ON public.flash_offer_claims;
DROP POLICY IF EXISTS "Venue staff can view claims for their offers" ON public.flash_offer_claims;
CREATE POLICY "Users can view claims"
  ON public.flash_offer_claims
  FOR SELECT
  USING (
    -- Users can view their own claims
    (SELECT auth.uid()) = user_id OR
    -- Venue staff can view claims for their offers
    EXISTS (
      SELECT 1 FROM flash_offers fo
      JOIN venue_business_accounts vba ON vba.venue_id = fo.venue_id
      WHERE fo.id = flash_offer_claims.offer_id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create their own claims" ON public.flash_offer_claims;
CREATE POLICY "Users can create their own claims"
  ON public.flash_offer_claims
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own claims" ON public.flash_offer_claims;
DROP POLICY IF EXISTS "Venue staff can update claims for their offers" ON public.flash_offer_claims;
CREATE POLICY "Users can update claims"
  ON public.flash_offer_claims
  FOR UPDATE
  USING (
    -- Users can update their own claims
    (SELECT auth.uid()) = user_id OR
    -- Venue staff can update claims for their offers
    EXISTS (
      SELECT 1 FROM flash_offers fo
      JOIN venue_business_accounts vba ON vba.venue_id = fo.venue_id
      WHERE fo.id = flash_offer_claims.offer_id
      AND vba.owner_user_id = (SELECT auth.uid())
    )
  );;
