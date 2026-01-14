-- Verify New Venues Data
-- Run this script in Supabase SQL Editor to check if the test venues exist and are configured correctly

-- 1. Check if the test venues exist
SELECT 
  v.id,
  v.name,
  v.category,
  v.created_at as venue_created_at
FROM venues v
WHERE v.name IN (
  'The Fresh Brew',
  'Neon Nights Club',
  'Sunrise Yoga Studio',
  'Burger Bliss',
  'The Craft Tap Room',
  'Sushi Zen',
  'The Game Lounge',
  'Vegan Vibes',
  'The Rooftop Lounge',
  'Morning Glory Cafe'
)
ORDER BY v.name;

-- 2. Check if business accounts exist for these venues
SELECT 
  v.name,
  vba.venue_id,
  vba.created_at as signup_date,
  vba.account_status,
  vba.verification_status,
  vba.subscription_tier,
  EXTRACT(DAY FROM (NOW() - vba.created_at)) as days_ago
FROM venues v
LEFT JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE v.name IN (
  'The Fresh Brew',
  'Neon Nights Club',
  'Sunrise Yoga Studio',
  'Burger Bliss',
  'The Craft Tap Room',
  'Sushi Zen',
  'The Game Lounge',
  'Vegan Vibes',
  'The Rooftop Lounge',
  'Morning Glory Cafe'
)
ORDER BY vba.created_at DESC;

-- 3. Check what the API query would return (simulating the exact query)
SELECT 
  v.*,
  vba.created_at as signup_date,
  vba.account_status,
  vba.verification_status
FROM venues v
INNER JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE vba.created_at >= NOW() - INTERVAL '30 days'
  AND vba.account_status = 'active'
  AND vba.verification_status = 'verified'
ORDER BY vba.created_at DESC
LIMIT 10;

-- 4. Count total venues with business accounts
SELECT 
  COUNT(*) as total_venues_with_accounts,
  COUNT(CASE WHEN vba.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as venues_within_30_days,
  COUNT(CASE WHEN vba.account_status = 'active' THEN 1 END) as active_accounts,
  COUNT(CASE WHEN vba.verification_status = 'verified' THEN 1 END) as verified_accounts
FROM venues v
LEFT JOIN venue_business_accounts vba ON v.id = vba.venue_id;
