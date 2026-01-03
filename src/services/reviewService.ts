import { supabase } from '../lib/supabase';
import { VenueService } from './venueService';
import type { Database } from '../lib/supabase';

type Review = Database['public']['Tables']['reviews']['Row'];
type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

export class ReviewService {
  // Get reviews for a venue
  static async getVenueReviews(venueId: string, limit: number = 20, offset: number = 0) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id (
          name,
          avatar_url
        )
      `)
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }

    return data || [];
  }

  // Create a new review
  static async createReview(review: ReviewInsert) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }

    // Update venue rating after new review
    await VenueService.updateVenueRating(review.venue_id);

    return data;
  }

  // Update a review
  static async updateReview(reviewId: string, updates: Partial<Review>) {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }

    // Update venue rating after review update
    if (data) {
      await VenueService.updateVenueRating(data.venue_id);
    }

    return data;
  }

  // Delete a review
  static async deleteReview(reviewId: string) {
    // Get the review first to know which venue to update
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('venue_id')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch review: ${fetchError.message}`);
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }

    // Update venue rating after review deletion
    if (review) {
      await VenueService.updateVenueRating(review.venue_id);
    }
  }

  // Get reviews by user
  static async getUserReviews(userId: string, limit: number = 20, offset: number = 0) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        venues:venue_id (
          name,
          image_url,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch user reviews: ${error.message}`);
    }

    return data || [];
  }

  // Check if user has reviewed a venue
  static async hasUserReviewedVenue(userId: string, venueId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to check user review: ${error.message}`);
    }

    return !!data;
  }

  // Get average rating for a venue
  static async getVenueAverageRating(venueId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('venue_id', venueId);

    if (error) {
      throw new Error(`Failed to fetch venue ratings: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { average: 0, count: 0 };
    }

    const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal
      count: data.length
    };
  }
}