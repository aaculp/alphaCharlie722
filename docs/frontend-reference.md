# Frontend Reference

This document provides a comprehensive overview of the frontend architecture, components, hooks, contexts, and utilities in the alphaCharlie722 React Native application.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Custom Hooks](#custom-hooks)
- [React Contexts](#react-contexts)
- [Components](#components)
- [Navigation](#navigation)
- [Utilities](#utilities)
- [Type Definitions](#type-definitions)
- [Best Practices](#best-practices)

---

## Architecture Overview

### Technology Stack

- **Framework**: React Native 0.83.1
- **Language**: TypeScript 5.8.3
- **Navigation**: React Navigation 7.x
- **State Management**: React Context API + Custom Hooks
- **Backend**: Supabase (PostgreSQL + Auth)
- **Animations**: React Native Reanimated 4.2.1
- **Storage**: AsyncStorage
- **Testing**: Jest + fast-check (property-based testing)

### Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── checkin/     # Check-in related components
│   ├── navigation/  # Navigation components (tab bars)
│   ├── quickpicks/  # Quick picks chips
│   ├── shared/      # Shared components (logos, etc.)
│   └── venue/       # Venue-related components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Third-party library configurations
├── navigation/      # Navigation configuration
├── screens/         # Screen components
│   ├── auth/        # Authentication screens
│   ├── customer/    # Customer-facing screens
│   └── venue/       # Venue owner screens
├── services/        # API services and business logic
│   └── api/         # API service modules
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
    ├── constants/   # App constants
    └── formatting/  # Formatting utilities
```

---

## Custom Hooks

**Location:** `src/hooks/`

Custom hooks encapsulate business logic and provide reusable functionality across components.


### useVenues

**Location:** `src/hooks/useVenues.ts`

Fetches and manages venue data with search and filter support.

**Interface:**
```typescript
interface UseVenuesOptions {
  search?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  enabled?: boolean;
}

interface UseVenuesReturn {
  venues: Venue[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**Usage:**
```typescript
const { venues, loading, error, refetch } = useVenues({
  featured: true,
  limit: 10,
  enabled: true
});
```

**Features:**
- Automatic fetching on mount (if enabled)
- Search and filter support
- Manual refetch capability
- Error handling

---

### useFavorites

**Location:** `src/hooks/useFavorites.ts`

Manages user favorites with optimistic updates.

**Interface:**
```typescript
interface UseFavoritesReturn {
  favorites: FavoriteWithVenue[];
  loading: boolean;
  error: Error | null;
  toggleFavorite: (venueId: string) => Promise<void>;
  isFavorite: (venueId: string) => boolean;
  refetch: () => Promise<void>;
}
```

**Usage:**
```typescript
const { favorites, toggleFavorite, isFavorite, loading } = useFavorites();

// Check if venue is favorited
const isVenueFavorited = isFavorite('venue-123');

// Toggle favorite status
await toggleFavorite('venue-123');
```

**Features:**
- Optimistic UI updates
- Automatic state synchronization
- Batch favorite checking
- Error rollback on failure

---


### useCheckInStats

**Location:** `src/hooks/useCheckInStats.ts`

Fetches check-in statistics for venues.

**Interface:**
```typescript
interface UseCheckInStatsOptions {
  venueIds: string[];
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseCheckInStatsReturn {
  stats: Map<string, VenueCheckInStats>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**Usage:**
```typescript
const { stats, loading, error, refetch } = useCheckInStats({
  venueIds: ['venue-1', 'venue-2'],
  enabled: true,
  refetchInterval: 30000 // Refresh every 30 seconds
});

// Get stats for a specific venue
const venueStats = stats.get('venue-1');
```

**Features:**
- Batch fetching for multiple venues
- Automatic polling (optional)
- Real-time check-in counts
- User check-in status

---

### useCheckInActions

**Location:** `src/hooks/useCheckInActions.ts`

Provides check-in and check-out functionality with callbacks.

**Interface:**
```typescript
interface UseCheckInActionsOptions {
  onCheckInSuccess?: (checkIn: CheckIn) => void;
  onCheckOutSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseCheckInActionsReturn {
  checkIn: (venueId: string) => Promise<void>;
  checkOut: (checkInId: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}
```

**Usage:**
```typescript
const { checkIn, checkOut, loading } = useCheckInActions({
  onCheckInSuccess: (checkIn) => {
    Alert.alert('Success', 'Checked in!');
  },
  onCheckOutSuccess: () => {
    Alert.alert('Success', 'Checked out!');
  },
  onError: (error) => {
    Alert.alert('Error', error.message);
  }
});

// Check in to a venue
await checkIn('venue-123');

// Check out
await checkOut('checkin-456');
```

**Features:**
- Automatic user context
- Success/error callbacks
- Loading state management
- Automatic checkout from previous venue

---


### useCheckInHistory 🆕

**Location:** `src/hooks/useCheckInHistory.ts`

Fetches user's check-in history with pagination support.

**Interface:**
```typescript
interface UseCheckInHistoryOptions {
  enabled?: boolean;
  daysBack?: number; // Default: 30
}

interface UseCheckInHistoryReturn {
  checkIns: CheckInWithVenue[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}
```

**Usage:**
```typescript
const { 
  checkIns, 
  loading, 
  refetch, 
  loadMore, 
  hasMore 
} = useCheckInHistory({
  enabled: true,
  daysBack: 30
});

// Refresh history (pull-to-refresh)
await refetch();

// Load more (infinite scroll)
if (hasMore) {
  await loadMore();
}
```

**Features:**
- Automatic fetching on mount
- Pull-to-refresh support
- Infinite scroll pagination
- 30-day default filter (configurable)
- Includes complete venue details
- Descending chronological order

---

### useDebounce

**Location:** `src/hooks/useDebounce.ts`

Debounces a value to prevent excessive updates.

**Usage:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

// Use debouncedSearch for API calls
useEffect(() => {
  if (debouncedSearch) {
    searchVenues(debouncedSearch);
  }
}, [debouncedSearch]);
```

**Parameters:**
- `value` (T): Value to debounce
- `delay` (number): Delay in milliseconds

**Returns:** Debounced value

---

### useEngagementColor

**Location:** `src/hooks/useEngagementColor.ts`

Calculates engagement color based on check-in activity.

**Interface:**
```typescript
interface EngagementColorResult {
  color: string;
  label: string;
  level: 'low' | 'medium' | 'high' | 'very-high';
}
```

**Usage:**
```typescript
const { color, label, level } = useEngagementColor(activeCheckIns);
```

**Features:**
- Dynamic color calculation
- Engagement level labels
- Theme-aware colors

---


## React Contexts

**Location:** `src/contexts/`

React Contexts provide global state management across the application.

### AuthContext

**Location:** `src/contexts/AuthContext.tsx`

Manages authentication state and user session.

**Interface:**
```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: UserType | null; // 'customer' | 'venue_owner'
  venueBusinessAccount: any | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserType: () => Promise<void>;
}
```

**Usage:**
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, session, signIn, signOut, userType } = useAuth();
  
  if (!session) {
    return <LoginScreen />;
  }
  
  return (
    <View>
      <Text>Welcome, {user?.email}</Text>
      <Text>User Type: {userType}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

**Features:**
- Automatic session restoration
- User type detection (customer vs venue owner)
- Persistent authentication
- Auth state change listeners
- Minimum splash screen duration (2 seconds)
- AsyncStorage integration

**User Types:**
- `customer`: Regular app users
- `venue_owner`: Business owners with venue dashboard access

---

### ThemeContext

**Location:** `src/contexts/ThemeContext.tsx`

Manages app theme (light/dark mode) and provides theme colors.

**Interface:**
```typescript
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

interface Theme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    // ... more colors
  };
}
```

**Usage:**
```typescript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Current mode: {isDark ? 'Dark' : 'Light'}
      </Text>
      <Button title="Toggle Theme" onPress={toggleTheme} />
    </View>
  );
}
```

**Features:**
- Light and dark mode support
- Persistent theme preference
- Smooth theme transitions
- Comprehensive color palette

---


### LocationContext

**Location:** `src/contexts/LocationContext.tsx`

Manages user location and location permissions.

**Interface:**
```typescript
interface LocationContextType {
  location: LocationCoordinates | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  hasPermission: boolean;
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}
```

**Usage:**
```typescript
import { useLocation } from '../contexts/LocationContext';

function MyComponent() {
  const { location, loading, error, requestLocation, hasPermission } = useLocation();
  
  if (!hasPermission) {
    return <Button title="Enable Location" onPress={requestLocation} />;
  }
  
  return (
    <View>
      {location && (
        <Text>
          Lat: {location.latitude}, Lng: {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

**Features:**
- Automatic permission handling
- Location caching
- Error handling
- Platform-specific permission requests (Android/iOS)

---

### NavigationStyleContext

**Location:** `src/contexts/NavigationStyleContext.tsx`

Manages navigation bar style (floating vs regular).

**Interface:**
```typescript
interface NavigationStyleContextType {
  navigationStyle: 'floating' | 'regular';
  setNavigationStyle: (style: 'floating' | 'regular') => void;
}
```

**Usage:**
```typescript
import { useNavigationStyle } from '../contexts/NavigationStyleContext';

function SettingsScreen() {
  const { navigationStyle, setNavigationStyle } = useNavigationStyle();
  
  return (
    <View>
      <Button 
        title="Use Floating Tab Bar" 
        onPress={() => setNavigationStyle('floating')} 
      />
      <Button 
        title="Use Regular Tab Bar" 
        onPress={() => setNavigationStyle('regular')} 
      />
    </View>
  );
}
```

**Features:**
- Persistent style preference
- Dynamic tab bar switching
- Smooth transitions

---

### GridLayoutContext

**Location:** `src/contexts/GridLayoutContext.tsx`

Manages grid layout preferences for venue lists.

**Interface:**
```typescript
interface GridLayoutContextType {
  isGridLayout: boolean;
  toggleLayout: () => void;
}
```

**Usage:**
```typescript
import { useGridLayout } from '../contexts/GridLayoutContext';

function VenueList() {
  const { isGridLayout, toggleLayout } = useGridLayout();
  
  return (
    <View>
      <Button 
        title={isGridLayout ? 'List View' : 'Grid View'} 
        onPress={toggleLayout} 
      />
      {isGridLayout ? <GridView /> : <ListView />}
    </View>
  );
}
```

---


## Components

**Location:** `src/components/`

Reusable UI components organized by domain.

### Check-In Components

**Location:** `src/components/checkin/`

#### CheckInButton

Primary button for checking in/out of venues.

**Props:**
```typescript
interface CheckInButtonProps {
  venueId: string;
  isCheckedIn: boolean;
  checkInId?: string;
  onCheckInSuccess?: (checkIn: CheckIn) => void;
  onCheckOutSuccess?: () => void;
}
```

**Usage:**
```typescript
<CheckInButton
  venueId="venue-123"
  isCheckedIn={false}
  onCheckInSuccess={(checkIn) => console.log('Checked in!', checkIn)}
/>
```

**Features:**
- Automatic state management
- Loading indicators
- Error handling
- Success callbacks

---

#### CheckInModal

Modal dialog for check-in confirmation and feedback.

**Props:**
```typescript
interface CheckInModalProps {
  visible: boolean;
  venue: Venue;
  onClose: () => void;
  onCheckIn: () => Promise<void>;
}
```

**Usage:**
```typescript
<CheckInModal
  visible={showModal}
  venue={selectedVenue}
  onClose={() => setShowModal(false)}
  onCheckIn={handleCheckIn}
/>
```

**Features:**
- Venue information display
- Check-in confirmation
- User feedback collection
- Animated transitions

---

#### PulseLikeButton

Animated like button with pulse effect.

**Props:**
```typescript
interface PulseLikeButtonProps {
  liked: boolean;
  onPress: () => void;
  size?: number;
}
```

**Usage:**
```typescript
<PulseLikeButton
  liked={isLiked}
  onPress={handleLike}
  size={24}
/>
```

**Features:**
- Smooth animations
- Haptic feedback
- Customizable size

---

#### UserFeedback

Component for collecting user feedback on venues.

**Props:**
```typescript
interface UserFeedbackProps {
  venueId: string;
  onSubmit: (feedback: string) => Promise<void>;
}
```

**Usage:**
```typescript
<UserFeedback
  venueId="venue-123"
  onSubmit={handleFeedbackSubmit}
/>
```

---


### Venue Components

**Location:** `src/components/venue/`

#### TestVenueCard

Card component for displaying venue information.

**Props:**
```typescript
interface TestVenueCardProps {
  venue: Venue;
  onPress: () => void;
  showCheckInButton?: boolean;
}
```

**Usage:**
```typescript
<TestVenueCard
  venue={venue}
  onPress={() => navigation.navigate('VenueDetail', { venueId: venue.id })}
  showCheckInButton={true}
/>
```

**Features:**
- Venue image display
- Rating and category badges
- Check-in count
- Engagement indicators
- Tap to navigate

---

#### VenueCustomerCount

Displays current customer count with engagement color.

**Props:**
```typescript
interface VenueCustomerCountProps {
  count: number;
  maxCapacity?: number;
}
```

**Usage:**
```typescript
<VenueCustomerCount
  count={activeCheckIns}
  maxCapacity={venue.max_capacity}
/>
```

**Features:**
- Dynamic color based on capacity
- Engagement level indicators
- Animated count updates

---

#### VenueEngagementChip

Chip displaying venue engagement level.

**Props:**
```typescript
interface VenueEngagementChipProps {
  activeCheckIns: number;
  size?: 'small' | 'medium' | 'large';
}
```

**Usage:**
```typescript
<VenueEngagementChip
  activeCheckIns={15}
  size="medium"
/>
```

**Features:**
- Color-coded engagement levels
- Customizable sizes
- Smooth transitions

---

#### VenueCardDialog

Full-screen dialog for venue details.

**Props:**
```typescript
interface VenueCardDialogProps {
  visible: boolean;
  venue: Venue;
  onClose: () => void;
}
```

**Usage:**
```typescript
<VenueCardDialog
  visible={showDialog}
  venue={selectedVenue}
  onClose={() => setShowDialog(false)}
/>
```

**Features:**
- Full venue information
- Check-in functionality
- Image gallery
- Reviews and ratings
- Animated entrance/exit

---


### Navigation Components

**Location:** `src/components/navigation/`

#### NewFloatingTabBar

Floating tab bar with modern design and animations.

**Props:**
```typescript
interface TabBarProps {
  state: NavigationState;
  descriptors: any;
  navigation: any;
}
```

**Usage:**
```typescript
<Tab.Navigator
  tabBar={(props) => <NewFloatingTabBar {...props} />}
>
  {/* Tab screens */}
</Tab.Navigator>
```

**Features:**
- Floating design
- Smooth animations
- Active tab indicators
- Icon-based navigation
- Theme support

---

#### AnimatedTabBar

Regular tab bar with Reanimated 3 animations.

**Props:**
```typescript
interface TabBarProps {
  state: NavigationState;
  descriptors: any;
  navigation: any;
}
```

**Usage:**
```typescript
<Tab.Navigator
  tabBar={(props) => <AnimatedTabBar {...props} />}
>
  {/* Tab screens */}
</Tab.Navigator>
```

**Features:**
- Smooth transitions
- Active tab animations
- Label animations
- Theme support

---

### Quick Picks Components

**Location:** `src/components/quickpicks/`

#### QuickPickChip

Chip component for quick category filters.

**Props:**
```typescript
interface QuickPickChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress: () => void;
}
```

**Usage:**
```typescript
<QuickPickChip
  label="Coffee Shops"
  icon="coffee"
  selected={selectedCategory === 'coffee'}
  onPress={() => setSelectedCategory('coffee')}
/>
```

**Features:**
- Icon support
- Selected state
- Smooth animations
- Theme colors

---

### Shared Components

**Location:** `src/components/shared/`

#### OTWLogo

App logo component with customizable size.

**Props:**
```typescript
interface OTWLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon';
}
```

**Usage:**
```typescript
<OTWLogo size="large" variant="full" />
```

---


## Navigation

**Location:** `src/navigation/AppNavigator.tsx`

### Navigation Structure

```
AppNavigator (Root)
├── SplashScreen (initializing)
├── AuthScreen (not authenticated)
├── VenueDashboardScreen (venue owners)
└── MainTabNavigator (customers)
    ├── HomeStack
    │   ├── HomeList
    │   └── VenueDetail
    ├── SearchStack
    │   ├── SearchList
    │   └── VenueDetail
    └── SettingsStack
        ├── SettingsList
        └── Favorites
```

### Navigation Types

**Location:** `src/types/navigation.types.ts`

```typescript
type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Settings: undefined;
};

type HomeStackParamList = {
  HomeList: undefined;
  VenueDetail: { venueId: string };
};

type SearchStackParamList = {
  SearchList: undefined;
  VenueDetail: { venueId: string };
};

type SettingsStackParamList = {
  SettingsList: undefined;
  Favorites: undefined;
};
```

### Navigation Usage

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'HomeList'
>;

function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  const navigateToVenue = (venueId: string) => {
    navigation.navigate('VenueDetail', { venueId });
  };
  
  return (
    <View>
      <Button title="View Venue" onPress={() => navigateToVenue('venue-123')} />
    </View>
  );
}
```

### Route Parameters

Access route parameters in screen components:

```typescript
import { useRoute, RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../types';

type VenueDetailRouteProp = RouteProp<HomeStackParamList, 'VenueDetail'>;

function VenueDetailScreen() {
  const route = useRoute<VenueDetailRouteProp>();
  const { venueId } = route.params;
  
  return (
    <View>
      <Text>Venue ID: {venueId}</Text>
    </View>
  );
}
```

---


## Utilities

**Location:** `src/utils/`

### Formatting Utilities

**Location:** `src/utils/formatting/`

#### Time Formatting 🆕

**Location:** `src/utils/formatting/time.ts`

```typescript
// Format check-in timestamp as relative or absolute time
export function formatCheckInTime(timestamp: string): string

// Calculate and format duration between timestamps
export function formatDuration(
  startTime: string, 
  endTime: string | null
): string

// Format visit count with ordinal suffix
export function formatVisitCount(count: number): string
```

**Examples:**
```typescript
import { formatCheckInTime, formatDuration, formatVisitCount } from '../utils/formatting/time';

// Relative time formatting
formatCheckInTime('2026-01-12T10:00:00Z'); // "2 hours ago"
formatCheckInTime('2026-01-11T10:00:00Z'); // "Yesterday at 10:00 AM"
formatCheckInTime('2026-01-05T10:00:00Z'); // "Jan 5, 2026"

// Duration formatting
formatDuration('2026-01-12T10:00:00Z', '2026-01-12T12:30:00Z'); // "2h 30m"
formatDuration('2026-01-12T10:00:00Z', '2026-01-12T10:45:00Z'); // "45m"
formatDuration('2026-01-12T10:00:00Z', null); // "Currently checked in"

// Visit count formatting
formatVisitCount(1);  // "First visit"
formatVisitCount(2);  // "2nd visit"
formatVisitCount(3);  // "3rd visit"
formatVisitCount(10); // "10th visit"
```

**Features:**
- Relative time for recent check-ins (<7 days)
- Absolute dates for older check-ins
- Human-readable duration formatting
- Ordinal suffix generation
- Handles active check-ins (null end time)

---

#### Activity Formatting

**Location:** `src/utils/formatting/activity.ts`

```typescript
// Format activity level based on check-in count
export function formatActivityLevel(count: number): string

// Get engagement color based on activity
export function getEngagementColor(count: number): string
```

**Examples:**
```typescript
import { formatActivityLevel, getEngagementColor } from '../utils/formatting/activity';

formatActivityLevel(5);  // "Low"
formatActivityLevel(15); // "Medium"
formatActivityLevel(30); // "High"
formatActivityLevel(50); // "Very High"

getEngagementColor(5);  // "#4CAF50" (green)
getEngagementColor(30); // "#FF9800" (orange)
```

---

### Constants

**Location:** `src/utils/constants/`

#### Colors

**Location:** `src/utils/constants/colors.ts`

```typescript
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  // ... more colors
};
```

#### Spacing

**Location:** `src/utils/constants/spacing.ts`

```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

**Usage:**
```typescript
import { SPACING } from '../utils/constants/spacing';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
});
```

---


## Type Definitions

**Location:** `src/types/`

### User Types

**Location:** `src/types/user.types.ts`

```typescript
type UserType = 'customer' | 'venue_owner';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}
```

---

### Venue Types

**Location:** `src/types/venue.types.ts`

```typescript
interface Venue {
  id: string;
  name: string;
  description: string | null;
  category: string;
  location: string;
  image_url: string | null;
  rating: number;
  latitude: number | null;
  longitude: number | null;
  max_capacity: number | null;
  created_at: string;
  updated_at: string;
}

interface VenueInsert {
  name: string;
  description?: string;
  category: string;
  location: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  max_capacity?: number;
}
```

---

### Check-In Types

**Location:** `src/types/checkin.types.ts`

```typescript
interface CheckIn {
  id: string;
  venue_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CheckInWithVenue {
  id: string;
  venue_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  venue: {
    id: string;
    name: string;
    location: string;
    category: string;
    image_url: string | null;
    rating: number;
    latitude: number | null;
    longitude: number | null;
  };
}

interface VenueCheckInStats {
  venue_id: string;
  active_checkins: number;
  recent_checkins: number;
  user_is_checked_in: boolean;
  user_checkin_id?: string;
  user_checkin_time?: string;
}
```

---

### Favorite Types

```typescript
interface Favorite {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
}

interface FavoriteWithVenue extends Favorite {
  venue: Venue;
}
```

---


## Best Practices

### Component Development

1. **Use TypeScript**: Always define prop interfaces
```typescript
interface MyComponentProps {
  title: string;
  onPress: () => void;
  optional?: boolean;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onPress, optional }) => {
  // Component implementation
};
```

2. **Extract Custom Hooks**: Move business logic to custom hooks
```typescript
// ❌ Bad: Logic in component
function VenueList() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Fetch logic...
  }, []);
  
  return <FlatList data={venues} />;
}

// ✅ Good: Logic in custom hook
function VenueList() {
  const { venues, loading } = useVenues();
  return <FlatList data={venues} />;
}
```

3. **Use Contexts for Global State**: Avoid prop drilling
```typescript
// ✅ Good: Use context for auth state
const { user, session } = useAuth();

// ❌ Bad: Pass user through many components
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>
```

---

### Performance Optimization

1. **Memoize Expensive Computations**
```typescript
const sortedVenues = useMemo(() => {
  return venues.sort((a, b) => b.rating - a.rating);
}, [venues]);
```

2. **Use useCallback for Event Handlers**
```typescript
const handlePress = useCallback(() => {
  navigation.navigate('VenueDetail', { venueId });
}, [navigation, venueId]);
```

3. **Optimize FlatList Rendering**
```typescript
<FlatList
  data={venues}
  renderItem={renderVenueCard}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
/>
```

---

### Error Handling

1. **Always Handle Errors in Hooks**
```typescript
const { venues, loading, error } = useVenues();

if (error) {
  return <ErrorView message={error.message} onRetry={refetch} />;
}
```

2. **Use Try-Catch for Async Operations**
```typescript
const handleCheckIn = async () => {
  try {
    await checkIn(venueId);
    Alert.alert('Success', 'Checked in!');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

3. **Provide Fallback UI**
```typescript
{venue.image_url ? (
  <Image source={{ uri: venue.image_url }} />
) : (
  <PlaceholderImage />
)}
```

---

### Testing

1. **Write Unit Tests for Utilities**
```typescript
describe('formatCheckInTime', () => {
  it('formats recent times as relative', () => {
    const result = formatCheckInTime(twoHoursAgo);
    expect(result).toBe('2 hours ago');
  });
});
```

2. **Write Property-Based Tests for Core Logic**
```typescript
import fc from 'fast-check';

test('Property: 30-day filter', () => {
  fc.assert(
    fc.property(fc.array(fc.date()), (dates) => {
      const filtered = filterLast30Days(dates);
      return filtered.every(d => isWithin30Days(d));
    }),
    { numRuns: 100 }
  );
});
```

3. **Test Component Rendering**
```typescript
import { render, fireEvent } from '@testing-library/react-native';

test('CheckInButton calls onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <CheckInButton venueId="123" onPress={onPress} />
  );
  
  fireEvent.press(getByText('Check In'));
  expect(onPress).toHaveBeenCalled();
});
```

---


### State Management

1. **Use Local State for UI State**
```typescript
const [isModalVisible, setIsModalVisible] = useState(false);
const [selectedTab, setSelectedTab] = useState(0);
```

2. **Use Context for Global State**
```typescript
// Auth state, theme, location
const { user } = useAuth();
const { theme } = useTheme();
const { location } = useLocation();
```

3. **Use Custom Hooks for Data Fetching**
```typescript
const { venues, loading, refetch } = useVenues({ featured: true });
const { favorites, toggleFavorite } = useFavorites();
```

---

### Styling

1. **Use Theme Colors**
```typescript
const { theme } = useTheme();

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.text,
  },
});
```

2. **Use Constants for Spacing**
```typescript
import { SPACING } from '../utils/constants/spacing';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
});
```

3. **Create Reusable Style Objects**
```typescript
const commonStyles = {
  card: {
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};
```

---

### Accessibility

1. **Add Accessibility Labels**
```typescript
<TouchableOpacity
  accessibilityLabel="Check in to venue"
  accessibilityRole="button"
  onPress={handleCheckIn}
>
  <Text>Check In</Text>
</TouchableOpacity>
```

2. **Ensure Minimum Touch Targets**
```typescript
// Minimum 44x44 points for touch targets
const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
  },
});
```

3. **Support Screen Readers**
```typescript
<View accessible={true} accessibilityLabel="Venue rating: 4.5 stars">
  <Text>⭐ 4.5</Text>
</View>
```

---


## Common Patterns

### Data Fetching Pattern

```typescript
function MyScreen() {
  const { user } = useAuth();
  const { venues, loading, error, refetch } = useVenues({
    enabled: !!user,
    featured: true,
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView message={error.message} onRetry={refetch} />;
  }

  return (
    <FlatList
      data={venues}
      renderItem={({ item }) => <VenueCard venue={item} />}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refetch} />
      }
    />
  );
}
```

---

### Navigation Pattern

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

function VenueCard({ venue }: { venue: Venue }) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    navigation.navigate('VenueDetail', { venueId: venue.id });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{venue.name}</Text>
    </TouchableOpacity>
  );
}
```

---

### Form Handling Pattern

```typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, loading } = useAuth();

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}
      
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}
      
      <Button
        title="Sign In"
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
}
```

---

### Modal Pattern

```typescript
function MyScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const openModal = (venue: Venue) => {
    setSelectedVenue(venue);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVenue(null);
  };

  return (
    <View>
      <FlatList
        data={venues}
        renderItem={({ item }) => (
          <VenueCard venue={item} onPress={() => openModal(item)} />
        )}
      />
      
      {selectedVenue && (
        <VenueCardDialog
          visible={modalVisible}
          venue={selectedVenue}
          onClose={closeModal}
        />
      )}
    </View>
  );
}
```

---


### Pull-to-Refresh Pattern

```typescript
function VenueListScreen() {
  const { venues, loading, refetch } = useVenues();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={venues}
      renderItem={({ item }) => <VenueCard venue={item} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    />
  );
}
```

---

### Infinite Scroll Pattern

```typescript
function HistoryScreen() {
  const { 
    checkIns, 
    loading, 
    loadingMore, 
    hasMore, 
    loadMore 
  } = useCheckInHistory();

  const handleEndReached = () => {
    if (!loadingMore && hasMore) {
      loadMore();
    }
  };

  return (
    <FlatList
      data={checkIns}
      renderItem={({ item }) => <CheckInHistoryItem checkIn={item} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator /> : null
      }
    />
  );
}
```

---

### Optimistic Updates Pattern

```typescript
function FavoriteButton({ venueId }: { venueId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

  const isCurrentlyFavorited = optimisticState ?? isFavorite(venueId);

  const handleToggle = async () => {
    // Optimistic update
    setOptimisticState(!isCurrentlyFavorited);
    
    try {
      await toggleFavorite(venueId);
      setOptimisticState(null); // Reset to actual state
    } catch (error) {
      // Rollback on error
      setOptimisticState(null);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  return (
    <TouchableOpacity onPress={handleToggle}>
      <Icon
        name={isCurrentlyFavorited ? 'heart' : 'heart-outline'}
        size={24}
        color={isCurrentlyFavorited ? 'red' : 'gray'}
      />
    </TouchableOpacity>
  );
}
```

---


## Recent Updates

### January 2026

#### Check-In History Feature 🆕

- **New Hook**: `useCheckInHistory` - Fetches user's check-in history with pagination
- **New Utilities**: Time formatting functions in `src/utils/formatting/time.ts`
  - `formatCheckInTime()` - Relative/absolute time formatting
  - `formatDuration()` - Check-in duration calculation
  - `formatVisitCount()` - Ordinal visit count formatting
- **New Types**: `CheckInWithVenue`, `CheckInHistoryOptions`, `CheckInHistoryResponse`
- **Features**:
  - 30-day check-in history with pagination
  - Pull-to-refresh support
  - Infinite scroll
  - Visit count tracking per venue
  - Batch visit count fetching for performance

#### Testing Improvements

- Added property-based testing with fast-check
- 100+ iterations per property test
- Comprehensive test coverage for:
  - Time formatting utilities
  - Check-in history service
  - Custom hooks
  - Data filtering and sorting

---

## Troubleshooting

### Common Issues

#### 1. Session Not Persisting

**Problem**: User gets logged out after app restart

**Solution**: Ensure AsyncStorage is properly configured
```typescript
// Check AsyncStorage in AuthContext initialization
const keys = await AsyncStorage.getAllKeys();
const supabaseKeys = keys.filter(key => key.includes('supabase'));
console.log('Supabase keys:', supabaseKeys);
```

#### 2. Navigation Type Errors

**Problem**: TypeScript errors with navigation

**Solution**: Use proper type annotations
```typescript
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;
const navigation = useNavigation<NavigationProp>();
```

#### 3. Hook Dependencies Warning

**Problem**: React Hook useEffect has missing dependencies

**Solution**: Add all dependencies or use useCallback
```typescript
// ❌ Bad
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency

// ✅ Good
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ Also good with useCallback
const fetchData = useCallback(async () => {
  // fetch logic
}, [userId]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

#### 4. Geolocation Not Working in Tests

**Problem**: Tests fail with geolocation linking error

**Solution**: Mock geolocation in test setup
```typescript
// jest.setup.js
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
}));
```

---


## Development Workflow

### Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Start Android emulator
npm run emulator

# Run everything (emulator + metro + android)
npm run dev:full
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- useCheckInHistory.test.tsx

# Run with coverage
npm test -- --coverage
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Cleaning

```bash
# Clean Android build
npm run clean

# Clean Metro cache
npm run clean:metro

# Fresh start (clean + rebuild)
npm run fresh-start
```

---

## Code Organization Guidelines

### File Naming

- **Components**: PascalCase (e.g., `VenueCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useVenues.ts`)
- **Utilities**: camelCase (e.g., `formatTime.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `venue.types.ts`)
- **Tests**: Same as source with `.test.tsx` suffix (e.g., `VenueCard.test.tsx`)

### Import Order

```typescript
// 1. React and React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { useNavigation } from '@react-navigation/native';

// 3. Contexts
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// 4. Hooks
import { useVenues } from '../hooks/useVenues';

// 5. Components
import { VenueCard } from '../components/venue';

// 6. Utilities
import { formatCheckInTime } from '../utils/formatting/time';

// 7. Types
import type { Venue } from '../types';

// 8. Constants
import { SPACING } from '../utils/constants/spacing';
```

### Component Structure

```typescript
// 1. Imports
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Types
interface MyComponentProps {
  title: string;
  onPress: () => void;
}

// 3. Component
export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  // 3a. Hooks
  const { theme } = useTheme();
  const [state, setState] = useState(false);
  
  // 3b. Derived values
  const computedValue = useMemo(() => {
    return someExpensiveCalculation(state);
  }, [state]);
  
  // 3c. Event handlers
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);
  
  // 3d. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 3e. Render
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
};

// 4. Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

---


## Contributing

When adding new frontend features:

1. **Create Types First**: Define TypeScript interfaces in `src/types/`
2. **Build Services**: Add API methods in `src/services/api/`
3. **Create Custom Hooks**: Encapsulate logic in `src/hooks/`
4. **Build Components**: Create reusable UI in `src/components/`
5. **Create Screens**: Compose components in `src/screens/`
6. **Write Tests**: Add unit and property-based tests
7. **Update Documentation**: Document new hooks, components, and patterns

### Pull Request Checklist

- [ ] TypeScript types defined
- [ ] Custom hooks created for business logic
- [ ] Components are reusable and well-documented
- [ ] Tests written (unit + property-based where applicable)
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Accessibility labels added
- [ ] Theme support implemented
- [ ] Documentation updated

---

## Resources

### Official Documentation

- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/docs)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

### Testing

- [Jest](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [fast-check](https://fast-check.dev/) (Property-based testing)

### Tools

- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

---

## API Integration

For backend API integration, see [API Reference](./api-reference.md).

### Example: Fetching Venues

```typescript
import { VenueService } from '../services/api/venues';

// In a custom hook
export function useVenues(options: UseVenuesOptions) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await VenueService.getVenues({
        search: options.search,
        category: options.category,
        limit: options.limit,
      });
      setVenues(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.search, options.category, options.limit]);

  useEffect(() => {
    if (options.enabled !== false) {
      fetchVenues();
    }
  }, [fetchVenues, options.enabled]);

  return { venues, loading, error, refetch: fetchVenues };
}
```

---

**Last Updated:** January 12, 2026

