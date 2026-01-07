import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

export interface CheckIn {
  id: string;
  venue_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VenueCheckInStats {
  venue_id: string;
  active_checkins: number;
  recent_checkins: number; // Last 24 hours
  user_is_checked_in: boolean;
  user_checkin_id?: string;
  user_checkin_time?: string; // ISO string of when user checked in
}

export class CheckInService {
  // Check into a venue
  static async checkIn(venueId: string, userId: string): Promise<CheckIn> {
    try {
      // First, check out any existing active check-ins for this user
      await this.checkOutUser(userId);

      // Create new check-in
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          venue_id: venueId,
          user_id: userId,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to check in: ${error.message}`);
      }

      console.log('✅ User checked in successfully:', data);
      return data;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  }

  // Check out of a venue
  static async checkOut(checkInId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({
          is_active: false,
          checked_out_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', checkInId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to check out: ${error.message}`);
      }

      console.log('✅ User checked out successfully');
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  }

  // Check out user from all venues (used when checking into a new venue)
  static async checkOutUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({
          is_active: false,
          checked_out_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.warn('Warning: Could not check out user from previous venues:', error.message);
      }
    } catch (error) {
      console.warn('Warning: Error checking out user:', error);
    }
  }

  // Get check-in stats for a venue
  static async getVenueCheckInStats(venueId: string, userId?: string): Promise<VenueCheckInStats> {
    try {
      // Get active check-ins count
      const { data: activeCheckIns, error: activeError } = await supabase
        .from('check_ins')
        .select('id')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      if (activeError) {
        throw new Error(`Failed to get active check-ins: ${activeError.message}`);
      }

      // Get recent check-ins count (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentCheckIns, error: recentError } = await supabase
        .from('check_ins')
        .select('id')
        .eq('venue_id', venueId)
        .gte('checked_in_at', twentyFourHoursAgo.toISOString());

      if (recentError) {
        throw new Error(`Failed to get recent check-ins: ${recentError.message}`);
      }

      let userIsCheckedIn = false;
      let userCheckInId: string | undefined;
      let userCheckInTime: string | undefined;

      // Check if current user is checked in
      if (userId) {
        const { data: userCheckIn, error: userError } = await supabase
          .from('check_ins')
          .select('id, checked_in_at')
          .eq('venue_id', venueId)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (!userError && userCheckIn) {
          userIsCheckedIn = true;
          userCheckInId = userCheckIn.id;
          userCheckInTime = userCheckIn.checked_in_at;
        }
      }

      return {
        venue_id: venueId,
        active_checkins: activeCheckIns?.length || 0,
        recent_checkins: recentCheckIns?.length || 0,
        user_is_checked_in: userIsCheckedIn,
        user_checkin_id: userCheckInId,
        user_checkin_time: userCheckInTime
      };
    } catch (error) {
      console.error('Error getting venue check-in stats:', error);
      // Return default stats on error
      return {
        venue_id: venueId,
        active_checkins: 0,
        recent_checkins: 0,
        user_is_checked_in: false
      };
    }
  }

  // Get check-in stats for multiple venues (for feed)
  static async getMultipleVenueStats(venueIds: string[], userId?: string): Promise<Map<string, VenueCheckInStats>> {
    const statsMap = new Map<string, VenueCheckInStats>();

    try {
      // Get all active check-ins for these venues
      const { data: activeCheckIns, error: activeError } = await supabase
        .from('check_ins')
        .select('venue_id')
        .in('venue_id', venueIds)
        .eq('is_active', true);

      if (activeError) {
        console.warn('Warning: Could not fetch active check-ins:', activeError.message);
      }

      // Count active check-ins per venue
      const activeCounts: { [key: string]: number } = {};
      activeCheckIns?.forEach(checkIn => {
        activeCounts[checkIn.venue_id] = (activeCounts[checkIn.venue_id] || 0) + 1;
      });

      // Get user's active check-ins if logged in
      let userCheckIns: { [key: string]: { id: string; time: string } } = {};
      if (userId) {
        const { data: userActiveCheckIns, error: userError } = await supabase
          .from('check_ins')
          .select('id, venue_id, checked_in_at')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (!userError && userActiveCheckIns) {
          userActiveCheckIns.forEach(checkIn => {
            userCheckIns[checkIn.venue_id] = {
              id: checkIn.id,
              time: checkIn.checked_in_at
            };
          });
        }
      }

      // Create stats for each venue
      venueIds.forEach(venueId => {
        const userCheckIn = userCheckIns[venueId];
        statsMap.set(venueId, {
          venue_id: venueId,
          active_checkins: activeCounts[venueId] || 0,
          recent_checkins: 0, // Skip recent count for performance in feed
          user_is_checked_in: !!userCheckIn,
          user_checkin_id: userCheckIn?.id,
          user_checkin_time: userCheckIn?.time
        });
      });

    } catch (error) {
      console.error('Error getting multiple venue stats:', error);
      // Return empty stats for all venues on error
      venueIds.forEach(venueId => {
        statsMap.set(venueId, {
          venue_id: venueId,
          active_checkins: 0,
          recent_checkins: 0,
          user_is_checked_in: false
        });
      });
    }

    return statsMap;
  }

  // Get user's current check-in
  static async getUserCurrentCheckIn(userId: string): Promise<CheckIn | null> {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active check-in found
          return null;
        }
        throw new Error(`Failed to get current check-in: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting current check-in:', error);
      return null;
    }
  }

  // Get user's current check-in with venue name
  static async getUserCurrentCheckInWithVenue(userId: string): Promise<{ checkIn: CheckIn; venueName: string } | null> {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          venues!inner(name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active check-in found
          return null;
        }
        throw new Error(`Failed to get current check-in with venue: ${error.message}`);
      }

      return {
        checkIn: {
          id: data.id,
          venue_id: data.venue_id,
          user_id: data.user_id,
          checked_in_at: data.checked_in_at,
          checked_out_at: data.checked_out_at,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at
        },
        venueName: data.venues.name
      };
    } catch (error) {
      console.error('Error getting current check-in with venue:', error);
      return null;
    }
  }
}