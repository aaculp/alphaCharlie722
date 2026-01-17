import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your actual Supabase project credentials
// You'll get these after creating your Supabase project
// For testing: Override with SUPABASE_URL and SUPABASE_ANON_KEY environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://cznhaaigowjhqdjtfeyz.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bmhhYWlnb3dqaHFkanRmZXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjQ1NDcsImV4cCI6MjA4MzA0MDU0N30.UMOiS197aGaVsl92UPxwArgUE7iiuEsgVlefKawfD8g';

// Custom AsyncStorage adapter with minimal logging
const customAsyncStorage = {
  getItem: async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    // Only log on app startup (first call)
    if (!customAsyncStorage._hasLogged) {
      console.log('📦 First AsyncStorage.getItem:', key, value ? 'HAS DATA' : 'null');
      customAsyncStorage._hasLogged = true;
    }
    return value;
  },
  setItem: async (key: string, value: string) => {
    console.log('💾 AsyncStorage.setItem:', key, value ? 'SAVING SESSION' : 'null');
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    console.log('🗑️ AsyncStorage.removeItem:', key);
    await AsyncStorage.removeItem(key);
  },
  _hasLogged: false,
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customAsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true, // Re-enable now that we fixed the hang issue
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Database types (we'll expand these as we build)
export interface Database {
  public: {
    Tables: {
      venues: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          location: string;
          address: string;
          phone: string | null;
          website: string | null;
          rating: number;
          review_count: number;
          image_url: string | null;
          amenities: string[];
          hours: Record<string, string>;
          price_range: string;
          latitude: number | null;
          longitude: number | null;
          wait_times: Record<string, string> | null; // e.g., { "lunch": "15-20 min", "dinner": "30-45 min" }
          popular_items: string[] | null; // e.g., ["Signature Burger", "Truffle Fries", "Craft Beer"]
          atmosphere_tags: string[] | null; // e.g., ["Quiet", "Family-Friendly", "Date Night"]
          parking_info: {
            type: string; // "Available", "Street Only", "Valet", "None"
            details?: string; // Additional parking details
            cost?: string; // "Free", "$5/hour", "Validated"
          } | null;
          max_capacity: number | null; // Maximum capacity for activity level calculation
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: string;
          location: string;
          address: string;
          phone?: string | null;
          website?: string | null;
          rating?: number;
          review_count?: number;
          image_url?: string | null;
          amenities?: string[];
          hours?: Record<string, string>;
          price_range?: string;
          latitude?: number | null;
          longitude?: number | null;
          wait_times?: Record<string, string> | null;
          popular_items?: string[] | null;
          atmosphere_tags?: string[] | null;
          parking_info?: {
            type: string;
            details?: string;
            cost?: string;
          } | null;
          max_capacity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          location?: string;
          address?: string;
          phone?: string | null;
          website?: string | null;
          rating?: number;
          review_count?: number;
          image_url?: string | null;
          amenities?: string[];
          hours?: Record<string, string>;
          price_range?: string;
          latitude?: number | null;
          longitude?: number | null;
          wait_times?: Record<string, string> | null;
          popular_items?: string[] | null;
          atmosphere_tags?: string[] | null;
          parking_info?: {
            type: string;
            details?: string;
            cost?: string;
          } | null;
          max_capacity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      venue_applications: {
        Row: {
          id: string;
          venue_name: string;
          venue_type: string;
          address: string;
          city: string;
          state: string;
          zip_code: string | null;
          phone: string | null;
          website: string | null;
          owner_name: string;
          owner_email: string;
          owner_user_id: string;
          status: 'pending' | 'approved' | 'rejected' | 'under_review';
          description: string | null;
          business_license: string | null;
          tax_id: string | null;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_name: string;
          venue_type: string;
          address: string;
          city: string;
          state: string;
          zip_code?: string | null;
          phone?: string | null;
          website?: string | null;
          owner_name: string;
          owner_email: string;
          owner_user_id: string;
          status?: 'pending' | 'approved' | 'rejected' | 'under_review';
          description?: string | null;
          business_license?: string | null;
          tax_id?: string | null;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venue_name?: string;
          venue_type?: string;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string | null;
          phone?: string | null;
          website?: string | null;
          owner_name?: string;
          owner_email?: string;
          owner_user_id?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'under_review';
          description?: string | null;
          business_license?: string | null;
          tax_id?: string | null;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      venue_business_accounts: {
        Row: {
          id: string;
          venue_id: string;
          owner_user_id: string;
          application_id: string | null;
          subscription_tier: 'free' | 'core' | 'pro' | 'revenue';
          subscription_status: 'active' | 'inactive' | 'suspended' | 'cancelled';
          subscription_start_date: string;
          subscription_end_date: string | null;
          push_credits_remaining: number;
          push_credits_used: number;
          account_status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
          verification_status: 'pending' | 'verified' | 'rejected';
          billing_email: string | null;
          billing_address: string | null;
          payment_method_id: string | null;
          settings: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          owner_user_id: string;
          application_id?: string | null;
          subscription_tier?: 'free' | 'core' | 'pro' | 'revenue';
          subscription_status?: 'active' | 'inactive' | 'suspended' | 'cancelled';
          subscription_start_date?: string;
          subscription_end_date?: string | null;
          push_credits_remaining?: number;
          push_credits_used?: number;
          account_status?: 'active' | 'inactive' | 'suspended' | 'pending_verification';
          verification_status?: 'pending' | 'verified' | 'rejected';
          billing_email?: string | null;
          billing_address?: string | null;
          payment_method_id?: string | null;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          owner_user_id?: string;
          application_id?: string | null;
          subscription_tier?: 'free' | 'core' | 'pro' | 'revenue';
          subscription_status?: 'active' | 'inactive' | 'suspended' | 'cancelled';
          subscription_start_date?: string;
          subscription_end_date?: string | null;
          push_credits_remaining?: number;
          push_credits_used?: number;
          account_status?: 'active' | 'inactive' | 'suspended' | 'pending_verification';
          verification_status?: 'pending' | 'verified' | 'rejected';
          billing_email?: string | null;
          billing_address?: string | null;
          payment_method_id?: string | null;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      venue_push_notifications: {
        Row: {
          id: string;
          venue_business_account_id: string;
          venue_id: string;
          title: string;
          message: string;
          notification_type: 'general' | 'flash_offer' | 'event' | 'promotion';
          target_radius_miles: number;
          target_user_count: number;
          actual_sent_count: number;
          scheduled_for: string | null;
          sent_at: string | null;
          status: 'draft' | 'scheduled' | 'sent' | 'cancelled' | 'failed';
          credits_used: number;
          delivery_stats: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_business_account_id: string;
          venue_id: string;
          title: string;
          message: string;
          notification_type?: 'general' | 'flash_offer' | 'event' | 'promotion';
          target_radius_miles?: number;
          target_user_count?: number;
          actual_sent_count?: number;
          scheduled_for?: string | null;
          sent_at?: string | null;
          status?: 'draft' | 'scheduled' | 'sent' | 'cancelled' | 'failed';
          credits_used?: number;
          delivery_stats?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venue_business_account_id?: string;
          venue_id?: string;
          title?: string;
          message?: string;
          notification_type?: 'general' | 'flash_offer' | 'event' | 'promotion';
          target_radius_miles?: number;
          target_user_count?: number;
          actual_sent_count?: number;
          scheduled_for?: string | null;
          sent_at?: string | null;
          status?: 'draft' | 'scheduled' | 'sent' | 'cancelled' | 'failed';
          credits_used?: number;
          delivery_stats?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          preferences: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          preferences?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          preferences?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          venue_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          venue_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          venue_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          venue_id?: string;
          created_at?: string;
        };
      };
      user_tags: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          tag_text: string;
          like_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          tag_text: string;
          like_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          user_id?: string;
          tag_text?: string;
          like_count?: number;
          created_at?: string;
        };
      };
      tag_likes: {
        Row: {
          id: string;
          tag_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tag_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tag_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          checked_in_at: string;
          checked_out_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          user_id?: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      venue_contributions: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          contribution_type: 'wait_times' | 'mood' | 'popular' | 'amenities';
          option_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          contribution_type: 'wait_times' | 'mood' | 'popular' | 'amenities';
          option_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          user_id?: string;
          contribution_type?: 'wait_times' | 'mood' | 'popular' | 'amenities';
          option_text?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Social Friend System Tables
      friendships: {
        Row: {
          id: string;
          user_id_1: string;
          user_id_2: string;
          is_close_friend_1: boolean;
          is_close_friend_2: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id_1: string;
          user_id_2: string;
          is_close_friend_1?: boolean;
          is_close_friend_2?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id_1?: string;
          user_id_2?: string;
          is_close_friend_1?: boolean;
          is_close_friend_2?: boolean;
          created_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      follow_requests: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          status: 'pending' | 'approved' | 'denied';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          status?: 'pending' | 'approved' | 'denied';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          status?: 'pending' | 'approved' | 'denied';
          created_at?: string;
          updated_at?: string;
        };
      };
      privacy_settings: {
        Row: {
          user_id: string;
          profile_visibility: 'public' | 'friends' | 'private';
          checkin_visibility: 'public' | 'friends' | 'close_friends' | 'private';
          favorite_visibility: 'public' | 'friends' | 'close_friends' | 'private';
          default_collection_visibility: 'public' | 'friends' | 'close_friends' | 'private';
          allow_follow_requests: boolean;
          show_activity_status: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          profile_visibility?: 'public' | 'friends' | 'private';
          checkin_visibility?: 'public' | 'friends' | 'close_friends' | 'private';
          favorite_visibility?: 'public' | 'friends' | 'close_friends' | 'private';
          default_collection_visibility?: 'public' | 'friends' | 'close_friends' | 'private';
          allow_follow_requests?: boolean;
          show_activity_status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          profile_visibility?: 'public' | 'friends' | 'private';
          checkin_visibility?: 'public' | 'friends' | 'close_friends' | 'private';
          favorite_visibility?: 'public' | 'friends' | 'close_friends' | 'private';
          default_collection_visibility?: 'public' | 'friends' | 'close_friends' | 'private';
          allow_follow_requests?: boolean;
          show_activity_status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
      };
      user_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          status: 'pending' | 'reviewed' | 'resolved';
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          status?: 'pending' | 'reviewed' | 'resolved';
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_id?: string;
          reason?: string;
          status?: 'pending' | 'reviewed' | 'resolved';
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          privacy_level: 'public' | 'friends' | 'close_friends' | 'private';
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          privacy_level?: 'public' | 'friends' | 'close_friends' | 'private';
          cover_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          privacy_level?: 'public' | 'friends' | 'close_friends' | 'private';
          cover_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_venues: {
        Row: {
          id: string;
          collection_id: string;
          venue_id: string;
          order: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          venue_id: string;
          order?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          venue_id?: string;
          order?: number;
          added_at?: string;
        };
      };
      collection_follows: {
        Row: {
          id: string;
          user_id: string;
          collection_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          collection_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          collection_id?: string;
          created_at?: string;
        };
      };
      group_outings: {
        Row: {
          id: string;
          creator_id: string;
          venue_id: string;
          title: string;
          description: string | null;
          scheduled_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          venue_id: string;
          title: string;
          description?: string | null;
          scheduled_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          venue_id?: string;
          title?: string;
          description?: string | null;
          scheduled_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_outing_invites: {
        Row: {
          id: string;
          group_outing_id: string;
          user_id: string;
          response: 'interested' | 'going' | 'cant_go' | 'no_response';
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_outing_id: string;
          user_id: string;
          response?: 'interested' | 'going' | 'cant_go' | 'no_response';
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_outing_id?: string;
          user_id?: string;
          response?: 'interested' | 'going' | 'cant_go' | 'no_response';
          responded_at?: string | null;
          created_at?: string;
        };
      };
      venue_shares: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          venue_id: string;
          message: string | null;
          viewed: boolean;
          viewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          venue_id: string;
          message?: string | null;
          viewed?: boolean;
          viewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          venue_id?: string;
          message?: string | null;
          viewed?: boolean;
          viewed_at?: string | null;
          created_at?: string;
        };
      };
      activity_feed: {
        Row: {
          id: string;
          user_id: string;
          activity_type: 'checkin' | 'favorite' | 'collection_created' | 'collection_updated' | 'group_outing';
          venue_id: string | null;
          collection_id: string | null;
          group_outing_id: string | null;
          privacy_level: 'public' | 'friends' | 'close_friends' | 'private';
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: 'checkin' | 'favorite' | 'collection_created' | 'collection_updated' | 'group_outing';
          venue_id?: string | null;
          collection_id?: string | null;
          group_outing_id?: string | null;
          privacy_level: 'public' | 'friends' | 'close_friends' | 'private';
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: 'checkin' | 'favorite' | 'collection_created' | 'collection_updated' | 'group_outing';
          venue_id?: string | null;
          collection_id?: string | null;
          group_outing_id?: string | null;
          privacy_level?: 'public' | 'friends' | 'close_friends' | 'private';
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      activity_likes: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          activity_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      activity_comments: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          comment_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          comment_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          activity_id?: string;
          user_id?: string;
          comment_text?: string;
          created_at?: string;
        };
      };
      social_notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          actor_id: string | null;
          reference_id: string | null;
          title: string;
          body: string;
          data: Record<string, any>;
          read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          actor_id?: string | null;
          reference_id?: string | null;
          title: string;
          body: string;
          data?: Record<string, any>;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          actor_id?: string | null;
          reference_id?: string | null;
          title?: string;
          body?: string;
          data?: Record<string, any>;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          user_id: string;
          friend_requests: boolean;
          friend_accepted: boolean;
          follow_requests: boolean;
          new_followers: boolean;
          venue_shares: boolean;
          group_outing_invites: boolean;
          group_outing_reminders: boolean;
          collection_follows: boolean;
          collection_updates: boolean;
          activity_likes: boolean;
          activity_comments: boolean;
          friend_checkins_nearby: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          friend_requests?: boolean;
          friend_accepted?: boolean;
          follow_requests?: boolean;
          new_followers?: boolean;
          venue_shares?: boolean;
          group_outing_invites?: boolean;
          group_outing_reminders?: boolean;
          collection_follows?: boolean;
          collection_updates?: boolean;
          activity_likes?: boolean;
          activity_comments?: boolean;
          friend_checkins_nearby?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          friend_requests?: boolean;
          friend_accepted?: boolean;
          follow_requests?: boolean;
          new_followers?: boolean;
          venue_shares?: boolean;
          group_outing_invites?: boolean;
          group_outing_reminders?: boolean;
          collection_follows?: boolean;
          collection_updates?: boolean;
          activity_likes?: boolean;
          activity_comments?: boolean;
          friend_checkins_nearby?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      venue_contribution_counts: {
        Row: {
          venue_id: string;
          contribution_type: 'wait_times' | 'mood' | 'popular' | 'amenities';
          option_text: string;
          count: number;
          last_contributed: string;
        };
      };
    };
  };
}