import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigationStyle } from '../contexts/NavigationStyleContext';
import { useNotifications } from '../contexts/NotificationContext';
import { NewFloatingTabBar, AnimatedTabBar } from '../components/navigation';
import { FriendRequestModal } from '../components/social';
import type {
  RootTabParamList,
  SettingsStackParamList,
  HomeStackParamList,
  SearchStackParamList,
} from '../types';
import type { SocialNotification } from '../types/social.types';

// Import screens
import { HomeScreen, SearchScreen, VenueDetailScreen, SettingsScreen, FavoritesScreen, ProfileScreen } from '../screens/customer';
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
      <SettingsStack.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </SettingsStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const { navigationStyle } = useNavigationStyle();
  const { setNotificationPressHandler } = useNotifications();
  const [friendRequestModalVisible, setFriendRequestModalVisible] = useState(false);
  const navigationRef = React.useRef<any>(null);

  // Set up notification tap handler
  useEffect(() => {
    const handleNotificationTap = (notification: SocialNotification) => {
      console.log('🔔 Handling notification tap:', notification.type);

      switch (notification.type) {
        case 'friend_request':
          // Show friend request modal
          setFriendRequestModalVisible(true);
          break;

        case 'friend_accepted':
          // Navigate to friends list (Settings screen for now)
          if (navigationRef.current) {
            navigationRef.current.navigate('Settings');
          }
          break;

        case 'venue_share':
          // Navigate to venue detail screen
          const venueId = notification.data?.venue_id;
          const venueName = notification.data?.venue_name || 'Venue';
          if (venueId && navigationRef.current) {
            navigationRef.current.navigate('Home', {
              screen: 'VenueDetail',
              params: { venueId, venueName },
            });
          }
          break;

        default:
          console.log('Unhandled notification type:', notification.type);
      }
    };

    setNotificationPressHandler(handleNotificationTap);
  }, [setNotificationPressHandler]);

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'Feed';
      case 'Search':
        return 'Search';
      case 'Profile':
        return 'Profile';
      case 'Settings':
        return 'Settings';
      default:
        return routeName;
    }
  };

  if (navigationStyle === 'floating') {
    // Floating Tab Bar (current implementation)
    return (
      <>
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
            name="Search"
            component={SearchStackNavigator}
            options={{ title: 'Search' }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsStackNavigator}
            options={{ title: 'Settings' }}
          />
        </Tab.Navigator>

        {/* Friend Request Modal */}
        <FriendRequestModal
          visible={friendRequestModalVisible}
          onClose={() => setFriendRequestModalVisible(false)}
        />
      </>
    );
  } else {
    // Regular Tab Bar with Reanimated 3 animations
    return (
      <>
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
            name="Search"
            component={SearchStackNavigator}
            options={{ title: getTabLabel('Search') }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: getTabLabel('Profile') }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsStackNavigator}
            options={{ title: getTabLabel('Settings') }}
          />
        </Tab.Navigator>

        {/* Friend Request Modal */}
        <FriendRequestModal
          visible={friendRequestModalVisible}
          onClose={() => setFriendRequestModalVisible(false)}
        />
      </>
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
  // return <VenueDashboardScreen />
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