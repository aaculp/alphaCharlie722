import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { VenueBusinessService } from '../services/venueBusinessService';
import { FCMTokenService } from '../services/FCMTokenService';
import { DeviceTokenManager } from '../services/DeviceTokenManager';
import { NotificationPreferencesService } from '../services/api/notificationPreferences';
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
        console.log('🔄 Setting userType to: venue_owner');
        setUserType('venue_owner');
        setVenueBusinessAccount(businessAccount);
        console.log('✅ UserType state updated to venue_owner');
      } else {
        console.log('👤 User is a regular customer');
        console.log('🔄 Setting userType to: customer');
        setUserType('customer');
        setVenueBusinessAccount(null);
        console.log('✅ UserType state updated to customer');
      }
    } catch (error) {
      console.error('❌ Error determining user type:', error);
      // Default to customer if we can't determine
      console.log('🔄 Setting userType to: customer (error fallback)');
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
    let authListenerReady = false;

    // Listen for auth changes FIRST (before trying to get session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        console.log('🔔 Auth state changed:', {
          event,
          hasSession: !!authSession,
          userId: authSession?.user?.id,
          userEmail: authSession?.user?.email,
          accessToken: authSession?.access_token ? 'present' : 'missing',
          refreshToken: authSession?.refresh_token ? 'present' : 'missing'
        });
        
        authListenerReady = true;
        
        if (mounted) {
          setSession(authSession);
          setUser(authSession?.user ?? null);
          setLoading(false);
          
          // DO NOT call determineUserType here - it causes queries to hang!
          // We'll determine user type after initialization completes
          if (!authSession?.user?.id) {
            setUserType(null);
            setVenueBusinessAccount(null);
            // Remove token refresh listener on sign out
            FCMTokenService.removeTokenRefreshListener();
          } else {
            // User signed in - set up FCM token
            try {
              await FCMTokenService.initialize();
              await FCMTokenService.generateAndStoreToken(authSession.user.id);
              FCMTokenService.setupTokenRefreshListener(authSession.user.id);
            } catch (error) {
              console.error('❌ Error setting up FCM token:', error);
              // Don't block auth flow if FCM setup fails
            }
          }
        }
      }
    );

    // Initialize auth state with minimum splash screen duration
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Test AsyncStorage first
        try {
          await AsyncStorage.setItem('@test_key', 'test_value');
          const testValue = await AsyncStorage.getItem('@test_key');
          console.log('✅ AsyncStorage test:', testValue === 'test_value' ? 'WORKING' : 'FAILED');
          await AsyncStorage.removeItem('@test_key');
        } catch (storageError) {
          console.error('❌ AsyncStorage test failed:', storageError);
        }
        
        // Check what's in AsyncStorage for Supabase
        try {
          const keys = await AsyncStorage.getAllKeys();
          const supabaseKeys = keys.filter((key: string) => key.includes('supabase'));
          console.log('🔑 Supabase keys in AsyncStorage:', supabaseKeys);
          
          if (supabaseKeys.length > 0) {
            for (const key of supabaseKeys) {
              const value = await AsyncStorage.getItem(key);
              console.log(`📦 ${key}:`, value ? 'exists (length: ' + value.length + ')' : 'null');
            }
            console.log('✅ Session data found in storage - auth listener will restore it');
          } else {
            console.log('ℹ️ No Supabase keys found in AsyncStorage - user needs to log in');
          }
        } catch (storageError) {
          console.error('❌ Error checking AsyncStorage keys:', storageError);
        }
        
        // Record start time for minimum splash duration
        const startTime = Date.now();
        const MINIMUM_SPLASH_DURATION = 2000; // 2 seconds
        const MAX_WAIT_FOR_LISTENER = 3000; // Wait up to 3 seconds for auth listener
        
        // Wait for auth listener to fire (if there's a stored session)
        console.log('⏳ Waiting for auth listener to restore session...');
        const listenerStart = Date.now();
        while (!authListenerReady && (Date.now() - listenerStart) < MAX_WAIT_FOR_LISTENER) {
          await new Promise<void>(resolve => setTimeout(resolve, 100));
        }
        
        if (authListenerReady) {
          console.log('✅ Auth listener fired');
          
          // Check if we actually have a valid session
          // If getSession() hangs or returns no session, we'll timeout and show login
          console.log('⏳ Verifying session is valid...');
          
          let hasValidSession = false;
          try {
            const sessionCheckPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session check timeout')), 2000)
            );
            
            const { data: { session: currentSession } } = await Promise.race([
              sessionCheckPromise,
              timeoutPromise
            ]) as any;
            
            if (currentSession?.access_token) {
              console.log('✅ Valid session confirmed');
              hasValidSession = true;
            } else {
              console.log('⚠️ No valid session found');
            }
          } catch (error) {
            console.warn('⚠️ Session verification failed:', error);
          }
          
          // If no valid session, clear the auth state so user sees login screen
          if (!hasValidSession && mounted) {
            console.log('🔄 Clearing invalid session, user will need to log in');
            setSession(null);
            setUser(null);
            setUserType(null);
            setVenueBusinessAccount(null);
          } else if (hasValidSession && mounted) {
            // Determine user type AFTER auth listener completes (not inside the callback)
            // Use currentSession from the getSession call, not the state variable
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession?.user?.id) {
              console.log('🔍 Determining user type after initialization...');
              await determineUserType(currentSession.user.id);
            } else {
              console.warn('⚠️ No user ID found in session after initialization');
            }
          }
        } else {
          console.log('ℹ️ No session to restore - user needs to log in');
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔐 Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(`Sign in failed: ${error.message}`);
      }

      console.log('✅ Sign in successful:', {
        hasSession: !!data.session,
        userId: data.user?.id,
        accessToken: data.session?.access_token ? 'present' : 'missing'
      });

      // Determine user type after successful sign in
      if (data.user?.id) {
        console.log('🔍 Determining user type after sign in...');
        await determineUserType(data.user.id);
      }

      // Check if session was persisted
      setTimeout(async () => {
        const keys = await AsyncStorage.getAllKeys();
        const supabaseKeys = keys.filter((key: string) => key.includes('supabase'));
        console.log('🔑 Supabase keys after sign in:', supabaseKeys);
      }, 1000);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
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

        // Create default notification preferences (Requirement 12.2)
        try {
          await NotificationPreferencesService.createDefaultPreferences(signUpData.user.id);
          console.log('✅ Default notification preferences created for new user');
        } catch (preferencesError) {
          console.log('⚠️ Notification preferences creation failed:', preferencesError);
          // Don't block signup if preferences creation fails
        }
      }

      return signUpData;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 Sign out initiated...');
    setLoading(true);
    try {
      // Get current FCM token before signing out
      const currentToken = await FCMTokenService.getCurrentToken();
      
      // Deactivate the current device token in the database
      if (currentToken) {
        try {
          await DeviceTokenManager.deactivateToken(currentToken);
          console.log('✅ Device token deactivated');
        } catch (error) {
          console.error('❌ Error deactivating device token:', error);
          // Don't block sign out if token deactivation fails
        }
      }
      
      // Remove token refresh listener
      FCMTokenService.removeTokenRefreshListener();
      
      // Delete FCM token from device
      try {
        await FCMTokenService.deleteToken();
      } catch (error) {
        console.error('❌ Error deleting FCM token:', error);
        // Don't block sign out if token deletion fails
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw new Error(`Sign out failed: ${error.message}`);
      }
      
      console.log('✅ Supabase sign out successful');
      
      // Clear user type data on sign out
      setUserType(null);
      setVenueBusinessAccount(null);
      
      // Verify session is cleared from AsyncStorage
      try {
        const keys = await AsyncStorage.getAllKeys();
        const supabaseKeys = keys.filter((key: string) => key.includes('supabase'));
        console.log('🔑 Supabase keys after sign out:', supabaseKeys);
        
        if (supabaseKeys.length > 0) {
          console.warn('⚠️ Supabase keys still exist after sign out - manually clearing');
          for (const key of supabaseKeys) {
            await AsyncStorage.removeItem(key);
            console.log(`🗑️ Removed key: ${key}`);
          }
        } else {
          console.log('✅ All Supabase keys cleared from AsyncStorage');
        }
      } catch (storageError) {
        console.error('❌ Error checking/clearing AsyncStorage:', storageError);
      }
      
      console.log('✅ Sign out complete');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
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