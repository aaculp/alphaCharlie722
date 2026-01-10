-- Safe Pulse Database Setup (Step by Step)
-- Copy and paste this into your Supabase SQL Editor and run it

-- Step 1: Create user_tags table (for pulses)
CREATE TABLE IF NOT EXISTS public.user_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL,
    user_id UUID NOT NULL,
    tag_text TEXT NOT NULL CHECK (length(tag_text) > 0 AND length(tag_text) <= 50),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create tag_likes table
CREATE TABLE IF NOT EXISTS public.tag_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tag_id, user_id)
);

-- Step 3: Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tag_likes_tag_id_fkey'
    ) THEN
        ALTER TABLE public.tag_likes 
        ADD CONSTRAINT tag_likes_tag_id_fkey 
        FOREIGN KEY (tag_id) REFERENCES public.user_tags(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tags_venue_id ON public.user_tags(venue_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_like_count ON public.user_tags(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_tag_likes_tag_id ON public.tag_likes(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_likes_user_id ON public.tag_likes(user_id);