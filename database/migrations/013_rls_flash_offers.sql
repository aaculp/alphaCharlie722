-- Migration: Implement RLS policies for flash offers
-- Description: Row Level Security policies for flash offer management
-- Requirements: Flash Offers MVP

-- ============================================================================
-- Flash Offers Table RLS
-- ============================================================================

-- Enable RLS on flash_offers table
ALTER TABLE flash_offers ENABLE ROW LEVEL SECURITY;

-- Policy: Venue owners can view their own offers
DROP POLICY IF EXISTS "Venue owners can view their own offers" ON flash_offers;
CREATE POLICY "Venue owners can view their own offers"
  ON flash_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts
      WHERE venue_business_accounts.venue_id = flash_offers.venue_id
      AND venue_business_accounts.owner_user_id = auth.uid()
    )
  );

-- Policy: Users can view active offers
DROP POLICY IF EXISTS "Users can view active offers" ON flash_offers;
CREATE POLICY "Users can view active offers"
  ON flash_offers FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND status = 'active'
    AND start_time <= NOW()
    AND end_time > NOW()
  );

-- Policy: Venue owners can create offers for their venues
DROP POLICY IF EXISTS "Venue owners can create offers" ON flash_offers;
CREATE POLICY "Venue owners can create offers"
  ON flash_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_business_accounts
      WHERE venue_business_accounts.venue_id = flash_offers.venue_id
      AND venue_business_accounts.owner_user_id = auth.uid()
    )
  );

-- Policy: Venue owners can update their own offers
DROP POLICY IF EXISTS "Venue owners can update their own offers" ON flash_offers;
CREATE POLICY "Venue owners can update their own offers"
  ON flash_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts
      WHERE venue_business_accounts.venue_id = flash_offers.venue_id
      AND venue_business_accounts.owner_user_id = auth.uid()
    )
  );

-- Policy: Venue owners can delete their own offers
DROP POLICY IF EXISTS "Venue owners can delete their own offers" ON flash_offers;
CREATE POLICY "Venue owners can delete their own offers"
  ON flash_offers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts
      WHERE venue_business_accounts.venue_id = flash_offers.venue_id
      AND venue_business_accounts.owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Flash Offer Claims Table RLS
-- ============================================================================

-- Enable RLS on flash_offer_claims table
ALTER TABLE flash_offer_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own claims
DROP POLICY IF EXISTS "Users can view their own claims" ON flash_offer_claims;
CREATE POLICY "Users can view their own claims"
  ON flash_offer_claims FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Venue staff can view claims for their venue's offers
DROP POLICY IF EXISTS "Venue staff can view claims for their offers" ON flash_offer_claims;
CREATE POLICY "Venue staff can view claims for their offers"
  ON flash_offer_claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flash_offers
      JOIN venue_business_accounts ON venue_business_accounts.venue_id = flash_offers.venue_id
      WHERE flash_offers.id = flash_offer_claims.offer_id
      AND venue_business_accounts.owner_user_id = auth.uid()
    )
  );

-- Policy: Users can create claims for themselves
DROP POLICY IF EXISTS "Users can create their own claims" ON flash_offer_claims;
CREATE POLICY "Users can create their own claims"
  ON flash_offer_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Venue staff can update claims for their venue's offers (for redemption)
DROP POLICY IF EXISTS "Venue staff can update claims for their offers" ON flash_offer_claims;
CREATE POLICY "Venue staff can update claims for their offers"
  ON flash_offer_claims FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM flash_offers
      JOIN venue_business_accounts ON venue_business_accounts.venue_id = flash_offers.venue_id
      WHERE flash_offers.id = flash_offer_claims.offer_id
      AND venue_business_accounts.owner_user_id = auth.uid()
    )
  );

-- Policy: Users can update their own claims (for status changes)
DROP POLICY IF EXISTS "Users can update their own claims" ON flash_offer_claims;
CREATE POLICY "Users can update their own claims"
  ON flash_offer_claims FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Flash Offer Events Table RLS
-- ============================================================================

-- Enable RLS on flash_offer_events table
ALTER TABLE flash_offer_events ENABLE ROW LEVEL SECURITY;

-- Policy: Venue owners can view events for their offers
DROP POLICY IF EXISTS "Venue owners can view events for their offers" ON flash_offer_events;
CREATE POLICY "Venue owners can view events for their offers"
  ON flash_offer_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flash_offers
      JOIN venue_business_accounts ON venue_business_accounts.venue_id = flash_offers.venue_id
      WHERE flash_offers.id = flash_offer_events.offer_id
      AND venue_business_accounts.owner_user_id = auth.uid()
    )
  );

-- Policy: Users can view their own events
DROP POLICY IF EXISTS "Users can view their own events" ON flash_offer_events;
CREATE POLICY "Users can view their own events"
  ON flash_offer_events FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert events (authenticated users for tracking)
DROP POLICY IF EXISTS "Authenticated users can create events" ON flash_offer_events;
CREATE POLICY "Authenticated users can create events"
  ON flash_offer_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON flash_offers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON flash_offer_claims TO authenticated;
GRANT SELECT, INSERT ON flash_offer_events TO authenticated;

-- Grant select to anonymous users for public offers (if needed in future)
-- GRANT SELECT ON flash_offers TO anon;

-- Success message
SELECT 'Flash offers RLS policies created successfully!' as message;
