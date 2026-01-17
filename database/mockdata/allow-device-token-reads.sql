-- TEMPORARY FIX FOR TESTING ONLY
-- Allow reading device tokens for push notification targeting
-- In production, this should be done via a backend service with service role

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only view own tokens" ON device_tokens;
DROP POLICY IF EXISTS "Users can view own device tokens" ON device_tokens;

-- Create a permissive policy for SELECT (testing only)
CREATE POLICY "Allow reading device tokens for push notifications (TESTING)"
ON device_tokens
FOR SELECT
USING (true);

-- Note: This allows anyone to read all device tokens
-- This is ONLY for testing the push notification flow
-- In production, use a backend service with service role key
