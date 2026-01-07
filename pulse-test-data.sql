-- Pulse Test Data (Run this LAST, after both previous scripts)
-- Copy and paste this into your Supabase SQL Editor and run it

-- First, let's get some actual venue IDs from your venues table
DO $$
DECLARE
    venue_uuid UUID;
    test_user_uuid UUID := gen_random_uuid();
BEGIN
    -- Get the first venue ID from your venues table
    SELECT id INTO venue_uuid FROM public.venues LIMIT 1;
    
    -- If we found a venue, insert test pulses
    IF venue_uuid IS NOT NULL THEN
        INSERT INTO public.user_tags (venue_id, user_id, tag_text, like_count) 
        VALUES 
            (venue_uuid, test_user_uuid, 'Great vibes!', 5),
            (venue_uuid, gen_random_uuid(), 'Perfect for dates', 12),
            (venue_uuid, gen_random_uuid(), 'Amazing coffee', 3),
            (venue_uuid, gen_random_uuid(), 'Cozy atmosphere', 8),
            (venue_uuid, gen_random_uuid(), 'Friendly staff', 15)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Test pulses created for venue: %', venue_uuid;
    ELSE
        RAISE NOTICE 'No venues found in database. Please add venues first.';
    END IF;
END $$;

-- Success message
SELECT 'Pulse test data setup complete!' as message;