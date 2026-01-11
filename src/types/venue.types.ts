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
