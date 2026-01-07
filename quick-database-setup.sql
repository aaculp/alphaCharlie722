-- Quick Database Setup for User Feedback System
-- Copy and paste this into your Supabase SQL Editor and run it

-- Create user_tags table
CREATE TABLE IF NOT EXISTS public.user_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL,
    user_id UUID NOT NULL,
    tag_text TEXT NOT NULL CHECK (length(tag_text) > 0 AND length(tag_text) <= 50),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tag_likes table
CREATE TABLE IF NOT EXISTS public.tag_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag_id UUID NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tag_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_tags_venue_id ON public.user_tags(venue_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_like_count ON public.user_tags(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_tag_likes_tag_id ON public.tag_likes(tag_id);

-- Enable RLS
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_likes ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (anyone can read, authenticated users can write)
CREATE POLICY "Anyone can view user tags" ON public.user_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tags" ON public.user_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own tags" ON public.user_tags FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own tags" ON public.user_tags FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Anyone can view tag likes" ON public.tag_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create likes" ON public.tag_likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own likes" ON public.tag_likes FOR DELETE USING (auth.uid()::text = user_id::text);

-- Grant permissions
GRANT ALL ON public.user_tags TO authenticated;
GRANT ALL ON public.tag_likes TO authenticated;