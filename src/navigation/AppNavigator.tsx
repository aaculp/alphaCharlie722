import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Import screens
import { HomeScreen, SearchScreen, VenueDetailScreen, SettingsScreen, SplashScreen } from '../screens';
import AuthScreen from '../screens/AuthScreen';

// Type definitions
export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeList: undefined;
  VenueDetail: { venueId: string; venueName: string };
};

export type SearchStackParamList = {
  SearchList: undefined;
  VenueDetail: { venueId: string; venueName: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

// Loading component
const LoadingScreen = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

// Home Stack Navigator
function HomeStackNavigator() {
  const { theme } = useTheme();
  
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'Poppins-SemiBold', // Primary font for headings
        },
        headerShadowVisible: true,
      }}
    >
      <HomeStack.Screen 
        name="HomeList" 
        component={HomeScreen}
        options={{ title: 'Feed' }}
      />
      <HomeStack.Screen 
        name="VenueDetail" 
        component={VenueDetailScreen}
        options={({ route }) => ({ title: route.params.venueName })}
      />
    </HomeStack.Navigator>
  );
}

// Search Stack Navigator
function SearchStackNavigator() {
  const { theme } = useTheme();
  
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'Poppins-SemiBold', // Primary font for headings
        },
        headerShadowVisible: true,
      }}
    >
      <SearchStack.Screen 
        name="SearchList" 
        component={SearchScreen}
        options={{ title: 'Search Venues' }}
      />
      <SearchStack.Screen 
        name="VenueDetail" 
        component={VenueDetailScreen}
        options={({ route }) => ({ title: route.params.venueName })}
      />
    </SearchStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          // Force tab bar to bottom edge
          paddingBottom: 0,
          marginBottom: 0,
          height: 60, // Fixed height
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium', // Secondary font for UI elements
          fontSize: 12,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{ title: 'Feed' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchStackNavigator}
        options={{ title: 'Search' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator with Authentication
function AppNavigator() {
  const { session, loading, initializing, user } = useAuth();

  console.log('🧭 AppNavigator render:', { 
    hasSession: !!session, 
    loading, 
    initializing,
    userId: user?.id,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  // Show splash screen while initializing
  if (initializing) {
    console.log('🎬 AppNavigator: Showing splash screen (initializing)');
    return <SplashScreen />;
  }

  // Show loading for auth operations
  if (loading) {
    console.log('⏳ AppNavigator: Showing loading screen (auth operation)');
    return <LoadingScreen />;
  }

  const shouldShowMainApp = !!session;
  console.log('🎯 AppNavigator: Navigation decision:', {
    shouldShowMainApp,
    component: shouldShowMainApp ? 'MainTabNavigator' : 'AuthScreen'
  });

  // Return navigator without NavigationContainer (now handled in App.tsx)
  return shouldShowMainApp ? <MainTabNavigator /> : <AuthScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;