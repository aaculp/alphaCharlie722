-- Verify Review Columns Exist in Venues Table
-- Run this in Supabase SQL Editor to check if columns were added

-- Check if columns exist
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'venues'
    AND column_name IN ('aggregate_rating', 'review_count')
ORDER BY column_name;

-- Check current values for Palm Bay Test Venue
SELECT 
    id,
    name,
    aggregate_rating,
    review_count,
    created_at
FROM public.venues
WHERE name ILIKE '%palm bay%'
ORDER BY created_at DESC;

-- Check if reviews exist for Palm Bay
SELECT 
    r.id,
    r.venue_id,
    r.rating,
    r.review_text,
    r.created_at,
    v.name as venue_name
FROM public.reviews r
JOIN public.venues v ON v.id = r.venue_id
WHERE v.name ILIKE '%palm bay%'
ORDER BY r.created_at DESC;

-- Manually trigger the update for Palm Bay venue
-- (Run this if the columns exist but values are wrong)
UPDATE public.venues
SET 
    aggregate_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1) 
        FROM public.reviews 
        WHERE venue_id = venues.id
    ), 0.0),
    review_count = COALESCE((
        SELECT COUNT(*) 
        FROM public.reviews 
        WHERE venue_id = venues.id
    ), 0)
WHERE name ILIKE '%palm bay%'
RETURNING id, name, aggregate_rating, review_count;
