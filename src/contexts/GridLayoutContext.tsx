import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GridLayoutType = '1-column' | '2-column';

interface GridLayoutContextType {
  gridLayout: GridLayoutType;
  setGridLayout: (layout: GridLayoutType) => void;
}

const GridLayoutContext = createContext<GridLayoutContextType | undefined>(undefined);

interface GridLayoutProviderProps {
  children: ReactNode;
}

export const GridLayoutProvider: React.FC<GridLayoutProviderProps> = ({ children }) => {
  const [gridLayout, setGridLayoutState] = useState<GridLayoutType>('2-column');

  // Load saved grid layout preference on app start
  useEffect(() => {
    const loadGridLayout = async () => {
      try {
        const savedLayout = await AsyncStorage.getItem('gridLayout');
        if (savedLayout && (savedLayout === '1-column' || savedLayout === '2-column')) {
          setGridLayoutState(savedLayout as GridLayoutType);
        }
      } catch (error) {
        console.error('Error loading grid layout preference:', error);
      }
    };

    loadGridLayout();
  }, []);

  // Save grid layout preference when it changes
  const setGridLayout = async (layout: GridLayoutType) => {
    try {
      await AsyncStorage.setItem('gridLayout', layout);
      setGridLayoutState(layout);
    } catch (error) {
      console.error('Error saving grid layout preference:', error);
    }
  };

  return (
    <GridLayoutContext.Provider value={{ gridLayout, setGridLayout }}>
      {children}
    </GridLayoutContext.Provider>
  );
};

export const useGridLayout = (): GridLayoutContextType => {
  const context = useContext(GridLayoutContext);
  if (!context) {
    throw new Error('useGridLayout must be used within a GridLayoutProvider');
  }
  return context;
};