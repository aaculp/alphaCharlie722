-- Migration: Optimize device_tokens table for performance
-- Description: Add composite indexes and optimize queries for push notification delivery
-- Requirements: 14.2, 14.4, 14.8

-- Add composite index for user_id + is_active queries
-- This optimizes the most common query: getting active tokens for a user
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active 
  ON device_tokens(user_id, is_active) 
  WHERE is_active = true;

-- Add index for cleanup queries (inactive tokens older than 30 days)
CREATE INDEX IF NOT EXISTS idx_device_tokens_cleanup 
  ON device_tokens(is_active, updated_at) 
  WHERE is_active = false;

-- Add index for last_used_at to optimize ordering
CREATE INDEX IF NOT EXISTS idx_device_tokens_last_used 
  ON device_tokens(user_id, last_used_at DESC) 
  WHERE is_active = true;

-- Analyze table to update query planner statistics
ANALYZE device_tokens;

-- Add comments
COMMENT ON INDEX idx_device_tokens_user_active IS 'Composite index for fast active token lookups by user';
COMMENT ON INDEX idx_device_tokens_cleanup IS 'Partial index for efficient cleanup of expired tokens';
COMMENT ON INDEX idx_device_tokens_last_used IS 'Index for ordering tokens by last usage';
