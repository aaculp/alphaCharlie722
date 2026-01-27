-- Migration: Add foreign key constraint for flash_offers.venue_id
-- Description: Adds the missing foreign key relationship between flash_offers and venues tables
-- This enables Supabase to properly join these tables in queries
-- Date: 2026-01-26

-- Add foreign key constraint to flash_offers.venue_id
ALTER TABLE flash_offers
ADD CONSTRAINT fk_flash_offers_venue
FOREIGN KEY (venue_id) 
REFERENCES venues(id) 
ON DELETE CASCADE;

-- Add comment
COMMENT ON CONSTRAINT fk_flash_offers_venue ON flash_offers IS 
  'Foreign key relationship to venues table - enables proper joins in Supabase queries';
