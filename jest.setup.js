/* eslint-env jest */
/* global jest */

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      call: () => {},
    },
    View,
    Text: require('react-native').Text,
    Image: require('react-native').Image,
    ScrollView: require('react-native').ScrollView,
    Animated: {
      View,
      Text: require('react-native').Text,
      createAnimatedComponent: (component) => component,
    },
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      quad: (t) => t,
      cubic: (t) => t,
      bezier: () => (t) => t,
      circle: (t) => t,
      sin: (t) => t,
      exp: (t) => t,
      elastic: () => (t) => t,
      back: () => (t) => t,
      bounce: (t) => t,
      poly: () => (t) => t,
      in: (easing) => easing,
      out: (easing) => easing,
      inOut: (easing) => easing,
    },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (callback) => callback(),
    withTiming: (value) => value,
    withSpring: (value) => value,
    withDecay: (value) => value,
    withRepeat: (value) => value,
    withSequence: (...values) => values[0],
    withDelay: (delay, value) => value,
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    interpolate: (value, input, output) => output[0],
    Extrapolate: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity',
    },
    cancelAnimation: () => {},
    measure: () => ({}),
    scrollTo: () => {},
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    SlideInLeft: { duration: () => ({}) },
    SlideInRight: { duration: () => ({}) },
    SlideOutLeft: { duration: () => ({}) },
    SlideOutRight: { duration: () => ({}) },
  };
});

// Mock react-native-worklets
jest.mock('react-native-worklets', () => ({
  useSharedValue: (value) => ({ value }),
  useWorklet: (fn) => fn,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
    GestureDetector: View,
    Gesture: {
      Tap: () => ({}),
      Pan: () => ({}),
      Pinch: () => ({}),
      Rotation: () => ({}),
      Fling: () => ({}),
      LongPress: () => ({}),
      ForceTouch: () => ({}),
    },
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill/auto', () => {});

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: {
    trigger: jest.fn(),
  },
  trigger: jest.fn(),
}));

// Mock @react-native-community/geolocation
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    getCurrentPosition: jest.fn((success) =>
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      })
    ),
    watchPosition: jest.fn(() => 1),
    clearWatch: jest.fn(),
    stopObserving: jest.fn(),
    setRNConfiguration: jest.fn(),
    requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  },
}));

// Mock Supabase - use the comprehensive mock from src/lib/__mocks__/supabase.ts
jest.mock('./src/lib/supabase');
