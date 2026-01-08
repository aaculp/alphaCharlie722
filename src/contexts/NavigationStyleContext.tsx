import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NavigationStyleType = 'floating' | 'regular';

interface NavigationStyleContextType {
  navigationStyle: NavigationStyleType;
  setNavigationStyle: (style: NavigationStyleType) => void;
}

const NavigationStyleContext = createContext<NavigationStyleContextType | undefined>(undefined);

interface NavigationStyleProviderProps {
  children: ReactNode;
}

export const NavigationStyleProvider: React.FC<NavigationStyleProviderProps> = ({ children }) => {
  const [navigationStyle, setNavigationStyleState] = useState<NavigationStyleType>('floating');

  // Load saved navigation style preference on app start
  useEffect(() => {
    const loadNavigationStyle = async () => {
      try {
        const savedStyle = await AsyncStorage.getItem('navigationStyle');
        if (savedStyle && (savedStyle === 'floating' || savedStyle === 'regular')) {
          setNavigationStyleState(savedStyle as NavigationStyleType);
        }
      } catch (error) {
        console.error('Error loading navigation style preference:', error);
      }
    };

    loadNavigationStyle();
  }, []);

  // Save navigation style preference when it changes
  const setNavigationStyle = async (style: NavigationStyleType) => {
    try {
      await AsyncStorage.setItem('navigationStyle', style);
      setNavigationStyleState(style);
    } catch (error) {
      console.error('Error saving navigation style preference:', error);
    }
  };

  return (
    <NavigationStyleContext.Provider value={{ navigationStyle, setNavigationStyle }}>
      {children}
    </NavigationStyleContext.Provider>
  );
};

export const useNavigationStyle = (): NavigationStyleContextType => {
  const context = useContext(NavigationStyleContext);
  if (!context) {
    throw new Error('useNavigationStyle must be used within a NavigationStyleProvider');
  }
  return context;
};