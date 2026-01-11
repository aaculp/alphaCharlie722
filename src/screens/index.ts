/**
 * Screens Index
 * 
 * Central export point for all screens in the application.
 * Re-exports screens from organized user type folders while maintaining
 * backward compatibility for existing imports.
 */

// Customer Screens - Re-export from customer directory
export {
  HomeScreen,
  SearchScreen,
  VenueDetailScreen,
  FavoritesScreen,
  SettingsScreen,
  QuickPicksScreen,
} from './customer';

// Auth Screens - Re-export from auth directory
export { AuthScreen, SplashScreen } from './auth';

// Venue Owner Screens - Re-export from venue directory
export { VenueDashboardScreen } from './venue';

// Legacy auth screens (still in root directory)
// TODO: Move these to auth directory in future cleanup
export { default as LoginScreen } from './LoginScreen';
export { default as SignUpScreen } from './SignUpScreen';