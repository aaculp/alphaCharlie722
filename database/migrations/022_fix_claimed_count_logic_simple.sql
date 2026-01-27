-- Migration: Fix claimed_count to only increment on redemption
-- Description: Changes claimed_count logic to increment only when venue redeems the claim, not when user claims

-- ============================================================================
-- Step 1: Update atomic claim function to NOT increment claimed_count
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_flash_offer_atomic(
  p_offer_id UUID,
  p_user_id UUID,
  p_token VARCHAR(6),
  p_expires_at TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  offer_id UUID,
  user_id UUID,
  token VARCHAR(6),
  status VARCHAR(20),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
  v_claim RECORD;
BEGIN
  -- Lock the offer row for update
  SELECT * INTO v_offer
  FROM flash_offers
  WHERE flash_offers.id = p_offer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.status != 'active' THEN
    RAISE EXCEPTION 'Offer is not active';
  END IF;

  IF v_offer.end_time < NOW() THEN
    RAISE EXCEPTION 'Offer has expired';
  END IF;

  IF v_offer.claimed_count >= v_offer.max_claims THEN
    RAISE EXCEPTION 'Offer has reached maximum claims';
  END IF;

  IF EXISTS (
    SELECT 1 FROM flash_offer_claims
    WHERE flash_offer_claims.offer_id = p_offer_id
    AND flash_offer_claims.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User has already claimed this offer';
  END IF;

  -- Create the claim (NOT incrementing claimed_count)
  INSERT INTO flash_offer_claims (
    offer_id,
    user_id,
    token,
    expires_at,
    status
  ) VALUES (
    p_offer_id,
    p_user_id,
    p_token,
    p_expires_at,
    'active'
  )
  RETURNING * INTO v_claim;

  RETURN QUERY
  SELECT 
    v_claim.id,
    v_claim.offer_id,
    v_claim.user_id,
    v_claim.token,
    v_claim.status,
    v_claim.redeemed_at,
    v_claim.redeemed_by_user_id,
    v_claim.expires_at,
    v_claim.created_at,
    v_claim.updated_at;
END;
$$;

-- ============================================================================
-- Step 2: Create trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_claimed_count_on_redemption()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
  v_offer RECORD;
  v_new_count INTEGER;
BEGIN
  IF NEW.status = 'redeemed' AND (OLD.status IS NULL OR OLD.status != 'redeemed') THEN
    SELECT * INTO v_offer
    FROM flash_offers
    WHERE id = NEW.offer_id
    FOR UPDATE;

    v_new_count := v_offer.claimed_count + 1;

    UPDATE flash_offers
    SET 
      claimed_count = v_new_count,
      status = CASE 
        WHEN v_new_count >= v_offer.max_claims THEN 'full'::VARCHAR(20)
        ELSE flash_offers.status
      END,
      updated_at = NOW()
    WHERE id = NEW.offer_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Step 3: Create trigger
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_claimed_count_on_redemption ON flash_offer_claims;

CREATE TRIGGER trigger_update_claimed_count_on_redemption
  AFTER UPDATE OF status ON flash_offer_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_claimed_count_on_redemption();

-- ============================================================================
-- Step 4: Reset claimed_count for existing offers
-- ============================================================================

UPDATE flash_offers
SET claimed_count = (
  SELECT COUNT(*)
  FROM flash_offer_claims
  WHERE flash_offer_claims.offer_id = flash_offers.id
  AND flash_offer_claims.status = 'redeemed'
);

UPDATE flash_offers
SET status = 'full'
WHERE claimed_count >= max_claims
AND status = 'active';

-- Success
SELECT 'Fixed claimed_count logic!' as message;
