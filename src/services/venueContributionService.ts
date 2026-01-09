import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type ContributionType = 'wait_times' | 'mood' | 'popular' | 'amenities';
type VenueContribution = Database['public']['Tables']['venue_contributions']['Row'];
type VenueContributionInsert = Database['public']['Tables']['venue_contributions']['Insert'];
type VenueContributionCount = Database['public']['Views']['venue_contribution_counts']['Row'];

export class VenueContributionService {
  /**
   * Add a user contribution to a venue
   */
  static async addContribution(
    venueId: string,
    contributionType: ContributionType,
    optionText: string
  ): Promise<{ success: boolean; error?: string; data?: VenueContribution }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Please sign in to contribute' };
      }

      // Check if user already contributed this exact option for this venue
      const { data: existingContribution } = await supabase
        .from('venue_contributions')
        .select('id')
        .eq('venue_id', venueId)
        .eq('user_id', user.id)
        .eq('contribution_type', contributionType)
        .eq('option_text', optionText)
        .single();

      if (existingContribution) {
        return { success: false, error: 'You have already contributed this option' };
      }

      const contributionData: VenueContributionInsert = {
        venue_id: venueId,
        user_id: user.id,
        contribution_type: contributionType,
        option_text: optionText,
      };

      const { data, error } = await supabase
        .from('venue_contributions')
        .insert(contributionData)
        .select()
        .single();

      if (error) {
        console.error('Error adding contribution:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in addContribution:', error);
      return { success: false, error: 'Failed to add contribution' };
    }
  }

  /**
   * Get all contributions for a venue with counts
   */
  static async getVenueContributions(
    venueId: string
  ): Promise<{ success: boolean; error?: string; data?: VenueContributionCount[] }> {
    try {
      const { data, error } = await supabase
        .from('venue_contribution_counts')
        .select('*')
        .eq('venue_id', venueId)
        .order('contribution_type')
        .order('count', { ascending: false });

      if (error) {
        console.error('Error fetching venue contributions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getVenueContributions:', error);
      return { success: false, error: 'Failed to fetch contributions' };
    }
  }

  /**
   * Get contributions by type for a venue
   */
  static async getVenueContributionsByType(
    venueId: string,
    contributionType: ContributionType
  ): Promise<{ success: boolean; error?: string; data?: VenueContributionCount[] }> {
    try {
      const { data, error } = await supabase
        .from('venue_contribution_counts')
        .select('*')
        .eq('venue_id', venueId)
        .eq('contribution_type', contributionType)
        .order('count', { ascending: false });

      if (error) {
        console.error('Error fetching contributions by type:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getVenueContributionsByType:', error);
      return { success: false, error: 'Failed to fetch contributions by type' };
    }
  }

  /**
   * Get user's contributions for a venue
   */
  static async getUserContributionsForVenue(
    venueId: string
  ): Promise<{ success: boolean; error?: string; data?: VenueContribution[] }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('venue_contributions')
        .select('*')
        .eq('venue_id', venueId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user contributions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getUserContributionsForVenue:', error);
      return { success: false, error: 'Failed to fetch user contributions' };
    }
  }

  /**
   * Remove a user's contribution
   */
  static async removeContribution(
    venueId: string,
    contributionType: ContributionType,
    optionText: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('venue_contributions')
        .delete()
        .eq('venue_id', venueId)
        .eq('user_id', user.id)
        .eq('contribution_type', contributionType)
        .eq('option_text', optionText);

      if (error) {
        console.error('Error removing contribution:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in removeContribution:', error);
      return { success: false, error: 'Failed to remove contribution' };
    }
  }

  /**
   * Get top contributions for a venue (most popular options)
   */
  static async getTopContributions(
    venueId: string,
    limit: number = 10
  ): Promise<{ success: boolean; error?: string; data?: VenueContributionCount[] }> {
    try {
      const { data, error } = await supabase
        .from('venue_contribution_counts')
        .select('*')
        .eq('venue_id', venueId)
        .order('count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top contributions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getTopContributions:', error);
      return { success: false, error: 'Failed to fetch top contributions' };
    }
  }

  /**
   * Batch update user contributions for a venue (add multiple, remove multiple)
   */
  static async batchUpdateContributions(
    venueId: string,
    contributionType: ContributionType,
    toAdd: string[],
    toRemove: string[]
  ): Promise<{ success: boolean; error?: string; addedCount?: number; removedCount?: number }> {
    try {
      // Early return if no changes to process
      if (toAdd.length === 0 && toRemove.length === 0) {
        return { success: true, addedCount: 0, removedCount: 0 };
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Please sign in to contribute' };
      }

      let addedCount = 0;
      let removedCount = 0;
      const errors: string[] = [];

      // Remove contributions first (if any)
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('venue_contributions')
          .delete()
          .eq('venue_id', venueId)
          .eq('user_id', user.id)
          .eq('contribution_type', contributionType)
          .in('option_text', toRemove);

        if (removeError) {
          errors.push(`Failed to remove contributions: ${removeError.message}`);
        } else {
          removedCount = toRemove.length;
        }
      }

      // Add new contributions (if any)
      if (toAdd.length > 0) {
        // First check for existing contributions to avoid duplicates
        const { data: existingContributions } = await supabase
          .from('venue_contributions')
          .select('option_text')
          .eq('venue_id', venueId)
          .eq('user_id', user.id)
          .eq('contribution_type', contributionType)
          .in('option_text', toAdd);

        const existingOptions = existingContributions?.map(c => c.option_text) || [];
        const newOptions = toAdd.filter(option => !existingOptions.includes(option));

        if (newOptions.length > 0) {
          const contributionsToInsert = newOptions.map(optionText => ({
            venue_id: venueId,
            user_id: user.id,
            contribution_type: contributionType,
            option_text: optionText,
          }));

          const { error: insertError } = await supabase
            .from('venue_contributions')
            .insert(contributionsToInsert);

          if (insertError) {
            errors.push(`Failed to add contributions: ${insertError.message}`);
          } else {
            addedCount = newOptions.length;
          }
        }
      }

      if (errors.length > 0) {
        return { 
          success: false, 
          error: errors.join('; '),
          addedCount,
          removedCount
        };
      }

      return { success: true, addedCount, removedCount };
    } catch (error) {
      console.error('Error in batchUpdateContributions:', error);
      return { success: false, error: 'Failed to update contributions' };
    }
  }
}

export default VenueContributionService;