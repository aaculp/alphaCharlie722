-- E2E Test Verification Queries
-- Use these queries to verify the system state during end-to-end testing

-- ============================================================================
-- SECTION 1: Pre-Test Verification
-- ============================================================================

-- 1.1 Check notification_preferences table exists and has data
SELECT 
    COUNT(*) as total_users_with_preferences,
    COUNT(CASE WHEN flash_offers_enabled = true THEN 1 END) as enabled_count,
    COUNT(CASE WHEN flash_offers_enabled = false THEN 1 END) as disabled_count,
    COUNT(CASE WHEN quiet_hours_start IS NOT NULL THEN 1 END) as quiet_hours_count,
    COUNT(CASE WHEN max_distance_miles IS NOT NULL THEN 1 END) as distance_limit_count
FROM notification_preferences;

-- 1.2 Check flash_offer_rate_limits table exists
SELECT 
    COUNT(*) as total_rate_limits,
    COUNT(CASE WHEN limit_type = 'venue_send' THEN 1 END) as venue_limits,
    COUNT(CASE WHEN limit_type = 'user_receive' THEN 1 END) as user_limits,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_limits
FROM flash_offer_rate_limits;

-- 1.3 Check device_tokens RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'device_tokens'
ORDER BY policyname;

-- 1.4 Check active device tokens
SELECT 
    COUNT(*) as total_tokens,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_tokens,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_tokens,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN platform = 'android' THEN 1 END) as android_tokens,
    COUNT(CASE WHEN platform = 'ios' THEN 1 END) as ios_tokens
FROM device_tokens;

-- ============================================================================
-- SECTION 2: Test Account Verification
-- ============================================================================

-- 2.1 List test accounts (replace with actual test user IDs)
-- Example: SELECT * FROM auth.users WHERE email LIKE '%test%';

-- 2.2 Check specific user's notification preferences
-- Replace <user_id> with actual test user ID
/*
SELECT 
    user_id,
    flash_offers_enabled,
    quiet_hours_start,
    quiet_hours_end,
    timezone,
    max_distance_miles,
    created_at,
    updated_at
FROM notification_preferences 
WHERE user_id = '<user_id>';
*/

-- 2.3 Check user's device tokens
-- Replace <user_id> with actual test user ID
/*
SELECT 
    id,
    user_id,
    token,
    platform,
    is_active,
    created_at,
    updated_at
FROM device_tokens 
WHERE user_id = '<user_id>';
*/

-- ============================================================================
-- SECTION 3: During Test - Offer Verification
-- ============================================================================

-- 3.1 Check recently created offers
SELECT 
    id,
    venue_id,
    title,
    description,
    discount_percentage,
    quantity_available,
    quantity_claimed,
    expires_at,
    push_sent,
    created_at
FROM flash_offers 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 3.2 Check specific offer details
-- Replace <offer_id> with actual offer ID
/*
SELECT 
    fo.id,
    fo.title,
    fo.push_sent,
    fo.created_at,
    v.name as venue_name,
    v.latitude,
    v.longitude
FROM flash_offers fo
JOIN venues v ON fo.venue_id = v.id
WHERE fo.id = '<offer_id>';
*/

-- 3.3 Check if offer was marked as push_sent
-- Replace <offer_id> with actual offer ID
/*
SELECT 
    id,
    title,
    push_sent,
    created_at,
    updated_at
FROM flash_offers 
WHERE id = '<offer_id>';
*/

-- ============================================================================
-- SECTION 4: Analytics Verification
-- ============================================================================

-- 4.1 Check analytics for specific offer
-- Replace <offer_id> with actual offer ID
/*
SELECT 
    offer_id,
    event_type,
    recipient_count,
    success_count,
    failure_count,
    metadata,
    created_at
FROM flash_offer_analytics 
WHERE offer_id = '<offer_id>'
ORDER BY created_at DESC;
*/

-- 4.2 Check recent push_sent analytics
SELECT 
    foa.offer_id,
    fo.title,
    foa.recipient_count,
    foa.success_count,
    foa.failure_count,
    foa.created_at
FROM flash_offer_analytics foa
JOIN flash_offers fo ON foa.offer_id = fo.id
WHERE foa.event_type = 'push_sent'
AND foa.created_at > NOW() - INTERVAL '1 hour'
ORDER BY foa.created_at DESC;

