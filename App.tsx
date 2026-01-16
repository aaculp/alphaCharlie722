/**
 * Main App - Full navigation with SafeAreaView fix for white bar
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { GridLayoutProvider } from './src/contexts/GridLayoutContext';
import { NavigationStyleProvider } from './src/contexts/NavigationStyleContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { TokenCleanupScheduler } from './src/services/TokenCleanupScheduler';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { isLoading, theme, isDark } = useTheme();
  const systemColorScheme = useColorScheme();

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
        backgroundColor={theme.colors.surface}
        translucent={false}
      />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
}

function App() {
  // Start token cleanup scheduler on app launch
  useEffect(() => {
    TokenCleanupScheduler.start();
    
    return () => {
      TokenCleanupScheduler.stop();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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