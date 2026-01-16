-- Comprehensive Test Users Script
-- This script creates multiple test users with various configurations
-- for development and testing purposes

-- ============================================================================
-- AUTH USERS (Supabase Auth)
-- ============================================================================

-- Test User 1: Basic user
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
  'testuser1@example.com',
  crypt('password123', gen_salt('bf')),
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Test User One"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Test User 2: Active user
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
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'testuser2@example.com',
  crypt('password123', gen_salt('bf')),
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '60 days',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Test User Two"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Test User 3: New user
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
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'testuser3@example.com',
  crypt('password123', gen_salt('bf')),
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Test User Three"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- ============================================================================
-- PROFILES
-- ============================================================================

-- Test User 1: Basic user
INSERT INTO profiles (
  id,
  email,
  name,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'testuser1@example.com',
  'Test User One',
  NOW() - INTERVAL '30 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Test User 2: Active user with recent activity
INSERT INTO profiles (
  id,
  email,
  name,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'testuser2@example.com',
  'Test User Two',
  NOW() - INTERVAL '60 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Test User 3: New user
INSERT INTO profiles (
  id,
  email,
  name,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  'testuser3@example.com',
  'Test User Three',
  NOW() - INTERVAL '7 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- ============================================================================
-- DEVICE TOKENS (for push notification testing)
-- ============================================================================

-- Add device tokens for test users
INSERT INTO device_tokens (
  user_id,
  token,
  platform,
  is_active,
  last_used_at
) VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'test-ios-token-' || gen_random_uuid()::text, 'ios', true, NOW()),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'test-android-token-' || gen_random_uuid()::text, 'android', true, NOW()),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'test-ios-token-' || gen_random_uuid()::text, 'ios', true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PRIVACY SETTINGS
-- ============================================================================

-- Add privacy settings for test users
INSERT INTO privacy_settings (
  user_id,
  profile_visibility,
  checkin_visibility,
  favorite_visibility,
  default_collection_visibility,
  allow_follow_requests,
  show_activity_status
) VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'public', 'friends', 'friends', 'friends', true, true),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'friends', 'friends', 'close_friends', 'friends', true, true),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'public', 'public', 'public', 'public', true, true)
ON CONFLICT (user_id) DO UPDATE SET
  profile_visibility = EXCLUDED.profile_visibility,
  checkin_visibility = EXCLUDED.checkin_visibility,
  favorite_visibility = EXCLUDED.favorite_visibility,
  default_collection_visibility = EXCLUDED.default_collection_visibility,
  allow_follow_requests = EXCLUDED.allow_follow_requests,
  show_activity_status = EXCLUDED.show_activity_status;

-- ============================================================================
-- FRIENDSHIPS (optional - uncomment to create test friendships)
-- ============================================================================

/*
-- Create friendship between test users 1 and 2
INSERT INTO friendships (
  user_id_1,
  user_id_2,
  status,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'accepted',
  NOW() - INTERVAL '20 days'
)
ON CONFLICT DO NOTHING;

-- Create pending friend request from test user 3 to test user 1
INSERT INTO friend_requests (
  from_user_id,
  to_user_id,
  status,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'pending',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- COLLECTIONS (optional - uncomment to create test collections)
-- ============================================================================

/*
-- Create a test collection for test user 1
INSERT INTO collections (
  id,
  user_id,
  name,
  description,
  is_public,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'My Favorite Coffee Shops',
  'A collection of the best coffee shops in the city',
  true,
  NOW() - INTERVAL '15 days',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
  '✅ Test users created successfully!' as message,
  COUNT(*) as users_created
FROM profiles 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);

SELECT 
  id as user_id,
  email,
  name,
  'password123' as password,
  created_at
FROM profiles 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
)
ORDER BY id;

SELECT 
  '📱 Device tokens added' as message,
  COUNT(*) as tokens_added
FROM device_tokens 
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);

SELECT 
  '🔒 Privacy settings configured' as message,
  COUNT(*) as settings_added
FROM privacy_settings 
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);
