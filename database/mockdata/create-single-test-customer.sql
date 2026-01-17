-- Create Single Test Customer for Flash Offer Testing
-- 
-- INSTRUCTIONS:
-- 1. Create auth user in Supabase Dashboard:
--    - Email: customer1@test.com
--    - Password: password123
--    - Auto Confirm User: YES
--    - Copy the UUID
-- 
-- 2. Replace the UUID below with your actual UUID
-- 
-- 3. Run this script in Supabase SQL Editor

DO $$
DECLARE
  -- REPLACE THIS WITH YOUR ACTUAL USER UUID FROM SUPABASE DASHBOARD
  customer_id UUID := 'YOUR-CUSTOMER-UUID-HERE'::uuid;
  
  -- Get the test venue ID
  test_venue_id UUID;
BEGIN
  -- Get the test venue ID
  SELECT id INTO test_venue_id
  FROM venues
  WHERE name = 'Test Flash Offer Cafe'
  LIMIT 1;
  
  IF test_venue_id IS NULL THEN
    RAISE EXCEPTION 'Test venue not found! Run create-test-venue-owner.sql first.';
  END IF;

  -- ============================================
  -- Create Customer Profile
  -- ============================================
  INSERT INTO profiles (id, email, name, created_at, updated_at)
  VALUES (
    customer_id,
    'customer1@test.com',
    'Test Customer 1',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW();
  
  RAISE NOTICE '✅ Customer profile created';

  -- ============================================
  -- Add Device Token for Push Notifications
  -- ============================================
  INSERT INTO device_tokens (user_id, token, platform, is_active, last_used_at)
  VALUES (
    customer_id,
    'test-customer1-token-' || gen_random_uuid()::text,
    'android',
    true,
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '✅ Device token added';

  -- ============================================
  -- Enable Flash Offer Notifications
  -- ============================================
  INSERT INTO notification_preferences (
    user_id,
    friend_requests,
    friend_accepted,
    venue_shares,
    activity_likes,
    activity_comments,
    group_outing_invites,
    group_outing_reminders,
    collection_follows,
    collection_updates,
    friend_checkins_nearby,
    new_followers,
    follow_requests
  )
  VALUES (
    customer_id,
    true, true, true, true, true, true, true, true, true, true, true, true
  )
  ON CONFLICT (user_id) DO UPDATE
  SET friend_requests = true;
  
  RAISE NOTICE '✅ Notifications enabled';

  -- ============================================
  -- Set Customer Location (San Francisco - near venue)
  -- ============================================
  -- Note: In the real app, location is set by the device
  -- This is just for testing proximity-based offers
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TEST CUSTOMER SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE '  Email: customer1@test.com';
  RAISE NOTICE '  Password: password123';
  RAISE NOTICE '';
  RAISE NOTICE 'Customer Details:';
  RAISE NOTICE '  - Will receive ALL flash offers within radius';
  RAISE NOTICE '  - Has NOT favorited the venue';
  RAISE NOTICE '  - Notifications: ENABLED';
  RAISE NOTICE '  - Location: San Francisco, CA (near test venue)';
  RAISE NOTICE '';
  RAISE NOTICE 'Testing:';
  RAISE NOTICE '  1. Log in to the app on a second emulator';
  RAISE NOTICE '  2. Grant notification permissions';
  RAISE NOTICE '  3. Create a flash offer from venue owner account';
  RAISE NOTICE '  4. Customer should receive push notification!';
  RAISE NOTICE '';
  
END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

SELECT 
  p.email,
  p.name,
  CASE 
    WHEN np.friend_requests THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as notifications_status,
  dt.platform as device_platform,
  dt.is_active as token_active
FROM profiles p
LEFT JOIN notification_preferences np ON p.id = np.user_id
LEFT JOIN device_tokens dt ON p.id = dt.user_id AND dt.is_active = true
WHERE p.email = 'customer1@test.com';
