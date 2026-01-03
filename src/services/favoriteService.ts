import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Favorite = Database['public']['Tables']['favorites']['Row'];

export class FavoriteService {
  // Add venue to favorites
  static async addToFavorites(userId: string, venueId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        venue_id: venueId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add to favorites: ${error.message}`);
    }

    return data;
  }

  // Remove venue from favorites
  static async removeFromFavorites(userId: string, venueId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('venue_id', venueId);

    if (error) {
      throw new Error(`Failed to remove from favorites: ${error.message}`);
    }
  }

  // Check if venue is favorited by user
  static async isFavorited(userId: string, venueId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to check favorite status: ${error.message}`);
    }

    return !!data;
  }

  // Get user's favorite venues
  static async getUserFavorites(userId: string, limit: number = 20, offset: number = 0) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        venues:venue_id (
          id,
          name,
          description,
          category,
          location,
          address,
          rating,
          review_count,
          image_url,
          price_range
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }

    return data || [];
  }

  // Toggle favorite status
  static async toggleFavorite(userId: string, venueId: string) {
    const isFav = await this.isFavorited(userId, venueId);
    
    if (isFav) {
      await this.removeFromFavorites(userId, venueId);
      return false;
    } else {
      await this.addToFavorites(userId, venueId);
      return true;
    }
  }

  // Get favorite count for a venue
  static async getFavoriteCount(venueId: string) {
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);

    if (error) {
      throw new Error(`Failed to get favorite count: ${error.message}`);
    }

    return count || 0;
  }
}