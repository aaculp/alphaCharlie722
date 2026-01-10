import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigationStyle } from '../contexts/NavigationStyleContext';
import NewFloatingTabBar from '../components/NewFloatingTabBar';
import AnimatedTabBar from '../components/AnimatedTabBar';

// Import venue-specific screens
import { 
  VenueDashboardScreen, 
  VenueProfileScreen, 
  VenueAnalyticsScreen, 
  VenueSettingsScreen 
} from '../screens';

// Type definitions for venue navigation
export type VenueTabParamList = {
  Dashboard: undefined;
  Profile: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type VenueDashboardStackParamList = {
  DashboardHome: undefined;
  EditProfile: undefined;
  ManageHours: undefined;
  ManagePhotos: undefined;
};

export type VenueProfileStackParamList = {
  ProfileHome: undefined;
  EditBasicInfo: undefined;
  ManageAmenities: undefined;
};

const VenueTab = createBottomTabNavigator<VenueTabParamList>();
const VenueDashboardStack = createNativeStackNavigator<VenueDashboardStackParamList>();
const VenueProfileStack = createNativeStackNavigator<VenueProfileStackParamList>();

// Dashboard Stack Navigator
function VenueDashboardStackNavigator() {
  const { theme } = useTheme();
  
  return (
    <VenueDashboardStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <VenueDashboardStack.Screen 
        name="DashboardHome" 
        component={VenueDashboardScreen}
      />
      <VenueDashboardStack.Screen 
        name="EditProfile" 
        component={VenueProfileScreen}
      />
    </VenueDashboardStack.Navigator>
  );
}

// Profile Stack Navigator
function VenueProfileStackNavigator() {
  const { theme } = useTheme();
  
  return (
    <VenueProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <VenueProfileStack.Screen 
        name="ProfileHome" 
        component={VenueProfileScreen}
      />
    </VenueProfileStack.Navigator>
  );
}

// Main Venue Tab Navigator
function VenueNavigator() {
  const { theme } = useTheme();
  const { navigationStyle } = useNavigationStyle();
  
  const getTabIcon = (routeName: string, focused: boolean) => {
    let iconName: string;
    
    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'speedometer' : 'speedometer-outline';
        break;
      case 'Profile':
        iconName = focused ? 'storefront' : 'storefront-outline';
        break;
      case 'Analytics':
        iconName = focused ? 'analytics' : 'analytics-outline';
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
      case 'Dashboard':
        return 'Dashboard';
      case 'Profile':
        return 'Profile';
      case 'Analytics':
        return 'Analytics';
      case 'Settings':
        return 'Settings';
      default:
        return routeName;
    }
  };

  if (navigationStyle === 'floating') {
    // Floating Tab Bar for venue owners
    return (
      <VenueTab.Navigator
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
        <VenueTab.Screen 
          name="Dashboard" 
          component={VenueDashboardStackNavigator}
          options={{ title: 'Dashboard' }}
        />
        <VenueTab.Screen 
          name="Profile" 
          component={VenueProfileStackNavigator}
          options={{ title: 'Profile' }}
        />
        <VenueTab.Screen 
          name="Analytics" 
          component={VenueAnalyticsScreen}
          options={{ title: 'Analytics' }}
        />
        <VenueTab.Screen 
          name="Settings" 
          component={VenueSettingsScreen}
          options={{ title: 'Settings' }}
        />
      </VenueTab.Navigator>
    );
  } else {
    // Regular Tab Bar with Reanimated 3 animations
    return (
      <VenueTab.Navigator
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
        <VenueTab.Screen 
          name="Dashboard" 
          component={VenueDashboardStackNavigator}
          options={{ title: getTabLabel('Dashboard') }}
        />
        <VenueTab.Screen 
          name="Profile" 
          component={VenueProfileStackNavigator}
          options={{ title: getTabLabel('Profile') }}
        />
        <VenueTab.Screen 
          name="Analytics" 
          component={VenueAnalyticsScreen}
          options={{ title: getTabLabel('Analytics') }}
        />
        <VenueTab.Screen 
          name="Settings" 
          component={VenueSettingsScreen}
          options={{ title: getTabLabel('Settings') }}
        />
      </VenueTab.Navigator>
    );
  }
}

export default VenueNavigator;