-- Test Script for Flash Offers RLS Policies
-- This script helps verify that Row Level Security policies are working correctly
-- 
-- IMPORTANT: Replace the placeholder IDs with actual IDs from your database
-- You'll need:
-- - A valid venue_id
-- - A valid user_id (venue owner)
-- - A valid user_id (regular customer)

-- ============================================================================
-- Setup Test Data
-- ============================================================================

-- Note: You need to replace these with actual IDs from your database
-- Get a venue_id: SELECT id FROM venues LIMIT 1;
-- Get owner user_id: SELECT owner_user_id FROM venue_business_accounts WHERE venue_id = 'your-venue-id';
-- Get customer user_id: SELECT id FROM profiles WHERE id != 'owner-user-id' LIMIT 1;

DO $$
DECLARE
  test_venue_id UUID;
  test_owner_id UUID;
  test_customer_id UUID;
  test_offer_id UUID;
  test_claim_id UUID;
BEGIN
  -- ============================================================================
  -- STEP 1: Get Test IDs (you may need to adjust these queries)
  -- ============================================================================
  
  RAISE NOTICE '=== STEP 1: Getting Test IDs ===';
  
  -- Get a venue ID
  SELECT id INTO test_venue_id FROM venues LIMIT 1;
  IF test_venue_id IS NULL THEN
    RAISE EXCEPTION 'No venues found. Please create a venue first.';
  END IF;
  RAISE NOTICE 'Using venue_id: %', test_venue_id;
  
  -- Get the venue owner ID
  SELECT owner_user_id INTO test_owner_id 
  FROM venue_business_accounts 
  WHERE venue_id = test_venue_id 
  LIMIT 1;
  IF test_owner_id IS NULL THEN
    RAISE EXCEPTION 'No venue owner found for venue %. Please ensure venue_business_accounts is set up.', test_venue_id;
  END IF;
  RAISE NOTICE 'Using owner_user_id: %', test_owner_id;
  
  -- Get a customer ID (different from owner)
  SELECT id INTO test_customer_id 
  FROM profiles 
  WHERE id != test_owner_id 
  LIMIT 1;
  IF test_customer_id IS NULL THEN
    RAISE EXCEPTION 'No customer profiles found. Please create a customer profile first.';
  END IF;
  RAISE NOTICE 'Using customer_user_id: %', test_customer_id;
  
  -- ============================================================================
  -- STEP 2: Create Test Offer
  -- ============================================================================
  
  RAISE NOTICE '=== STEP 2: Creating Test Offer ===';
  
  INSERT INTO flash_offers (
    venue_id,
    title,
    description,
    value_cap,
    max_claims,
    start_time,
    end_time,
    status
  ) VALUES (
    test_venue_id,
    'RLS Test Offer',
    'This is a test offer to verify RLS policies are working correctly',
    '$10 off',
    5,
    NOW(),
    NOW() + INTERVAL '1 hour',
    'active'
  ) RETURNING id INTO test_offer_id;
  
  RAISE NOTICE 'Created test offer with id: %', test_offer_id;
  
  -- ============================================================================
  -- STEP 3: Create Test Claim
  -- ============================================================================
  
  RAISE NOTICE '=== STEP 3: Creating Test Claim ===';
  
  INSERT INTO flash_offer_claims (
    offer_id,
    user_id,
    token,
    expires_at
  ) VALUES (
    test_offer_id,
    test_customer_id,
    '999999',
    NOW() + INTERVAL '24 hours'
  ) RETURNING id INTO test_claim_id;
  
  RAISE NOTICE 'Created test claim with id: %', test_claim_id;
  
  -- ============================================================================
  -- STEP 4: Create Test Event
  -- ============================================================================
  
  RAISE NOTICE '=== STEP 4: Creating Test Event ===';
  
  INSERT INTO flash_offer_events (
    offer_id,
    user_id,
    event_type,
    metadata
  ) VALUES (
    test_offer_id,
    test_customer_id,
    'view',
    '{"source": "rls_test"}'::jsonb
  );
  
  RAISE NOTICE 'Created test event';
  
  -- ============================================================================
  -- STEP 5: Verify Data Was Created
  -- ============================================================================
  
  RAISE NOTICE '=== STEP 5: Verifying Test Data ===';
  
  -- Check offer exists
  IF EXISTS (SELECT 1 FROM flash_offers WHERE id = test_offer_id) THEN
    RAISE NOTICE '✓ Test offer exists';
  ELSE
    RAISE EXCEPTION '✗ Test offer not found';
  END IF;
  
  -- Check claim exists
  IF EXISTS (SELECT 1 FROM flash_offer_claims WHERE id = test_claim_id) THEN
    RAISE NOTICE '✓ Test claim exists';
  ELSE
    RAISE EXCEPTION '✗ Test claim not found';
  END IF;
  
  -- Check event exists
  IF EXISTS (SELECT 1 FROM flash_offer_events WHERE offer_id = test_offer_id) THEN
    RAISE NOTICE '✓ Test event exists';
  ELSE
    RAISE EXCEPTION '✗ Test event not found';
  END IF;
  
  -- ============================================================================
  -- STEP 6: Display Test Data for Manual Verification
  -- ============================================================================
  
  RAISE NOTICE '=== STEP 6: Test Data Summary ===';
  RAISE NOTICE 'Test Venue ID: %', test_venue_id;
  RAISE NOTICE 'Test Owner ID: %', test_owner_id;
  RAISE NOTICE 'Test Customer ID: %', test_customer_id;
  RAISE NOTICE 'Test Offer ID: %', test_offer_id;
  RAISE NOTICE 'Test Claim ID: %', test_claim_id;
  RAISE NOTICE '';
  RAISE NOTICE 'To test RLS policies:';
  RAISE NOTICE '1. Log in as the venue owner (%) and verify you can see the offer', test_owner_id;
  RAISE NOTICE '2. Log in as the customer (%) and verify you can see the offer and your claim', test_customer_id;
  RAISE NOTICE '3. Log in as a different user and verify you cannot see the claim';
  RAISE NOTICE '';
  RAISE NOTICE 'To clean up test data, run:';
  RAISE NOTICE 'DELETE FROM flash_offers WHERE id = ''%'';', test_offer_id;
  
