# Location-Based Venue Sorting Implementation

## Overview
Implemented "Sort by Distance" feature that allows users to sort venues by their distance from the user's current location.

## Implementation Details

### 1. Location Service (`src/services/locationService.ts`)
- **Geolocation Library**: Using `@react-native-community/geolocation` (compatible with React Native 0.83.1 new architecture)
- **Permission Handling**: 
  - Android: Uses `PermissionsAndroid` API with proper handling of `granted`, `denied`, and `never_ask_again` states
  - iOS: Automatic permission handling via Info.plist configuration
- **Features**:
  - `checkLocationPermission()`: Check current permission status
  - `requestLocationPermission()`: Request permission with custom dialog
  - `getCurrentLocation()`: Get user's GPS coordinates
  - `calculateDistance()`: Haversine formula for distance calculation
  - `formatDistance()`: Format distance as "X.X km" or "XXX m"
  - `openAppSettings()`: Open device settings for manual permission enable

### 2. Location Context (`src/contexts/LocationContext.tsx`)
- Global state management for location preferences
- Persists user's location toggle preference to AsyncStorage
- Provides `locationEnabled`, `setLocationEnabled`, `currentLocation`, `setCurrentLocation`

### 3. Location Hook (`src/hooks/useLocation.ts`)
- Custom React hook for accessing location in components
- Returns: `location`, `loading`, `error`, `refetch`, `hasPermission`
- Handles permission errors and provides retry mechanism

### 4. HomeScreen Integration (`src/screens/customer/HomeScreen.tsx`)
- "Sort by Distance" button that toggles distance-based sorting
- Shows distance badges on venue cards when sorting is active
- Error handling with "Open Settings" button for permission issues
- Graceful fallback when location is unavailable

### 5. Venue Card Enhancement (`src/components/venue/TestVenueCard.tsx`)
- Optional `distance` prop for displaying distance badge
- Badge shows formatted distance (e.g., "1.2 km" or "500 m")

## Platform Configuration

### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### iOS (`ios/alphaCharlie722/Info.plist`)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>alphaCharlie722 needs your location to show nearby venues and calculate distances.</string>
```

## Dependencies Added
- `@react-native-community/geolocation@^3.4.0`

## Permission States Handled

### Android
1. **Granted**: Permission approved, location fetching works
2. **Denied**: User denied permission, can request again
3. **Never Ask Again**: User denied and checked "Don't ask again"
   - Shows "Open Settings" button
   - Opens device settings via `Linking.openSettings()`

### iOS
- Automatic permission dialog on first location request
- Permission description shown from Info.plist

## User Experience

### When Location is Enabled
1. User toggles location in Settings screen
2. HomeScreen shows "Sort by Distance" button
3. Tapping button requests location permission (if needed)
4. Once granted, venues are sorted by distance
5. Distance badges appear on venue cards
6. Button changes to "Near Me" when active

### When Permission is Denied
- Error message displayed below button
- "Open Settings" button appears
- Tapping opens device settings for manual permission enable

### When Location is Disabled
- "Sort by Distance" button is hidden
- No location requests are made
- Venues shown in default order

## Testing Notes

### Permission Reset (Android)
If permission gets stuck in `never_ask_again` state during testing:
```bash
adb shell pm clear com.alphacharlie722
```
This clears app data including permission states.

### Metro Cache Clear
After adding new native dependencies:
```bash
npm run clean:metro
npm run start:clean
```

### Full Rebuild
```bash
cd android
.\gradlew clean
cd ..
npm run android
```

## Status
✅ Location service implemented with @react-native-community/geolocation
✅ Permission handling for Android (granted/denied/never_ask_again)
✅ iOS permission configuration
✅ Location context and hook
✅ HomeScreen integration with sort button
✅ Distance badges on venue cards
✅ Error handling with "Open Settings" button
🔄 Currently building and testing on Android device

## Next Steps
1. Test location permission flow on Android device
2. Verify distance calculation accuracy
3. Test on iOS device
4. Consider adding location caching to reduce battery usage
5. Add loading indicator while fetching location
