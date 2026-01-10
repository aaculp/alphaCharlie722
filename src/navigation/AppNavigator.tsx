import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigationStyle } from '../contexts/NavigationStyleContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import NewFloatingTabBar from '../components/NewFloatingTabBar';
import AnimatedTabBar from '../components/AnimatedTabBar';
import VenueNavigator from './VenueNavigator';

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
  const { theme, isDark } = useTheme();
  const { navigationStyle } = useNavigationStyle();
  
  const getTabIcon = (routeName: string, focused: boolean) => {
    let iconName: string;
    
    switch (routeName) {
      case 'Home':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'QuickPicks':
        iconName = focused ? 'walk' : 'walk-outline';
        break;
      case 'Search':
        iconName = focused ? 'search' : 'search-outline';
        break;
      case 'Settings':
        iconName = focused ? 'settings' : 'settings-outline';
        break;
      default:
        iconName = 'help-outline';
    }
    
    return iconName;
  };

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

  // TEMPORARY: Always show venue interface for testing
  // TODO: Remove this and uncomment the proper logic below
  console.log('🏢 TEMPORARY: Always showing Venue Dashboard for testing');
  return <VenueNavigator />;

  /* COMMENTED OUT FOR TESTING - UNCOMMENT WHEN READY
  const shouldShowMainApp = !!session;
  console.log('🎯 AppNavigator: Navigation decision:', {
    shouldShowMainApp,
    userType,
    component: shouldShowMainApp 
      ? (userType === 'venue_owner' ? 'VenueNavigator' : 'MainTabNavigator')
      : 'AuthScreen'
  });

  // Return appropriate navigator based on user type
  if (!shouldShowMainApp) {
    return <AuthScreen />;
  }

  // Route to different UIs based on user type
  if (userType === 'venue_owner') {
    console.log('🏢 Routing to Venue Dashboard');
    return <VenueNavigator />;
  } else {
    console.log('👤 Routing to Customer App');
    return <MainTabNavigator />;
  }
  */
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;