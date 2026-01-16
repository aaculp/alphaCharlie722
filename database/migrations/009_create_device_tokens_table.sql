-- Migration: Create device_tokens table for push notification management
-- Description: Stores FCM device tokens for push notification delivery
-- Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9

-- Create device_tokens table
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_device_tokens_token ON device_tokens(token);

-- Add comment to table
COMMENT ON TABLE device_tokens IS 'Stores FCM device tokens for push notification delivery';
COMMENT ON COLUMN device_tokens.user_id IS 'Reference to the user who owns this device';
COMMENT ON COLUMN device_tokens.token IS 'FCM device token for push notifications';
COMMENT ON COLUMN device_tokens.platform IS 'Device platform: ios or android';
COMMENT ON COLUMN device_tokens.is_active IS 'Whether this token is currently active';
COMMENT ON COLUMN device_tokens.last_used_at IS 'Last time this token was used to send a notification';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();
