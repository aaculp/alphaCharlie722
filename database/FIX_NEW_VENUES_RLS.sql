-- FIX: New Venues Not Showing Due to RLS Policies
-- The issue is likely that venue_business_accounts table has RLS enabled
-- but no policy allows anonymous/authenticated users to SELECT

-- ============================================
-- STEP 1: Check current RLS status
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'venue_business_accounts';

-- ============================================
-- STEP 2: Check existing policies
-- ============================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'venue_business_accounts';

-- ============================================
-- STEP 3: Create SELECT policy for venue_business_accounts
-- This allows anyone to read business account data (needed for new venues spotlight)
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access to venue business accounts" ON venue_business_accounts;

-- Create new policy that allows SELECT for everyone
CREATE POLICY "Allow public read access to venue business accounts"
ON venue_business_accounts
FOR SELECT
TO public
USING (true);

-- ============================================
-- STEP 4: Verify the policy was created
-- ============================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'venue_business_accounts'
  AND policyname = 'Allow public read access to venue business accounts';

-- ============================================
-- STEP 5: Test the query as it would run from the app
-- ============================================
-- This simulates what the app sees when making the query
SET ROLE anon; -- Switch to anonymous role (like unauthenticated app users)

SELECT 
  v.id,
  v.name,
  v.category,
  vba.created_at as signup_date
FROM venues v
INNER JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE vba.created_at >= NOW() - INTERVAL '30 days'
  AND vba.account_status = 'active'
  AND vba.verification_status = 'verified'
ORDER BY vba.created_at DESC
LIMIT 10;

RESET ROLE; -- Switch back to admin role

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ RLS policy created! New venues should now appear in the app.' as status;
