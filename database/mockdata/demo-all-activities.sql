-- Demo Script: Show ALL Activity Types
-- This creates sample data to demonstrate every activity type in the Recent Activity feed

-- Use your test venue ID: e8bbe779-5f94-4b82-933c-ad2b2c318d0b

-- Add more varied check-ins for different activity titles
INSERT INTO check_ins (venue_id, user_id, checked_in_at, is_active) VALUES
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '5 minutes', true),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '12 minutes', true),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '18 minutes', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '25 minutes', false),
('e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, gen_random_uuid(), NOW() - INTERVAL '35 minutes', false);

-- Add sample reviews (if reviews table exists)
-- Note: This will only work if you have a reviews table set up
/*
INSERT INTO reviews (user_id, venue_id, rating, comment, created_at) VALUES
(gen_random_uuid(), 'e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, 5, 'Amazing coffee and service!', NOW() - INTERVAL '10 minutes'),
(gen_random_uuid(), 'e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, 4, 'Great atmosphere for work', NOW() - INTERVAL '45 minutes');
*/

-- Add sample favorites (if favorites table exists)
-- Note: This will only work if you have a favorites table set up
/*
INSERT INTO favorites (user_id, venue_id, created_at) VALUES
(gen_random_uuid(), 'e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, NOW() - INTERVAL '20 minutes'),
(gen_random_uuid(), 'e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid, NOW() - INTERVAL '1 hour');
*/

-- Add sample push notifications (if venue_push_notifications table exists)
-- Note: This will only work if you have the venue business account system set up
/*
INSERT INTO venue_push_notifications (
  venue_business_account_id,
  venue_id,
  title,
  message,
  notification_type,
  target_radius_miles,
  target_user_count,
  actual_sent_count,
  sent_at,
  status,
  credits_used,
  delivery_stats,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(), -- You'd need a real business account ID
  'e8bbe779-5f94-4b82-933c-ad2b2c318d0b'::uuid,
  'Happy Hour Special!',
  'Join us for 20% off all drinks from 3-5 PM today!',
  'flash_offer',
  2.0,
  150,
  142,
  NOW() - INTERVAL '30 minutes',
  'sent',
  1,
  '{"delivered": 142, "opened": 67, "clicked": 23}',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
);
*/

SELECT 'Demo data created! Check the Activity tab to see all activity types.' as message;
SELECT 'Note: Some activities are simulated and will appear automatically based on the check-ins above.' as note;