-- 4.3 Calculate delivery rate for recent offers
SELECT 
    fo.id,
    fo.title,
    foa.recipient_count,
    foa.success_count,
    foa.failure_count,
    CASE 
        WHEN foa.recipient_count > 0 
        THEN ROUND((foa.success_count::numeric / foa.recipient_count::numeric) * 100, 2)
        ELSE 0 
    END as delivery_rate_percent
FROM flash_offers fo
LEFT JOIN flash_offer_analytics foa ON fo.id = foa.offer_id AND foa.event_type = 'push_sent'
WHERE fo.created_at > NOW() - INTERVAL '1 hour'
ORDER BY fo.created_at DESC;

-- ============================================================================
-- SECTION 5: Rate Limit Verification
-- ============================================================================

-- 5.1 Check venue rate limits
-- Replace <venue_id> with actual venue ID
/*
SELECT 
    venue_id,
    limit_type,
    count,
    window_start,
    expires_at,
    created_at,
    CASE 
        WHEN expires_at > NOW() THEN 'Active'
        ELSE 'Expired'
    END as status
FROM flash_offer_rate_limits 
WHERE venue_id = '<venue_id>'
AND limit_type = 'venue_send'
ORDER BY created_at DESC;
*/

-- 5.2 Count offers sent by venue in last 24 hours
-- Replace <venue_id> with actual venue ID
/*
SELECT 
    venue_id,
    COUNT(*) as offers_sent_24h
FROM flash_offers 
WHERE venue_id = '<venue_id>'
AND created_at > NOW() - INTERVAL '24 hours'
AND push_sent = true
GROUP BY venue_id;
*/

-- 5.3 Check user rate limits
-- Replace <user_id> with actual user ID
/*
SELECT 
    user_id,
    limit_type,
    count,
    window_start,
    expires_at,
    created_at,
    CASE 
        WHEN expires_at > NOW() THEN 'Active'
        ELSE 'Expired'
    END as status
FROM flash_offer_rate_limits 
WHERE user_id = '<user_id>'
AND limit_type = 'user_receive'
ORDER BY created_at DESC;
*/

-- 5.4 Check all active rate limits
SELECT 
    COALESCE(venue_id::text, user_id::text) as entity_id,
    limit_type,
    count,
    window_start,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 as hours_until_expiry
FROM flash_offer_rate_limits 
WHERE expires_at > NOW()
ORDER BY expires_at ASC;

-- ============================================================================
-- SECTION 6: Preference Filtering Verification
-- ============================================================================

-- 6.1 Users with notifications disabled
SELECT 
    np.user_id,
    u.email,
    np.flash_offers_enabled,
    np.updated_at
FROM notification_preferences np
JOIN auth.users u ON np.user_id = u.id
WHERE np.flash_offers_enabled = false;

-- 6.2 Users currently in quiet hours
-- This query checks if current time is within quiet hours
SELECT 
    np.user_id,
    u.email,
    np.quiet_hours_start,
    np.quiet_hours_end,
    np.timezone,
    (NOW() AT TIME ZONE np.timezone)::time as current_time_in_user_tz,
    CASE 
        WHEN np.quiet_hours_start IS NULL THEN false
        WHEN np.quiet_hours_start < np.quiet_hours_end THEN
            (NOW() AT TIME ZONE np.timezone)::time BETWEEN np.quiet_hours_start AND np.quiet_hours_end
        ELSE
            (NOW() AT TIME ZONE np.timezone)::time >= np.quiet_hours_start 
            OR (NOW() AT TIME ZONE np.timezone)::time <= np.quiet_hours_end
    END as currently_in_quiet_hours
FROM notification_preferences np
JOIN auth.users u ON np.user_id = u.id
WHERE np.quiet_hours_start IS NOT NULL;

-- 6.3 Users with distance limits
SELECT 
    np.user_id,
    u.email,
    np.max_distance_miles,
    np.updated_at
FROM notification_preferences np
JOIN auth.users u ON np.user_id = u.id
WHERE np.max_distance_miles IS NOT NULL
ORDER BY np.max_distance_miles ASC;

-- ============================================================================
-- SECTION 7: Token Health Check
-- ============================================================================

-- 7.1 Recently deactivated tokens
SELECT 
    id,
    user_id,
    token,
    platform,
    is_active,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutes_since_deactivation
