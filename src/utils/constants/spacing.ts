// Spacing Constants for OTW Application

/**
 * Base Spacing Scale
 * Consistent spacing values used throughout the application
 * Based on 4px base unit for consistent visual rhythm
 */
export const SPACING = {
  XS: 4,    // Extra small - minimal spacing
  SM: 8,    // Small - compact spacing
  MD: 16,   // Medium - standard spacing
  LG: 24,   // Large - generous spacing
  XL: 32,   // Extra large - maximum spacing
} as const;

/**
 * Padding Values
 * Common padding values used in components
 */
export const PADDING = {
  TINY: 4,      // Minimal padding for tight spaces
  SMALL: 8,     // Small padding for compact elements
  MEDIUM: 12,   // Medium padding for content areas
  STANDARD: 16, // Standard padding for cards/containers
  LARGE: 20,    // Large padding for spacious layouts
  XLARGE: 24,   // Extra large padding for major sections
} as const;

/**
 * Margin Values
 * Common margin values used for component spacing
 */
export const MARGIN = {
  TINY: 4,      // Minimal margin
  SMALL: 8,     // Small margin
  MEDIUM: 12,   // Medium margin
  STANDARD: 15, // Standard margin (commonly used for horizontal spacing)
  LARGE: 20,    // Large margin
  XLARGE: 24,   // Extra large margin
} as const;

/**
 * Border Radius Values
 * Consistent border radius for rounded corners
 */
export const BORDER_RADIUS = {
  SM: 8,    // Small radius - subtle rounding
  MD: 12,   // Medium radius - standard rounding
  LG: 16,   // Large radius - prominent rounding
  XL: 20,   // Extra large radius - very rounded
} as const;

/**
 * Gap Values
 * Used for flexbox/grid gap spacing
 */
export const GAP = {
  TINY: 4,
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 16,
  XLARGE: 20,
} as const;
