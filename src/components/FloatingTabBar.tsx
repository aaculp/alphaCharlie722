import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

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
  
  // Animation for sliding indicator
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimations = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  // Calculate tab width for sliding animation
  const tabWidth = (width - 80) / state.routes.length; // 80px for container padding

  useEffect(() => {
    // Calculate the center position for each tab
    const tabCenterOffset = (tabWidth - 50) / 2; // Center the 50px circle within the tab width
    Animated.spring(slideAnimation, {
      toValue: state.index * tabWidth + tabCenterOffset,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    // Animate scale for all tabs
    scaleAnimations.forEach((anim: Animated.Value, index: number) => {
      Animated.spring(anim, {
        toValue: state.index === index ? 1.05 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    });
  }, [state.index, slideAnimation, scaleAnimations, tabWidth]);

  const getTabIcon = (routeName: string, focused: boolean) => {
    let iconName: string;
    
    switch (routeName) {
      case 'Home':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'QuickPicks':
        iconName = focused ? 'flash' : 'flash-outline';
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
    <View style={[
      styles.container,
      { 
        paddingBottom: insets.bottom + 10,
        backgroundColor: 'transparent',
      }
    ]}>
      <View style={[
        styles.tabBar,
        {
          backgroundColor: isDark 
            ? 'rgba(30, 30, 30, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        {/* Sliding Background Indicator */}
        <Animated.View
          style={[
            styles.slidingIndicator,
            {
              backgroundColor: theme.colors.primary,
              transform: [{ translateX: slideAnimation }],
              width: 50, // Fixed 50px for perfect circle
            }
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
              navigation.navigate(route.name);
            }
          };

          return (
            <Animated.View
              key={route.key}
              style={[
                styles.tabContainer,
                { transform: [{ scale: scaleAnimations[index] }] }
              ]}
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
                  <View style={[
                    styles.iconContainer,
                    // Slight adjustment for specific icons that appear visually off-center
                    route.name === 'Settings' && { marginLeft: -4 },
                    route.name === 'Search' && { marginLeft: -0.5 },
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
                  </View>
                  {!isFocused && (
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {getTabLabel(route.name)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

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
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(20px)',
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
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
    gap: 2,
    minHeight: 50,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default FloatingTabBar;