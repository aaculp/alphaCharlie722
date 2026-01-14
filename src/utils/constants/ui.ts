/**
 * UI Constants
 * 
 * Centralized UI constants for consistent styling across the app
 */

/**
 * Border Radius values
 */
export const BORDER_RADIUS = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  ROUND: 999,
} as const;

/**
 * Shadow configurations for elevation
 */
export const SHADOWS = {
  NONE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  SM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  MD: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  XL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

/**
 * Opacity values for different states
 */
export const OPACITY = {
  DISABLED: 0.4,
  INACTIVE: 0.6,
  ACTIVE: 1,
  OVERLAY: 0.5,
  SUBTLE: 0.3,
} as const;

/**
 * Z-Index layers
 */
export const Z_INDEX = {
  BACKGROUND: -1,
  BASE: 0,
  CONTENT: 1,
  OVERLAY: 10,
  MODAL: 100,
  POPOVER: 200,
  TOOLTIP: 300,
  NOTIFICATION: 400,
} as const;

/**
 * Animation timing
 */
export const ANIMATION_TIMING = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  VERY_SLOW: 500,
} as const;

/**
 * Touch target sizes (minimum for accessibility)
 */
export const TOUCH_TARGET = {
  MIN: 44,
  COMFORTABLE: 48,
  LARGE: 56,
} as const;

/**
 * Icon sizes
 */
export const ICON_SIZE = {
  XS: 12,
  SM: 16,
  MD: 20,
  LG: 24,
  XL: 32,
  XXL: 40,
} as const;

/**
 * Avatar sizes
 */
export const AVATAR_SIZE = {
  XS: 24,
  SM: 32,
  MD: 40,
  LG: 56,
  XL: 80,
  XXL: 120,
} as const;

/**
 * Card dimensions
 */
export const CARD = {
  MIN_HEIGHT: 80,
  PADDING: 16,
  MARGIN: 12,
} as const;

/**
 * List item dimensions
 */
export const LIST_ITEM = {
  HEIGHT: 64,
  PADDING_HORIZONTAL: 16,
  PADDING_VERTICAL: 12,
} as const;

/**
 * Button dimensions
 */
export const BUTTON = {
  HEIGHT: 44,
  HEIGHT_LARGE: 52,
  HEIGHT_SMALL: 36,
  PADDING_HORIZONTAL: 24,
  PADDING_HORIZONTAL_SMALL: 16,
} as const;

/**
 * Input dimensions
 */
export const INPUT = {
  HEIGHT: 48,
  PADDING_HORIZONTAL: 16,
  PADDING_VERTICAL: 12,
} as const;

/**
 * Modal dimensions
 */
export const MODAL = {
  MAX_WIDTH: 400,
  PADDING: 24,
  BORDER_RADIUS: BORDER_RADIUS.LG,
} as const;

/**
 * Bottom sheet dimensions
 */
export const BOTTOM_SHEET = {
  HANDLE_HEIGHT: 4,
  HANDLE_WIDTH: 40,
  HEADER_HEIGHT: 60,
  MAX_HEIGHT_PERCENTAGE: 0.9,
} as const;
