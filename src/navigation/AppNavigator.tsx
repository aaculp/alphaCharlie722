import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import FloatingTabBar from '../components/FloatingTabBar';

// Import screens
import { HomeScreen, SearchScreen, VenueDetailScreen, SettingsScreen, SplashScreen, FavoritesScreen, QuickPicksScreen } from '../screens';
import AuthScreen from '../screens/AuthScreen';

// Type definitions
export type RootTabParamList = {
  Home: undefined;
  QuickPicks: undefined;
  Search: undefined;
  Settings: undefined;
};

export type SettingsStackParamList = {
  SettingsList: undefined;
  Favorites: undefined;
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
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

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
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <HomeStack.Screen 
        name="HomeList" 
        component={HomeScreen}
      />
      <HomeStack.Screen 
        name="VenueDetail" 
        component={VenueDetailScreen}
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
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <SearchStack.Screen 
        name="SearchList" 
        component={SearchScreen}
      />
      <SearchStack.Screen 
        name="VenueDetail" 
        component={VenueDetailScreen}
      />
    </SearchStack.Navigator>
  );
}

// Settings Stack Navigator
function SettingsStackNavigator() {
  const { theme } = useTheme();
  
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <SettingsStack.Screen 
        name="SettingsList" 
        component={SettingsScreen}
      />
      <SettingsStack.Screen 
        name="Favorites" 
        component={FavoritesScreen}
      />
    </SettingsStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          display: 'none',
          height: 0,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: 'transparent',
          position: 'absolute',
          bottom: -200,
          opacity: 0,
        },
        tabBarBackground: () => null,
        tabBarShowLabel: false,
        tabBarItemStyle: { display: 'none' },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{ title: 'Feed' }}
      />
      <Tab.Screen 
        name="QuickPicks" 
        component={QuickPicksScreen}
        options={{ title: 'Quick Picks' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchStackNavigator}
        options={{ title: 'Search' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStackNavigator}
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