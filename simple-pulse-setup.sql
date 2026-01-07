-- Simple Pulse Database Setup
-- Copy and paste this into your Supabase SQL Editor and run it

-- Create user_tags table (for pulses)
CREATE TABLE IF NOT EXISTS public.user_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tag_text TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tag_likes table
CREATE TABLE IF NOT EXISTS public.tag_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag_id UUID NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tags_venue_id ON public.user_tags(venue_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_like_count ON public.user_tags(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_tag_likes_tag_id ON public.tag_likes(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_likes_user_id ON public.tag_likes(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_likes ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (allow all for now)
DROP POLICY IF EXISTS "Allow all operations on user_tags" ON public.user_tags;
CREATE POLICY "Allow all operations on user_tags" ON public.user_tags FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on tag_likes" ON public.tag_likes;
CREATE POLICY "Allow all operations on tag_likes" ON public.tag_likes FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.user_tags TO authenticated;
GRANT ALL ON public.tag_likes TO authenticated;
GRANT ALL ON public.user_tags TO anon;
GRANT ALL ON public.tag_likes TO anon;

-- Insert some test data
INSERT INTO public.user_tags (venue_id, user_id, tag_text, like_count) VALUES
('1', 'test-user', 'Great vibes!', 5),
('1', 'test-user', 'Perfect for dates', 12),
('1', 'test-user', 'Amazing coffee', 3)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Pulse database setup complete!' as message;