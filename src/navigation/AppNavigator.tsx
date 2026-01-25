import React, { useEffect, useState, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getMessaging, onNotificationOpenedApp, getInitialNotification, onMessage } from '@react-native-firebase/messaging';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigationStyle } from '../contexts/NavigationStyleContext';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationHandler } from '../services/NotificationHandler';
import { NewFloatingTabBar, AnimatedTabBar } from '../components/navigation';
import { FriendRequestModal } from '../components/social';
import { FlashOfferNotificationBanner } from '../components/flashOffer';
import type {
  RootTabParamList,
  ProfileStackParamList,
  SettingsStackParamList,
  HomeStackParamList,
  SearchStackParamList,
  FavoritesStackParamList,
  HistoryStackParamList,
  VenueStackParamList,
} from '../types';
import type { SocialNotification } from '../types/social.types';

// Import screens
import { HomeScreen, SearchScreen, VenueDetailScreen, SettingsScreen, FavoritesScreen, ProfileScreen, FlashOfferDetailScreen, ClaimConfirmationScreen, HistoryScreen } from '../screens/customer';
import VenueReviewsScreen from '../screens/customer/VenueReviewsScreen';
import MyClaimsScreen from '../screens/customer/MyClaimsScreen';
import ClaimDetailScreen from '../screens/customer/ClaimDetailScreen';
import NotificationSettingsScreen from '../screens/customer/NotificationSettingsScreen';
import FlashOffersHelpScreen from '../screens/customer/FlashOffersHelpScreen';
import { SplashScreen, AuthScreen } from '../screens/auth';
import { VenueDashboardScreen, FlashOfferListScreen, FlashOfferDetailScreen as VenueFlashOfferDetailScreen, TokenRedemptionScreen } from '../screens/venue';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const VenueStack = createNativeStackNavigator<VenueStackParamList>();

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
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <HomeStack.Screen
        name="HomeList"
        component={HomeScreen}
        options={{
          animation: 'fade',
        }}
      />
      <HomeStack.Screen
        name="VenueDetail"
        component={VenueDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <HomeStack.Screen
        name="VenueReviews"
        component={VenueReviewsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <HomeStack.Screen
        name="FlashOfferDetail"
        component={FlashOfferDetailScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <HomeStack.Screen
        name="ClaimConfirmation"
        component={ClaimConfirmationScreen}
        options={{
          animation: 'fade_from_bottom',
          presentation: 'modal',
        }}
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
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <SearchStack.Screen
        name="SearchList"
        component={SearchScreen}
        options={{
          animation: 'fade',
        }}
      />
      <SearchStack.Screen
        name="VenueDetail"
        component={VenueDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <SearchStack.Screen
        name="UserProfile"
        component={ProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </SearchStack.Navigator>
  );
}

// Favorites Stack Navigator
function FavoritesStackNavigator() {
  const { theme } = useTheme();

  return (
    <FavoritesStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <FavoritesStack.Screen
        name="FavoritesList"
        component={FavoritesScreen}
        options={{
          animation: 'fade',
        }}
      />
      <FavoritesStack.Screen
        name="VenueDetail"
        component={VenueDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </FavoritesStack.Navigator>
  );
}

// History Stack Navigator
function HistoryStackNavigator() {
  const { theme } = useTheme();

  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <HistoryStack.Screen
        name="HistoryList"
        component={HistoryScreen}
        options={{
          animation: 'fade',
        }}
      />
      <HistoryStack.Screen
        name="VenueDetail"
        component={VenueDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </HistoryStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileStackNavigator() {
  const { theme } = useTheme();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsStackNavigator}
      />
      <ProfileStack.Screen
        name="Favorites"
        component={FavoritesScreen}
      />
    </ProfileStack.Navigator>
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
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <SettingsStack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{
          animation: 'fade',
        }}
      />
      <SettingsStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <SettingsStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <SettingsStack.Screen
        name="MyClaims"
        component={MyClaimsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <SettingsStack.Screen
        name="ClaimDetail"
        component={ClaimDetailScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <SettingsStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <SettingsStack.Screen
        name="FlashOffersHelp"
        component={FlashOffersHelpScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </SettingsStack.Navigator>
  );
}

// Venue Stack Navigator
function VenueStackNavigator() {
  const { theme } = useTheme();

  return (
    <VenueStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <VenueStack.Screen
        name="VenueDashboard"
        component={VenueDashboardScreen}
        options={{
          animation: 'fade',
        }}
      />
      <VenueStack.Screen
        name="FlashOfferList"
        component={FlashOfferListScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <VenueStack.Screen
        name="FlashOfferDetail"
        component={VenueFlashOfferDetailScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <VenueStack.Screen
        name="TokenRedemption"
        component={TokenRedemptionScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </VenueStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const { navigationStyle } = useNavigationStyle();
  const { setNotificationPressHandler } = useNotifications();
  const [friendRequestModalVisible, setFriendRequestModalVisible] = useState(false);
  const [flashOfferBannerVisible, setFlashOfferBannerVisible] = useState(false);
  const [flashOfferBannerData, setFlashOfferBannerData] = useState<{
    title: string;
    body: string;
    offerId: string;
    venueName: string;
  } | null>(null);
  const navigationRef = useRef<any>(null);

  // Set up notification tap handler for in-app notifications
  useEffect(() => {
    const handleNotificationTap = (notification: SocialNotification) => {
      console.log('🔔 Handling in-app notification tap:', notification.type);

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

  // Set up push notification tap handler
  useEffect(() => {
    console.log('🔔 Setting up push notification tap handler');

    // Register navigation handler with NotificationHandler
    NotificationHandler.setNavigationHandler((screen: string, params?: Record<string, any>) => {
      console.log('🧭 Navigating to:', screen, params);

      if (!navigationRef.current) {
        console.warn('⚠️ Navigation ref not available');
        return;
      }

      // Handle different navigation targets
      switch (screen) {
        case 'FriendRequests':
          setFriendRequestModalVisible(true);
          break;

        case 'Settings':
          navigationRef.current.navigate('Settings');
          break;

        case 'Profile':
          if (params?.userId) {
            // TODO: Navigate to user profile screen when implemented
            console.log('Navigate to user profile:', params.userId);
            navigationRef.current.navigate('Profile');
          } else {
            navigationRef.current.navigate('Profile');
          }
          break;

        case 'VenueDetail':
          if (params?.venueId) {
            navigationRef.current.navigate('Home', {
              screen: 'VenueDetail',
              params: {
                venueId: params.venueId,
                venueName: params.venueName || 'Venue',
              },
            });
          }
          break;

        case 'FlashOfferDetail':
          if (params?.offerId) {
            navigationRef.current.navigate('Home', {
              screen: 'FlashOfferDetail',
              params: {
                offerId: params.offerId,
                venueName: params.venueName || 'Venue',
              },
            });
          }
          break;

        case 'Home':
        default:
          navigationRef.current.navigate('Home');
          break;
      }
    });

    // Listen for notification taps when app is in background/closed
    const unsubscribe = onNotificationOpenedApp(getMessaging(), (remoteMessage) => {
      console.log('🔔 Notification opened app (background):', remoteMessage);
      NotificationHandler.handleNotificationTap(remoteMessage);
    });

    // Check if app was opened from a notification (killed state)
    getInitialNotification(getMessaging())
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('🔔 Notification opened app (killed):', remoteMessage);
          NotificationHandler.handleNotificationTap(remoteMessage);
        }
      });

    // Listen for foreground notifications
    const foregroundUnsubscribe = onMessage(getMessaging(), (remoteMessage) => {
      console.log('📬 Foreground notification received:', remoteMessage);
      
      // Handle flash offer notifications with in-app banner
      if (remoteMessage.data?.type === 'flash_offer') {
        const title = remoteMessage.notification?.title || 'Flash Offer';
        const body = remoteMessage.notification?.body || '';
        const offerId = remoteMessage.data.offer_id as string;
        const venueName = remoteMessage.data.venue_name as string;

        setFlashOfferBannerData({
          title,
          body,
          offerId,
          venueName,
        });
        setFlashOfferBannerVisible(true);
      }
      
      // Handle other notification types
      NotificationHandler.handleForegroundNotification(remoteMessage);
    });

    return () => {
      unsubscribe();
      foregroundUnsubscribe();
    };
  }, []);

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'Feed';
      case 'Search':
        return 'Search';
      case 'Favorites':
        return 'Favorites';
      case 'History':
        return 'History';
      case 'Profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  const handleFlashOfferBannerPress = () => {
    if (flashOfferBannerData && navigationRef.current) {
      navigationRef.current.navigate('Home', {
        screen: 'FlashOfferDetail',
        params: {
          offerId: flashOfferBannerData.offerId,
          venueName: flashOfferBannerData.venueName,
        },
      });
    }
  };

  const handleFlashOfferBannerDismiss = () => {
    setFlashOfferBannerVisible(false);
    setFlashOfferBannerData(null);
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
            name="Favorites"
            component={FavoritesStackNavigator}
            options={{ title: 'Favorites' }}
          />
          <Tab.Screen
            name="History"
            component={HistoryStackNavigator}
            options={{ title: 'History' }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileStackNavigator}
            options={{ title: 'Profile' }}
          />
        </Tab.Navigator>

        {/* Friend Request Modal */}
        <FriendRequestModal
          visible={friendRequestModalVisible}
          onClose={() => setFriendRequestModalVisible(false)}
        />

        {/* Flash Offer Notification Banner */}
        {flashOfferBannerData && (
          <FlashOfferNotificationBanner
            visible={flashOfferBannerVisible}
            title={flashOfferBannerData.title}
            body={flashOfferBannerData.body}
            onPress={handleFlashOfferBannerPress}
            onDismiss={handleFlashOfferBannerDismiss}
          />
        )}
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
            name="Favorites"
            component={FavoritesStackNavigator}
            options={{ title: getTabLabel('Favorites') }}
          />
          <Tab.Screen
            name="History"
            component={HistoryStackNavigator}
            options={{ title: getTabLabel('History') }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileStackNavigator}
            options={{ title: getTabLabel('Profile') }}
          />
        </Tab.Navigator>

        {/* Friend Request Modal */}
        <FriendRequestModal
          visible={friendRequestModalVisible}
          onClose={() => setFriendRequestModalVisible(false)}
        />

        {/* Flash Offer Notification Banner */}
        {flashOfferBannerData && (
          <FlashOfferNotificationBanner
            visible={flashOfferBannerVisible}
            title={flashOfferBannerData.title}
            body={flashOfferBannerData.body}
            onPress={handleFlashOfferBannerPress}
            onDismiss={handleFlashOfferBannerDismiss}
          />
        )}
      </>
    );
  }
}

// Main App Navigator with Authentication
function AppNavigator() {
  const { session, loading, initializing, user, userType } = useAuth();
  const [waitingForUserType, setWaitingForUserType] = useState(false);

  console.log('🧭 AppNavigator render:', {
    hasSession: !!session,
    loading,
    initializing,
    userId: user?.id,
    userEmail: user?.email,
    userType,
    waitingForUserType,
    timestamp: new Date().toISOString()
  });

  // Safety timeout: if we're stuck waiting for userType, default to customer after 5 seconds
  useEffect(() => {
    if (session && userType === null && !initializing) {
      console.log('⏱️ Starting safety timeout for userType determination');
      setWaitingForUserType(true);
      
      const timeout = setTimeout(() => {
        console.warn('⚠️ UserType determination timed out, defaulting to customer view');
        // The AuthContext should handle this, but if it doesn't, we'll proceed anyway
        setWaitingForUserType(false);
      }, 5000);

      return () => {
        clearTimeout(timeout);
        setWaitingForUserType(false);
      };
    } else {
      setWaitingForUserType(false);
    }
  }, [session, userType, initializing]);

  // Show splash screen while initializing
  if (initializing) {
    console.log('🎬 AppNavigator: Showing splash screen (initializing)');
    return <SplashScreen />;
  }

  // If we have a session but userType is still null, keep showing splash briefly
  // But only if we haven't exceeded the safety timeout
  if (session && userType === null && waitingForUserType) {
    console.log('🎬 AppNavigator: Showing splash screen (determining user type)');
    return <SplashScreen />;
  }

  // Determine which screen to show based on auth state
  const shouldShowMainApp = !!session;
  
  // If we have a session but no userType after timeout, default to customer
  const effectiveUserType = userType || 'customer';
  
  console.log('🎯 AppNavigator: Navigation decision:', {
    shouldShowMainApp,
    userType,
    effectiveUserType,
    component: shouldShowMainApp
      ? (effectiveUserType === 'venue_owner' ? 'VenueNavigator' : 'MainTabNavigator')
      : 'AuthScreen'
  });

  // Show auth screen if not logged in
  if (!shouldShowMainApp) {
    console.log('🔐 AppNavigator: Showing auth screen (no session)');
    return <AuthScreen />;
  }

  // Show venue dashboard for venue owners
  if (effectiveUserType === 'venue_owner') {
    console.log('🏢 AppNavigator: Showing venue dashboard (venue owner)');
    return <VenueStackNavigator />;
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