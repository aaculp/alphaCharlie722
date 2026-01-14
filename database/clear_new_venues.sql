-- Clear New Venues Test Data
-- This script removes all test venues created by populate_new_venues.sql
-- Run this script in the Supabase SQL Editor

-- Delete business accounts first (foreign key constraint)
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

-- Delete the venues
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

-- Verify deletion
SELECT COUNT(*) as remaining_test_venues
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
);
