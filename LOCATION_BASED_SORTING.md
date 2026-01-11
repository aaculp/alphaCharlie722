# Location-Based Venue Sorting Implementation

## Overview
Implemented location-based venue sorting feature that allows users to sort venues by distance from their current location.

## Changes Made

### 1. Location Service (`src/services/locationService.ts`)
- Created comprehensive location service with:
  - `requestLocationPermission()` - Handles Android permission requests
  - `getCurrentLocation()` - Gets user's current coordinates using `@react-native-community/geolocation`
  - `calculateDistance()` - Haversine formula for distance calculation between two coordinates
  - `formatDistance()` - Formats distance for display (e.g., "1.2 km" or "500 m")

### 2. Location Hook (`src/hooks/useLocation.ts`)
- Custom React hook for accessing location in components
- Provides: `location`, `loading`, `error`, `refetch`, `hasPermission`
- Supports optional auto-fetch on mount

### 3. Location Context (`src/contexts/LocationContext.tsx`)
- Global state management for location preferences
- Persists location enabled/disabled state to AsyncStorage
- Provides: `locationEnabled`, `setLocationEnabled`, `currentLocation`, `setCurrentLocation`
- Integrated into App.tsx provider tree

### 4. HomeScreen Updates (`src/screens/customer/HomeScreen.tsx`)
- Added "Near Me" / "Sort by Distance" button (only visible when location is enabled)
- Button toggles between normal sorting and distance-based sorting
- Venues are sorted by distance when location is available and sorting is enabled
- Distance badge displayed on venue cards when sorting by distance
- Handles location loading and error states gracefully

### 5. SettingsScreen Updates (`src/screens/customer/SettingsScreen.tsx`)
- Wired up existing location toggle to LocationContext
- Toggle now persists preference and controls location features app-wide

### 6. TestVenueCard Updates (`src/components/venue/TestVenueCard.tsx`)
- Added optional `distance` prop
- Displays distance badge next to location when provided
- Badge styled with blue background for visibility

### 7. Android Permissions (`android/app/src/main/AndroidManifest.xml`)
- Added `ACCESS_FINE_LOCATION` permission
- Added `ACCESS_COARSE_LOCATION` permission

### 8. Dependencies
- Installed `@react-native-community/geolocation@3.4.0`
- **IMPORTANT**: After installing, you MUST rebuild the Android app:
  ```bash
  npm run android
  ```
  This is required because the geolocation package includes native Android code that needs to be linked.

## How It Works

1. **User enables location in Settings**
   - Toggle persists to AsyncStorage via LocationContext
   - Location services become available app-wide

2. **User taps "Sort by Distance" on HomeScreen**
   - App requests location permission (if not already granted)
   - Gets current location using geolocation service
   - Calculates distance from user to each venue using Haversine formula
   - Sorts venues by distance (closest first)
   - Displays distance badge on each venue card

3. **User taps "Near Me" (when already sorting)**
   - Turns off distance sorting
   - Returns to default sorting (by rating)
   - Removes distance badges

## Backend Support

The backend already has infrastructure for location-based queries:
- Venues table has `latitude` and `longitude` fields
- `getNearbyVenues()` function exists in `VenueService` (uses PostGIS)
- Currently using client-side sorting, but can switch to backend PostGIS queries for better performance with large datasets

## Testing

**IMPORTANT: First-time setup**
After pulling these changes, you MUST rebuild the Android app:
```bash
npm run android
```
This is required because `@react-native-community/geolocation` includes native code.

To test:
1. Enable location services in Settings
2. Go to HomeScreen
3. Tap "Sort by Distance" button
4. Grant location permission when prompted
5. Venues should sort by distance with distance badges displayed
6. Tap "Near Me" to toggle off distance sorting

## Future Enhancements

- Add "Near Me" filter to SearchScreen
- Use backend PostGIS queries for better performance
- Add distance radius filter (e.g., "Within 5km")
- Cache location to avoid repeated permission requests
- Add location accuracy indicator
- Support iOS location permissions (Info.plist)
