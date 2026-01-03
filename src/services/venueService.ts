import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Venue = Database['public']['Tables']['venues']['Row'];
type VenueInsert = Database['public']['Tables']['venues']['Insert'];

export class VenueService {
  // Get all venues with optional search and filtering
  static async getVenues(options?: {
    search?: string;
    category?: string;
    location?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('venues')
      .select('*')
      .order('rating', { ascending: false });

    if (options?.search) {
      query = query.or(
        `name.ilike.%${options.search}%,description.ilike.%${options.search}%,category.ilike.%${options.search}%,location.ilike.%${options.search}%`
      );
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.location) {
      query = query.ilike('location', `%${options.location}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch venues: ${error.message}`);
    }

    return data || [];
  }

  // Get a single venue by ID
  static async getVenueById(id: string) {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch venue: ${error.message}`);
    }

    return data;
  }

  // Get featured venues for the home feed
  static async getFeaturedVenues(limit: number = 10) {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .gte('rating', 4.0)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch featured venues: ${error.message}`);
    }

    return data || [];
  }

  // Create a new venue (for admin/business owners)
  static async createVenue(venue: VenueInsert) {
    const { data, error } = await supabase
      .from('venues')
      .insert(venue)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create venue: ${error.message}`);
    }

    return data;
  }

  // Update venue rating (called after new reviews)
  static async updateVenueRating(venueId: string) {
    // Get average rating from reviews
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('venue_id', venueId);

    if (reviewError) {
      throw new Error(`Failed to fetch reviews: ${reviewError.message}`);
    }

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      const { error: updateError } = await supabase
        .from('venues')
        .update({ 
          rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
          review_count: reviews.length 
        })
        .eq('id', venueId);

      if (updateError) {
        throw new Error(`Failed to update venue rating: ${updateError.message}`);
      }
    }
  }

  // Get venues by category
  static async getVenuesByCategory(category: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('category', category)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch venues by category: ${error.message}`);
    }

    return data || [];
  }

  // Get nearby venues (requires latitude/longitude)
  static async getNearbyVenues(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10, 
    limit: number = 20
  ) {
    // Using PostGIS functions for location-based queries
    const { data, error } = await supabase
      .rpc('get_nearby_venues', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
        result_limit: limit
      });

    if (error) {
      throw new Error(`Failed to fetch nearby venues: ${error.message}`);
    }

    return data || [];
  }
}