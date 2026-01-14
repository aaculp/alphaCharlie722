-- Migration: Create collections and collection_venues tables
-- Description: Implements venue collections with privacy levels and custom ordering
-- Requirements: 5.1, 5.2

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  privacy_level VARCHAR(20) DEFAULT 'friends' CHECK (privacy_level IN ('public', 'friends', 'close_friends', 'private')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_privacy ON collections(privacy_level);

-- Collection Venues junction table (many-to-many with ordering)
CREATE TABLE IF NOT EXISTS collection_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, venue_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_venues_collection ON collection_venues(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_venues_venue ON collection_venues(venue_id);
CREATE INDEX IF NOT EXISTS idx_collection_venues_order ON collection_venues(collection_id, "order");
