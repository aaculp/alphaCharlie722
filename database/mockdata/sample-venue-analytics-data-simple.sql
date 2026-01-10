-- Sample Venue Analytics Data Script (Simple Version)
-- This script creates a complete sample venue with all necessary data
-- to test the venue analytics dashboard with real database data

-- First, let's create a sample venue (using only existing columns)
INSERT INTO venues (
  id,
  name,
  description,
  category,
  location,
  address,
  phone,
  website,
  rating,
  review_count,
  amenities,
  hours,
  price_range
) VALUES (
  'sample-venue-001',
  'The Analytics Cafe',
  'A modern coffee shop and eatery perfect for testing our analytics dashboard. Features great coffee, fresh food, and a welcoming atmosphere.',
  'Coffee Shops',
  'Downtown, Tech District',
  '123 Analytics Street, Tech District, CA 94105',
  '+1 (555) 123-4567',
  'https://analyticsacafe.com',
  4.7,
  156,
  ARRAY['WiFi', 'Outdoor Seating', 'Pet Friendly', 'Parking Available', 'Takeout', 'Delivery'],
  '{
    "monday": "7:00 AM - 9:00 PM",
    "tuesday": "7:00 AM - 9:00 PM", 
    "wednesday": "7:00 AM - 9:00 PM",
    "thursday": "7:00 AM - 9:00 PM",
    "friday": "7:00 AM - 10:00 PM",
    "saturday": "8:00 AM - 10:00 PM",
    "sunday": "8:00 AM - 8:00 PM"
  }',
  '$'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Create sample customer profiles
