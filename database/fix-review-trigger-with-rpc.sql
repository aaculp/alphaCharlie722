-- ============================================================================
-- COMPREHENSIVE FIX: Replace Trigger with RPC Function
-- ============================================================================
-- 
-- PROBLEM: Database triggers don't fire when updates come through Supabase 
-- PostgREST API (only when using direct SQL)
--
-- SOLUTION: Create an RPC function that the app calls directly to update
-- reviews AND venue ratings atomically in a single transaction
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Create RPC function to update review and venue rating atomically
-- ============================================================================

CREATE OR REPLACE FUNCTION update_review_and_venue_rating(
    p_review_id UUID,
    p_user_id UUID,
    p_rating INTEGER,
    p_review_text TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    v_venue_id UUID;
    v_updated_review json;
    v_new_aggregate_rating NUMERIC(2,1);
    v_new_review_count INTEGER;
BEGIN
    -- Validate rating
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;

    -- Update the review and get venue_id
    UPDATE public.reviews
    SET 
        rating = p_rating,
        review_text = COALESCE(p_review_text, review_text),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_review_id AND user_id = p_user_id
    RETURNING venue_id, row_to_json(reviews.*) INTO v_venue_id, v_updated_review;

    -- Check if review was found and updated
    IF v_venue_id IS NULL THEN
        RAISE EXCEPTION 'Review not found or you do not have permission to update it';
    END IF;

    -- Calculate new aggregate rating and review count for the venue
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
        COALESCE(COUNT(*), 0)
    INTO v_new_aggregate_rating, v_new_review_count
    FROM public.reviews
    WHERE venue_id = v_venue_id;

    -- Update the venue's aggregate rating and review count
    UPDATE public.venues
    SET 
        aggregate_rating = v_new_aggregate_rating,
        review_count = v_new_review_count
    WHERE id = v_venue_id;

    -- Return the updated review
    RETURN v_updated_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_review_and_venue_rating(UUID, UUID, INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- STEP 2: Create RPC function to submit new review and update venue rating
-- ============================================================================

CREATE OR REPLACE FUNCTION submit_review_and_update_venue(
    p_venue_id UUID,
    p_user_id UUID,
    p_rating INTEGER,
    p_review_text TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    v_new_review json;
    v_new_aggregate_rating NUMERIC(2,1);
    v_new_review_count INTEGER;
    v_is_verified BOOLEAN;
BEGIN
    -- Validate rating
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;

    -- Check if user has checked in (for verified badge)
    SELECT EXISTS (
        SELECT 1 FROM public.check_ins 
        WHERE user_id = p_user_id AND venue_id = p_venue_id
    ) INTO v_is_verified;

    -- Insert the new review
    INSERT INTO public.reviews (venue_id, user_id, rating, review_text, is_verified)
    VALUES (p_venue_id, p_user_id, p_rating, p_review_text, v_is_verified)
    RETURNING row_to_json(reviews.*) INTO v_new_review;

    -- Calculate new aggregate rating and review count for the venue
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
        COALESCE(COUNT(*), 0)
    INTO v_new_aggregate_rating, v_new_review_count
    FROM public.reviews
    WHERE venue_id = p_venue_id;

    -- Update the venue's aggregate rating and review count
    UPDATE public.venues
    SET 
        aggregate_rating = v_new_aggregate_rating,
        review_count = v_new_review_count
    WHERE id = p_venue_id;

    -- Return the new review
    RETURN v_new_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION submit_review_and_update_venue(UUID, UUID, INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- STEP 3: Create RPC function to delete review and update venue rating
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_review_and_update_venue(
    p_review_id UUID,
    p_user_id UUID
)
RETURNS json AS $$
DECLARE
    v_venue_id UUID;
    v_deleted_review json;
    v_new_aggregate_rating NUMERIC(2,1);
    v_new_review_count INTEGER;
BEGIN
    -- Delete the review and get venue_id
    DELETE FROM public.reviews
    WHERE id = p_review_id AND user_id = p_user_id
    RETURNING venue_id, row_to_json(reviews.*) INTO v_venue_id, v_deleted_review;

    -- Check if review was found and deleted
    IF v_venue_id IS NULL THEN
        RAISE EXCEPTION 'Review not found or you do not have permission to delete it';
    END IF;

    -- Calculate new aggregate rating and review count for the venue
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
        COALESCE(COUNT(*), 0)
    INTO v_new_aggregate_rating, v_new_review_count
    FROM public.reviews
    WHERE venue_id = v_venue_id;

    -- Update the venue's aggregate rating and review count
    UPDATE public.venues
    SET 
        aggregate_rating = v_new_aggregate_rating,
        review_count = v_new_review_count
    WHERE id = v_venue_id;

    -- Return the deleted review
    RETURN v_deleted_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_review_and_update_venue(UUID, UUID) TO authenticated;

-- ============================================================================
-- STEP 4: Manually fix all existing venue ratings (one-time fix)
-- ============================================================================

UPDATE venues v
SET 
    aggregate_rating = COALESCE(
        (SELECT ROUND(AVG(r.rating)::numeric, 1) 
         FROM reviews r 
         WHERE r.venue_id = v.id), 
        0.0
    ),
    review_count = COALESCE(
        (SELECT COUNT(*) 
         FROM reviews r 
         WHERE r.venue_id = v.id), 
        0
    );

-- ============================================================================
-- STEP 5: Verify the fix for Palm Bay Test Venue
-- ============================================================================

SELECT 
    v.id,
    v.name,
    v.aggregate_rating as stored_rating,
    v.review_count as stored_count,
    COUNT(r.id) as actual_count,
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0) as calculated_rating
FROM venues v
LEFT JOIN reviews r ON r.venue_id = v.id
WHERE v.name ILIKE '%palm bay%'
GROUP BY v.id, v.name, v.aggregate_rating, v.review_count;

-- ============================================================================
-- Success!
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ RPC functions created successfully!';
    RAISE NOTICE '✅ Venue ratings updated!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update ReviewService.updateReview() to call update_review_and_venue_rating()';
    RAISE NOTICE '2. Update ReviewService.submitReview() to call submit_review_and_update_venue()';
    RAISE NOTICE '3. Update ReviewService.deleteReview() to call delete_review_and_update_venue()';
END $$;
