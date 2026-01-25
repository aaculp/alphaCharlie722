/**
 * Main App - Full navigation with SafeAreaView fix for white bar
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { GridLayoutProvider } from './src/contexts/GridLayoutContext';
import { NavigationStyleProvider } from './src/contexts/NavigationStyleContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { TokenCleanupScheduler } from './src/services/TokenCleanupScheduler';
import { queryClient, setupQueryPersistence } from './src/lib/queryClient';
import { setupRealtimeSync } from './src/lib/realtimeSync';
import { setupNavigationSync } from './src/lib/navigationSync';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isLoading, theme, isDark } = useTheme();
  const systemColorScheme = useColorScheme();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Configure deep linking
  const linking = {
    prefixes: ['otw://', 'https://ontheway.app'],
    config: {
      screens: {
        Home: 'home',
        Search: 'search',
        Profile: 'profile',
      },
    },
  };

  // Set up navigation sync with React Query
  useEffect(() => {
    // Wait for navigation ref to be ready
    if (!navigationRef.current) {
      return;
    }

    const cleanup = setupNavigationSync({
      queryClient,
      navigationRef,
    });

    return cleanup;
  }, []);

  // Show a simple loading view while theme is loading
  // Use system color scheme to avoid black flicker
  if (isLoading) {
    const loadingBg = systemColorScheme === 'dark' ? '#000000' : '#f5f5f5';
    const statusBarStyle = systemColorScheme === 'dark' ? 'light-content' : 'dark-content';
    
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: loadingBg }]}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={loadingBg} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <NavigationContainer ref={navigationRef} linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
}

function App() {
  // Set up cache persistence on app launch
  useEffect(() => {
    setupQueryPersistence().catch((error) => {
      console.error('Failed to restore query cache:', error);
    });
  }, []);

  // Start token cleanup scheduler on app launch
  useEffect(() => {
    TokenCleanupScheduler.start();
    
    return () => {
      TokenCleanupScheduler.stop();
    };
  }, []);

  // Set up real-time sync for React Query cache invalidation
  useEffect(() => {
    const cleanup = setupRealtimeSync(queryClient);
    
    return cleanup; // Cleanup on unmount
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <GridLayoutProvider>
              <NavigationStyleProvider>
                <LocationProvider>
                  <AuthProvider>
                    <NotificationProvider>
                      <AppContent />
                    </NotificationProvider>
                  </AuthProvider>
                </LocationProvider>
              </NavigationStyleProvider>
            </GridLayoutProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
});

export default App;