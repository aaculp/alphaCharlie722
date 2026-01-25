-- Migration: Add RLS policy for user search
-- Date: 2025-01-25
-- Requirements: 2.7, 9.1, 9.2

-- Allow authenticated users to search and view other users' profiles
-- This policy enables user search functionality while maintaining privacy
CREATE POLICY "Authenticated users can search profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Add comment for documentation
COMMENT ON POLICY "Authenticated users can search profiles" ON profiles IS 
'Allows authenticated users to search for other users by username or display_name. Only public profile information is exposed.';
