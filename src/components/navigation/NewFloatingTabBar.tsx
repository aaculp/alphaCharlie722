import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
  interpolate,
  SharedValue,
  cancelAnimation,
} from 'react-native-reanimated';

interface NewFloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface TabItemProps {
  route: any;
  index: number;
  isFocused: boolean;
  options: any;
  onPress: () => void;
  activeIndex: SharedValue<number>;
  tabWidth: number;
  theme: any;
  unreadCount?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const TAB_BAR_WIDTH = screenWidth - 40; // 20px margin on each side
const INDICATOR_SIZE = 50;

// Separate component for each tab item to fix Rules of Hooks
const TabItem = memo(({ route, index, isFocused, options, onPress, activeIndex, tabWidth, theme, unreadCount }: TabItemProps) => {
  const getTabIcon = (routeName: string, focused: boolean) => {
    let iconName: string;
    switch (routeName) {
      case 'Home':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'Search':
        iconName = focused ? 'search' : 'search-outline';
        break;
      case 'Favorites':
        iconName = focused ? 'heart' : 'heart-outline';
        break;
      case 'History':
        iconName = focused ? 'time' : 'time-outline';
        break;
      case 'Profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        iconName = 'help-outline';
    }
    return iconName;
  };

  const showBadge = false; // Removed Settings badge since Settings is no longer in tab bar

  // Tab animation
  const tabStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [1, 1.05, 1],
      'clamp'
    );

    return {
      transform: [{ scale }],
    };
  });

  // Icon animation with perfect centering
  const iconStyle = useAnimatedStyle(() => {
    const iconScale = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [1, 1.15, 1],
      'clamp'
    );

    return {
      transform: [{ scale: iconScale }],
    };
  });

  return (
    <Animated.View key={route.key} style={[styles.tabContainer, { width: tabWidth }, tabStyle]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onPress}
        style={styles.tab}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Icon
            name={getTabIcon(route.name, isFocused)}
            size={24}
            color={isFocused ? 'white' : theme.colors.textSecondary}
          />
          {showBadge && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.badgeText}>
                {unreadCount! > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const NewFloatingTabBar: React.FC<NewFloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  
  // Calculate tab width and positions
  const tabCount = state.routes.length;
  const tabWidth = TAB_BAR_WIDTH / tabCount;
  
  // Shared value for active tab index
  const activeIndex = useSharedValue(state.index);
  
  // Update active index when state changes
  React.useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
  }, [state.index, activeIndex]);

  // Cleanup animations on unmount
  React.useEffect(() => {
    return () => {
      cancelAnimation(activeIndex);
    };
  }, [activeIndex]);

  // Calculate indicator position
  const indicatorPosition = useDerivedValue(() => {
    const tabCenterX = (activeIndex.value * tabWidth) + (tabWidth / 2) - (INDICATOR_SIZE / 2);
    return tabCenterX;
  });

  // Animated style for sliding indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
    };
  });

  const renderTab = (route: any, index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TabItem
        key={route.key}
        route={route}
        index={index}
        isFocused={isFocused}
        options={options}
        onPress={onPress}
        activeIndex={activeIndex}
        tabWidth={tabWidth}
        theme={theme}
        unreadCount={unreadCount}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      <Animated.View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark 
              ? 'rgba(20, 20, 20, 0.8)' 
              : '#F5F5F5', // Solid color for light theme
            borderColor: isDark 
              ? 'rgba(255, 255, 255, 0.1)' 
              : '#B0B0B0', // Solid border for light theme
            width: TAB_BAR_WIDTH,
          }
        ]}
      >
        {/* Sliding Background Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.colors.primary,
              width: INDICATOR_SIZE,
              height: INDICATOR_SIZE,
            },
            indicatorStyle,
          ]}
        />
        
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {state.routes.map(renderTab)}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabBar: {
    borderRadius: 30,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  indicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabContainer: {
    height: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    zIndex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    lineHeight: 12,
  },
});

export default NewFloatingTabBar;