INSERT INTO profiles (id, email, name, created_at, updated_at) VALUES
('customer-001', 'sarah.m@email.com', 'Sarah Miller', NOW() - INTERVAL '60 days', NOW()),
('customer-002', 'mike.j@email.com', 'Mike Johnson', NOW() - INTERVAL '58 days', NOW()),
('customer-003', 'emma.w@email.com', 'Emma Wilson', NOW() - INTERVAL '56 days', NOW()),
('customer-004', 'david.l@email.com', 'David Lee', NOW() - INTERVAL '54 days', NOW()),
('customer-005', 'lisa.k@email.com', 'Lisa Kim', NOW() - INTERVAL '52 days', NOW()),
('customer-006', 'james.r@email.com', 'James Rodriguez', NOW() - INTERVAL '50 days', NOW()),
('customer-007', 'anna.s@email.com', 'Anna Smith', NOW() - INTERVAL '48 days', NOW()),
('customer-008', 'chris.b@email.com', 'Chris Brown', NOW() - INTERVAL '46 days', NOW()),
('customer-009', 'maria.g@email.com', 'Maria Garcia', NOW() - INTERVAL '44 days', NOW()),
('customer-010', 'tom.h@email.com', 'Tom Harris', NOW() - INTERVAL '42 days', NOW()),
('customer-011', 'jenny.p@email.com', 'Jenny Parker', NOW() - INTERVAL '40 days', NOW()),
('customer-012', 'alex.c@email.com', 'Alex Chen', NOW() - INTERVAL '38 days', NOW()),
('customer-013', 'sam.d@email.com', 'Sam Davis', NOW() - INTERVAL '36 days', NOW()),
('customer-014', 'kate.m@email.com', 'Kate Martinez', NOW() - INTERVAL '34 days', NOW()),
('customer-015', 'ryan.t@email.com', 'Ryan Taylor', NOW() - INTERVAL '32 days', NOW()),
('customer-016', 'nina.v@email.com', 'Nina Volkov', NOW() - INTERVAL '30 days', NOW()),
('customer-017', 'paul.f@email.com', 'Paul Foster', NOW() - INTERVAL '28 days', NOW()),
('customer-018', 'zoe.l@email.com', 'Zoe Liu', NOW() - INTERVAL '26 days', NOW()),
('customer-019', 'max.w@email.com', 'Max Wright', NOW() - INTERVAL '24 days', NOW()),
('customer-020', 'ivy.n@email.com', 'Ivy Nelson', NOW() - INTERVAL '22 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create venue owner profile
INSERT INTO profiles (
  id,
  email,
  name,
  created_at,
  updated_at
) VALUES (
  'sample-owner-001',
  'owner@analyticsacafe.com',
  'Alex Johnson',
  NOW() - INTERVAL '30 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- Generate check-ins for the past 30 days (sample data)
-- Day 1 check-ins
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active, created_at, updated_at) VALUES
('sample-venue-001', 'customer-001', NOW() - INTERVAL '30 days' + INTERVAL '8 hours', NOW() - INTERVAL '30 days' + INTERVAL '8 hours 45 minutes', false, NOW() - INTERVAL '30 days' + INTERVAL '8 hours', NOW() - INTERVAL '30 days' + INTERVAL '8 hours 45 minutes'),
('sample-venue-001', 'customer-002', NOW() - INTERVAL '30 days' + INTERVAL '9 hours', NOW() - INTERVAL '30 days' + INTERVAL '9 hours 30 minutes', false, NOW() - INTERVAL '30 days' + INTERVAL '9 hours', NOW() - INTERVAL '30 days' + INTERVAL '9 hours 30 minutes'),
('sample-venue-001', 'customer-003', NOW() - INTERVAL '30 days' + INTERVAL '12 hours', NOW() - INTERVAL '30 days' + INTERVAL '12 hours 25 minutes', false, NOW() - INTERVAL '30 days' + INTERVAL '12 hours', NOW() - INTERVAL '30 days' + INTERVAL '12 hours 25 minutes'),
('sample-venue-001', 'customer-004', NOW() - INTERVAL '30 days' + INTERVAL '13 hours', NOW() - INTERVAL '30 days' + INTERVAL '13 hours 40 minutes', false, NOW() - INTERVAL '30 days' + INTERVAL '13 hours', NOW() - INTERVAL '30 days' + INTERVAL '13 hours 40 minutes'),
('sample-venue-001', 'customer-005', NOW() - INTERVAL '30 days' + INTERVAL '18 hours', NOW() - INTERVAL '30 days' + INTERVAL '18 hours 55 minutes', false, NOW() - INTERVAL '30 days' + INTERVAL '18 hours', NOW() - INTERVAL '30 days' + INTERVAL '18 hours 55 minutes'),
('sample-venue-001', 'customer-006', NOW() - INTERVAL '30 days' + INTERVAL '19 hours', NOW() - INTERVAL '30 days' + INTERVAL '19 hours 35 minutes', false, NOW() - INTERVAL '30 days' + INTERVAL '19 hours', NOW() - INTERVAL '30 days' + INTERVAL '19 hours 35 minutes');

-- Day 2 check-ins
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active, created_at, updated_at) VALUES
('sample-venue-001', 'customer-007', NOW() - INTERVAL '29 days' + INTERVAL '7 hours 30 minutes', NOW() - INTERVAL '29 days' + INTERVAL '8 hours 15 minutes', false, NOW() - INTERVAL '29 days' + INTERVAL '7 hours 30 minutes', NOW() - INTERVAL '29 days' + INTERVAL '8 hours 15 minutes'),
('sample-venue-001', 'customer-008', NOW() - INTERVAL '29 days' + INTERVAL '11 hours 45 minutes', NOW() - INTERVAL '29 days' + INTERVAL '12 hours 20 minutes', false, NOW() - INTERVAL '29 days' + INTERVAL '11 hours 45 minutes', NOW() - INTERVAL '29 days' + INTERVAL '12 hours 20 minutes'),
('sample-venue-001', 'customer-009', NOW() - INTERVAL '29 days' + INTERVAL '12 hours 30 minutes', NOW() - INTERVAL '29 days' + INTERVAL '13 hours 10 minutes', false, NOW() - INTERVAL '29 days' + INTERVAL '12 hours 30 minutes', NOW() - INTERVAL '29 days' + INTERVAL '13 hours 10 minutes'),
('sample-venue-001', 'customer-010', NOW() - INTERVAL '29 days' + INTERVAL '17 hours 15 minutes', NOW() - INTERVAL '29 days' + INTERVAL '18 hours', false, NOW() - INTERVAL '29 days' + INTERVAL '17 hours 15 minutes', NOW() - INTERVAL '29 days' + INTERVAL '18 hours'),
('sample-venue-001', 'customer-011', NOW() - INTERVAL '29 days' + INTERVAL '19 hours 30 minutes', NOW() - INTERVAL '29 days' + INTERVAL '20 hours 15 minutes', false, NOW() - INTERVAL '29 days' + INTERVAL '19 hours 30 minutes', NOW() - INTERVAL '29 days' + INTERVAL '20 hours 15 minutes');

