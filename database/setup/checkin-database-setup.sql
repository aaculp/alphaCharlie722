-- Check-in System Database Setup
-- Copy and paste this into your Supabase SQL Editor and run it

-- Create check_ins table
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL,
    user_id UUID NOT NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    checked_out_at TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_check_ins_venue_id ON public.check_ins(venue_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_active ON public.check_ins(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_check_ins_venue_active ON public.check_ins(venue_id, is_active) WHERE is_active = true;

-- Enable RLS (Row Level Security)
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view check ins" ON public.check_ins FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create check ins" ON public.check_ins FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can update own check ins" ON public.check_ins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own check ins" ON public.check_ins FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically check out old check-ins (older than 12 hours)
CREATE OR REPLACE FUNCTION auto_checkout_old_checkins()
RETURNS void AS $$
BEGIN
    UPDATE public.check_ins 
    SET 
        is_active = false,
        checked_out_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE 
        is_active = true 
        AND checked_in_at < (timezone('utc'::text, now()) - INTERVAL '12 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT SELECT ON public.check_ins TO anon;

-- Success message
SELECT 'Check-in system database setup complete!' as message;