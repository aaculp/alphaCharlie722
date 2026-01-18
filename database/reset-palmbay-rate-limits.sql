-- Reset Rate Limits for Palm Bay Test Account
-- User: palmbaytest@icloud.com
-- User ID: 441b155d-0f20-4a88-b1cb-ff4d33ec5e56
-- Venue ID: 036324ad-d9c6-484b-9f9f-0356346e681f

-- Clear venue rate limits (venue_send type)
DELETE FROM flash_offer_rate_limits 
WHERE venue_id = '036324ad-d9c6-484b-9f9f-0356346e681f' 
  AND limit_type = 'venue_send';

-- Clear user rate limits (user_receive type)
DELETE FROM flash_offer_rate_limits 
WHERE user_id = '441b155d-0f20-4a88-b1cb-ff4d33ec5e56' 
  AND limit_type = 'user_receive';

-- Verify cleared
SELECT 
  'Venue rate limits' as type,
  COUNT(*) as remaining_records 
FROM flash_offer_rate_limits 
WHERE venue_id = '036324ad-d9c6-484b-9f9f-0356346e681f'
UNION ALL
SELECT 
  'User rate limits' as type,
  COUNT(*) as remaining_records 
FROM flash_offer_rate_limits 
WHERE user_id = '441b155d-0f20-4a88-b1cb-ff4d33ec5e56';
