-- Add Check-ins to Test Venue
-- Replace 'YOUR_VENUE_ID_HERE' with the actual venue ID from simple-test.sql

-- First, create some test user profiles
INSERT INTO profiles (id, email, name) VALUES 
(gen_random_uuid(), 'testuser1@example.com', 'Test User 1'),
(gen_random_uuid(), 'testuser2@example.com', 'Test User 2'),
(gen_random_uuid(), 'testuser3@example.com', 'Test User 3'),
(gen_random_uuid(), 'testuser4@example.com', 'Test User 4'),
(gen_random_uuid(), 'testuser5@example.com', 'Test User 5'),
(gen_random_uuid(), 'testuser6@example.com', 'Test User 6')
ON CONFLICT (email) DO NOTHING;

-- Add some check-ins (replace YOUR_VENUE_ID_HERE with actual venue ID)
-- Active check-ins (currently in the venue)
INSERT INTO check_ins (venue_id, user_id, checked_in_at, is_active) 
SELECT 
  'YOUR_VENUE_ID_HERE'::uuid,
  p.id,
  NOW() - INTERVAL '30 minutes',
  true
FROM profiles p 
WHERE p.email = 'testuser1@example.com';

INSERT INTO check_ins (venue_id, user_id, checked_in_at, is_active) 
SELECT 
  'YOUR_VENUE_ID_HERE'::uuid,
  p.id,
  NOW() - INTERVAL '1 hour',
  true
FROM profiles p 
WHERE p.email = 'testuser2@example.com';

INSERT INTO check_ins (venue_id, user_id, checked_in_at, is_active) 
SELECT 
  'YOUR_VENUE_ID_HERE'::uuid,
  p.id,
  NOW() - INTERVAL '45 minutes',
  true
FROM profiles p 
WHERE p.email = 'testuser3@example.com';

-- Completed check-ins (for analytics history)
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active) 
SELECT 
  'YOUR_VENUE_ID_HERE'::uuid,
  p.id,
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '2 hours',
  false
FROM profiles p 
WHERE p.email = 'testuser4@example.com';

INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active) 
SELECT 
  'YOUR_VENUE_ID_HERE'::uuid,
  p.id,
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '4 hours',
  false
FROM profiles p 
WHERE p.email = 'testuser5@example.com';

-- Yesterday's check-ins
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active) 
SELECT 
  'YOUR_VENUE_ID_HERE'::uuid,
  p.id,
  NOW() - INTERVAL '1 day' + INTERVAL '2 hours',
  NOW() - INTERVAL '1 day' + INTERVAL '3 hours',
  false
FROM profiles p 
WHERE p.email = 'testuser6@example.com';

-- Verify the data was created
SELECT 'Check-ins created successfully!' as result;
SELECT 
  COUNT(*) as total_checkins,
  COUNT(CASE WHEN is_active THEN 1 END) as active_checkins
FROM check_ins 
WHERE venue_id = 'YOUR_VENUE_ID_HERE'::uuid;