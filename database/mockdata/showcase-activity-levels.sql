-- Showcase Activity Levels - Set different check-in counts to demo all 5 levels
-- Copy and paste this into your Supabase SQL Editor and run it

-- First, clear existing check-ins to start fresh
DELETE FROM public.check_ins;

-- Add max_capacity to venues if not already done
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

-- Update venues with max capacity values
UPDATE public.venues 
SET max_capacity = CASE 
    WHEN name LIKE '%Coffee%' THEN 45
    WHEN name LIKE '%Sunset%' OR name LIKE '%Grill%' THEN 120
    WHEN name LIKE '%Pizza%' OR name LIKE '%Tony%' THEN 80
    WHEN name LIKE '%Beer%' OR name LIKE '%Craft%' THEN 150
    WHEN name LIKE '%Bistro%' OR name LIKE '%Market%' THEN 65
    WHEN name LIKE '%Sports%' OR name LIKE '%Touchdown%' THEN 200
    ELSE 100
END
WHERE max_capacity IS NULL;

-- Create check-ins to showcase all 5 activity levels
DO $$
DECLARE
    venue_record RECORD;
    target_checkins INTEGER;
    i INTEGER;
    venue_count INTEGER := 0;
BEGIN
    -- Loop through venues and assign different activity levels
    FOR venue_record IN SELECT id, name, max_capacity FROM public.venues WHERE max_capacity IS NOT NULL ORDER BY name LOOP
        venue_count := venue_count + 1;
        
        -- Assign different activity levels to showcase variety
        CASE venue_count % 5
            WHEN 1 THEN 
                -- Low-key (10% capacity)
                target_checkins := GREATEST(1, ROUND(venue_record.max_capacity * 0.10));
            WHEN 2 THEN 
                -- Vibey (30% capacity)
                target_checkins := ROUND(venue_record.max_capacity * 0.30);
            WHEN 3 THEN 
                -- Poppin (55% capacity)
                target_checkins := ROUND(venue_record.max_capacity * 0.55);
            WHEN 4 THEN 
                -- Lit (75% capacity)
                target_checkins := ROUND(venue_record.max_capacity * 0.75);
            WHEN 0 THEN 
                -- Maxed (90% capacity)
                target_checkins := ROUND(venue_record.max_capacity * 0.90);
        END CASE;
        
        -- Create the check-ins for this venue
        FOR i IN 1..target_checkins LOOP
            INSERT INTO public.check_ins (
                venue_id, 
                user_id, 
                checked_in_at, 
                is_active,
                created_at,
                updated_at
            ) VALUES (
                venue_record.id,
                gen_random_uuid(),
                timezone('utc'::text, now()) - (random() * INTERVAL '2 hours'),
                true,
                timezone('utc'::text, now()),
                timezone('utc'::text, now())
            );
        END LOOP;
        
        RAISE NOTICE 'Venue: % (Max: %) - Added % check-ins for % activity level', 
            venue_record.name, 
            venue_record.max_capacity, 
            target_checkins,
            CASE venue_count % 5
                WHEN 1 THEN 'Low-key 😌'
                WHEN 2 THEN 'Vibey ✨'
                WHEN 3 THEN 'Poppin 🎉'
                WHEN 4 THEN 'Lit 🔥'
                WHEN 0 THEN 'Maxed ⛔'
            END;
    END LOOP;
    
    RAISE NOTICE 'Activity level showcase complete! All 5 levels should now be visible.';
END $$;

-- Show the results
SELECT 
    v.name,
    v.max_capacity,
    COUNT(c.id) as current_checkins,
    ROUND((COUNT(c.id)::DECIMAL / v.max_capacity) * 100, 1) as capacity_percentage,
    CASE 
        WHEN COUNT(c.id)::DECIMAL / v.max_capacity <= 0.20 THEN 'Low-key 😌'
        WHEN COUNT(c.id)::DECIMAL / v.max_capacity <= 0.40 THEN 'Vibey ✨'
        WHEN COUNT(c.id)::DECIMAL / v.max_capacity <= 0.65 THEN 'Poppin 🎉'
        WHEN COUNT(c.id)::DECIMAL / v.max_capacity <= 0.85 THEN 'Lit 🔥'
        ELSE 'Maxed ⛔'
    END as activity_level
FROM public.venues v
LEFT JOIN public.check_ins c ON v.id = c.venue_id AND c.is_active = true
WHERE v.max_capacity IS NOT NULL
GROUP BY v.id, v.name, v.max_capacity
ORDER BY v.name;