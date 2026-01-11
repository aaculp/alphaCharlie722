import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { VenueBusinessService } from '../services/venueBusinessService';
import type { UserType } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: UserType | null;
  venueBusinessAccount: any | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ user: User | null; session: Session | null; autoSignedIn?: boolean; needsManualLogin?: boolean; }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserType: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [venueBusinessAccount, setVenueBusinessAccount] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Function to determine user type
  const determineUserType = async (userId: string) => {
    try {
      console.log('🔍 Determining user type for:', userId);
      
      // Check if user has a venue business account
      const businessAccount = await VenueBusinessService.getBusinessAccount(userId);
      
      if (businessAccount) {
        console.log('🏢 User is a venue owner:', businessAccount);
        setUserType('venue_owner');
        setVenueBusinessAccount(businessAccount);
      } else {
        console.log('👤 User is a regular customer');
        setUserType('customer');
        setVenueBusinessAccount(null);
      }
    } catch (error) {
      console.error('❌ Error determining user type:', error);
      // Default to customer if we can't determine
      setUserType('customer');
      setVenueBusinessAccount(null);
    }
  };

  const refreshUserType = async () => {
    if (user?.id) {
      await determineUserType(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize auth state with minimum splash screen duration
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Record start time for minimum splash duration
        const startTime = Date.now();
        const MINIMUM_SPLASH_DURATION = 5000; // 5 seconds
        const MAXIMUM_INIT_DURATION = 10000; // 10 seconds max
        
        // Add a small delay to ensure AsyncStorage is ready
        await new Promise<void>(resolve => setTimeout(resolve, 100));
        
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), MAXIMUM_INIT_DURATION);
        });
        
        // Race between getting session and timeout
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]).catch((err) => {
          console.warn('⚠️ Auth initialization timed out or failed:', err);
          return { data: { session: null }, error: err };
        });
        
        if (error && error.message !== 'Auth initialization timeout') {
          console.error('❌ Error getting session:', error);
        }
        
        if (mounted) {
          console.log('📱 Initial session check:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            expiresAt: session?.expires_at,
            accessToken: session?.access_token ? 'present' : 'missing',
            isExpired: session?.expires_at ? new Date(session.expires_at * 1000) < new Date() : 'N/A'
          });
          setSession(session);
          setUser(session?.user ?? null);
          
          // Determine user type if we have a user
          if (session?.user?.id) {
            await determineUserType(session.user.id);
          }
        }

        // Ensure minimum splash screen duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MINIMUM_SPLASH_DURATION - elapsedTime);
        
        if (remainingTime > 0) {
          console.log(`⏱️ Showing splash screen for ${remainingTime}ms more to reach minimum duration`);
          await new Promise<void>(resolve => setTimeout(resolve, remainingTime));
        }
        
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserType(null);
          setVenueBusinessAccount(null);
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete - hiding splash screen');
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Determine user type when auth state changes
          if (session?.user?.id) {
            await determineUserType(session.user.id);
          } else {
            setUserType(null);
            setVenueBusinessAccount(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(`Sign in failed: ${error.message}`);
      }

      // User type will be determined by the auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
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
        throw new Error(`Sign up failed: ${signUpError.message}`);
      }

      // Create profile if user was created
      if (signUpData.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              email: signUpData.user.email!,
              name: name || null,
            });
          
          if (profileError) {
            console.log('⚠️ Profile creation failed:', profileError);
          }
        } catch (profileError) {
          console.log('⚠️ Profile creation failed:', profileError);
        }
      }

      return signUpData;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(`Sign out failed: ${error.message}`);
      }
      
      // Clear user type data on sign out
      setUserType(null);
      setVenueBusinessAccount(null);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'your-app://reset-password',
    });

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    userType,
    venueBusinessAccount,
    loading,
    initializing,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUserType,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};