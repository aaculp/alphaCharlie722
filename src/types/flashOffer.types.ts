// Flash Offer Types
// Based on database schema from migration 012_create_flash_offers_tables.sql

/**
 * Flash offer status enum
 * - scheduled: Offer is created but not yet active
 * - active: Offer is currently active and can be claimed
 * - expired: Offer has passed its end_time
 * - cancelled: Offer was manually cancelled by venue
 * - full: Offer has reached max_claims limit
 */
export type FlashOfferStatus = 'scheduled' | 'active' | 'expired' | 'cancelled' | 'full';

/**
 * Flash offer interface matching database schema
 * Represents a time-limited, claim-limited promotional offer created by venues
 */
export interface FlashOffer {
  id: string;
  venue_id: string;
  
  // Offer details
  title: string;
  description: string;
  value_cap: string | null;
  
  // Claim limits
  max_claims: number;
  claimed_count: number;
  
  // Time constraints
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
  
  // Targeting
  radius_miles: number;
  target_favorites_only: boolean;
  
  // Status tracking
  status: FlashOfferStatus;
  
  // Notification tracking
  push_sent: boolean;
  push_sent_at: string | null; // ISO 8601 timestamp
  
  // Timestamps
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Input type for creating a new flash offer
 * Omits auto-generated fields and provides sensible defaults
 */
export interface CreateFlashOfferInput {
  venue_id: string;
  
  // Offer details (required)
  title: string; // 3-100 characters
  description: string; // 10-500 characters
  value_cap?: string | null; // e.g., "$10 off", "Free appetizer"
  
  // Claim limits (required)
  max_claims: number; // 1-1000
  
  // Time constraints (required)
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
  
  // Targeting (optional, has defaults)
  radius_miles?: number; // Default: 1.0
  target_favorites_only?: boolean; // Default: false
}

/**
 * Input type for updating an existing flash offer
 * All fields are optional to allow partial updates
 */
export interface UpdateFlashOfferInput {
  title?: string;
  description?: string;
  value_cap?: string | null;
  max_claims?: number;
  start_time?: string;
  end_time?: string;
  radius_miles?: number;
  target_favorites_only?: boolean;
  status?: FlashOfferStatus;
}

/**
 * Flash offer with venue details
 * Used when displaying offers to customers with venue information
 */
export interface FlashOfferWithVenue extends FlashOffer {
  venue: {
    id: string;
    name: string;
    location: string;
    category: string;
    image_url: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

/**
 * Flash offer with statistics
 * Used in venue dashboard to show offer performance
 */
export interface FlashOfferWithStats extends FlashOffer {
  stats: {
    views: number;
    claims: number;
    redemptions: number;
    open_rate: number; // percentage
    claim_rate: number; // percentage
    redemption_rate: number; // percentage
  };
}

/**
 * Query options for fetching flash offers
 */
export interface FlashOfferQueryOptions {
  venue_id?: string;
  status?: FlashOfferStatus | FlashOfferStatus[];
  limit?: number;
  offset?: number;
}

/**
 * Options for fetching active offers near a location
 */
export interface ActiveOffersQueryOptions {
  latitude: number;
  longitude: number;
  radius_miles?: number; // Default: 10
  limit?: number;
  offset?: number;
}
