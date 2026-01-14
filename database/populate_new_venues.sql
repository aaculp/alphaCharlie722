-- Populate New Venues for Testing the New Venues Spotlight Feature
-- This script creates 10 test venues with recent signup dates (1-20 days ago)
-- Run this script in the Supabase SQL Editor

-- First, delete any existing test venues to avoid duplicates
DELETE FROM venue_business_accounts
WHERE venue_id IN (
  SELECT id FROM venues
  WHERE name IN (
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
);

DELETE FROM venues
WHERE name IN (
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
);

-- Insert test venues
INSERT INTO venues (name, category, description, location, address, latitude, longitude, rating, price_range, image_url, amenities, hours, review_count, phone, website)
VALUES
  (
    'The Fresh Brew',
    'Coffee Shops',
    'Brand new artisan coffee shop with locally roasted beans and fresh pastries',
    'San Francisco, CA',
    '123 Main St',
    37.7749,
    -122.4194,
    0,
    '$',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'Neon Nights Club',
    'Nightclubs',
    'Just opened! The hottest new nightclub with world-class DJs',
    'San Francisco, CA',
    '456 Dance Ave',
    37.7849,
    -122.4094,
    4.8,
    '$$',
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'Sunrise Yoga Studio',
    'Fitness',
    'New yoga and wellness center offering morning and evening classes',
    'San Francisco, CA',
    '789 Zen Way',
    37.7649,
    -122.4294,
    0,
    '$',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'Burger Bliss',
    'Fast Food',
    'Gourmet burgers made with locally sourced ingredients - now open!',
    'San Francisco, CA',
    '321 Burger Blvd',
    37.7549,
    -122.4394,
    4.5,
    '$',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'The Craft Tap Room',
    'Breweries',
    'New craft brewery featuring 20 rotating taps of local beers',
    'San Francisco, CA',
    '654 Hops St',
    37.7949,
    -122.3994,
    4.7,
    '$$',
    'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'Sushi Zen',
    'Fine Dining',
    'Authentic Japanese cuisine with a modern twist - grand opening!',
    'San Francisco, CA',
    '987 Sushi Lane',
    37.7449,
    -122.4494,
    0,
    '$$$',
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'The Game Lounge',
    'Sports Bars',
    'New sports bar with 50+ screens and the best wings in town',
    'San Francisco, CA',
    '147 Sports Way',
    37.7349,
    -122.4594,
    4.6,
    '$$',
    'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'Vegan Vibes',
    'Restaurants',
    'Plant-based restaurant serving innovative vegan dishes',
    'San Francisco, CA',
    '258 Green St',
    37.7249,
    -122.4694,
    4.9,
    '$$',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'The Rooftop Lounge',
    'Lounges',
    'Stunning new rooftop bar with panoramic city views',
    'San Francisco, CA',
    '369 Sky High Ave',
    37.7149,
    -122.4794,
    0,
    '$$$',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  ),
  (
    'Morning Glory Cafe',
    'Coffee Shops',
    'Cozy neighborhood cafe with amazing breakfast and coffee',
    'San Francisco, CA',
    '741 Sunrise Blvd',
    37.7049,
    -122.4894,
    4.4,
    '$',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    ARRAY[]::text[],
    '{}'::jsonb,
    0,
    NULL,
    NULL
  );

-- Create business accounts for the new venues with recent signup dates
-- This uses a CTE to get the venue IDs and assign signup dates
WITH venue_signup_dates AS (
  SELECT 
    id,
    name,
    CASE name
      WHEN 'The Fresh Brew' THEN NOW() - INTERVAL '2 days'
      WHEN 'Neon Nights Club' THEN NOW() - INTERVAL '5 days'
      WHEN 'Sunrise Yoga Studio' THEN NOW() - INTERVAL '1 day'
      WHEN 'Burger Bliss' THEN NOW() - INTERVAL '7 days'
      WHEN 'The Craft Tap Room' THEN NOW() - INTERVAL '10 days'
      WHEN 'Sushi Zen' THEN NOW() - INTERVAL '3 days'
      WHEN 'The Game Lounge' THEN NOW() - INTERVAL '14 days'
      WHEN 'Vegan Vibes' THEN NOW() - INTERVAL '20 days'
      WHEN 'The Rooftop Lounge' THEN NOW() - INTERVAL '4 days'
      WHEN 'Morning Glory Cafe' THEN NOW() - INTERVAL '12 days'
    END as signup_date
  FROM venues
  WHERE name IN (
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
)
INSERT INTO venue_business_accounts (venue_id, created_at, account_status, verification_status, subscription_tier)
SELECT 
  id,
  signup_date,
  'active',
  'verified',
  'free'
FROM venue_signup_dates;

-- Verify the results
SELECT 
  v.name,
  v.category,
  v.rating,
  vba.created_at as signup_date,
  EXTRACT(DAY FROM (NOW() - vba.created_at)) as days_ago,
  vba.account_status,
  vba.verification_status
FROM venues v
INNER JOIN venue_business_accounts vba ON v.id = vba.venue_id
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
