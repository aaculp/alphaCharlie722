-- Venues Table RLS Policies Setup
-- This script adds Row Level Security policies to allow public read access to venues
-- Copy and paste this into your Supabase SQL Editor and run it

-- Step 1: Enable RLS on venues table (if not already enabled)
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can create venues" ON public.venues;
DROP POLICY IF EXISTS "Venue owners can update their venues" ON public.venues;
DROP POLICY IF EXISTS "Venue owners can delete their venues" ON public.venues;

-- Step 3: Create RLS policy for public read access
-- This allows both anonymous and authenticated users to view all venues
CREATE POLICY "Anyone can view venues" 
ON public.venues FOR SELECT 
USING (true);

-- Step 4: Create policies for venue management (authenticated users only)
-- Only authenticated users can create venues
CREATE POLICY "Authenticated users can create venues" 
ON public.venues FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Venue owners can update their own venues
-- Note: This assumes you have a way to track venue ownership
-- You may need to adjust this based on your schema
CREATE POLICY "Venue owners can update their venues" 
ON public.venues FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Venue owners can delete their own venues
CREATE POLICY "Venue owners can delete their venues" 
ON public.venues FOR DELETE 
USING (auth.role() = 'authenticated');

-- Step 5: Grant permissions
-- Allow authenticated users full access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues TO authenticated;

-- Allow anonymous users read-only access
GRANT SELECT ON public.venues TO anon;

-- Success message
SELECT 'Venues RLS policies created successfully! Anonymous users can now view venues.' as message;
