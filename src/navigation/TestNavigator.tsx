import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';

// Import test screens
import TestHomeScreen from '../screens/TestHomeScreen';
import TestSearchScreen from '../screens/TestSearchScreen';

// Type definitions for test
export type TestStackParamList = {
  TestHome: undefined;
  TestSearch: undefined;
};

const TestStack = createNativeStackNavigator<TestStackParamList>();

// Simple Test Navigator - No tabs, just stack navigation
function TestNavigator() {
  const { theme } = useTheme();
  
  return (
    <NavigationContainer>
      <TestStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: true,
        }}
      >
        <TestStack.Screen 
          name="TestHome" 
          component={TestHomeScreen}
          options={{ title: 'Test Home Feed' }}
        />
        <TestStack.Screen 
          name="TestSearch" 
          component={TestSearchScreen}
          options={{ title: 'Test Search' }}
        />
      </TestStack.Navigator>
    </NavigationContainer>
  );
}

export default TestNavigator;