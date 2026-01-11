// Color Constants for OTW Application

/**
 * Activity Level Colors
 * Used to indicate venue capacity and activity levels
 */
export const ACTIVITY_COLORS = {
  LOW_KEY: '#10B981',      // Green - Low capacity (0-20%)
  VIBEY: '#3B82F6',        // Blue - Moderate capacity (21-40%)
  POPPIN: '#F59E0B',       // Yellow/Orange - Good capacity (41-65%)
  LIT: '#EF4444',          // Red - High capacity (66-85%)
  MAXED: '#7C2D12',        // Dark Red - At capacity (86-100%)
} as const;

/**
 * Dashboard Card Colors
 * Used for various dashboard metrics and indicators
 */
export const DASHBOARD_COLORS = {
  CHECK_INS: '#2196F3',    // Blue - Check-in metrics
  NEW_CUSTOMERS: '#4CAF50', // Green - New customer metrics
  ACTIVITY: '#FF9800',     // Orange - Activity metrics
  RATING: '#FFC107',       // Amber - Rating metrics
  FAVORITES: '#E91E63',    // Pink - Favorites metrics
  PROFILE_VIEWS: '#9C27B0', // Purple - Profile view metrics
  PEAK_HOUR: '#FF6B6B',    // Light Red - Peak hour indicator
} as const;

/**
 * Action Button Colors
 * Used for various action buttons in the UI
 */
export const ACTION_COLORS = {
  FLASH_OFFER: '#FF9800',  // Orange - Flash offer action
  UPDATE_HOURS: '#4CAF50', // Green - Update hours action
  EDIT_PROFILE: '#9C27B0', // Purple - Edit profile action
  HINT: '#FFC107',         // Amber - Hint/tip indicator
  TRENDING: '#4CAF50',     // Green - Trending indicator
  STAR: '#E91E63',         // Pink - Star/favorite indicator
  PEOPLE: '#2196F3',       // Blue - People/social indicator
} as const;

/**
 * UI Element Colors
 * Common colors used across UI elements
 */
export const UI_COLORS = {
  WHITE: '#FFFFFF',
  DANGER: '#FF3B30',       // Red - Danger/delete actions
  SUCCESS: '#4CAF50',      // Green - Success states
  TRACK_INACTIVE: '#767577', // Gray - Inactive switch track
  THUMB_INACTIVE: '#f4f3f4', // Light gray - Inactive switch thumb
} as const;

/**
 * OTW Logo Colors
 * Brand colors used in the OTW logo
 */
export const LOGO_COLORS = {
  RED: '#DC2626',
  YELLOW: '#F59E0B',
  GREEN: '#059669',
} as const;

/**
 * Opacity values for color overlays
 * Used to create semi-transparent color effects
 */
export const OPACITY = {
  LIGHT: '20',    // 20% opacity
  MEDIUM: '40',   // 40% opacity
  HEAVY: '80',    // 80% opacity
} as const;