-- Recent days with more check-ins (last 7 days)
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active, created_at, updated_at) VALUES
-- Yesterday morning rush
('sample-venue-001', 'customer-001', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '1 day' + INTERVAL '8 hours 35 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '1 day' + INTERVAL '8 hours 35 minutes'),
('sample-venue-001', 'customer-003', NOW() - INTERVAL '1 day' + INTERVAL '8 hours 15 minutes', NOW() - INTERVAL '1 day' + INTERVAL '8 hours 50 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '8 hours 15 minutes', NOW() - INTERVAL '1 day' + INTERVAL '8 hours 50 minutes'),
('sample-venue-001', 'customer-005', NOW() - INTERVAL '1 day' + INTERVAL '9 hours', NOW() - INTERVAL '1 day' + INTERVAL '9 hours 25 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '9 hours', NOW() - INTERVAL '1 day' + INTERVAL '9 hours 25 minutes'),
-- Yesterday lunch rush
('sample-venue-001', 'customer-007', NOW() - INTERVAL '1 day' + INTERVAL '12 hours', NOW() - INTERVAL '1 day' + INTERVAL '12 hours 40 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '12 hours', NOW() - INTERVAL '1 day' + INTERVAL '12 hours 40 minutes'),
('sample-venue-001', 'customer-009', NOW() - INTERVAL '1 day' + INTERVAL '12 hours 30 minutes', NOW() - INTERVAL '1 day' + INTERVAL '13 hours 15 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '12 hours 30 minutes', NOW() - INTERVAL '1 day' + INTERVAL '13 hours 15 minutes'),
('sample-venue-001', 'customer-011', NOW() - INTERVAL '1 day' + INTERVAL '13 hours', NOW() - INTERVAL '1 day' + INTERVAL '13 hours 45 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '13 hours', NOW() - INTERVAL '1 day' + INTERVAL '13 hours 45 minutes'),
('sample-venue-001', 'customer-013', NOW() - INTERVAL '1 day' + INTERVAL '13 hours 30 minutes', NOW() - INTERVAL '1 day' + INTERVAL '14 hours 10 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '13 hours 30 minutes', NOW() - INTERVAL '1 day' + INTERVAL '14 hours 10 minutes'),
-- Yesterday evening
('sample-venue-001', 'customer-015', NOW() - INTERVAL '1 day' + INTERVAL '18 hours', NOW() - INTERVAL '1 day' + INTERVAL '18 hours 50 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '18 hours', NOW() - INTERVAL '1 day' + INTERVAL '18 hours 50 minutes'),
('sample-venue-001', 'customer-017', NOW() - INTERVAL '1 day' + INTERVAL '19 hours', NOW() - INTERVAL '1 day' + INTERVAL '19 hours 35 minutes', false, NOW() - INTERVAL '1 day' + INTERVAL '19 hours', NOW() - INTERVAL '1 day' + INTERVAL '19 hours 35 minutes');

-- Today's check-ins (some completed, some active)
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active, created_at, updated_at) VALUES
-- Today morning (completed)
('sample-venue-001', 'customer-002', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 25 minutes', false, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 25 minutes'),
('sample-venue-001', 'customer-004', NOW() - INTERVAL '3 hours 30 minutes', NOW() - INTERVAL '2 hours 50 minutes', false, NOW() - INTERVAL '3 hours 30 minutes', NOW() - INTERVAL '2 hours 50 minutes'),
-- Today lunch (completed)
('sample-venue-001', 'customer-006', NOW() - INTERVAL '2 hours 15 minutes', NOW() - INTERVAL '1 hour 35 minutes', false, NOW() - INTERVAL '2 hours 15 minutes', NOW() - INTERVAL '1 hour 35 minutes'),
('sample-venue-001', 'customer-008', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 20 minutes', false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 20 minutes'),
-- Currently active check-ins
('sample-venue-001', 'customer-010', NOW() - INTERVAL '1 hour 45 minutes', NULL, true, NOW() - INTERVAL '1 hour 45 minutes', NOW() - INTERVAL '1 hour 45 minutes'),
('sample-venue-001', 'customer-012', NOW() - INTERVAL '1 hour 15 minutes', NULL, true, NOW() - INTERVAL '1 hour 15 minutes', NOW() - INTERVAL '1 hour 15 minutes'),
('sample-venue-001', 'customer-014', NOW() - INTERVAL '45 minutes', NULL, true, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),
('sample-venue-001', 'customer-016', NOW() - INTERVAL '30 minutes', NULL, true, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
('sample-venue-001', 'customer-018', NOW() - INTERVAL '15 minutes', NULL, true, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
('sample-venue-001', 'customer-020', NOW() - INTERVAL '5 minutes', NULL, true, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes');

-- Add more historical check-ins for better analytics (past week)
INSERT INTO check_ins (venue_id, user_id, checked_in_at, checked_out_at, is_active, created_at, updated_at) VALUES
-- 2 days ago
('sample-venue-001', 'customer-001', NOW() - INTERVAL '2 days' + INTERVAL '8 hours', NOW() - INTERVAL '2 days' + INTERVAL '8 hours 40 minutes', false, NOW() - INTERVAL '2 days' + INTERVAL '8 hours', NOW() - INTERVAL '2 days' + INTERVAL '8 hours 40 minutes'),
('sample-venue-001', 'customer-003', NOW() - INTERVAL '2 days' + INTERVAL '12 hours', NOW() - INTERVAL '2 days' + INTERVAL '12 hours 30 minutes', false, NOW() - INTERVAL '2 days' + INTERVAL '12 hours', NOW() - INTERVAL '2 days' + INTERVAL '12 hours 30 minutes'),
('sample-venue-001', 'customer-005', NOW() - INTERVAL '2 days' + INTERVAL '18 hours', NOW() - INTERVAL '2 days' + INTERVAL '18 hours 45 minutes', false, NOW() - INTERVAL '2 days' + INTERVAL '18 hours', NOW() - INTERVAL '2 days' + INTERVAL '18 hours 45 minutes'),
-- 3 days ago
('sample-venue-001', 'customer-007', NOW() - INTERVAL '3 days' + INTERVAL '9 hours', NOW() - INTERVAL '3 days' + INTERVAL '9 hours 35 minutes', false, NOW() - INTERVAL '3 days' + INTERVAL '9 hours', NOW() - INTERVAL '3 days' + INTERVAL '9 hours 35 minutes'),
('sample-venue-001', 'customer-009', NOW() - INTERVAL '3 days' + INTERVAL '13 hours', NOW() - INTERVAL '3 days' + INTERVAL '13 hours 50 minutes', false, NOW() - INTERVAL '3 days' + INTERVAL '13 hours', NOW() - INTERVAL '3 days' + INTERVAL '13 hours 50 minutes'),
('sample-venue-001', 'customer-011', NOW() - INTERVAL '3 days' + INTERVAL '19 hours', NOW() - INTERVAL '3 days' + INTERVAL '19 hours 25 minutes', false, NOW() - INTERVAL '3 days' + INTERVAL '19 hours', NOW() - INTERVAL '3 days' + INTERVAL '19 hours 25 minutes'),
-- 4 days ago
('sample-venue-001', 'customer-013', NOW() - INTERVAL '4 days' + INTERVAL '8 hours 30 minutes', NOW() - INTERVAL '4 days' + INTERVAL '9 hours 15 minutes', false, NOW() - INTERVAL '4 days' + INTERVAL '8 hours 30 minutes', NOW() - INTERVAL '4 days' + INTERVAL '9 hours 15 minutes'),
('sample-venue-001', 'customer-015', NOW() - INTERVAL '4 days' + INTERVAL '12 hours 15 minutes', NOW() - INTERVAL '4 days' + INTERVAL '12 hours 55 minutes', false, NOW() - INTERVAL '4 days' + INTERVAL '12 hours 15 minutes', NOW() - INTERVAL '4 days' + INTERVAL '12 hours 55 minutes'),
('sample-venue-001', 'customer-017', NOW() - INTERVAL '4 days' + INTERVAL '17 hours 45 minutes', NOW() - INTERVAL '4 days' + INTERVAL '18 hours 30 minutes', false, NOW() - INTERVAL '4 days' + INTERVAL '17 hours 45 minutes', NOW() - INTERVAL '4 days' + INTERVAL '18 hours 30 minutes'),
-- 5 days ago
('sample-venue-001', 'customer-019', NOW() - INTERVAL '5 days' + INTERVAL '7 hours 45 minutes', NOW() - INTERVAL '5 days' + INTERVAL '8 hours 20 minutes', false, NOW() - INTERVAL '5 days' + INTERVAL '7 hours 45 minutes', NOW() - INTERVAL '5 days' + INTERVAL '8 hours 20 minutes'),
('sample-venue-001', 'customer-001', NOW() - INTERVAL '5 days' + INTERVAL '11 hours 30 minutes', NOW() - INTERVAL '5 days' + INTERVAL '12 hours 10 minutes', false, NOW() - INTERVAL '5 days' + INTERVAL '11 hours 30 minutes', NOW() - INTERVAL '5 days' + INTERVAL '12 hours 10 minutes'),
('sample-venue-001', 'customer-002', NOW() - INTERVAL '5 days' + INTERVAL '18 hours 15 minutes', NOW() - INTERVAL '5 days' + INTERVAL '19 hours', false, NOW() - INTERVAL '5 days' + INTERVAL '18 hours 15 minutes', NOW() - INTERVAL '5 days' + INTERVAL '19 hours'),
-- 6 days ago
('sample-venue-001', 'customer-004', NOW() - INTERVAL '6 days' + INTERVAL '8 hours 15 minutes', NOW() - INTERVAL '6 days' + INTERVAL '8 hours 50 minutes', false, NOW() - INTERVAL '6 days' + INTERVAL '8 hours 15 minutes', NOW() - INTERVAL '6 days' + INTERVAL '8 hours 50 minutes'),
('sample-venue-001', 'customer-006', NOW() - INTERVAL '6 days' + INTERVAL '12 hours 45 minutes', NOW() - INTERVAL '6 days' + INTERVAL '13 hours 25 minutes', false, NOW() - INTERVAL '6 days' + INTERVAL '12 hours 45 minutes', NOW() - INTERVAL '6 days' + INTERVAL '13 hours 25 minutes'),
('sample-venue-001', 'customer-008', NOW() - INTERVAL '6 days' + INTERVAL '19 hours 30 minutes', NOW() - INTERVAL '6 days' + INTERVAL '20 hours 15 minutes', false, NOW() - INTERVAL '6 days' + INTERVAL '19 hours 30 minutes', NOW() - INTERVAL '6 days' + INTERVAL '20 hours 15 minutes'),
-- 7 days ago
('sample-venue-001', 'customer-010', NOW() - INTERVAL '7 days' + INTERVAL '9 hours', NOW() - INTERVAL '7 days' + INTERVAL '9 hours 40 minutes', false, NOW() - INTERVAL '7 days' + INTERVAL '9 hours', NOW() - INTERVAL '7 days' + INTERVAL '9 hours 40 minutes'),
('sample-venue-001', 'customer-012', NOW() - INTERVAL '7 days' + INTERVAL '13 hours 20 minutes', NOW() - INTERVAL '7 days' + INTERVAL '14 hours', false, NOW() - INTERVAL '7 days' + INTERVAL '13 hours 20 minutes', NOW() - INTERVAL '7 days' + INTERVAL '14 hours'),
('sample-venue-001', 'customer-014', NOW() - INTERVAL '7 days' + INTERVAL '18 hours 45 minutes', NOW() - INTERVAL '7 days' + INTERVAL '19 hours 30 minutes', false, NOW() - INTERVAL '7 days' + INTERVAL '18 hours 45 minutes', NOW() - INTERVAL '7 days' + INTERVAL '19 hours 30 minutes');

-- Success message
SELECT '✅ Sample venue analytics data created successfully!' as message,
       'The Analytics Cafe (ID: sample-venue-001)' as venue,
       'owner@analyticsacafe.com / password123' as login_credentials,
       'Check-ins, profiles, and venue data ready for testing!' as status;