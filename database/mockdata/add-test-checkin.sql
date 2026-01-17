-- Add a test check-in for the customer at the venue
-- This allows the customer to be targeted by flash offers

-- Get the user ID for aaculp@icloud.com
DO $$
DECLARE
  v_user_id UUID;
  v_venue_id UUID := '6de07e50-8a09-43bd-9d5b-061f221f4f0d'; -- Test Flash Offer Cafe
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'aaculp@icloud.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User aaculp@icloud.com not found';
  END IF;

  -- Check if check-in already exists
  IF EXISTS (
    SELECT 1 FROM check_ins 
    WHERE user_id = v_user_id 
    AND venue_id = v_venue_id 
    AND created_at > NOW() - INTERVAL '1 day'
  ) THEN
    RAISE NOTICE 'Check-in already exists for today';
  ELSE
    -- Insert check-in
    INSERT INTO check_ins (
      user_id,
      venue_id,
      checked_in_at,
      checked_out_at,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_venue_id,
      NOW() - INTERVAL '30 minutes', -- Checked in 30 minutes ago
      NULL, -- Still checked in
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Check-in created for user % at venue %', v_user_id, v_venue_id;
  END IF;
END $$;
