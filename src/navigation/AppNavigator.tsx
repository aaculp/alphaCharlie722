import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigationStyle } from '../contexts/NavigationStyleContext';
import { NewFloatingTabBar, AnimatedTabBar } from '../components/navigation';
import type {
  RootTabParamList,
  SettingsStackParamList,
  HomeStackParamList,
  SearchStackParamList,
} from '../types';

// Import screens
import { HomeScreen, SearchScreen, VenueDetailScreen, SettingsScreen, FavoritesScreen, QuickPicksScreen } from '../screens/customer';
import { SplashScreen, AuthScreen } from '../screens/auth';
import { VenueDashboardScreen } from '../screens/venue';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

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
  const { navigationStyle } = useNavigationStyle();

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'Feed';
      case 'QuickPicks':
        return 'Quick Picks';
      case 'Search':
        return 'Search';
      case 'Settings':
        return 'Settings';
      default:
        return routeName;
    }
  };

  if (navigationStyle === 'floating') {
    // Floating Tab Bar (current implementation)
    return (
      <Tab.Navigator
        tabBar={(props) => <NewFloatingTabBar {...props} />}
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
  } else {
    // Regular Tab Bar with Reanimated 3 animations
    return (
      <Tab.Navigator
        tabBar={(props) => <AnimatedTabBar {...props} />}
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
          options={{ title: getTabLabel('Home') }}
        />
        <Tab.Screen 
          name="QuickPicks" 
          component={QuickPicksScreen}
          options={{ title: getTabLabel('QuickPicks') }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchStackNavigator}
          options={{ title: getTabLabel('Search') }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsStackNavigator}
          options={{ title: getTabLabel('Settings') }}
        />
      </Tab.Navigator>
    );
  }
}

// Main App Navigator with Authentication
function AppNavigator() {
  const { session, loading, initializing, user, userType } = useAuth();

  console.log('🧭 AppNavigator render:', { 
    hasSession: !!session, 
    loading, 
    initializing,
    userId: user?.id,
    userEmail: user?.email,
    userType,
    timestamp: new Date().toISOString()
  });

  // Show splash screen while initializing
  if (initializing) {
    console.log('🎬 AppNavigator: Showing splash screen (initializing)');
    return <SplashScreen />;
  }

  // Determine which screen to show based on auth state
  const shouldShowMainApp = !!session;
  console.log('🎯 AppNavigator: Navigation decision:', {
    shouldShowMainApp,
    userType,
    component: shouldShowMainApp 
      ? (userType === 'venue_owner' ? 'VenueNavigator' : 'MainTabNavigator')
      : 'AuthScreen'
  });

  // Show auth screen if not logged in
  if (!shouldShowMainApp) {
    console.log('🔐 AppNavigator: Showing auth screen (no session)');
    return <AuthScreen />;
  }

  // Show venue dashboard for venue owners
  if (userType === 'venue_owner') {
    console.log('🏢 AppNavigator: Showing venue dashboard (venue owner)');
    return <VenueDashboardScreen />;
  }

  // Show main tab navigator for customers
  console.log('👤 AppNavigator: Showing main tab navigator (customer)');
  return <MainTabNavigator />;
}

// Unused styles - kept for potential future use
// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

export default AppNavigator;