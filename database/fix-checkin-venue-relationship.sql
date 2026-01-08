-- Fix Check-in to Venue Relationship
-- Copy and paste this into your Supabase SQL Editor and run it

-- Add foreign key constraint between check_ins and venues tables
-- This will allow Supabase to understand the relationship for joins

ALTER TABLE public.check_ins 
ADD CONSTRAINT check_ins_venue_id_fkey 
FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;

-- Verify the relationship was created
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='check_ins'
    AND kcu.column_name='venue_id';

-- Success message
SELECT 'Foreign key relationship between check_ins and venues has been established!' as message;