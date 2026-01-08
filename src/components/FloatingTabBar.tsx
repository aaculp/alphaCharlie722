import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
  // Reanimated 3 shared values
  const slidePosition = useSharedValue(0);
  const tabWidth = (width - 80) / state.routes.length; // 80px for container padding

  // Update slide position when active tab changes
  useEffect(() => {
    const tabCenterOffset = (tabWidth - 50) / 2; // Center the 50px circle within the tab width
    slidePosition.value = withSpring(
      state.index * tabWidth + tabCenterOffset,
      {
        damping: 18,
        stiffness: 250,
        mass: 0.7,
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

  return (
    <GestureHandlerRootView style={[
      styles.container,
      { 
        paddingBottom: insets.bottom + 10,
        backgroundColor: 'transparent',
      }
    ]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          styles.tabBar,
          {
            backgroundColor: isDark 
              ? 'rgba(20, 20, 20, 0.7)' 
              : 'rgba(255, 255, 255, 0.7)',
            borderColor: isDark 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(0, 0, 0, 0.15)',
          }
        ]}>
          {/* Sliding Background Indicator */}
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                backgroundColor: theme.colors.primary,
                width: 50, // Fixed 50px for perfect circle
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

            // Individual tab animation with improved centering
            const tabAnimatedStyle = useAnimatedStyle(() => {
              const scale = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth + (tabWidth - 50) / 2,
                  index * tabWidth + (tabWidth - 50) / 2,
                  (index + 1) * tabWidth + (tabWidth - 50) / 2,
                ],
                [1, 1.08, 1],
                'clamp'
              );

              return {
                transform: [{ scale: withSpring(scale, { 
                  damping: 15, 
                  stiffness: 250,
                }) }],
              };
            });

            // Icon-specific animation for perfect centering
            const iconAnimatedStyle = useAnimatedStyle(() => {
              const iconScale = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth + (tabWidth - 50) / 2,
                  index * tabWidth + (tabWidth - 50) / 2,
                  (index + 1) * tabWidth + (tabWidth - 50) / 2,
                ],
                [1, 1.1, 1],
                'clamp'
              );

              const translateY = interpolate(
                slidePosition.value,
                [
                  (index - 1) * tabWidth + (tabWidth - 50) / 2,
                  index * tabWidth + (tabWidth - 50) / 2,
                  (index + 1) * tabWidth + (tabWidth - 50) / 2,
                ],
                [0, -1, 0],
                'clamp'
              );

              return {
                transform: [
                  { scale: withSpring(iconScale, { 
                    damping: 12, 
                    stiffness: 300,
                  }) },
                  { translateY: withSpring(translateY, { 
                    damping: 15, 
                    stiffness: 250,
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
                        marginLeft: -1.5,
                        marginTop: -0.5,
                      },
                      route.name === 'Search' && { 
                        marginLeft: -0.5,
                        marginTop: -0.5,
                      },
                      route.name === 'Home' && { 
                        marginTop: -0.5,
                      },
                      route.name === 'QuickPicks' && { 
                        marginLeft: 0.5,
                        marginTop: -0.5,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(30px)',
      },
      android: {
        // Android doesn't support backdrop-filter, but we can enhance the shadow
        shadowOpacity: 0.3,
        elevation: 20,
      },
    }),
  },
  slidingIndicator: {
    position: 'absolute',
    height: 50,
    borderRadius: 25,
    top: 8,
    left: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 25,
    minHeight: 50,
    width: '100%',
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    position: 'relative',
  },
});

export default FloatingTabBar;