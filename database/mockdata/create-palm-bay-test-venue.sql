-- Create Test Venue in Palm Bay, Florida for Push Notification Testing
-- Location: 443 Gallagher St SW, Palm Bay, FL 32908
-- 
-- Login Credentials:
--    Email: palmbaytest@icloud.com
--    Password: test123

DO $body$
DECLARE
  venue_owner_user_id UUID := '441b155d-0f20-4a88-b1cb-ff4d33ec5e56'::uuid;
  new_venue_id UUID;
  new_business_account_id UUID;
BEGIN
  -- Create Profile
  INSERT INTO profiles (id, email, name, created_at, updated_at)
  VALUES (
    venue_owner_user_id,
    'palmbaytest@icloud.com',
    'Palm Bay Test Venue',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW();
  
  RAISE NOTICE 'Profile created';

  -- Delete existing test venue if exists
  DELETE FROM venue_business_accounts
  WHERE venue_id IN (SELECT id FROM venues WHERE name = 'Palm Bay Test Spot');
  DELETE FROM venues WHERE name = 'Palm Bay Test Spot';
  
  -- Create venue
  INSERT INTO venues (
    name, category, description, location, address,
    latitude, longitude, rating, price_range, image_url,
    amenities, hours, review_count, phone, website, max_capacity
  )
  VALUES (
    'Palm Bay Test Spot',
    'Bar',
    'Local test venue for push notification testing',
    'Palm Bay, FL',
    '443 Gallagher St SW, Palm Bay, FL 32908',
    28.0344,
    -80.6887,
    4.7,
    '$$',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
    ARRAY['WiFi', 'Outdoor Seating']::text[],
    '{"Monday": "11:00 AM - 11:00 PM", "Tuesday": "11:00 AM - 11:00 PM", "Wednesday": "11:00 AM - 11:00 PM", "Thursday": "11:00 AM - 12:00 AM", "Friday": "11:00 AM - 2:00 AM", "Saturday": "11:00 AM - 2:00 AM", "Sunday": "12:00 PM - 10:00 PM"}'::jsonb,
    156,
    '+1 (321) 555-0199',
    'https://palmbaytest.example.com',
    75
  )
  RETURNING id INTO new_venue_id;
  
  RAISE NOTICE 'Venue created: %', new_venue_id;

  -- Create business account
  INSERT INTO venue_business_accounts (
    venue_id, owner_user_id, account_status, verification_status,
    subscription_tier, subscription_status, subscription_start_date,
    push_credits_remaining, billing_email, created_at, updated_at
  )
  VALUES (
    new_venue_id,
    venue_owner_user_id,
    'active',
    'verified',
    'pro',
    'active',
    NOW(),
    999999,
    'palmbaytest@icloud.com',
    NOW(),
    NOW()
  )
  RETURNING id INTO new_business_account_id;
  
  RAISE NOTICE 'Business account created: %', new_business_account_id;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE 'Email: palmbaytest@icloud.com';
  RAISE NOTICE 'Password: test123';
  RAISE NOTICE 'Venue: Palm Bay Test Spot';
  RAISE NOTICE 'Address: 443 Gallagher St SW, Palm Bay, FL 32908';
  RAISE NOTICE '========================================';
  
END $body$;

-- Verify
SELECT v.id, v.name, v.address, vba.subscription_tier, vba.push_credits_remaining
FROM venues v
INNER JOIN venue_business_accounts vba ON v.id = vba.venue_id
WHERE v.name = 'Palm Bay Test Spot';
