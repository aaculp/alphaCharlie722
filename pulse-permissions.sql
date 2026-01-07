-- Pulse Permissions Setup (Run this AFTER the safe-pulse-setup.sql)
-- Copy and paste this into your Supabase SQL Editor and run it

-- Step 1: Enable RLS (Row Level Security)
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_likes ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view user tags" ON public.user_tags;
DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can update own tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON public.user_tags;
DROP POLICY IF EXISTS "Anyone can view tag likes" ON public.tag_likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.tag_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.tag_likes;

-- Step 3: Create RLS policies for user_tags
CREATE POLICY "Anyone can view user tags" 
ON public.user_tags FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create tags" 
ON public.user_tags FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own tags" 
ON public.user_tags FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" 
ON public.user_tags FOR DELETE 
USING (auth.uid() = user_id);

-- Step 4: Create RLS policies for tag_likes
CREATE POLICY "Anyone can view tag likes" 
ON public.tag_likes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create likes" 
ON public.tag_likes FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" 
ON public.tag_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_tags TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.tag_likes TO authenticated;
GRANT SELECT ON public.user_tags TO anon;
GRANT SELECT ON public.tag_likes TO anon;