-- Fixed Pulse Test Data (Run this to add test pulses)
-- Copy and paste this into your Supabase SQL Editor and run it

-- Check if we have venues and create test pulses
DO $$
DECLARE
    venue_record RECORD;
    test_user_uuid UUID := gen_random_uuid();
    pulse_count INTEGER := 0;
BEGIN
    -- Loop through all venues and add test pulses to each
    FOR venue_record IN SELECT id, name FROM public.venues LIMIT 3 LOOP
        -- Insert test pulses for this venue
        INSERT INTO public.user_tags (venue_id, user_id, tag_text, like_count) 
        VALUES 
            (venue_record.id, test_user_uuid, 'Great vibes!', 5),
            (venue_record.id, gen_random_uuid(), 'Perfect for dates', 12),
            (venue_record.id, gen_random_uuid(), 'Amazing coffee', 3),
            (venue_record.id, gen_random_uuid(), 'Cozy atmosphere', 8),
            (venue_record.id, gen_random_uuid(), 'Friendly staff', 15)
        ON CONFLICT DO NOTHING;
        
        pulse_count := pulse_count + 5;
        RAISE NOTICE 'Added 5 test pulses for venue: % (%)', venue_record.name, venue_record.id;
    END LOOP;
    
    IF pulse_count > 0 THEN
        RAISE NOTICE 'Successfully created % test pulses total!', pulse_count;
    ELSE
        RAISE NOTICE 'No venues found. Please populate venues first using populateVenuesDatabase().';
    END IF;
END $$;

-- Show current pulse count
SELECT 
    COUNT(*) as total_pulses,
    COUNT(DISTINCT venue_id) as venues_with_pulses
FROM public.user_tags;