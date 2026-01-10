-- Quick Test Data for Analytics Dashboard
-- This script adds sample check-ins to your existing venues

-- First, let's see what venues exist
SELECT id, name FROM venues LIMIT 5;

-- Add some test check-ins to the first venue (replace the venue_id with an actual one from above)
-- You'll need to copy a real venue ID from the query above and replace 'YOUR_VENUE_ID_HERE'

-- Example check-ins for testing (replace YOUR_VENUE_ID_HERE with actual venue ID):
/*
-- Create some sample profiles first
INSERT INTO profiles (id, email, name) VALUES 
(gen_random_uuid(), 'test1@example.com', 'Test User 1'),
(gen_random_uuid(), 'test2@example.com', 'Test User 2'),
(gen_random_uuid(), 'test3@example.com', 'Test User 3'),
(gen_random_uuid(), 'test4@example.com', 'Test User 4'),
(gen_random_uuid(), 'test5@example.com', 'Test User 5')
ON CONFLICT (email) DO NOTHING;

-- Add check-ins (replace YOUR_VENUE_ID_HERE with actual venue ID)
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active) 
SELECT 
  'YOUR_VENUE_ID_HERE'::uuid,
  p.id,
  NOW() - (random() * INTERVAL '2 hours'),
  CASE 
    WHEN random() > 0.3 THEN NOW() - (random() * INTERVAL '1 hour')
    ELSE NULL 
  END,
  CASE 
    WHEN random() > 0.3 THEN false
    ELSE true 
  END
FROM profiles p 
WHERE p.email LIKE 'test%@example.com'
LIMIT 5;
*/

-- Instructions:
-- 1. Run the SELECT query above to see your venues
-- 2. Copy a venue ID from the results
-- 3. Uncomment the INSERT statements below
-- 4. Replace 'YOUR_VENUE_ID_HERE' with the actual venue ID
-- 5. Run the script