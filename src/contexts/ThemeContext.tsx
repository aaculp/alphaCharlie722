import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    notification: string;
    error: string;
    success: string;
    warning: string;
    tabBarActive: string;
    tabBarInactive: string;
    shadow: string;
    // OTW Logo Colors
    logoRed: string;
    logoYellow: string;
    logoGreen: string;
  };
  fonts: {
    // Primary font family (Poppins) - for headings, branding, emphasis
    primary: {
      regular: string;
      medium: string;
      semiBold: string;
      bold: string;
    };
    // Secondary font family (Inter) - for body text, UI elements
    secondary: {
      regular: string;
      medium: string;
      semiBold: string;
      bold: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#d1d5db', // Made darker for better visibility in light mode
    card: '#ffffff',
    notification: '#ff3b30',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ff9500',
    tabBarActive: '#007AFF',
    tabBarInactive: 'gray',
    shadow: '#000000',
    // OTW Logo Colors
    logoRed: '#DC2626',
    logoYellow: '#F59E0B',
    logoGreen: '#059669',
  },
  fonts: {
    primary: {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semiBold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
    },
    secondary: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#0A84FF',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    card: '#2C2C2E',
    notification: '#FF453A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    tabBarActive: '#0A84FF',
    tabBarInactive: '#8E8E93',
    shadow: '#000000',
    // OTW Logo Colors (same in both themes)
    logoRed: '#DC2626',
    logoYellow: '#F59E0B',
    logoGreen: '#059669',
  },
  fonts: {
    primary: {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semiBold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
    },
    secondary: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  isLoading: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = '@OTW_theme_mode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        console.log('🎨 Loading theme preference...');
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          console.log('✅ Loaded saved theme:', savedTheme);
          setThemeModeState(savedTheme as ThemeMode);
        } else {
          console.log('📱 No saved theme, using system default');
        }
      } catch (error) {
        console.error('❌ Error loading theme preference:', error);
      } finally {
        console.log('🎨 Theme loading complete, setting isLoading to false');
        setIsLoading(false);
      }
    };

    // Add a timeout to ensure loading doesn't hang
    const timeoutId = setTimeout(() => {
      console.log('⏰ Theme loading timeout, forcing isLoading to false');
      setIsLoading(false);
    }, 3000);

    loadThemePreference().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  // Determine if we should use dark theme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  // Set theme mode and save to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      console.log('🎨 Setting theme mode:', mode);
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      console.log('✅ Theme preference saved');
    } catch (error) {
      console.error('❌ Error saving theme preference:', error);
    }
  };

  // Toggle between light and dark (not system)
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    isLoading,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};