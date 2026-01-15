/**
 * Responsive Layout Utilities
 * 
 * Provides utilities for responsive spacing and sizing based on screen dimensions.
 * Requirement 7.4: Adjust spacing for different screen sizes
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Screen size breakpoints
 */
export const BREAKPOINTS = {
  SMALL: 667,   // iPhone SE, iPhone 8
  MEDIUM: 812,  // iPhone 12, 13
  LARGE: 896,   // iPhone 14 Pro Max, Plus models
} as const;

/**
 * Determine current screen size category
 */
export const getScreenSize = (): 'small' | 'medium' | 'large' => {
  if (SCREEN_HEIGHT < BREAKPOINTS.SMALL) {
    return 'small';
  } else if (SCREEN_HEIGHT <= BREAKPOINTS.MEDIUM) {
    return 'medium';
  } else {
    return 'large';
  }
};

/**
 * Get responsive spacing value based on screen size
 * 
 * @param small - Spacing value for small screens
 * @param medium - Spacing value for medium screens (optional, defaults to small)
 * @param large - Spacing value for large screens (optional, defaults to medium)
 * @returns Appropriate spacing value for current screen size
 */
export const getResponsiveSpacing = (
  small: number,
  medium?: number,
  large?: number
): number => {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case 'small':
      return small;
    case 'medium':
      return medium ?? small;
    case 'large':
      return large ?? medium ?? small;
    default:
      return small;
  }
};

/**
 * Responsive spacing presets
 * Requirement 7.4: Maintain appropriate spacing across screen sizes
 */
export const RESPONSIVE_SPACING = {
  // Section padding (horizontal)
  sectionHorizontal: getResponsiveSpacing(16, 20, 24),
  
  // Section padding (vertical)
  sectionVertical: getResponsiveSpacing(16, 20, 24),
  
  // Card padding
  cardPadding: getResponsiveSpacing(16, 20, 24),
  
  // Card margin (bottom)
  cardMargin: getResponsiveSpacing(12, 16, 20),
  
  // Element gap (between related elements)
  elementGap: getResponsiveSpacing(8, 10, 12),
  
  // Button padding (vertical)
  buttonVertical: getResponsiveSpacing(10, 12, 14),
  
  // Button padding (horizontal)
  buttonHorizontal: getResponsiveSpacing(16, 20, 24),
} as const;

/**
 * Get responsive font size
 * 
 * @param base - Base font size
 * @param scale - Scale factor for larger screens (default: 1.1)
 * @returns Scaled font size for current screen
 */
export const getResponsiveFontSize = (base: number, scale: number = 1.1): number => {
  const screenSize = getScreenSize();
  
  if (screenSize === 'large') {
    return Math.round(base * scale);
  }
  
  return base;
};

/**
 * Check if screen is small
 */
export const isSmallScreen = (): boolean => {
  return getScreenSize() === 'small';
};

/**
 * Check if screen is large
 */
export const isLargeScreen = (): boolean => {
  return getScreenSize() === 'large';
};
