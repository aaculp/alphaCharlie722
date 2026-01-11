// Venue Activity Level Utilities
import { ACTIVITY_COLORS } from '../constants';

export interface ActivityLevel {
  level: 'Low-key' | 'Vibey' | 'Poppin' | 'Lit' | 'Maxed';
  emoji: '😌' | '✨' | '🎉' | '🔥' | '⛔';
  color: string;
  percentage: number;
}

export const getActivityLevel = (currentCapacity: number, maxCapacity: number): ActivityLevel => {
  if (maxCapacity === 0) {
    return {
      level: 'Low-key',
      emoji: '😌',
      color: ACTIVITY_COLORS.LOW_KEY,
      percentage: 0
    };
  }

  const percentage = Math.round((currentCapacity / maxCapacity) * 100);

  if (percentage <= 20) {
    return {
      level: 'Low-key',
      emoji: '😌',
      color: ACTIVITY_COLORS.LOW_KEY,
      percentage
    };
  } else if (percentage <= 40) {
    return {
      level: 'Vibey',
      emoji: '✨',
      color: ACTIVITY_COLORS.VIBEY,
      percentage
    };
  } else if (percentage <= 65) {
    return {
      level: 'Poppin',
      emoji: '🎉',
      color: ACTIVITY_COLORS.POPPIN,
      percentage
    };
  } else if (percentage <= 85) {
    return {
      level: 'Lit',
      emoji: '🔥',
      color: ACTIVITY_COLORS.LIT,
      percentage
    };
  } else {
    return {
      level: 'Maxed',
      emoji: '⛔',
      color: ACTIVITY_COLORS.MAXED,
      percentage
    };
  }
};

export const getActivityLevelDescription = (level: ActivityLevel['level']): string => {
  switch (level) {
    case 'Low-key':
      return 'Quiet and relaxed';
    case 'Vibey':
      return 'Good energy, comfortable';
    case 'Poppin':
      return 'Lively and energetic';
    case 'Lit':
      return 'Very busy and exciting';
    case 'Maxed':
      return 'At capacity, very crowded';
    default:
      return '';
  }
};
