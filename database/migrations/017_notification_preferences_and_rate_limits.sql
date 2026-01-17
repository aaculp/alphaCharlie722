-- Migration: Create notification preferences and rate limits tables
-- Description: Adds user notification preferences and rate limiting for flash offers
-- Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.6, 12.1

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  flash_offers_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,  -- e.g., '22:00:00'
  quiet_hours_end TIME,    -- e.g., '08:00:00'
  timezone TEXT DEFAULT 'UTC',  -- IANA timezone, e.g., 'America/New_York'
  max_distance_miles DECIMAL(5,2),  -- NULL = no limit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- Add comments to table
COMMENT ON TABLE notification_preferences IS 'Stores user preferences for push notifications';
COMMENT ON COLUMN notification_preferences.user_id IS 'Reference to the user';
COMMENT ON COLUMN notification_preferences.flash_offers_enabled IS 'Whether user wants to receive flash offer notifications';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Start time for quiet hours (no notifications)';
COMMENT ON COLUMN notification_preferences.quiet_hours_end IS 'End time for quiet hours (no notifications)';
COMMENT ON COLUMN notification_preferences.timezone IS 'User timezone for quiet hours calculation';
COMMENT ON COLUMN notification_preferences.max_distance_miles IS 'Maximum distance for flash offer notifications (NULL = no limit)';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================================================
-- FLASH OFFER RATE LIMITS TABLE
-- ============================================================================

-- Create flash_offer_rate_limits table
CREATE TABLE IF NOT EXISTS flash_offer_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  limit_type TEXT NOT NULL,  -- 'venue_send' or 'user_receive'
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_limit_type CHECK (limit_type IN ('venue_send', 'user_receive')),
  CONSTRAINT check_venue_or_user CHECK (
    (venue_id IS NOT NULL AND user_id IS NULL) OR
    (venue_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_venue ON flash_offer_rate_limits(venue_id, limit_type, expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON flash_offer_rate_limits(user_id, limit_type, expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON flash_offer_rate_limits(expires_at);

-- Add comments to table
COMMENT ON TABLE flash_offer_rate_limits IS 'Tracks rate limits for flash offer notifications';
COMMENT ON COLUMN flash_offer_rate_limits.venue_id IS 'Venue being rate limited (for venue_send type)';
COMMENT ON COLUMN flash_offer_rate_limits.user_id IS 'User being rate limited (for user_receive type)';
COMMENT ON COLUMN flash_offer_rate_limits.limit_type IS 'Type of rate limit: venue_send or user_receive';
COMMENT ON COLUMN flash_offer_rate_limits.count IS 'Number of notifications sent/received in current window';
COMMENT ON COLUMN flash_offer_rate_limits.window_start IS 'Start of the 24-hour rate limit window';
COMMENT ON COLUMN flash_offer_rate_limits.expires_at IS 'When this rate limit counter expires';

-- ============================================================================
-- CLEANUP FUNCTION FOR EXPIRED RATE LIMITS
-- ============================================================================

-- Create function to cleanup expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM flash_offer_rate_limits WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_rate_limits IS 'Removes expired rate limit counters from the database';

-- ============================================================================
-- UPDATE DEVICE_TOKENS RLS POLICIES
-- ============================================================================

-- Enable RLS on device_tokens if not already enabled
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Remove permissive testing policy
DROP POLICY IF EXISTS "Allow reading device tokens for push notifications (TESTING)" ON device_tokens;

-- Remove any old restrictive policies
DROP POLICY IF EXISTS "Users can only view own tokens" ON device_tokens;
DROP POLICY IF EXISTS "Users can view own device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Users can manage own device tokens" ON device_tokens;

-- Create secure policy: Users can only manage their own device tokens
CREATE POLICY "Users can manage own device tokens"
ON device_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can manage own device tokens" ON device_tokens IS 
  'Users can only read, insert, update, and delete their own device tokens. Edge Function uses service role key to bypass RLS.';

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notification preferences
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage own notification preferences"
ON notification_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can manage own notification preferences" ON notification_preferences IS 
  'Users can only read and update their own notification preferences';

-- Enable RLS on flash_offer_rate_limits
ALTER TABLE flash_offer_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access to rate limits for regular users
-- Only Edge Function with service role can access
DROP POLICY IF EXISTS "No direct access to rate limits" ON flash_offer_rate_limits;
CREATE POLICY "No direct access to rate limits"
ON flash_offer_rate_limits
FOR ALL
USING (false);

COMMENT ON POLICY "No direct access to rate limits" ON flash_offer_rate_limits IS 
  'Rate limits are only accessible via Edge Function with service role key';
