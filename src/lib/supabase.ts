import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your actual Supabase project credentials
// You'll get these after creating your Supabase project
const supabaseUrl = 'https://cznhaaigowjhqdjtfeyz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bmhhYWlnb3dqaHFkanRmZXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjQ1NDcsImV4cCI6MjA4MzA0MDU0N30.UMOiS197aGaVsl92UPxwArgUE7iiuEsgVlefKawfD8g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
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
    };
  };
}