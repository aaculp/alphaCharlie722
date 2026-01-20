import type { Database } from '../lib/supabase';

// Venue types from database
export type Venue = Database['public']['Tables']['venues']['Row'];
export type VenueInsert = Database['public']['Tables']['venues']['Insert'];
export type VenueUpdate = Database['public']['Tables']['venues']['Update'];

// Venue query options
export interface VenueQueryOptions {
  search?: string;
  category?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

/**
 * VenueWithStats - Unified venue display structure
 * 
 * This type ensures all venue cards (CompactVenueCard, WideVenueCard) 
 * receive the same data structure regardless of where they're displayed.
 * 
 * Usage:
 * - HomeScreen featured venues
 * - New Venues section
 * - Recently Visited section
 * - Search results
 * - Any other venue list
 */
export interface VenueWithStats extends Venue {
  // Check-in statistics
  stats?: {
    active_checkins: number;
    recent_checkins: number; // Last 24 hours
    user_is_checked_in: boolean;
    user_checkin_id?: string;
    user_checkin_time?: string;
  };
  
  // Optional metadata for specific sections
  metadata?: {
    // For "Recently Visited" section
    last_visit_time?: string;
    visit_count?: number;
    
    // For "New Venues" section
    signup_date?: string;
    days_since_signup?: number;
    
    // For distance-based sorting
    distance_km?: number;
    distance_formatted?: string;
  };
}
