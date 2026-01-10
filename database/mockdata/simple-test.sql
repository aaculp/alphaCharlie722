-- Simple Test Data for Analytics Dashboard
-- This creates minimal test data that should work with any setup

-- Step 1: Check what venues exist
SELECT 'Step 1: Existing venues' as info;
SELECT id, name, category FROM venues LIMIT 5;

-- Step 2: Create a simple test venue with proper UUID
INSERT INTO venues (
  id,
  name,
  description,
  category,
  location,
  address,
  phone,
  rating,
  review_count,
  amenities,
  hours,
  price_range
) VALUES (
  gen_random_uuid(),
  'Test Analytics Cafe',
  'A test venue for analytics dashboard',
  'Coffee Shop',
  'Test City',
  '123 Test Street',
  '555-0123',
  4.5,
  10,
  ARRAY['WiFi', 'Outdoor Seating'],
  '{"monday": "8:00 AM - 8:00 PM"}',
  '$'
) RETURNING id, name;

-- Step 3: Get the venue ID we just created
-- (You'll need to copy this ID for the next steps)
SELECT 'Step 3: Copy this venue ID for next steps' as info;
SELECT id, name FROM venues WHERE name = 'Test Analytics Cafe';