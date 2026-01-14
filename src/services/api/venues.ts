import { supabase } from '../../lib/supabase';
import type { VenueInsert, VenueQueryOptions } from '../../types';

export class VenueService {
  // Get all venues with optional search and filtering
  static async getVenues(options?: VenueQueryOptions) {
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
  static async getFeaturedVenues(limit?: number) {
    const venueLimit = limit || 10;
    
    console.log('🏢 Fetching featured venues...', {
      limit: venueLimit,
      timestamp: new Date().toISOString()
    });
    
    try {
      console.log('⏱️ Starting query...');
      
      // Simple query without timeout first to see if it works
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .gte('rating', 4.0)
        .order('rating', { ascending: false })
        .limit(venueLimit);

      console.log('📊 Query result:', { 
        success: !error, 
        count: data?.length || 0,
        error: error?.message 
      });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error(`Failed to fetch featured venues: ${error.message}`);
      }

      console.log('✅ Successfully fetched', data?.length || 0, 'venues');
      return data || [];
    } catch (err) {
      console.error('💥 Exception caught:', err);
      throw err;
    }
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

  // Get new venues for spotlight section (venues signed up within last 30 days)
  static async getNewVenues(limit: number = 10) {
    console.log('🆕 Fetching new venues...', { limit, timestamp: new Date().toISOString() });
    
    // Calculate the date 30 days ago in JavaScript
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    
    console.log('📅 Date filter:', { thirtyDaysAgoISO });

    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        venue_business_accounts!inner(
          created_at,
          account_status,
          verification_status
        )
      `)
      .gte('venue_business_accounts.created_at', thirtyDaysAgoISO)
      .eq('venue_business_accounts.account_status', 'active')
      .eq('venue_business_accounts.verification_status', 'verified')
      .limit(limit * 2); // Fetch more to account for sorting

    console.log('📊 Raw query result:', { 
      dataCount: data?.length || 0, 
      hasError: !!error,
      errorMessage: error?.message,
      firstVenue: data?.[0] ? { 
        id: data[0].id, 
        name: data[0].name,
        business_account: data[0].venue_business_accounts 
      } : null
    });

    if (error) {
      throw new Error(`Failed to fetch new venues: ${error.message}`);
    }

    // Transform the data to include signup_date at the top level
    const venues = (data || []).map(venue => ({
      ...venue,
      signup_date: venue.venue_business_accounts?.created_at || null,
      venue_business_accounts: undefined, // Remove nested object
    }));

    console.log('✅ Transformed venues:', { 
      count: venues.length,
      venues: venues.map(v => ({ id: v.id, name: v.name, signup_date: v.signup_date }))
    });

    // Sort by signup_date descending (newest first) and limit
    return venues
      .sort((a, b) => {
        const dateA = a.signup_date ? new Date(a.signup_date).getTime() : 0;
        const dateB = b.signup_date ? new Date(b.signup_date).getTime() : 0;
        return dateB - dateA; // Descending order
      })
      .slice(0, limit);
  }
}