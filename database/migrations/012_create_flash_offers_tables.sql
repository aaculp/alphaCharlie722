-- Migration: Create flash offers system tables
-- Description: Implements time-limited, claim-limited promotional offers with push notifications
-- Requirements: Flash Offers MVP

-- ============================================================================
-- Flash Offers Table
-- ============================================================================
-- Stores promotional offers created by venues
CREATE TABLE IF NOT EXISTS flash_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  
  -- Offer details
  title VARCHAR(100) NOT NULL CHECK (char_length(title) >= 3),
  description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 500),
  value_cap VARCHAR(50), -- e.g., "$10 off", "Free appetizer"
  
  -- Claim limits
  max_claims INTEGER NOT NULL CHECK (max_claims >= 1 AND max_claims <= 1000),
  claimed_count INTEGER DEFAULT 0 CHECK (claimed_count >= 0 AND claimed_count <= max_claims),
  
  -- Time constraints
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
  
  -- Targeting
  radius_miles DECIMAL(5,2) DEFAULT 1.0 CHECK (radius_miles > 0),
  target_favorites_only BOOLEAN DEFAULT false,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'expired', 'cancelled', 'full')),
  
  -- Notification tracking
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flash_offers_venue ON flash_offers(venue_id);
CREATE INDEX IF NOT EXISTS idx_flash_offers_status ON flash_offers(status);
CREATE INDEX IF NOT EXISTS idx_flash_offers_active ON flash_offers(status, end_time) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_flash_offers_time_range ON flash_offers(start_time, end_time);

-- Comments
COMMENT ON TABLE flash_offers IS 'Time-limited promotional offers created by venues';
COMMENT ON COLUMN flash_offers.venue_id IS 'Reference to the venue that created this offer';
COMMENT ON COLUMN flash_offers.title IS 'Offer title (3-100 characters)';
COMMENT ON COLUMN flash_offers.description IS 'Offer description (10-500 characters)';
COMMENT ON COLUMN flash_offers.value_cap IS 'Maximum value of the offer (e.g., "$10 off")';
COMMENT ON COLUMN flash_offers.max_claims IS 'Maximum number of users who can claim this offer (1-1000)';
COMMENT ON COLUMN flash_offers.claimed_count IS 'Current number of claims';
COMMENT ON COLUMN flash_offers.radius_miles IS 'Radius in miles for targeting users';
COMMENT ON COLUMN flash_offers.target_favorites_only IS 'Whether to only target users who favorited this venue';
COMMENT ON COLUMN flash_offers.status IS 'Current status: scheduled, active, expired, cancelled, full';

-- ============================================================================
-- Flash Offer Claims Table
-- ============================================================================
-- Stores user claims for flash offers with redemption tokens
CREATE TABLE IF NOT EXISTS flash_offer_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES flash_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Token for redemption
  token VARCHAR(6) NOT NULL CHECK (char_length(token) = 6 AND token ~ '^[0-9]{6}$'),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  
  -- Redemption details
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id UUID, -- Staff member who redeemed
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_offer UNIQUE(offer_id, user_id),
  CONSTRAINT unique_offer_token UNIQUE(offer_id, token),
  CONSTRAINT redeemed_requires_timestamp CHECK (
    (status = 'redeemed' AND redeemed_at IS NOT NULL AND redeemed_by_user_id IS NOT NULL) OR
    (status != 'redeemed' AND redeemed_at IS NULL AND redeemed_by_user_id IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flash_offer_claims_offer ON flash_offer_claims(offer_id);
CREATE INDEX IF NOT EXISTS idx_flash_offer_claims_user ON flash_offer_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_offer_claims_token ON flash_offer_claims(offer_id, token);
CREATE INDEX IF NOT EXISTS idx_flash_offer_claims_status ON flash_offer_claims(status);
CREATE INDEX IF NOT EXISTS idx_flash_offer_claims_active ON flash_offer_claims(status, expires_at) WHERE status = 'active';

-- Comments
COMMENT ON TABLE flash_offer_claims IS 'User claims for flash offers with redemption tokens';
COMMENT ON COLUMN flash_offer_claims.offer_id IS 'Reference to the flash offer';
COMMENT ON COLUMN flash_offer_claims.user_id IS 'User who claimed the offer';
COMMENT ON COLUMN flash_offer_claims.token IS '6-digit numeric token for redemption';
COMMENT ON COLUMN flash_offer_claims.status IS 'Claim status: active, redeemed, expired';
COMMENT ON COLUMN flash_offer_claims.redeemed_by_user_id IS 'Staff member who redeemed this claim';
COMMENT ON COLUMN flash_offer_claims.expires_at IS 'When this claim expires';

-- ============================================================================
-- Flash Offer Events Table
-- ============================================================================
-- Tracks analytics events for flash offers
CREATE TABLE IF NOT EXISTS flash_offer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES flash_offers(id) ON DELETE CASCADE,
  user_id UUID, -- NULL for system events like push_sent
  
  -- Event details
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('push_sent', 'view', 'claim', 'redeem')),
  
  -- Metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flash_offer_events_offer ON flash_offer_events(offer_id);
CREATE INDEX IF NOT EXISTS idx_flash_offer_events_type ON flash_offer_events(event_type);
CREATE INDEX IF NOT EXISTS idx_flash_offer_events_offer_type ON flash_offer_events(offer_id, event_type);
CREATE INDEX IF NOT EXISTS idx_flash_offer_events_created ON flash_offer_events(created_at);

-- Comments
COMMENT ON TABLE flash_offer_events IS 'Analytics events for flash offers';
COMMENT ON COLUMN flash_offer_events.offer_id IS 'Reference to the flash offer';
COMMENT ON COLUMN flash_offer_events.user_id IS 'User who triggered the event (NULL for system events)';
COMMENT ON COLUMN flash_offer_events.event_type IS 'Type of event: push_sent, view, claim, redeem';
COMMENT ON COLUMN flash_offer_events.metadata IS 'Additional event metadata as JSON';

-- ============================================================================
-- Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_flash_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for flash_offers
CREATE TRIGGER flash_offers_updated_at
  BEFORE UPDATE ON flash_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_flash_offers_updated_at();

-- Trigger for flash_offer_claims
CREATE TRIGGER flash_offer_claims_updated_at
  BEFORE UPDATE ON flash_offer_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_flash_offers_updated_at();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to automatically expire offers past end_time
CREATE OR REPLACE FUNCTION expire_flash_offers()
RETURNS void AS $$
BEGIN
  UPDATE flash_offers
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status IN ('scheduled', 'active')
    AND end_time < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically expire unclaimed tokens
CREATE OR REPLACE FUNCTION expire_flash_offer_claims()
RETURNS void AS $$
BEGIN
  UPDATE flash_offer_claims
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark offers as full when max_claims reached
CREATE OR REPLACE FUNCTION mark_full_flash_offers()
RETURNS void AS $$
BEGIN
  UPDATE flash_offers
  SET 
    status = 'full',
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND claimed_count >= max_claims;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate scheduled offers
CREATE OR REPLACE FUNCTION activate_scheduled_flash_offers()
RETURNS void AS $$
BEGIN
  UPDATE flash_offers
  SET 
    status = 'active',
    updated_at = NOW()
  WHERE 
    status = 'scheduled'
    AND start_time <= NOW()
    AND end_time > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Flash offers tables created successfully!' as message;
