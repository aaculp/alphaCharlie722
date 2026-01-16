-- Add Test User Script
-- This script creates a test user in both auth.users and profiles tables

-- Create test user in auth.users (Supabase Auth)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'testuser@example.com',
  crypt('password123', gen_salt('bf')), -- Password: password123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Test User"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Create test user profile
INSERT INTO profiles (
  id,
  email,
  name,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'testuser@example.com',
  'Test User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Display success message
SELECT 
  '✅ Test user created successfully!' as message,
  '00000000-0000-0000-0000-000000000001'::uuid as user_id,
  'testuser@example.com' as email,
  'password123' as password,
  'Test User' as name;

-- Optional: Add some test data for the user
-- Uncomment the sections below if you want to add additional test data

/*
-- Add test device token for push notifications
INSERT INTO device_tokens (
  user_id,
  token,
  platform,
  is_active,
  last_used_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test-fcm-token-' || gen_random_uuid()::text,
  'ios',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Add test privacy settings
INSERT INTO privacy_settings (
  user_id,
  profile_visibility,
  checkin_visibility,
  favorite_visibility,
  default_collection_visibility,
  allow_follow_requests,
  show_activity_status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'public',
  'friends',
  'friends',
  'friends',
  true,
  true
)
ON CONFLICT (user_id) DO NOTHING;

-- Display additional info
SELECT 
  '✅ Test user data created!' as message,
  'Device token and privacy settings added' as details;
*/
