-- Create Test Venue Owner Account for Flash Offer Testing
-- This script creates a venue owner account that you can use to test flash offers
-- 
-- INSTRUCTIONS:
-- 1. First, create an auth user in Supabase Dashboard:
--    - Go to Authentication > Users > Add User
--    - Email: aaculptestvenue@icloud.comloud.com
--    - Password: password123
--    - Auto Confirm User: YES
--    - Copy the UUID that gets generated
-- 
-- 2. Replace 'b0c15295-db9a-41f9-9ba4-15337dc0a8cb' below with the copied UUID
-- 
-- 3. Run this script in Supabase SQL Editor
-- 
-- 4. Log in to the app with:
--    - Email: aaculptestvenue@icloud.com
--    - Password: password123

DO $$
DECLARE
  -- REPLACE THIS WITH YOUR ACTUAL USER UUID FROM SUPABASE DASHBOARD
  venue_owner_user_id UUID := 'b0c15295-db9a-41f9-9ba4-15337dc0a8cb'::uuid;
  
  -- Variables for created records
  new_venue_id UUID;
  new_business_account_id UUID;
BEGIN
  -- ============================================
  -- STEP 1: Create Profile for Venue Owner
  -- ============================================
  INSERT INTO profiles (id, email, name, created_at, updated_at)
  VALUES (
    venue_owner_user_id,
    'aaculptestvenue@icloud.com',
    'Test Venue Owner',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Profile created for venue owner';

  -- ============================================
  -- STEP 2: Create Test Venue
  -- ============================================
  -- First, delete existing test venue if it exists
  DELETE FROM venue_business_accounts
  WHERE venue_id IN (
    SELECT id FROM venues WHERE name = 'Test Flash Offer Cafe'
  );
  
  DELETE FROM venues WHERE name = 'Test Flash Offer Cafe';
  
  -- Create the venue
  INSERT INTO venues (
    name,
    category,
    description,
    location,
    address,
    latitude,
    longitude,
    rating,
    price_range,
    image_url,
    amenities,
    hours,
    review_count,
    phone,
    website,
    max_capacity
  )
  VALUES (
    'Test Flash Offer Cafe',
    'Coffee Shops',
    'A cozy cafe perfect for testing flash offers! Great coffee and pastries.',
    'San Francisco, CA',
    '123 Test Street, San Francisco, CA 94102',
    37.7749,  -- San Francisco coordinates
    -122.4194,
    4.5,
    '$',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    ARRAY['WiFi', 'Outdoor Seating', 'Takeout']::text[],
    jsonb_build_object(
      'Monday', '7:00 AM - 8:00 PM',
      'Tuesday', '7:00 AM - 8:00 PM',
      'Wednesday', '7:00 AM - 8:00 PM',
      'Thursday', '7:00 AM - 8:00 PM',
      'Friday', '7:00 AM - 9:00 PM',
      'Saturday', '8:00 AM - 9:00 PM',
      'Sunday', '8:00 AM - 7:00 PM'
    ),
    42,
    '+1 (555) 123-4567',
    'https://testcafe.example.com',
    50  -- Max capacity for activity level calculations
  )
  RETURNING id INTO new_venue_id;
  
  RAISE NOTICE '✅ Venue created with ID: %', new_venue_id;

  -- ============================================
  -- STEP 3: Create Business Account
  -- ============================================
  INSERT INTO venue_business_accounts (
    venue_id,
    owner_user_id,
    account_status,
    verification_status,
    subscription_tier,
    billing_email,
    created_at,
    updated_at
  )
  VALUES (
    new_venue_id,
    venue_owner_user_id,
    'active',
    'verified',
    'pro',  -- Pro tier for full flash offer features
    'aaculptestvenue@icloud.com',
    NOW(),
    NOW()
  )
  RETURNING id INTO new_business_account_id;
  
  RAISE NOTICE '✅ Business account created with ID: %', new_business_account_id;

  -- ============================================
  -- STEP 4: Add Device Token (for testing)
  -- ============================================
  INSERT INTO device_tokens (
    user_id,
    token,
    platform,
    is_active,
    last_used_at
  )
  VALUES (
    venue_owner_user_id,
    'test-venue-owner-token-' || gen_random_uuid()::text,
    'ios',
    true,
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '✅ Device token added for venue owner';

  -- ============================================
  -- STEP 5: Display Summary
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TEST VENUE OWNER SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE '  Email: aaculptestvenue@icloud.com';
  RAISE NOTICE '  Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE 'Venue Details:';
  RAISE NOTICE '  Name: Test Flash Offer Cafe';
  RAISE NOTICE '  ID: %', new_venue_id;
  RAISE NOTICE '  Location: San Francisco, CA';
  RAISE NOTICE '  Coordinates: 37.7749, -122.4194';
  RAISE NOTICE '';
  RAISE NOTICE 'Business Account:';
  RAISE NOTICE '  ID: %', new_business_account_id;
  RAISE NOTICE '  Status: active';
  RAISE NOTICE '  Tier: pro';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Log in to the app with the credentials above';
  RAISE NOTICE '  2. Navigate to the venue owner dashboard';
  RAISE NOTICE '  3. Create a flash offer';
  RAISE NOTICE '  4. Test push notifications!';
  RAISE NOTICE '';
  RAISE NOTICE 'Flash Offer Targeting Options:';
  RAISE NOTICE '  - target_favorites_only = false: Sends to ALL users within radius';
  RAISE NOTICE '  - target_favorites_only = true: Sends ONLY to users who favorited this venue';
  RAISE NOTICE '';
  
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if venue was created
SELECT 
  v.id,
  v.name,
  v.category,
  v.location,
  v.latitude,
  v.longitude,
  vba.account_status,
  vba.verification_status,
  vba.subscription_tier
FROM venues v
INNER JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE v.name = 'Test Flash Offer Cafe';

-- Check if profile was created
SELECT 
  id,
  email,
  name,
  created_at
FROM profiles
WHERE email = 'aaculptestvenue@icloud.com';
