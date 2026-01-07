-- Simulate Check-ins for Testing
-- Copy and paste this into your Supabase SQL Editor and run it

-- Function to generate random check-ins for venues
DO $$
DECLARE
    venue_record RECORD;
    random_checkins INTEGER;
    i INTEGER;
    random_user_id UUID;
    checkin_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through all venues
    FOR venue_record IN SELECT id, name FROM public.venues LOOP
        -- Generate random number of check-ins (0-15 for variety)
        random_checkins := floor(random() * 16);
        
        -- Create check-ins for this venue
        FOR i IN 1..random_checkins LOOP
            -- Generate random user ID
            random_user_id := gen_random_uuid();
            
            -- Generate random check-in time (within last 8 hours)
            checkin_time := timezone('utc'::text, now()) - (random() * INTERVAL '8 hours');
            
            -- Insert simulated check-in
            INSERT INTO public.check_ins (
                venue_id, 
                user_id, 
                checked_in_at, 
                is_active,
                created_at,
                updated_at
            ) VALUES (
                venue_record.id,
                random_user_id,
                checkin_time,
                true,
                checkin_time,
                checkin_time
            );
        END LOOP;
        
        RAISE NOTICE 'Added % check-ins for venue: %', random_checkins, venue_record.name;
    END LOOP;
    
    RAISE NOTICE 'Simulation complete! Check-ins added to all venues.';
END $$;

-- Show summary of check-ins per venue
SELECT 
    v.name as venue_name,
    COUNT(c.id) as active_checkins
FROM public.venues v
LEFT JOIN public.check_ins c ON v.id = c.venue_id AND c.is_active = true
GROUP BY v.id, v.name
ORDER BY active_checkins DESC;