-- Sample Venue Analytics Data Script
-- This script creates a complete sample venue with all necessary data
-- to test the venue analytics dashboard with real database data

-- First, let's create a sample venue
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
  image_url,
  amenities,
  hours,
  price_range,
  latitude,
  longitude,
  wait_times,
  popular_items,
  atmosphere_tags,
  parking_info,
  max_capacity,
  created_at,
  updated_at
) VALUES (
  'sample-venue-001',
  'The Analytics Cafe',
  'A modern coffee shop and eatery perfect for testing our analytics dashboard. Features great coffee, fresh food, and a welcoming atmosphere.',
  'Coffee Shops',
  'Downtown',
  '123 Analytics Street, Tech District, CA 94105',
  '+1 (555) 123-4567',
  'https://analyticsacafe.com',
  4.7,
  156,
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
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
  '$$',
  37.7749,
  -122.4194,
  '{
    "breakfast": "5-10 min",
    "lunch": "15-20 min",
    "dinner": "10-15 min",
    "weekend": "20-25 min"
  }',
  ARRAY['Signature Latte', 'Avocado Toast', 'Breakfast Burrito', 'Artisan Pastries', 'Cold Brew'],
  ARRAY['Cozy', 'Study-Friendly', 'Instagram-worthy', 'Casual', 'Trendy'],
  '{
    "type": "Available",
    "details": "Street parking and nearby garage",
    "cost": "Free for 2 hours"
  }',
  85,
  NOW() - INTERVAL '30 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create a sample user (venue owner)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  'sample-owner-001',
  'owner@analyticsacafe.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW() - INTERVAL '30 days',
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Alex Johnson"}'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Create user profile
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

-- Create venue business account
INSERT INTO venue_business_accounts (
  id,
  venue_id,
  owner_user_id,
  subscription_tier,
  subscription_status,
  subscription_start_date,
  push_credits_remaining,
  push_credits_used,
  account_status,
  verification_status,
  billing_email,
  settings,
  created_at,
  updated_at
) VALUES (
  'sample-business-001',
  'sample-venue-001',
  'sample-owner-001',
  'core',
  'active',
  NOW() - INTERVAL '15 days',
  18,
  2,
  'active',
  'verified',
  'billing@analyticsacafe.com',
  '{
    "notifications_enabled": true,
    "auto_accept_reservations": false,
    "theme": "system"
  }',
  NOW() - INTERVAL '30 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  subscription_tier = EXCLUDED.subscription_tier,
  account_status = EXCLUDED.account_status,
  updated_at = NOW();

-- Create sample customers for realistic data
DO $$
DECLARE
  customer_ids TEXT[] := ARRAY[
    'customer-001', 'customer-002', 'customer-003', 'customer-004', 'customer-005',
    'customer-006', 'customer-007', 'customer-008', 'customer-009', 'customer-010',
    'customer-011', 'customer-012', 'customer-013', 'customer-014', 'customer-015',
    'customer-016', 'customer-017', 'customer-018', 'customer-019', 'customer-020'
  ];
  customer_emails TEXT[] := ARRAY[
    'sarah.m@email.com', 'mike.j@email.com', 'emma.w@email.com', 'david.l@email.com', 'lisa.k@email.com',
    'james.r@email.com', 'anna.s@email.com', 'chris.b@email.com', 'maria.g@email.com', 'tom.h@email.com',
    'jenny.p@email.com', 'alex.c@email.com', 'sam.d@email.com', 'kate.m@email.com', 'ryan.t@email.com',
    'nina.v@email.com', 'paul.f@email.com', 'zoe.l@email.com', 'max.w@email.com', 'ivy.n@email.com'
  ];
  customer_names TEXT[] := ARRAY[
    'Sarah Miller', 'Mike Johnson', 'Emma Wilson', 'David Lee', 'Lisa Kim',
    'James Rodriguez', 'Anna Smith', 'Chris Brown', 'Maria Garcia', 'Tom Harris',
    'Jenny Parker', 'Alex Chen', 'Sam Davis', 'Kate Martinez', 'Ryan Taylor',
    'Nina Volkov', 'Paul Foster', 'Zoe Liu', 'Max Wright', 'Ivy Nelson'
  ];
  i INTEGER;
