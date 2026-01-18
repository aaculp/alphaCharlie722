-- Add Test Check-ins for Push Notification Testing
-- This creates check-ins for the test user at the Palm Bay venue
-- so they will be targeted by flash offer notifications

-- User: palmbaytest@icloud.com
-- User ID: 441b155d-0f20-4a88-b1cb-ff4d33ec5e56
-- Venue ID: 036324ad-d9c6-484b-9f9f-0356346e681f (Palm Bay Test Spot)

-- Add a recent check-in (within last 30 days)
INSERT INTO check_ins (user_id, venue_id, created_at)
VALUES (
  '441b155d-0f20-4a88-b1cb-ff4d33ec5e56',
  '036324ad-d9c6-484b-9f9f-0356346e681f',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT DO NOTHING;

-- Verify check-in was created
SELECT 
  ci.id,
  ci.user_id,
  ci.venue_id,
  v.name as venue_name,
  ci.created_at,
  AGE(NOW(), ci.created_at) as age
FROM check_ins ci
JOIN venues v ON v.id = ci.venue_id
WHERE ci.user_id = '441b155d-0f20-4a88-b1cb-ff4d33ec5e56'
ORDER BY ci.created_at DESC
LIMIT 5;
