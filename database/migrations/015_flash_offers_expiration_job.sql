-- Migration: Flash Offers Expiration Background Job
-- Description: Sets up scheduled jobs to automatically expire offers and claims
-- Requirements: Flash Offers MVP - Task 4.1 & 4.2

-- ============================================================================
-- Comprehensive Expiration Function
-- ============================================================================

CREATE OR REPLACE FUNCTION run_flash_offers_expiration_job()
RETURNS TABLE (
  offers_expired INTEGER,
  claims_expired INTEGER,
  offers_activated INTEGER,
  offers_marked_full INTEGER,
  execution_time TIMESTAMPTZ,
  errors TEXT[]
) AS $$
DECLARE
  v_offers_expired INTEGER := 0;
  v_claims_expired INTEGER := 0;
  v_offers_activated INTEGER := 0;
  v_offers_marked_full INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_start_time TIMESTAMPTZ;
BEGIN
  v_start_time := NOW();
  
  -- Step 1: Activate scheduled offers
  BEGIN
    WITH updated_offers AS (
      UPDATE flash_offers
      SET status = 'active', updated_at = NOW()
      WHERE status = 'scheduled' AND start_time <= NOW() AND end_time > NOW() AND claimed_count < max_claims
      RETURNING id
    )
    SELECT COUNT(*) INTO v_offers_activated FROM updated_offers;
    RAISE NOTICE 'Activated % scheduled offers', v_offers_activated;
  EXCEPTION WHEN OTHERS THEN
    v_errors := array_append(v_errors, 'Error activating offers: ' || SQLERRM);
  END;

  -- Step 2: Expire offers past end_time
  BEGIN
    WITH updated_offers AS (
      UPDATE flash_offers
      SET status = 'expired', updated_at = NOW()
      WHERE status IN ('scheduled', 'active') AND end_time < NOW()
      RETURNING id
    )
    SELECT COUNT(*) INTO v_offers_expired FROM updated_offers;
    RAISE NOTICE 'Expired % offers', v_offers_expired;
  EXCEPTION WHEN OTHERS THEN
    v_errors := array_append(v_errors, 'Error expiring offers: ' || SQLERRM);
  END;

  -- Step 3: Mark offers as full
  BEGIN
    WITH updated_offers AS (
      UPDATE flash_offers
      SET status = 'full', updated_at = NOW()
      WHERE status = 'active' AND claimed_count >= max_claims AND end_time > NOW()
      RETURNING id
    )
    SELECT COUNT(*) INTO v_offers_marked_full FROM updated_offers;
    RAISE NOTICE 'Marked % offers as full', v_offers_marked_full;
  EXCEPTION WHEN OTHERS THEN
    v_errors := array_append(v_errors, 'Error marking offers full: ' || SQLERRM);
  END;

  -- Step 4: Expire unclaimed tokens
  BEGIN
    WITH updated_claims AS (
      UPDATE flash_offer_claims
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'active' AND expires_at < NOW()
      RETURNING id
    )
    SELECT COUNT(*) INTO v_claims_expired FROM updated_claims;
    RAISE NOTICE 'Expired % claims', v_claims_expired;
  EXCEPTION WHEN OTHERS THEN
    v_errors := array_append(v_errors, 'Error expiring claims: ' || SQLERRM);
  END;

  RETURN QUERY SELECT v_offers_expired, v_claims_expired, v_offers_activated, v_offers_marked_full, v_start_time, v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION run_flash_offers_expiration_job() TO authenticated;
COMMENT ON FUNCTION run_flash_offers_expiration_job IS 'Comprehensive expiration job that activates, expires, and marks offers as full';

-- ============================================================================
-- Execution Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS flash_offers_expiration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offers_expired INTEGER NOT NULL DEFAULT 0,
  claims_expired INTEGER NOT NULL DEFAULT 0,
  offers_activated INTEGER NOT NULL DEFAULT 0,
  offers_marked_full INTEGER NOT NULL DEFAULT 0,
  execution_time TIMESTAMPTZ NOT NULL,
  errors TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expiration_log_created ON flash_offers_expiration_log(created_at DESC);
COMMENT ON TABLE flash_offers_expiration_log IS 'Execution log for flash offers expiration job';

-- ============================================================================
-- Wrapper Function with Logging
-- ============================================================================

CREATE OR REPLACE FUNCTION run_flash_offers_expiration_job_with_logging()
RETURNS void AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM run_flash_offers_expiration_job();
  
  INSERT INTO flash_offers_expiration_log (
    offers_expired, claims_expired, offers_activated, offers_marked_full, execution_time, errors
  ) VALUES (
    v_result.offers_expired, v_result.claims_expired, v_result.offers_activated, 
    v_result.offers_marked_full, v_result.execution_time, v_result.errors
  );
  
  RAISE NOTICE 'Expiration Job Complete: Activated=%, Expired=%, Full=%, Claims Expired=%',
    v_result.offers_activated, v_result.offers_expired, v_result.offers_marked_full, v_result.claims_expired;
    
  IF array_length(v_result.errors, 1) > 0 THEN
    RAISE WARNING 'Job completed with errors: %', array_to_string(v_result.errors, '; ');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION run_flash_offers_expiration_job_with_logging() TO authenticated;
COMMENT ON FUNCTION run_flash_offers_expiration_job_with_logging IS 'Wrapper function that executes expiration job and logs results';

-- ============================================================================
-- Monitoring View
-- ============================================================================

CREATE OR REPLACE VIEW flash_offers_expiration_summary AS
SELECT 
  created_at, offers_activated, offers_expired, offers_marked_full, claims_expired, execution_time,
  CASE WHEN array_length(errors, 1) > 0 THEN 'Has Errors' ELSE 'Success' END as status, errors
FROM flash_offers_expiration_log
ORDER BY created_at DESC;

COMMENT ON VIEW flash_offers_expiration_summary IS 'Summary view of expiration job execution history';

-- Success message
SELECT 'Flash offers expiration job created successfully!' as message;
