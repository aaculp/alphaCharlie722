import type { Database } from '../lib/supabase';

// User types from database
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// User type enum
export type UserType = 'customer' | 'venue_owner';
