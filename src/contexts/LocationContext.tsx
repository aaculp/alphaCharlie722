import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationCoordinates } from '../services/locationService';

interface LocationContextType {
  locationEnabled: boolean;
  setLocationEnabled: (enabled: boolean) => void;
  currentLocation: LocationCoordinates | null;
  setCurrentLocation: (location: LocationCoordinates | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_ENABLED_KEY = '@location_enabled';

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locationEnabled, setLocationEnabledState] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);

  // Load location preference from storage on mount
  useEffect(() => {
    const loadLocationPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATION_ENABLED_KEY);
        if (stored !== null) {
          setLocationEnabledState(stored === 'true');
        }
      } catch (error) {
        console.error('Failed to load location preference:', error);
      }
    };
    
    loadLocationPreference();
  }, []);

  // Save location preference to storage when it changes
  const setLocationEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(LOCATION_ENABLED_KEY, enabled.toString());
      setLocationEnabledState(enabled);
      
      // Clear current location when disabled
      if (!enabled) {
        setCurrentLocation(null);
      }
    } catch (error) {
      console.error('Failed to save location preference:', error);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        locationEnabled,
        setLocationEnabled,
        currentLocation,
        setCurrentLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