FROM device_tokens 
WHERE is_active = false
AND updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- 7.2 Token activity summary
SELECT 
    platform,
    is_active,
    COUNT(*) as token_count,
    COUNT(DISTINCT user_id) as unique_users
FROM device_tokens
GROUP BY platform, is_active
ORDER BY platform, is_active DESC;

-- ============================================================================
-- SECTION 8: Error Investigation
-- ============================================================================

-- 8.1 Offers with push_sent = false (potential failures)
SELECT 
    fo.id,
    fo.title,
    fo.push_sent,
    fo.created_at,
    v.name as venue_name,
    EXTRACT(EPOCH FROM (NOW() - fo.created_at)) / 60 as minutes_since_creation
FROM flash_offers fo
JOIN venues v ON fo.venue_id = v.id
WHERE fo.push_sent = false
AND fo.created_at > NOW() - INTERVAL '1 hour'
ORDER BY fo.created_at DESC;

-- 8.2 Analytics events with failures
SELECT 
    foa.offer_id,
    fo.title,
    foa.recipient_count,
    foa.success_count,
    foa.failure_count,
    ROUND((foa.failure_count::numeric / NULLIF(foa.recipient_count, 0)::numeric) * 100, 2) as failure_rate_percent,
    foa.metadata,
    foa.created_at
FROM flash_offer_analytics foa
JOIN flash_offers fo ON foa.offer_id = fo.id
WHERE foa.failure_count > 0
AND foa.created_at > NOW() - INTERVAL '1 hour'
ORDER BY foa.failure_count DESC;

-- ============================================================================
-- SECTION 9: Cleanup (Use After Testing)
-- ============================================================================

-- 9.1 Delete test offers (CAUTION: Verify IDs before running)
-- Replace 'E2E Test%' with your test offer naming pattern
/*
DELETE FROM flash_offers 
WHERE title LIKE 'E2E Test%'
AND created_at > NOW() - INTERVAL '2 hours';
*/

-- 9.2 Delete test rate limits
/*
DELETE FROM flash_offer_rate_limits 
WHERE created_at > NOW() - INTERVAL '2 hours';
*/

-- 9.3 Delete test analytics
/*
DELETE FROM flash_offer_analytics 
WHERE created_at > NOW() - INTERVAL '2 hours';
*/

-- 9.4 Reset test user preferences
-- Replace with actual test user IDs
/*
UPDATE notification_preferences 
SET 
    flash_offers_enabled = true,
    quiet_hours_start = NULL,
    quiet_hours_end = NULL,
    max_distance_miles = NULL,
    updated_at = NOW()
WHERE user_id IN ('<test_user_id_1>', '<test_user_id_2>', '<test_user_id_3>');
*/

-- 9.5 Clean up expired rate limits (safe to run anytime)
DELETE FROM flash_offer_rate_limits 
WHERE expires_at < NOW();

-- ============================================================================
-- SECTION 10: Performance Monitoring
-- ============================================================================

-- 10.1 Average notification counts per offer
SELECT 
    AVG(recipient_count) as avg_recipients,
    AVG(success_count) as avg_successes,
    AVG(failure_count) as avg_failures,
    COUNT(*) as total_offers
FROM flash_offer_analytics
WHERE event_type = 'push_sent'
AND created_at > NOW() - INTERVAL '24 hours';

-- 10.2 Offers by hour (activity pattern)
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as offers_created,
    COUNT(CASE WHEN push_sent = true THEN 1 END) as offers_with_push
FROM flash_offers
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- 10.3 Rate limit violations (venues hitting limits)
SELECT 
    venue_id,
    COUNT(*) as times_rate_limited,
    MAX(count) as max_count_reached,
    MAX(created_at) as last_rate_limit
FROM flash_offer_rate_limits
WHERE limit_type = 'venue_send'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY venue_id
HAVING COUNT(*) > 1
ORDER BY times_rate_limited DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Usage Instructions:
-- 1. Run Section 1 queries before starting tests to verify setup
-- 2. Use Section 2 to verify test account configuration
-- 3. Run Section 3-8 queries during and after tests to verify behavior
-- 4. Use Section 9 queries to clean up after testing (BE CAREFUL!)
-- 5. Use Section 10 for performance analysis
--
-- Replace placeholders:
-- - <user_id>: Replace with actual user UUID
-- - <venue_id>: Replace with actual venue UUID
-- - <offer_id>: Replace with actual offer UUID
--
-- ============================================================================
