/**
 * Test App - Simple stack navigation to debug white bar issue
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import TestNavigator from './src/navigation/TestNavigator';

function AppContent() {
  const { isLoading } = useTheme();

  // Show loading while theme is loading
  if (isLoading) {
    return null;
  }

  return <TestNavigator />;
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;