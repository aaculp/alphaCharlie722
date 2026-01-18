-- Check Device Tokens for Push Notification Testing
-- This helps diagnose why FCM sends are failing

-- Check all active device tokens
SELECT 
  dt.user_id,
  dt.token,
  dt.platform,
  dt.is_active,
  dt.created_at,
  dt.last_used_at,
  u.email
FROM device_tokens dt
LEFT JOIN auth.users u ON u.id = dt.user_id
WHERE dt.is_active = true
ORDER BY dt.created_at DESC;

-- Check if tokens look like test/emulator tokens
SELECT 
  dt.user_id,
  dt.platform,
  CASE 
    WHEN dt.token LIKE 'test_%' THEN 'Test Token'
    WHEN dt.token LIKE 'emulator_%' THEN 'Emulator Token'
    WHEN LENGTH(dt.token) < 100 THEN 'Possibly Invalid (too short)'
    WHEN LENGTH(dt.token) > 200 THEN 'Possibly Invalid (too long)'
    ELSE 'Looks Valid'
  END as token_status,
  LENGTH(dt.token) as token_length,
  dt.is_active,
  u.email
FROM device_tokens dt
LEFT JOIN auth.users u ON u.id = dt.user_id
WHERE dt.is_active = true
ORDER BY dt.created_at DESC;

-- Count tokens by platform
SELECT 
  platform,
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN is_active THEN 1 END) as active_tokens
FROM device_tokens
GROUP BY platform;
