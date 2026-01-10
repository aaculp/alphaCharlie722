import { useTheme } from '../contexts/ThemeContext';

export interface EngagementColorResult {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  level: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * useEngagementColor - Traffic light system for venue capacity using OTW logo colors
 * 
 * Uses the "On The Way" concept - like a traffic light for venue activity:
 * 🟢 Green (0-33%): Go! Low activity, easy to get in
 * 🟡 Yellow (34-65%): Caution! Moderate activity, might need to wait
 * 🔴 Red (66-100%): Stop! High activity, likely crowded
 * 
 * @param currentCheckIns - Current number of people checked in
 * @param maxCapacity - Maximum venue capacity
 * @returns EngagementColorResult with colors and activity info
 */
export const useEngagementColor = (
  currentCheckIns: number, 
  maxCapacity: number
): EngagementColorResult => {
  const { theme } = useTheme();
  
  // Calculate capacity percentage
  const capacityPercentage = maxCapacity > 0 ? (currentCheckIns / maxCapacity) * 100 : 0;
  
  // Traffic light logic using OTW logo colors
  if (capacityPercentage >= 66) {
    // RED - High activity (66%+)
    return {
      backgroundColor: theme.colors.logoRed + '40', // 40% opacity
      borderColor: theme.colors.logoRed + '60',     // 60% opacity
      textColor: 'white',
      level: 'high',
      description: 'High Activity'
    };
  } else if (capacityPercentage >= 34) {
    // YELLOW - Medium activity (34-65%)
    return {
      backgroundColor: theme.colors.logoYellow + '40',
      borderColor: theme.colors.logoYellow + '60',
      textColor: 'white',
      level: 'medium',
      description: 'Moderate Activity'
    };
  } else {
    // GREEN - Low activity (0-33%)
    return {
      backgroundColor: theme.colors.logoGreen + '40',
      borderColor: theme.colors.logoGreen + '60',
      textColor: 'white',
      level: 'low',
      description: 'Low Activity'
    };
  }
};