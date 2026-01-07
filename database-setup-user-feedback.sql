-- User Feedback System Database Setup
-- Run these commands in your Supabase SQL Editor

-- Create user_tags table
CREATE TABLE IF NOT EXISTS public.user_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tag_text TEXT NOT NULL CHECK (length(tag_text) > 0 AND length(tag_text) <= 50),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique tags per venue (case insensitive)
    UNIQUE(venue_id, LOWER(tag_text))
);

-- Create tag_likes table
CREATE TABLE IF NOT EXISTS public.tag_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag_id UUID NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one like per user per tag
    UNIQUE(tag_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tags_venue_id ON public.user_tags(venue_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON public.user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_like_count ON public.user_tags(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_tags_created_at ON public.user_tags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tag_likes_tag_id ON public.tag_likes(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_likes_user_id ON public.tag_likes(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_tags
-- Anyone can read tags
CREATE POLICY "Anyone can view user tags" ON public.user_tags
    FOR SELECT USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags" ON public.user_tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Users can update their own tags (like_count is handled by triggers)
CREATE POLICY "Users can update own tags" ON public.user_tags
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tags
CREATE POLICY "Users can delete own tags" ON public.user_tags
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tag_likes
-- Anyone can read likes (for counting)
CREATE POLICY "Anyone can view tag likes" ON public.tag_likes
    FOR SELECT USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can create likes" ON public.tag_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes" ON public.tag_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update like count when likes are added/removed
CREATE OR REPLACE FUNCTION update_tag_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.user_tags 
        SET like_count = like_count + 1 
        WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.user_tags 
        SET like_count = like_count - 1 
        WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to automatically update like counts
DROP TRIGGER IF EXISTS trigger_update_like_count_insert ON public.tag_likes;
CREATE TRIGGER trigger_update_like_count_insert
    AFTER INSERT ON public.tag_likes
    FOR EACH ROW EXECUTE FUNCTION update_tag_like_count();

DROP TRIGGER IF EXISTS trigger_update_like_count_delete ON public.tag_likes;
CREATE TRIGGER trigger_update_like_count_delete
    AFTER DELETE ON public.tag_likes
    FOR EACH ROW EXECUTE FUNCTION update_tag_like_count();

-- Function to prevent negative like counts
CREATE OR REPLACE FUNCTION prevent_negative_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.like_count < 0 THEN
        NEW.like_count = 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent negative like counts
DROP TRIGGER IF EXISTS trigger_prevent_negative_like_count ON public.user_tags;
CREATE TRIGGER trigger_prevent_negative_like_count
    BEFORE UPDATE ON public.user_tags
    FOR EACH ROW EXECUTE FUNCTION prevent_negative_like_count();

-- Sample data for testing (optional)
-- INSERT INTO public.user_tags (venue_id, user_id, tag_text, like_count) VALUES
-- ('your-venue-id-here', 'your-user-id-here', 'Great for dates', 5),
-- ('your-venue-id-here', 'your-user-id-here', 'Amazing coffee', 12),
-- ('your-venue-id-here', 'your-user-id-here', 'Too crowded', 2);

-- Grant necessary permissions
GRANT ALL ON public.user_tags TO authenticated;
GRANT ALL ON public.tag_likes TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;