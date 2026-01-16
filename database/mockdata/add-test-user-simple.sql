-- Simple Test User Script
-- This script creates a test user profile that can be linked to a Supabase Auth user
-- 
-- IMPORTANT: You need to create the auth user through Supabase Dashboard first!
-- 
-- Steps:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" and create a user with:
--    - Email: aaculp1@icloud.com
--    - Password: password123
--    - Auto Confirm User: YES
-- 3. Copy the UUID from the created user
-- 4. Replace the UUID below (line 23) with the copied UUID
-- 5. Run this script

-- ============================================================================
-- REPLACE THIS UUID WITH YOUR ACTUAL AUTH USER UUID!
-- ============================================================================
-- Get the UUID from: Supabase Dashboard > Authentication > Users
-- After creating the user, copy the ID column value

-- Create test user profile
INSERT INTO profiles (
  id,
  email,
  name,
  created_at,
  updated_at
) VALUES (
  '1f07cc7c-6496-4e67-b944-963945b0691d'::uuid, -- ⚠️ REPLACE THIS UUID!
  'aaculp1@icloud.com',
  'Test User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Add test device token for push notifications
INSERT INTO device_tokens (
  user_id,
  token,
  platform,
  is_active,
  last_used_at
) VALUES (
  '1f07cc7c-6496-4e67-b944-963945b0691d'::uuid, -- ⚠️ REPLACE THIS UUID!
  'test-fcm-token-' || gen_random_uuid()::text,
  'ios',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Update privacy settings (created automatically by trigger)
UPDATE privacy_settings 
SET 
  profile_visibility = 'public',
  checkin_visibility = 'friends',
  favorite_visibility = 'friends',
  default_collection_visibility = 'friends',
  allow_follow_requests = true,
  show_activity_status = true
WHERE user_id = '1f07cc7c-6496-4e67-b944-963945b0691d'::uuid; -- ⚠️ REPLACE THIS UUID!

-- Verify the user was created
SELECT 
  '✅ Test user profile created!' as message,
  id as user_id,
  email,
  name,
  created_at
FROM profiles 
WHERE email = 'aaculp1@icloud.com';

SELECT 
  '📱 Device token added!' as message,
  COUNT(*) as token_count
FROM device_tokens 
WHERE user_id = '1f07cc7c-6496-4e67-b944-963945b0691d'::uuid; -- ⚠️ REPLACE THIS UUID!

SELECT 
  '🔒 Privacy settings configured!' as message,
  profile_visibility,
  checkin_visibility,
  allow_follow_requests
FROM privacy_settings 
WHERE user_id = '1f07cc7c-6496-4e67-b944-963945b0691d'::uuid; -- ⚠️ REPLACE THIS UUID!
