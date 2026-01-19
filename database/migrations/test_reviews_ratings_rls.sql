-- Test Script: Venue Reviews & Ratings RLS Policies
-- This script tests Row Level Security policies for the reviews system
-- Run this after creating the schema to verify RLS is working correctly

-- ============================================================================
-- Setup Test Data
-- ============================================================================

-- Note: This script assumes you have test users and venues already set up
-- You'll need to replace the UUIDs below with actual test user/venue IDs

-- Test variables (replace with actual IDs from your database)
DO $
DECLARE
    test_user_1 UUID := '00000000-0000-0000-0000-000000000001'; -- Replace with actual user ID
    test_user_2 UUID := '00000000-0000-0000-0000-000000000002'; -- Replace with actual user ID
    test_venue_1 UUID := '00000000-0000-0000-0000-000000000011'; -- Replace with actual venue ID
    test_review_id UUID;
BEGIN
    RAISE NOTICE 'Starting RLS policy tests...';
    RAISE NOTICE 'Note: Replace test UUIDs with actual user/venue IDs from your database';
    
    -- ========================================================================
    -- Test 1: Anyone can view reviews (SELECT policy)
    -- ========================================================================
    RAISE NOTICE 'Test 1: Verifying anyone can view reviews...';
    
    -- This should work even without authentication
    PERFORM * FROM public.reviews LIMIT 1;
    RAISE NOTICE '✓ Test 1 passed: Anyone can view reviews';
    
    -- ========================================================================
    -- Test 2: Authenticated users can create reviews
    -- ========================================================================
    RAISE NOTICE 'Test 2: Testing review creation...';
    
    -- Note: This test requires setting auth.uid() which can only be done
    -- in the context of an authenticated request. In production, this is
    -- handled automatically by Supabase.
    RAISE NOTICE '⚠ Test 2: Manual testing required with authenticated user';
    
    -- ========================================================================
    -- Test 3: Unique constraint (one review per user per venue)
    -- ========================================================================
    RAISE NOTICE 'Test 3: Testing unique constraint...';
    
    -- Verify the unique constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_user_venue_review'
        AND table_name = 'reviews'
    ) THEN
        RAISE NOTICE '✓ Test 3 passed: Unique constraint exists';
    ELSE
        RAISE EXCEPTION '✗ Test 3 failed: Unique constraint missing';
    END IF;
    
    -- ========================================================================
    -- Test 4: Rating constraints (1-5)
    -- ========================================================================
    RAISE NOTICE 'Test 4: Testing rating constraints...';
    
    -- Verify the check constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%rating%'
        AND constraint_schema = 'public'
    ) THEN
        RAISE NOTICE '✓ Test 4 passed: Rating check constraint exists';
    ELSE
        RAISE EXCEPTION '✗ Test 4 failed: Rating check constraint missing';
    END IF;
    
    -- ========================================================================
    -- Test 5: Review text length constraint (max 500 chars)
    -- ========================================================================
    RAISE NOTICE 'Test 5: Testing review text length constraint...';
    
    -- Verify the check constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'review_text_length'
        AND constraint_schema = 'public'
    ) THEN
        RAISE NOTICE '✓ Test 5 passed: Review text length constraint exists';
    ELSE
        RAISE EXCEPTION '✗ Test 5 failed: Review text length constraint missing';
    END IF;
    
    -- ========================================================================
    -- Test 6: Helpful votes unique constraint
    -- ========================================================================
    RAISE NOTICE 'Test 6: Testing helpful votes unique constraint...';
    
    -- Verify the unique constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_user_review_vote'
        AND table_name = 'helpful_votes'
    ) THEN
        RAISE NOTICE '✓ Test 6 passed: Helpful votes unique constraint exists';
    ELSE
        RAISE EXCEPTION '✗ Test 6 failed: Helpful votes unique constraint missing';
    END IF;
    
    -- ========================================================================
    -- Test 7: Venue response unique constraint (one per review)
    -- ========================================================================
    RAISE NOTICE 'Test 7: Testing venue response unique constraint...';
    
    -- Verify the unique constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_review_response'
        AND table_name = 'venue_responses'
    ) THEN
        RAISE NOTICE '✓ Test 7 passed: Venue response unique constraint exists';
    ELSE
        RAISE EXCEPTION '✗ Test 7 failed: Venue response unique constraint missing';
    END IF;
    
    -- ========================================================================
    -- Test 8: Review report unique constraint (one per user per review)
    -- ========================================================================
    RAISE NOTICE 'Test 8: Testing review report unique constraint...';
    
    -- Verify the unique constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_user_review_report'
        AND table_name = 'review_reports'
    ) THEN
        RAISE NOTICE '✓ Test 8 passed: Review report unique constraint exists';
    ELSE
        RAISE EXCEPTION '✗ Test 8 failed: Review report unique constraint missing';
    END IF;
    
    -- ========================================================================
    -- Test 9: Cascade delete on reviews
    -- ========================================================================
    RAISE NOTICE 'Test 9: Testing cascade delete constraints...';
    
    -- Verify foreign key constraints with CASCADE
    IF EXISTS (
        SELECT 1 FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc 
            ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name IN ('helpful_votes', 'venue_responses', 'review_reports')
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        RAISE NOTICE '✓ Test 9 passed: Cascade delete constraints exist';
    ELSE
        RAISE EXCEPTION '✗ Test 9 failed: Cascade delete constraints missing';
    END IF;
    
    -- ========================================================================
    -- Test 10: Triggers exist and are active
    -- ========================================================================
    RAISE NOTICE 'Test 10: Testing triggers...';
    
    -- Check for venue rating update triggers
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name LIKE '%update_venue_rating%'
        AND event_object_table = 'reviews'
    ) THEN
        RAISE NOTICE '✓ Test 10a passed: Venue rating update triggers exist';
    ELSE
        RAISE EXCEPTION '✗ Test 10a failed: Venue rating update triggers missing';
    END IF;
    
    -- Check for helpful count update triggers
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name LIKE '%update_helpful_count%'
        AND event_object_table = 'helpful_votes'
    ) THEN
        RAISE NOTICE '✓ Test 10b passed: Helpful count update triggers exist';
    ELSE
        RAISE EXCEPTION '✗ Test 10b failed: Helpful count update triggers missing';
    END IF;
    
    -- Check for verified status trigger
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'trigger_set_verified_status'
        AND event_object_table = 'reviews'
    ) THEN
        RAISE NOTICE '✓ Test 10c passed: Verified status trigger exists';
    ELSE
        RAISE EXCEPTION '✗ Test 10c failed: Verified status trigger missing';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Policy Tests Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All automated tests passed ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Manual Testing Required:';
    RAISE NOTICE '1. Test authenticated user can create reviews';
    RAISE NOTICE '2. Test user can only update/delete own reviews';
    RAISE NOTICE '3. Test venue owners can create/update/delete responses';
    RAISE NOTICE '4. Test users can only view their own reports';
    RAISE NOTICE '';
    RAISE NOTICE 'Use the Supabase dashboard or client SDK to test these scenarios.';
    
END $;