END $$;

-- ============================================================================
-- Manual RLS Tests (Run these while authenticated as different users)
-- ============================================================================

-- Test 1: Venue owner should see their offers
-- (Run this while authenticated as the venue owner)
-- SELECT * FROM flash_offers WHERE title = 'RLS Test Offer';
-- Expected: 1 row

-- Test 2: Customer should see active offers
-- (Run this while authenticated as any customer)
-- SELECT * FROM flash_offers WHERE title = 'RLS Test Offer' AND status = 'active';
-- Expected: 1 row

-- Test 3: Customer should see their own claims
-- (Run this while authenticated as the customer who made the claim)
-- SELECT * FROM flash_offer_claims WHERE token = '999999';
-- Expected: 1 row

-- Test 4: Different customer should NOT see other's claims
-- (Run this while authenticated as a different customer)
-- SELECT * FROM flash_offer_claims WHERE token = '999999';
-- Expected: 0 rows

-- Test 5: Venue owner should see claims for their offers
-- (Run this while authenticated as the venue owner)
-- SELECT * FROM flash_offer_claims WHERE token = '999999';
-- Expected: 1 row

-- Test 6: Customer should see their own events
-- (Run this while authenticated as the customer)
-- SELECT * FROM flash_offer_events WHERE event_type = 'view' AND metadata->>'source' = 'rls_test';
-- Expected: 1 row

-- Test 7: Venue owner should see events for their offers
-- (Run this while authenticated as the venue owner)
-- SELECT * FROM flash_offer_events WHERE event_type = 'view' AND metadata->>'source' = 'rls_test';
-- Expected: 1 row

-- ============================================================================
-- Cleanup (Run this after testing)
-- ============================================================================

-- Uncomment to clean up test data:
-- DELETE FROM flash_offers WHERE title = 'RLS Test Offer';
-- This will cascade delete claims and events due to foreign key constraints

-- ============================================================================
-- Expected Results Summary
-- ============================================================================

/*
RLS Policy Test Results:

flash_offers:
✓ Venue owners can view their own offers
✓ All authenticated users can view active offers
✓ Venue owners can create/update/delete their own offers

flash_offer_claims:
✓ Users can view their own claims
✓ Venue staff can view claims for their venue's offers
✓ Users can create their own claims
✓ Venue staff can update claims for redemption

flash_offer_events:
✓ Venue owners can view events for their offers
✓ Users can view their own events
✓ All authenticated users can create events
*/
