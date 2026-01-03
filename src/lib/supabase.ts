import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// You'll get these after creating your Supabase project
const supabaseUrl = 'https://cznhaaigowjhqdjtfeyz.supabase.co';
const supabaseAnonKey = 'sb_publishable_MNXDPxE0icnZqdljoipuLQ_FgUtWGIK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
    };
  };
}