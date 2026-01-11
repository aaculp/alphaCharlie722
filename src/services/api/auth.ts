import { supabase } from '../../lib/supabase';
import type { Profile, ProfileInsert } from '../../types';

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, name?: string) {
    console.log('🚀 Starting signup process...');
    
    // First, try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        },
      },
    });

    if (signUpError) {
      console.error('❌ Signup failed:', signUpError);
      throw new Error(`Sign up failed: ${signUpError.message}`);
    }

    console.log('📝 Signup response:', { 
      userId: signUpData.user?.id, 
      hasSession: !!signUpData.session,
      emailConfirmed: signUpData.user?.email_confirmed_at,
      userConfirmed: signUpData.user?.confirmed_at
    });

    // Create profile first
    if (signUpData.user) {
      try {
        await this.createProfile({
          id: signUpData.user.id,
          email: signUpData.user.email!,
          name: name || null,
        });
        console.log('✅ Profile created successfully');
      } catch (profileError) {
        console.log('⚠️ Profile creation failed:', profileError);
      }
    }

    // If we already have a session, we're good to go
    if (signUpData.session && signUpData.user) {
      console.log('✅ User automatically signed in after signup');
      return { 
        ...signUpData, 
        autoSignedIn: true 
      };
    }

    // If no session, the user was created but needs to sign in
    // We'll let the UI handle the sign-in process
    console.log('✅ Account created, manual login required');
    return { 
      user: signUpData.user, 
      session: null, 
      autoSignedIn: false,
      needsManualLogin: true 
    };
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    return data;
  }

  // Sign out
  static async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  // Get current session
  static async getCurrentSession() {
    console.log('🔍 AuthService: Getting current session...');
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ AuthService: Failed to get session:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    console.log('📋 AuthService: Session result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      expiresAt: session?.expires_at,
      isExpired: session?.expires_at ? new Date(session.expires_at * 1000) < new Date() : 'N/A'
    });

    return session;
  }

  // Get current user
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return user;
  }

  // Create user profile
  static async createProfile(profile: ProfileInsert) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return data;
  }

  // Get user profile
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    return data;
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data;
  }

  // Reset password
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'your-app://reset-password',
    });

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}