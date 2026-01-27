-- Migration: Fix ambiguous status column reference in atomic claim function
-- Description: Fixes "column reference 'status' is ambiguous" error in claim_flash_offer_atomic function
-- Issue: The CASE statement referenced 'status' without table qualification, causing ambiguity

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
) AS $$
DECLARE
  v_offer RECORD;
  v_claim RECORD;
  v_new_count INTEGER;
BEGIN
  -- Lock the offer row for update (prevents concurrent modifications)
  SELECT * INTO v_offer
  FROM flash_offers
  WHERE flash_offers.id = p_offer_id
  FOR UPDATE;

  -- Check if offer exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  -- Check if offer is active
  IF v_offer.status != 'active' THEN
    RAISE EXCEPTION 'Offer is not active';
  END IF;

  -- Check if offer has expired
  IF v_offer.end_time < NOW() THEN
    RAISE EXCEPTION 'Offer has expired';
  END IF;

  -- Check if offer is full
  IF v_offer.claimed_count >= v_offer.max_claims THEN
    RAISE EXCEPTION 'Offer has reached maximum claims';
  END IF;

  -- Check if user has already claimed this offer
  IF EXISTS (
    SELECT 1 FROM flash_offer_claims
    WHERE flash_offer_claims.offer_id = p_offer_id
    AND flash_offer_claims.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User has already claimed this offer';
  END IF;

  -- Create the claim
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

  -- Increment the claimed count
  v_new_count := v_offer.claimed_count + 1;

  -- Update the offer (FIX: Qualified 'status' with table name to avoid ambiguity)
  UPDATE flash_offers
  SET 
    claimed_count = v_new_count,
    status = CASE 
      WHEN v_new_count >= v_offer.max_claims THEN 'full'::VARCHAR(20)
      ELSE flash_offers.status
    END,
    updated_at = NOW()
  WHERE flash_offers.id = p_offer_id;

  -- Return the created claim
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Fixed ambiguous status column reference in claim_flash_offer_atomic function' as message;
