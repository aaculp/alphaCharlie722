// Venue Activity Level Utilities

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
      color: '#10B981', // Green
      percentage: 0
    };
  }

  const percentage = Math.round((currentCapacity / maxCapacity) * 100);

  if (percentage <= 20) {
    return {
      level: 'Low-key',
      emoji: '😌',
      color: '#10B981', // Green
      percentage
    };
  } else if (percentage <= 40) {
    return {
      level: 'Vibey',
      emoji: '✨',
      color: '#3B82F6', // Blue
      percentage
    };
  } else if (percentage <= 65) {
    return {
      level: 'Poppin',
      emoji: '🎉',
      color: '#F59E0B', // Yellow/Orange
      percentage
    };
  } else if (percentage <= 85) {
    return {
      level: 'Lit',
      emoji: '🔥',
      color: '#EF4444', // Red
      percentage
    };
  } else {
    return {
      level: 'Maxed',
      emoji: '⛔',
      color: '#7C2D12', // Dark Red
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