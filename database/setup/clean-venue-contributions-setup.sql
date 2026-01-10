-- Clean venue contributions setup (authentication required)
-- This script sets up the venue contributions system for authenticated users only
-- Run this in your Supabase SQL editor

-- 1. Drop any existing anonymous user tables and columns if they exist
DROP TABLE IF EXISTS anonymous_users CASCADE;

-- 2. First, drop all existing policies that might depend on anonymous columns
DROP POLICY IF EXISTS "Users can view all contributions" ON venue_contributions;
DROP POLICY IF EXISTS "Users can insert their own contributions" ON venue_contributions;
DROP POLICY IF EXISTS "Users can update their own contributions" ON venue_contributions;
DROP POLICY IF EXISTS "Users can delete their own contributions" ON venue_contributions;
DROP POLICY IF EXISTS "Anyone can view all contributions" ON venue_contributions;
DROP POLICY IF EXISTS "Anyone can insert contributions" ON venue_contributions;

-- 3. Clean up venue_contributions table structure
-- Remove anonymous user columns if they exist (now safe after dropping policies)
ALTER TABLE venue_contributions DROP COLUMN IF EXISTS anonymous_user_id;
ALTER TABLE venue_contributions DROP COLUMN IF EXISTS is_anonymous;

-- Make sure user_id is NOT NULL (required for authenticated users)
ALTER TABLE venue_contributions ALTER COLUMN user_id SET NOT NULL;

-- Drop any anonymous-related constraints
ALTER TABLE venue_contributions DROP CONSTRAINT IF EXISTS check_user_type;

-- 4. Ensure proper table structure
CREATE TABLE IF NOT EXISTS venue_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('wait_times', 'mood', 'popular', 'amenities')),
  option_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_contributions_venue_id ON venue_contributions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_contributions_type ON venue_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_venue_contributions_user_id ON venue_contributions(user_id);

-- 6. Create view for contribution counts
DROP VIEW IF EXISTS venue_contribution_counts;
CREATE VIEW venue_contribution_counts AS
SELECT 
  venue_id,
  contribution_type,
  option_text,
  COUNT(*) as count,
  MAX(created_at) as last_contributed
FROM venue_contributions
GROUP BY venue_id, contribution_type, option_text
ORDER BY venue_id, contribution_type, count DESC;

-- 7. Enable RLS (Row Level Security)
ALTER TABLE venue_contributions ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for authenticated users only (policies were already dropped above)
CREATE POLICY "Users can view all contributions" ON venue_contributions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own contributions" ON venue_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contributions" ON venue_contributions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contributions" ON venue_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_venue_contributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS venue_contributions_updated_at ON venue_contributions;
CREATE TRIGGER venue_contributions_updated_at
  BEFORE UPDATE ON venue_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_contributions_updated_at();

-- 10. Grant permissions (authenticated users only)
GRANT ALL ON venue_contributions TO authenticated;
GRANT SELECT ON venue_contribution_counts TO authenticated;

-- 11. Clean up any anonymous-related functions
DROP FUNCTION IF EXISTS create_anonymous_user();
DROP FUNCTION IF EXISTS update_anonymous_user_activity(UUID);
DROP FUNCTION IF EXISTS update_anonymous_users_updated_at();

-- 12. Success message
SELECT 
  'Clean venue contributions setup completed!' as status,
  'Authentication required for contributions' as note,
  COUNT(*) as existing_contributions
FROM venue_contributions;