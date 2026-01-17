-- Edge Function Monitoring Views and Functions
-- 
-- Provides database-level monitoring for the flash offer push notification system
-- Requirements: 6.5, 9.6

-- View: Recent rate limit violations (last hour)
CREATE OR REPLACE VIEW recent_rate_limit_violations AS
SELECT 
  limit_type,
  COUNT(*) as violation_count,
  MAX(created_at) as last_violation,
  MIN(created_at) as first_violation
FROM flash_offer_rate_limits
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY limit_type;

-- View: Device token health
CREATE OR REPLACE VIEW device_token_health AS
SELECT 
  is_active,
  COUNT(*) as token_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM device_tokens
GROUP BY is_active;

-- View: Notification preferences distribution
CREATE OR REPLACE VIEW notification_preferences_stats AS
SELECT 
  flash_offers_enabled,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM notification_preferences
GROUP BY flash_offers_enabled;

-- View: Daily notification volume
CREATE OR REPLACE VIEW daily_notification_volume AS
SELECT 
  DATE(created_at) as date,
  limit_type,
  SUM(count) as total_count
FROM flash_offer_rate_limits
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), limit_type
ORDER BY date DESC, limit_type;

-- Function: Check if error rate threshold is exceeded
CREATE OR REPLACE FUNCTION check_error_rate_threshold()
RETURNS TABLE(
  exceeded boolean,
  error_rate numeric,
  threshold numeric
) AS $$
DECLARE
  v_threshold numeric := 0.05; -- 5%
  v_error_rate numeric;
BEGIN
  -- This would need to be populated by the Edge Function
  -- For now, return a placeholder
  v_error_rate := 0.0;
  
  RETURN QUERY SELECT 
    v_error_rate > v_threshold as exceeded,
    v_error_rate as error_rate,
    v_threshold as threshold;
END;
$$ LANGUAGE plpgsql;

-- Function: Check rate limit violations in last hour
CREATE OR REPLACE FUNCTION check_rate_limit_violations()
RETURNS TABLE(
  exceeded boolean,
  violation_count bigint,
  threshold integer
) AS $$
DECLARE
  v_threshold integer := 100; -- 100 per hour
  v_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM flash_offer_rate_limits
  WHERE created_at > NOW() - INTERVAL '1 hour';
  
  RETURN QUERY SELECT 
    v_count > v_threshold as exceeded,
    v_count as violation_count,
    v_threshold as threshold;
END;
$$ LANGUAGE plpgsql;


-- Function: Get monitoring summary
CREATE OR REPLACE FUNCTION get_monitoring_summary()
RETURNS TABLE(
  metric_name text,
  metric_value text,
  status text
) AS $$
BEGIN
  -- Rate limit violations
  RETURN QUERY
  SELECT 
    'Rate Limit Violations (1h)' as metric_name,
    COUNT(*)::text as metric_value,
    CASE 
      WHEN COUNT(*) > 100 THEN 'WARNING'
      ELSE 'OK'
    END as status
  FROM flash_offer_rate_limits
  WHERE created_at > NOW() - INTERVAL '1 hour';
  
  -- Active device tokens
  RETURN QUERY
  SELECT 
    'Active Device Tokens' as metric_name,
    COUNT(*)::text as metric_value,
    'INFO' as status
  FROM device_tokens
  WHERE is_active = true;
  
  -- Inactive device tokens percentage
  RETURN QUERY
  SELECT 
    'Inactive Token Rate' as metric_name,
    ROUND(
      COUNT(*) FILTER (WHERE is_active = false) * 100.0 / 
      NULLIF(COUNT(*), 0), 
      2
    )::text || '%' as metric_value,
    CASE 
      WHEN COUNT(*) FILTER (WHERE is_active = false) * 100.0 / NULLIF(COUNT(*), 0) > 10 THEN 'WARNING'
      ELSE 'OK'
    END as status
  FROM device_tokens;
  
  -- Users with notifications disabled
  RETURN QUERY
  SELECT 
    'Users with Notifications Disabled' as metric_name,
    COUNT(*)::text as metric_value,
    'INFO' as status
  FROM notification_preferences
  WHERE flash_offers_enabled = false;
  
  -- Venue rate limits today
  RETURN QUERY
  SELECT 
    'Venue Offers Sent Today' as metric_name,
    COUNT(*)::text as metric_value,
    'INFO' as status
  FROM flash_offer_rate_limits
  WHERE limit_type = 'venue_send'
  AND created_at > CURRENT_DATE;
  
  -- User notifications received today
  RETURN QUERY
  SELECT 
    'User Notifications Today' as metric_name,
    COUNT(*)::text as metric_value,
    'INFO' as status
  FROM flash_offer_rate_limits
  WHERE limit_type = 'user_receive'
  AND created_at > CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get alert summary
CREATE OR REPLACE FUNCTION get_alert_summary()
RETURNS TABLE(
  alert_type text,
  severity text,
  message text,
  triggered_at timestamptz
) AS $$
BEGIN
  -- Check rate limit violations
  IF (SELECT COUNT(*) FROM flash_offer_rate_limits WHERE created_at > NOW() - INTERVAL '1 hour') > 100 THEN
    RETURN QUERY SELECT 
      'rate_limit_violations'::text,
      'WARNING'::text,
      'Rate limit violations exceeded 100 in the last hour'::text,
      NOW();
  END IF;
  
  -- Check inactive token rate
  IF (
    SELECT COUNT(*) FILTER (WHERE is_active = false) * 100.0 / NULLIF(COUNT(*), 0)
    FROM device_tokens
  ) > 10 THEN
    RETURN QUERY SELECT 
      'inactive_token_rate'::text,
      'WARNING'::text,
      'Inactive device token rate exceeded 10%'::text,
      NOW();
  END IF;
  
  -- If no alerts, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for monitoring views and functions
GRANT SELECT ON recent_rate_limit_violations TO authenticated;
GRANT SELECT ON device_token_health TO authenticated;
GRANT SELECT ON notification_preferences_stats TO authenticated;
GRANT SELECT ON daily_notification_volume TO authenticated;
GRANT EXECUTE ON FUNCTION check_error_rate_threshold() TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit_violations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitoring_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_alert_summary() TO authenticated;

-- Example queries for monitoring

-- Check current monitoring summary
-- SELECT * FROM get_monitoring_summary();

-- Check for active alerts
-- SELECT * FROM get_alert_summary();

-- View recent rate limit violations
-- SELECT * FROM recent_rate_limit_violations;

-- View device token health
-- SELECT * FROM device_token_health;

-- View notification preferences distribution
-- SELECT * FROM notification_preferences_stats;

-- View daily notification volume
-- SELECT * FROM daily_notification_volume;
