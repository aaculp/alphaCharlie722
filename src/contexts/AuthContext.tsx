import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ user: User | null; session: Session | null; autoSignedIn?: boolean; needsManualLogin?: boolean; }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initialize auth state with minimum splash screen duration
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Record start time for minimum splash duration
        const startTime = Date.now();
        const MINIMUM_SPLASH_DURATION = 5000; // 5 seconds
        
        // Add a small delay to ensure AsyncStorage is ready
        await new Promise<void>(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          throw error;
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
    loading,
    initializing,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};