BEGIN
  -- Insert sample customers
  FOR i IN 1..20 LOOP
    INSERT INTO profiles (
      id,
      email,
      name,
      created_at,
      updated_at
    ) VALUES (
      customer_ids[i],
      customer_emails[i],
      customer_names[i],
      NOW() - INTERVAL '60 days' + (i * INTERVAL '2 days'),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Generate realistic check-ins over the past 30 days
DO $$
DECLARE
  customer_ids TEXT[] := ARRAY[
    'customer-001', 'customer-002', 'customer-003', 'customer-004', 'customer-005',
    'customer-006', 'customer-007', 'customer-008', 'customer-009', 'customer-010',
    'customer-011', 'customer-012', 'customer-013', 'customer-014', 'customer-015',
    'customer-016', 'customer-017', 'customer-018', 'customer-019', 'customer-020'
  ];
  day_offset INTEGER;
  hour_offset INTEGER;
  checkin_count INTEGER;
  customer_id TEXT;
  checkin_time TIMESTAMP;
  checkout_time TIMESTAMP;
  visit_duration INTEGER;
  i INTEGER;
BEGIN
  -- Generate check-ins for the past 30 days
  FOR day_offset IN 0..29 LOOP
    -- Morning rush (7-10 AM): 3-8 check-ins
    checkin_count := 3 + floor(random() * 6)::INTEGER;
    FOR i IN 1..checkin_count LOOP
      customer_id := customer_ids[1 + floor(random() * 20)::INTEGER];
      hour_offset := 7 + floor(random() * 3)::INTEGER; -- 7-9 AM
      checkin_time := (NOW() - INTERVAL '30 days' + (day_offset * INTERVAL '1 day') + (hour_offset * INTERVAL '1 hour') + (random() * INTERVAL '1 hour'));
      visit_duration := 20 + floor(random() * 40)::INTEGER; -- 20-60 minutes
      checkout_time := checkin_time + (visit_duration * INTERVAL '1 minute');
      
      INSERT INTO check_ins (
        venue_id,
        user_id,
        checked_in_at,
        checked_out_at,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'sample-venue-001',
        customer_id,
        checkin_time,
        checkout_time,
        false,
        checkin_time,
        checkout_time
      ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Lunch rush (11 AM - 2 PM): 8-15 check-ins
    checkin_count := 8 + floor(random() * 8)::INTEGER;
    FOR i IN 1..checkin_count LOOP
      customer_id := customer_ids[1 + floor(random() * 20)::INTEGER];
      hour_offset := 11 + floor(random() * 4)::INTEGER; -- 11 AM - 2 PM
      checkin_time := (NOW() - INTERVAL '30 days' + (day_offset * INTERVAL '1 day') + (hour_offset * INTERVAL '1 hour') + (random() * INTERVAL '1 hour'));
      visit_duration := 25 + floor(random() * 35)::INTEGER; -- 25-60 minutes
      checkout_time := checkin_time + (visit_duration * INTERVAL '1 minute');
      
      INSERT INTO check_ins (
        venue_id,
        user_id,
        checked_in_at,
        checked_out_at,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'sample-venue-001',
        customer_id,
        checkin_time,
        checkout_time,
        false,
        checkin_time,
        checkout_time
      ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Afternoon (3-5 PM): 2-6 check-ins
    checkin_count := 2 + floor(random() * 5)::INTEGER;
    FOR i IN 1..checkin_count LOOP
      customer_id := customer_ids[1 + floor(random() * 20)::INTEGER];
      hour_offset := 15 + floor(random() * 3)::INTEGER; -- 3-5 PM
      checkin_time := (NOW() - INTERVAL '30 days' + (day_offset * INTERVAL '1 day') + (hour_offset * INTERVAL '1 hour') + (random() * INTERVAL '1 hour'));
      visit_duration := 30 + floor(random() * 60)::INTEGER; -- 30-90 minutes
      checkout_time := checkin_time + (visit_duration * INTERVAL '1 minute');
      
      INSERT INTO check_ins (
        venue_id,
        user_id,
        checked_in_at,
        checked_out_at,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'sample-venue-001',
        customer_id,
        checkin_time,
        checkout_time,
        false,
        checkin_time,
        checkout_time
      ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Evening (6-8 PM): 4-10 check-ins
    checkin_count := 4 + floor(random() * 7)::INTEGER;
    FOR i IN 1..checkin_count LOOP
      customer_id := customer_ids[1 + floor(random() * 20)::INTEGER];
      hour_offset := 18 + floor(random() * 3)::INTEGER; -- 6-8 PM
      checkin_time := (NOW() - INTERVAL '30 days' + (day_offset * INTERVAL '1 day') + (hour_offset * INTERVAL '1 hour') + (random() * INTERVAL '1 hour'));
      visit_duration := 35 + floor(random() * 45)::INTEGER; -- 35-80 minutes
      checkout_time := checkin_time + (visit_duration * INTERVAL '1 minute');
      
      INSERT INTO check_ins (
        venue_id,
        user_id,
        checked_in_at,
        checked_out_at,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'sample-venue-001',
        customer_id,
        checkin_time,
        checkout_time,
        false,
        checkin_time,
        checkout_time
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Create some active check-ins for current activity level
DO $$
DECLARE
  customer_ids TEXT[] := ARRAY['customer-001', 'customer-005', 'customer-008', 'customer-012', 'customer-015', 'customer-018'];
  customer_id TEXT;
  checkin_time TIMESTAMP;
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    customer_id := customer_ids[i];
    checkin_time := NOW() - (random() * INTERVAL '2 hours'); -- Checked in within last 2 hours
    
    INSERT INTO check_ins (
      venue_id,
      user_id,
      checked_in_at,
      checked_out_at,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      'sample-venue-001',
      customer_id,
      checkin_time,
      NULL,
      true,
      checkin_time,
      checkin_time
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Generate realistic reviews
DO $$
DECLARE
  customer_ids TEXT[] := ARRAY[
    'customer-001', 'customer-002', 'customer-003', 'customer-004', 'customer-005',
    'customer-006', 'customer-007', 'customer-008', 'customer-009', 'customer-010',
    'customer-011', 'customer-012', 'customer-013', 'customer-014', 'customer-015'
  ];
  review_comments TEXT[] := ARRAY[
    'Amazing coffee and great atmosphere! Perfect for working.',
    'Love the avocado toast here. Staff is super friendly.',
    'Best latte in the neighborhood. Will definitely come back!',
    'Cozy spot with excellent WiFi. Great for studying.',
    'The breakfast burrito is incredible. Highly recommend!',
    'Beautiful interior design and delicious pastries.',
    'Quick service and quality food. Perfect lunch spot.',
    'Great place to meet friends. Love the outdoor seating.',
    'Consistently good coffee and friendly service.',
    'The cold brew is amazing! Perfect afternoon pick-me-up.',
    'Wonderful local cafe with a great community feel.',
    'Excellent food quality and reasonable prices.',
    'Perfect spot for a casual date or business meeting.',
    'Love supporting this local business. Always great!',
    'The signature latte is worth the visit alone.'
  ];
  customer_id TEXT;
  rating INTEGER;
  comment TEXT;
  review_date TIMESTAMP;
  i INTEGER;
BEGIN
  FOR i IN 1..15 LOOP
    customer_id := customer_ids[i];
    rating := 3 + floor(random() * 3)::INTEGER; -- Ratings between 3-5 (mostly positive)
    IF random() > 0.8 THEN rating := 5; END IF; -- 20% chance of 5 stars
    comment := review_comments[i];
    review_date := NOW() - (random() * INTERVAL '25 days');
    
    INSERT INTO reviews (
      user_id,
      venue_id,
      rating,
      comment,
      created_at,
      updated_at
    ) VALUES (
      customer_id,
      'sample-venue-001',
      rating,
      comment,
      review_date,
      review_date
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Generate favorites
DO $$
DECLARE
  customer_ids TEXT[] := ARRAY[
    'customer-001', 'customer-003', 'customer-005', 'customer-007', 'customer-009',
    'customer-011', 'customer-013', 'customer-015', 'customer-017', 'customer-019',
    'customer-002', 'customer-004', 'customer-006', 'customer-008', 'customer-010',
    'customer-012', 'customer-014', 'customer-016', 'customer-018', 'customer-020'
  ];
  customer_id TEXT;
  favorite_date TIMESTAMP;
  i INTEGER;
BEGIN
  FOR i IN 1..20 LOOP
    customer_id := customer_ids[i];
    favorite_date := NOW() - (random() * INTERVAL '20 days');
    
    INSERT INTO favorites (
      user_id,
      venue_id,
      created_at
    ) VALUES (
      customer_id,
      'sample-venue-001',
      favorite_date
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Generate venue contributions (user feedback)
DO $$
DECLARE
  customer_ids TEXT[] := ARRAY[
    'customer-001', 'customer-002', 'customer-003', 'customer-004', 'customer-005',
    'customer-006', 'customer-007', 'customer-008', 'customer-009', 'customer-010'
  ];
  wait_time_options TEXT[] := ARRAY['Quick Service', 'Short Wait', 'Moderate Wait', 'Worth the Wait'];
  mood_options TEXT[] := ARRAY['Energetic', 'Relaxed', 'Focused', 'Social', 'Cozy', 'Productive'];
  popular_options TEXT[] := ARRAY['Signature Latte', 'Avocado Toast', 'Cold Brew', 'Breakfast Burrito', 'Pastries'];
  amenity_options TEXT[] := ARRAY['Great WiFi', 'Comfortable Seating', 'Good Music', 'Clean Restrooms', 'Friendly Staff'];
  customer_id TEXT;
  contribution_date TIMESTAMP;
  i INTEGER;
BEGIN
  -- Wait times contributions
  FOR i IN 1..8 LOOP
    customer_id := customer_ids[1 + floor(random() * 10)::INTEGER];
    contribution_date := NOW() - (random() * INTERVAL '15 days');
    
    INSERT INTO venue_contributions (
      venue_id,
      user_id,
      contribution_type,
      option_text,
      created_at,
      updated_at
    ) VALUES (
      'sample-venue-001',
      customer_id,
      'wait_times',
      wait_time_options[1 + floor(random() * 4)::INTEGER],
      contribution_date,
      contribution_date
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Mood contributions
  FOR i IN 1..12 LOOP
    customer_id := customer_ids[1 + floor(random() * 10)::INTEGER];
    contribution_date := NOW() - (random() * INTERVAL '15 days');
    
    INSERT INTO venue_contributions (
      venue_id,
      user_id,
      contribution_type,
      option_text,
      created_at,
      updated_at
    ) VALUES (
      'sample-venue-001',
      customer_id,
      'mood',
      mood_options[1 + floor(random() * 6)::INTEGER],
      contribution_date,
      contribution_date
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Popular items contributions
  FOR i IN 1..15 LOOP
    customer_id := customer_ids[1 + floor(random() * 10)::INTEGER];
    contribution_date := NOW() - (random() * INTERVAL '15 days');
    
    INSERT INTO venue_contributions (
      venue_id,
      user_id,
      contribution_type,
      option_text,
      created_at,
      updated_at
    ) VALUES (
      'sample-venue-001',
      customer_id,
      'popular',
      popular_options[1 + floor(random() * 5)::INTEGER],
      contribution_date,
      contribution_date
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Amenities contributions
  FOR i IN 1..10 LOOP
    customer_id := customer_ids[1 + floor(random() * 10)::INTEGER];
    contribution_date := NOW() - (random() * INTERVAL '15 days');
    
    INSERT INTO venue_contributions (
      venue_id,
      user_id,
      contribution_type,
      option_text,
      created_at,
      updated_at
    ) VALUES (
      'sample-venue-001',
      customer_id,
      'amenities',
      amenity_options[1 + floor(random() * 5)::INTEGER],
      contribution_date,
      contribution_date
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Update venue rating based on reviews
UPDATE venues 
SET 
  rating = (
    SELECT ROUND(AVG(rating)::numeric, 1) 
    FROM reviews 
    WHERE venue_id = 'sample-venue-001'
  ),
  review_count = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE venue_id = 'sample-venue-001'
  ),
  updated_at = NOW()
WHERE id = 'sample-venue-001';

-- Create some recent push notifications for activity feed
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
  'sample-business-001',
  'sample-venue-001',
  'Happy Hour Special!',
  'Join us for 20% off all drinks from 3-5 PM today!',
  'flash_offer',
  2.0,
  150,
  142,
  NOW() - INTERVAL '2 hours',
  'sent',
  1,
  '{"delivered": 142, "opened": 67, "clicked": 23}',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
(
  'sample-business-001',
  'sample-venue-001',
  'New Menu Items!',
  'Try our new seasonal pastries and specialty drinks!',
  'general',
  1.5,
  200,
  187,
  NOW() - INTERVAL '3 days',
  'sent',
  1,
  '{"delivered": 187, "opened": 89, "clicked": 34}',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
) ON CONFLICT DO NOTHING;

-- Summary of created data
DO $$
BEGIN
  RAISE NOTICE '✅ Sample venue analytics data created successfully!';
  RAISE NOTICE '📊 Venue: The Analytics Cafe (ID: sample-venue-001)';
  RAISE NOTICE '👤 Owner: Alex Johnson (owner@analyticsacafe.com)';
  RAISE NOTICE '📈 Data includes:';
  RAISE NOTICE '   - 30 days of check-in history with realistic patterns';
  RAISE NOTICE '   - 6 active check-ins (current activity level)';
  RAISE NOTICE '   - 15 customer reviews (avg 4.7 stars)';
  RAISE NOTICE '   - 20 customer favorites';
  RAISE NOTICE '   - User contributions for all venue card types';
  RAISE NOTICE '   - 2 push notification campaigns';
  RAISE NOTICE '   - 20 sample customers with realistic names';
  RAISE NOTICE '🎯 Perfect for testing all analytics dashboard features!';
END $$;