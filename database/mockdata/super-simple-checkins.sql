-- Super Simple Check-ins for Testing
-- Replace 'e8bbe779-5f94-4b82-933c-ad2b2c318d0b' with the actual venue ID from simple-test.sql

-- Add some check-ins with random user IDs (no profiles needed)
-- Active check-ins (currently in the venue)
INSERT INTO check_ins (venue_id, user_id, checked_in_at, is_active) VALUES
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '30 minutes', true),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '1 hour', true),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '45 minutes', true),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '15 minutes', true);

-- Completed check-ins (for analytics history)
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active) VALUES
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 30 minutes', false);

-- Yesterday's check-ins
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active) VALUES
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '1 day' + INTERVAL '2 hours', NOW() - INTERVAL '1 day' + INTERVAL '3 hours', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '1 day' + INTERVAL '4 hours', NOW() - INTERVAL '1 day' + INTERVAL '5 hours', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '1 day' + INTERVAL '6 hours', NOW() - INTERVAL '1 day' + INTERVAL '7 hours', false);

-- This week's check-ins for better analytics
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active) VALUES
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '2 days' + INTERVAL '3 hours', NOW() - INTERVAL '2 days' + INTERVAL '4 hours', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '3 days' + INTERVAL '5 hours', NOW() - INTERVAL '3 days' + INTERVAL '6 hours', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '4 days' + INTERVAL '2 hours', NOW() - INTERVAL '4 days' + INTERVAL '3 hours', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '5 days' + INTERVAL '4 hours', NOW() - INTERVAL '5 days' + INTERVAL '5 hours', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '6 days' + INTERVAL '6 hours', NOW() - INTERVAL '6 days' + INTERVAL '7 hours', false);

-- Verify the data was created
SELECT 'Check-ins created successfully!' as result;
SELECT 
  COUNT(*) as total_checkins,
  COUNT(CASE WHEN is_active THEN 1 END) as active_checkins,
  COUNT(CASE WHEN checked_in_at >= NOW() - INTERVAL '1 day' THEN 1 END) as today_checkins,
  COUNT(CASE WHEN checked_in_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week_checkins
FROM check_ins 
WHERE venue_id = 'e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid;