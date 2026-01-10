-- Add max_capacity column to venues table
-- Copy and paste this into your Supabase SQL Editor and run it

-- Add max_capacity column to venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

-- Update existing venues with realistic max capacity values
-- These match the values in populateVenues.ts
UPDATE public.venues 
SET max_capacity = CASE 
    WHEN name = 'The Coffee Collective' THEN 45
    WHEN name = 'Sunset Grill & Bar' THEN 120
    WHEN name = 'Tony''s Pizza Palace' THEN 80
    WHEN name = 'Craft Beer Garden' THEN 150
    WHEN name = 'Fresh Market Bistro' THEN 65
    WHEN name = 'The Touchdown Sports Bar' THEN 200
    ELSE 100 -- Default capacity for any other venues
END
WHERE max_capacity IS NULL;

-- Success message
SELECT 'Max capacity column added and populated!' as message;