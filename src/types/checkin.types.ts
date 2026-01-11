// Check-in interface
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

// Venue check-in statistics
export interface VenueCheckInStats {
  venue_id: string;
  active_checkins: number;
  recent_checkins: number; // Last 24 hours
  user_is_checked_in: boolean;
  user_checkin_id?: string;
  user_checkin_time?: string; // ISO string of when user checked in
}
