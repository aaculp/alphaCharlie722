import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

interface AnimatedTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
  // Reanimated 3 shared values
  const slidePosition = useSharedValue(0);
  const tabWidth = (width - 40) / state.routes.length; // 40px for container padding

  // Update slide position when active tab changes
  useEffect(() => {
    slidePosition.value = withSpring(
      state.index * tabWidth,
      {
        damping: 22,
        stiffness: 320,
        mass: 0.5,
      }
    );
  }, [state.index, tabWidth]);

  // Animated style for sliding indicator
  const slidingIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slidePosition.value }],
    };
  });

  // Navigation functions for gesture handling
  const navigateToTab = (tabName: string) => {
    'worklet';
    navigation.navigate(tabName);
  };

  // Gesture for swipe navigation
  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      'worklet';
      const { velocityX, translationX } = event;
      const threshold = 50;
      
      if (Math.abs(translationX) > threshold || Math.abs(velocityX) > 500) {
        if (translationX > 0 && velocityX > 0) {
          // Swipe right - go to previous tab
          if (state.index > 0) {
            navigateToTab(state.routes[state.index - 1].name);
          }
        } else if (translationX < 0 && velocityX < 0) {
          // Swipe left - go to next tab
          if (state.index < state.routes.length - 1) {
            navigateToTab(state.routes[state.index + 1].name);
          }
        }
      }
    });

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

  return (
    <GestureHandlerRootView style={[
      styles.container,
      { 
        paddingBottom: insets.bottom,
        backgroundColor: isDark ? theme.colors.surface : '#ffffff',
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }
    ]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.tabBar}>
          {/* Sliding Background Indicator */}
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                backgroundColor: theme.colors.primary,
                width: tabWidth,
              },
              slidingIndicatorStyle,
            ]}
          />
          
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                // Add subtle haptic feedback on tab press
                if (Platform.OS === 'ios') {
                  // iOS haptic feedback would go here if available
                }
                navigation.navigate(route.name);
              }
            };

            // Individual tab animation with improved responsiveness
            const tabAnimatedStyle = useAnimatedStyle(() => {
              const scale = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth,
                  index * tabWidth,
                  (index + 1) * tabWidth,
                ],
                [1, 1.06, 1],
                'clamp'
              );

              return {
                transform: [{ scale: withSpring(scale, { 
                  damping: 16, 
                  stiffness: 280,
                }) }],
              };
            });

            const iconAnimatedStyle = useAnimatedStyle(() => {
              const iconScale = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth,
                  index * tabWidth,
                  (index + 1) * tabWidth,
                ],
                [1, 1.12, 1],
                'clamp'
              );

              const translateY = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth,
                  index * tabWidth,
                  (index + 1) * tabWidth,
                ],
                [0, -2.5, 0],
                'clamp'
              );

              return {
                transform: [
                  { scale: withSpring(iconScale, { 
                    damping: 14, 
                    stiffness: 300,
                  }) },
                  { translateY: withSpring(translateY, { 
                    damping: 16, 
                    stiffness: 280,
                  }) }
                ],
              };
            });

            const labelAnimatedStyle = useAnimatedStyle(() => {
              const opacity = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth,
                  index * tabWidth,
                  (index + 1) * tabWidth,
                ],
                [0.65, 1, 0.65],
                'clamp'
              );

              const translateY = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth,
                  index * tabWidth,
                  (index + 1) * tabWidth,
                ],
                [3, 0, 3],
                'clamp'
              );

              const scale = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth,
                  index * tabWidth,
                  (index + 1) * tabWidth,
                ],
                [0.95, 1, 0.95],
                'clamp'
              );

              return {
                opacity: withTiming(opacity, { duration: 180 }),
                transform: [
                  { translateY: withSpring(translateY, { 
                    damping: 16, 
                    stiffness: 280,
                  }) },
                  { scale: withSpring(scale, { 
                    damping: 18, 
                    stiffness: 300,
                  }) }
                ],
              };
            });

            return (
              <Animated.View
                key={route.key}
                style={[styles.tabContainer, tabAnimatedStyle]}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  style={styles.tab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabContent}>
                    <Animated.View style={[
                      styles.iconContainer, 
                      iconAnimatedStyle,
                      // Enhanced centering adjustments for each icon
                      route.name === 'Settings' && { 
                        marginLeft: -1,
                      },
                      route.name === 'Search' && { 
                        marginLeft: -0.5,
                      },
                      route.name === 'QuickPicks' && { 
                        marginLeft: 0.5,
                      },
                    ]}>
                      <Icon
                        name={getTabIcon(route.name, isFocused)}
                        size={24}
                        color={
                          isFocused
                            ? 'white'
                            : theme.colors.textSecondary
                        }
                      />
                    </Animated.View>
                    <Animated.Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isFocused ? 'white' : theme.colors.textSecondary,
                          fontFamily: 'Inter-Medium',
                        },
                        labelAnimatedStyle,
                      ]}
                    >
                      {getTabLabel(route.name)}
                    </Animated.Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
    height: 60,
  },
  slidingIndicator: {
    position: 'absolute',
    height: 44,
    borderRadius: 22,
    top: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 22,
    minHeight: 44,
    width: '100%',
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    marginBottom: 3,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default AnimatedTabBar;