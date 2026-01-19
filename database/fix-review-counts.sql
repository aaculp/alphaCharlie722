-- Fix Review Counts for All Venues
-- This script manually updates review_count and aggregate_rating for all venues
-- Run this if the trigger isn't working or to fix existing data

-- Update all venues with correct review counts and ratings
UPDATE public.venues v
SET 
    review_count = COALESCE((
        SELECT COUNT(*) 
        FROM public.reviews r 
        WHERE r.venue_id = v.id
    ), 0),
    aggregate_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1) 
        FROM public.reviews r 
        WHERE r.venue_id = v.id
    ), 0.0);

-- Verify the results
SELECT 
    v.id,
    v.name,
    v.review_count as stored_count,
    (SELECT COUNT(*) FROM public.reviews WHERE venue_id = v.id) as actual_count,
    v.aggregate_rating as stored_rating,
    (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE venue_id = v.id) as actual_rating
FROM public.venues v
WHERE v.review_count > 0 OR EXISTS (SELECT 1 FROM public.reviews WHERE venue_id = v.id)
ORDER BY v.name;
