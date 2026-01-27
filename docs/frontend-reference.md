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

### useSearchMode 🆕

**Location:** `src/hooks/useSearchMode.ts`

Detects search mode based on @ prefix and cleans the query for the @ search feature.

**Interface:**
```typescript
interface UseSearchModeResult {
  mode: SearchMode; // 'venue' | 'user'
  cleanQuery: string;
}
```

**Usage:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const { mode, cleanQuery } = useSearchMode(searchQuery);

// Mode is 'user' when query starts with @, otherwise 'venue'
// cleanQuery has @ prefix removed for API calls

if (mode === 'user') {
  // Search for users with cleanQuery
  const users = await searchUsers(cleanQuery);
} else {
  // Search for venues with cleanQuery
  const venues = await searchVenues(cleanQuery);
}
```

**Parameters:**
- `searchQuery` (string): The raw search query from user input

**Returns:**
- `mode` (SearchMode): 'user' if query starts with @, otherwise 'venue'
- `cleanQuery` (string): Query with @ prefix removed (if present)

**Features:**
- Automatic mode detection based on @ prefix
- Query cleaning for API calls
- Memoized for performance
- Type-safe with SearchMode type

**Requirements:**
- 3.1: Detect user search mode when query starts with @
- 3.2: Use venue search mode when query doesn't start with @
- 3.3: Remove @ prefix before sending query to API

**Testing:**
- Comprehensive property-based test coverage in `useSearchMode.pbt.test.ts`
- 100+ iterations per property test validate correctness across all inputs
- Property 8 validates mode detection for any string input
- Property 9 validates @ prefix removal logic
- Additional properties test consistency, determinism, and idempotency
- Tests cover edge cases: empty strings, multiple @, special characters
- See [Testing Improvements](#testing-improvements) section for detailed test documentation

---

### useUsersQuery 🆕

**Location:** `src/hooks/queries/useUsersQuery.ts`

React Query hook for searching users by username or display name. Part of the @ search feature.

**Interface:**
```typescript
interface UseUsersQueryOptions {
  searchQuery: string;
  enabled?: boolean;
}

interface UseUsersQueryReturn {
  data: UserSearchResult[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**Usage:**
```typescript
const { data, isLoading, error } = useUsersQuery({
  searchQuery: 'john',
  enabled: true
});

// Conditionally enable search
const { data, isLoading } = useUsersQuery({
  searchQuery: query,
  enabled: query.length >= 2
});
```

**Parameters:**
- `searchQuery` (string): Search query to match against username and display_name
- `enabled` (boolean, optional): Whether to enable the query (default: true)

**Returns:**
- `data` (UserSearchResult[]): Array of matching user profiles
- `isLoading` (boolean): Loading state
- `error` (Error | null): Error state
- `refetch` (function): Manual refetch function

**Features:**
- Case-insensitive search on username and display_name fields
- Automatic caching with 30s stale time
- Filters out users without usernames
- Limits results to 20 users maximum
- Only queries when searchQuery is at least 2 characters
- Loading and error state management
- Manual refetch capability
- **Privacy-focused**: Only returns public profile fields (id, username, display_name, avatar_url)
- **Sensitive data protection**: Excludes email, preferences, and other private information
- **Error handling**: Comprehensive try-catch with detailed error logging
- **Network resilience**: Automatic retry on failure (2 retries with exponential backoff)
- **Retry strategy**: Exponential backoff starting at 1s, capped at 30s

**Error Handling:**
```typescript
// Errors are logged and re-thrown for React Query to handle
// Console logs include:
// - 'User search error:' for Supabase query errors
// - 'Unexpected error in user search:' for other errors
// Error messages are user-friendly: "Failed to search users: {error.message}"
```

**Retry Configuration:**
- Retries: 2 attempts on failure
- Retry delay: Exponential backoff (1s, 2s, 4s, capped at 30s)
- Formula: `Math.min(1000 * 2 ** attemptIndex, 30000)`

**Requirements:**
- 2.1: Search profiles table when query starts with @
- 2.2: Match against both username and display_name fields
- 2.3: Perform case-insensitive matching
- 2.4: Return results ordered by relevance
- 2.5: Limit results to maximum of 20 users
- 8.3: Handle network failures gracefully with retry logic
- 9.3: Only return public profile information in search results
- 9.4: Do not expose sensitive user data in search results

**Testing:**
- Comprehensive test coverage in `useUsersQuery.sensitiveData.test.ts`
- Validates field selection excludes sensitive data
- Ensures exactly 4 public fields per result
- Verifies no email, preferences, or private fields are exposed
- Property-based test coverage in `useUsersQuery.pbt.test.ts` (Property 17)
- 100+ iterations validate sensitive data exclusion across all search scenarios
- Tests field exclusion with various user data combinations
- Ensures privacy protection regardless of database content
- Error handling test coverage in `useUsersQuery.errorHandling.test.tsx`
- Validates network error handling, empty query handling, and loading states
- Tests authentication errors, RLS policy violations, and timeout scenarios
- Verifies graceful degradation and error message formatting

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

#### UserFeedback 🆕

**Location:** `src/components/checkin/UserFeedback.tsx`

Community feedback component for venues (Pulse system). Displays user-generated tags/vibes with like functionality.

**Props:**
```typescript
interface UserFeedbackProps {
  venue: Venue;
}
```

**Usage:**
```typescript
import { UserFeedback } from '../../components/checkin';

<UserFeedback venue={venue} />
```

**Features:**
- **Tag Display**: Shows all tags for a venue sorted by like count
- **Create Tags**: Authenticated users can create new tags (max 50 characters)
- **Like/Unlike**: Toggle likes on tags with optimistic UI updates
- **Duplicate Detection**: Prevents creating duplicate tags (case-insensitive)
- **Color-Coded Engagement**: Tags change color based on like count
  - 20+ likes: Hot orange-red (#FF4500)
  - 10-19 likes: Red (#FF6B6B)
  - 5-9 likes: Light red (#FF8A8A)
  - 0-4 likes: Default red (#FF6B6B)
- **Relative Timestamps**: Shows when tags were created (e.g., "2h", "1d")
- **Empty State**: Contextual empty state for venues with no tags
- **Loading State**: Shows loading indicator while fetching tags
- **Error Handling**: Gracefully handles missing database tables
- **Authentication**: Login required for creating and liking tags
- **Scrollable List**: Vertical scroll for long tag lists (max height 240pt)

**UI Components:**
- Header with Pulse icon and title
- Add button (authenticated users only)
- Create form with text input and submit button
- Tag cards with text, timestamp, and like button
- Empty state with icon and message

**Tag Card Layout:**
```
┌─────────────────────────────────────┐
│ Tag text here                       │
│ 2h                    ❤️ 15         │
└─────────────────────────────────────┘
```

**State Management:**
```typescript
const [tags, setTags] = useState<UserTag[]>([]);
const [loading, setLoading] = useState(true);
const [creating, setCreating] = useState(false);
const [newTagText, setNewTagText] = useState('');
const [showCreateForm, setShowCreateForm] = useState(false);
const [likingTags, setLikingTags] = useState<Set<string>>(new Set());
const [tablesExist, setTablesExist] = useState(true);
```

**API Integration:**
```typescript
// Load tags on mount
const loadTags = useCallback(async () => {
  const venueTags = await UserFeedbackService.getVenueTags(venue.id, user?.id);
  setTags(venueTags);
}, [venue.id, user?.id]);

// Create new tag
const handleCreateTag = async () => {
  const newTag = await UserFeedbackService.createTag(
    { venue_id: venue.id, tag_text: trimmedText },
    user.id
  );
  setTags(prev => [{ ...newTag, user_has_liked: false }, ...prev]);
};

// Toggle like on tag
const handleLikeTag = async (tagId: string) => {
  const result = await UserFeedbackService.toggleTagLike(tagId, user.id);
  setTags(prev => prev.map(tag =>
    tag.id === tagId
      ? { ...tag, user_has_liked: result.liked, like_count: result.newCount }
      : tag
  ));
};
```

**Validation:**
- Tag text required (trimmed)
- Max length: 50 characters
- Duplicate check (case-insensitive)
- Authentication required for create/like

**Used In:**
- `VenueDetailScreen` - Displayed as "Pulse" section

**Related Components:**
- `PulseLikeButton` - Like button with animation
- Uses `UserFeedbackService` for API calls
- Integrates with `AuthContext` for user state
- Integrates with `ThemeContext` for styling

**Database Tables:**
- `user_tags` - Tag data
- `tag_likes` - Like tracking

**Purpose**: Enables community-driven venue feedback where users share short vibes/tags and engage with others' tags through likes.

---


### Claim Button Components

**Location:** `src/components/ClaimButton/`

#### ClaimButton 🆕

**Location:** `src/components/ClaimButton/ClaimButton.tsx`

Interactive button for claiming flash offers directly from venue detail cards.

**Props:**
```typescript
interface ClaimButtonProps {
  offer: FlashOffer;
  userClaim: FlashOfferClaim | null;
  isCheckedIn: boolean;
  onNavigate?: (target: string) => void;
  compact?: boolean;
}
```

**Usage:**
```typescript
<ClaimButton
  offer={flashOffer}
  userClaim={userClaim}
  isCheckedIn={isCheckedIn}
  onNavigate={handleNavigation}
/>
```

**Features:**
- State-driven button that adapts based on eligibility
- Multiple button states: claimable, claimed, loading, not_checked_in, full, expired
- Integrated with useClaimFlashOfferMutation hook
- Optimistic UI updates for instant feedback
- Haptic feedback on successful claim
- Error handling with retry options
- Success modal with claim token display
- Navigation to ClaimDetailScreen for claimed offers
- Memoized for performance in scroll views

**Button States:**
- **Claimable**: Primary button, "Claim Offer" - user can claim
- **Claimed**: Success color with checkmark, "View Claim" - navigates to claim details
- **Loading**: Disabled with spinner, "Claiming..." - claim in progress
- **Not Checked In**: Secondary style, "Check In to Claim" - prompts check-in
- **Full**: Disabled gray, "Offer Full" - no claims remaining
- **Expired**: Disabled gray, "Expired" - offer no longer active

**State Derivation Priority:**
1. Loading (mutation in progress)
2. Claimed (user has claimed)
3. Not checked in (user must check in first)
4. Full (no claims remaining)
5. Expired (offer ended or cancelled)
6. Claimable (eligible to claim)

**Error Handling:**
- Eligibility errors: Clear messages explaining why claim failed
- Network errors: Retry option with connection guidance
- Timeout errors: Check claims option with status guidance
- Race condition errors: Appropriate message when offer becomes full
- Optimistic update rollback on failure

**Related Components:**
- `ClaimFeedbackModal` - Success confirmation modal
- `FlashOfferCard` - Integrates ClaimButton
- Uses `useClaimFlashOfferMutation` hook
- Uses `deriveClaimButtonState` utility

**Requirements:**
- Validates check-in status before allowing claim
- Enforces all eligibility requirements
- Provides immediate user feedback
- Handles edge cases gracefully

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

#### VenueSearchCard 🆕

**Location:** `src/components/venue/VenueSearchCard.tsx`

Reusable venue card component for search results and lists. Displays venue information in a compact, horizontal layout optimized for list views.

**Props:**
```typescript
interface VenueSearchCardProps {
  venue: Venue;
  onPress: () => void;
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}
```

**Usage:**
```typescript
import { VenueSearchCard } from '../../components/venue';

// Basic usage
<VenueSearchCard
  venue={venue}
  onPress={() => navigation.navigate('VenueDetail', { 
    venueId: venue.id, 
    venueName: venue.name 
  })}
/>

// With favorite button
<VenueSearchCard
  venue={venue}
  onPress={() => handleVenuePress(venue)}
  showFavoriteButton={true}
  isFavorite={isFavorite(venue.id)}
  onFavoritePress={() => toggleFavorite(venue.id)}
/>
```

**Features:**
- **Horizontal Layout**: Compact card design with image on left, content in center, chevron on right
- **Venue Image**: 80x80pt rounded image with fallback placeholder
- **Category Badge**: Colored badge displaying venue category
- **Location Display**: Icon + location text with truncation
- **Rating Display**: Star icon + numeric rating (formatted to 1 decimal)
- **Price Range**: Displays venue price range (e.g., "$", "$$", "$$$")
- **Optional Favorite Button**: Toggleable heart icon overlay on image
- **Navigation Chevron**: Right-pointing chevron indicating tappable card
- **Theme Support**: Fully integrated with ThemeContext for light/dark mode
- **Accessibility**: Proper touch targets and visual feedback

**Conditional Rendering Logic:**
The component includes robust defensive checks to handle missing or invalid data:
- **Rating**: Only displays when `venue.rating != null && venue.rating > 0`
  - Prevents showing "0.0" ratings or null values
  - Ensures only meaningful ratings are displayed
- **Price Range**: Only displays when `venue.price_range != null && venue.price_range !== ''`
  - Handles null, undefined, and empty string values
  - Prevents rendering empty price indicators

**Layout Structure:**
```
┌─────────────────────────────────────────────────┐
│ ┌────────┐  Venue Name          [Category]     │
│ │        │  📍 Location                      ›  │
│ │ Image  │  ⭐ 4.5  $$                          │
│ │  [♥]   │                                      │
│ └────────┘                                      │
└─────────────────────────────────────────────────┘
```

**Styling:**
- Container: 12pt padding, 12pt border radius, 1pt border
- Image: 80x80pt, 8pt border radius
- Favorite button: 24x24pt, positioned top-right of image with shadow
- Category badge: 8pt horizontal padding, 3pt vertical padding
- Metadata row: Items spaced with 12pt right margin (React Native compatible)
- Metadata icons: 4pt right margin for spacing from text
- Chevron: 20pt size, positioned at right edge

**Theme Integration:**
- Background: `theme.colors.surface`
- Border: `theme.colors.border`
- Text: `theme.colors.text` (primary), `theme.colors.textSecondary` (secondary)
- Category badge: `theme.colors.primary` with 20% opacity background
- Favorite icon: Red (#FF3B30) when active, `theme.colors.textSecondary` when inactive

**Used In:**
- `SearchScreen`: Venue search results with favorite button
- `FavoritesScreen`: User's favorited venues list
- Any screen requiring standardized venue list display

**Benefits:**
- Consistent venue display across the app
- Reduces code duplication
- Easier maintenance and updates
- Standardized user experience
- Reusable across multiple screens
- React Native compatible styling (uses marginRight instead of gap for broader compatibility)

**Implementation Notes:**
- Uses `marginRight` for spacing instead of CSS `gap` property for React Native compatibility
- Metadata items use 12pt right margin between elements
- Icons within metadata items use 4pt right margin from text
- This approach ensures consistent rendering across all React Native versions
- **Defensive null checks**: Rating and price range use explicit null/empty checks (`!= null`, `!== ''`) to prevent rendering invalid data
- **Type-safe conditionals**: Combines null checks with value validation (e.g., `rating > 0`) for robust data handling

**Related Components:**
- `TestVenueCard`: Alternative venue card with different layout
- `VenueCardDialog`: Full-screen venue details dialog
- `VenueEngagementChip`: Engagement level indicator

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

### Profile Components

**Location:** `src/components/profile/`

#### HeroSection

Hero section component for the profile screen displaying the user's profile photo, display name, username, and action buttons.

**Props:**
```typescript
interface HeroSectionProps {
  profileImageUri: string | null;
  username: string | null;
  displayName?: string | null;
  onCameraPress: () => void;
  onSettingsPress: () => void;
  isUploading?: boolean;
}
```

**Usage:**
```typescript
<HeroSection
  profileImageUri={user.profilePhotoUrl}
  username={user.username}
  displayName={user.display_name}
  onCameraPress={handlePhotoChange}
  onSettingsPress={handleSettingsPress}
  isUploading={isUploadingPhoto}
/>
```

**Features:**
- **Responsive Height**: Adapts to screen size (35-45% of screen height, min 300pt, max 500pt)
- **Profile Image Display**: Shows user's profile photo or app logo placeholder
- **Display Name Priority Logic**:
  - Primary text: display_name (if set), otherwise @username, otherwise "Anonymous"
  - Secondary text: @username (only shown when display_name exists)
- **Action Buttons**:
  - Camera button: Change profile photo
  - Settings button: Open settings menu
- **Loading State**: Shows activity indicator overlay during photo upload
- **Gradient Overlay**: Semi-transparent bottom overlay for text readability
- **Accessibility**: Full accessibility labels and hints for all interactive elements

**Display Name Logic:**
```typescript
// Priority: display_name (primary) with @username (secondary), or just @username, or fallback
const primaryText = displayName || (username ? `@${username}` : 'Anonymous');
const secondaryText = displayName && username ? `@${username}` : null;
```

**Responsive Height Calculation:**
- Small screens (< 667pt): 35% of screen height
- Medium screens (667-812pt): 40% of screen height
- Large screens (> 812pt): 45% of screen height
- Enforced bounds: minimum 300pt, maximum 500pt

**Requirements:**
- 1.1: Display profile photo with full-width layout
- 1.2: Show placeholder when no photo uploaded
- 1.5: Camera button for photo upload
- 1.6: Settings button for navigation
- 1.7: Username overlay at bottom-left
- 7.1: Responsive height adaptation
- 10.1: Prioritize display_name over username
- 10.4: Provide fallback when display_name not set

**Related Components:**
- Used in `ProfileScreen` as the hero section
- Integrates with `useProfilePhotoUpload` hook for photo management
- Works with display name utility from `src/utils/displayName.ts`

---


## Screens

**Location:** `src/screens/`

Screen components compose hooks and components to create full-page experiences.

### Customer Screens

**Location:** `src/screens/customer/`

#### SearchScreen 🆕

**Location:** `src/screens/customer/SearchScreen.tsx`

Unified search interface supporting simultaneous venue and user search.

**Features:**
- **Unified Search**: Fetches both venues and users when user is actively searching
- **Smart Query Handling**: Venue search activates with any search query, user search only activates with 2+ characters
- **Advanced Filtering**: Category, price range, and trending filters for venue search
- **Filter Drawer**: Side drawer with comprehensive filter options
- **Real-time Results**: Debounced search (300ms) to optimize performance
- **Error Handling**: Comprehensive error tracking for both venue and user queries
- **Debug Logging**: Console logging for venue data changes and error states
- **Result Display**:
  - Venue results: Image, name, category, location, rating, price range
  - User results: Avatar, display name, username with @ prefix
- **Navigation**:
  - Venue results navigate to VenueDetail screen
  - User results navigate to UserProfile screen
- **Empty States**: Context-aware empty states for both result types
- **Loading States**: Combined loading indicator for both queries

**Hooks Used:**
```typescript
// Memoize the filters object to prevent recreating on every render
// This optimization ensures the venueFilters object reference stays stable
const venueFilters = useMemo(() => ({ limit: 50 }), []);

// Debounce search query to optimize filtering and reduce API calls
// 300ms delay ensures we don't query on every keystroke
const debouncedSearchQuery = useDebounce(searchQuery, 300);

// Unified search: Always fetch both venues and users
// Venue search query - only enabled when there's a search query
const { data: venuesData, isLoading: venuesLoading, error: venuesError } = useVenuesQuery({ 
  filters: venueFilters,
  enabled: debouncedSearchQuery.length > 0, // Only fetch when user is searching
});

// Memoize venues array to prevent new reference on every render
// Includes debug logging to track venue data changes
const venues = useMemo(() => {
  console.log('📊 Venues data:', venuesData?.length || 0, 'venues');
  return venuesData || [];
}, [venuesData]);

// User search query - always enabled when there's a search query
// Searches profiles table for matching usernames and display names
const { data: usersData, isLoading: usersLoading, error: usersError } = useUsersQuery({
  searchQuery: debouncedSearchQuery,
  enabled: debouncedSearchQuery.length >= 2, // Only search users with 2+ characters
});

// Log errors for debugging
useEffect(() => {
  if (venuesError) {
    console.error('❌ Venues error:', venuesError);
  }
}, [venuesError]);

// Favorites management
const { toggleFavorite, isFavorite } = useFavorites();

// Combined loading state - show loading if either query is loading
const isLoading = venuesLoading || usersLoading;
```

**State Management:**
```typescript
// Search state
const [searchQuery, setSearchQuery] = useState('');
const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);

// Filter state
const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);
const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>(['all_prices']);

// UI state
const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
```

**Navigation:**
```typescript
// Navigate to venue details
const handleVenuePress = (venue: Venue) => {
  navigation.navigate('VenueDetail', {
    venueId: venue.id,
    venueName: venue.name,
  });
};

// Navigate to user profile
const handleUserPress = (user: UserSearchResult) => {
  navigation.navigate('UserProfile', {
    userId: user.id,
  });
};
```

**Venue Filtering:**
- Category filters (Fast Food, Fine Dining, Coffee Shops, etc.)
- Price range filters ($, $$, $$$, $$$$)
- Trending filters (Open Now, Highly Rated, Budget Friendly)
- Text search across name, category, location, and description (minimum 2 characters required)
- Multi-select support for categories and price ranges
- **Filter activation logic**: Filters are applied when search query has 2+ characters OR when any non-default filters are active (categories other than 'All', filters other than 'all', or price ranges other than 'all_prices')

**User Search:**
- Activated when search query has 2+ characters
- Case-insensitive matching on username and display_name
- Results limited to 20 users
- Displays avatar with fallback placeholder
- Shows display_name or username as primary text
- Shows @username as secondary text

**UI Components:**
- Search input with clear button
- Filter button with active indicator badge
- Results counter (X venues/users found)
- Animated filter drawer
- FlatList with pull-to-refresh
- Empty state with helpful messaging

**Search Behavior:**
- Venues are only fetched when there's an active search query
- User search activates when query length >= 2 characters
- Venue text search filtering requires minimum 2 characters to avoid matching too many results
- **Filter application logic**: Venue filters are applied when search query has 2+ characters OR when any non-default filters are active
  - This ensures filters work independently of search text
  - Allows users to browse filtered results without typing a search query
  - Prevents showing unfiltered results when search query is too short (< 2 characters) and no filters are active
- Both result types can be displayed simultaneously
- Debounced search (300ms) reduces API calls
- Combined loading state shows when either query is loading
- **Loading indicator is conditional**: Only displays when `searchQuery.length > 0` AND `isLoading` is true
- **Results display is conditional**: FlatList only renders results when `searchQuery.length > 0`, showing an empty array otherwise
- This prevents showing loading state or stale results when the search input is empty/cleared

**Result Rendering Logic:**
```typescript
// Loading state only displays when actively searching
// This prevents showing spinner when search input is empty
{isLoading && searchQuery.length > 0 ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
      Searching...
    </Text>
  </View>
) : (
  // FlatList data prop conditionally renders results based on search query
  <FlatList
    data={
      searchQuery.length > 0
        ? [
            ...(usersData && usersData.length > 0 ? [{ type: 'section', title: 'Users' }] : []),
            ...(usersData || []).map(user => ({ type: 'user', data: user })),
            ...(filteredVenues.length > 0 ? [{ type: 'section', title: 'Venues' }] : []),
            ...filteredVenues.map(venue => ({ type: 'venue', data: venue })),
          ]
        : [] // Empty array when no search query
    }
    // ... other FlatList props
  />
)}
```

**Benefits of Conditional Rendering:**
- Prevents displaying outdated results after clearing search
- Prevents showing loading spinner when search input is empty
- Provides cleaner UX when user clears the search input
- Ensures results list is always in sync with search query state
- Reduces unnecessary rendering when no search is active
- Improves perceived performance by only showing loading state during active searches

**Debugging & Monitoring:**
The SearchScreen includes built-in debugging capabilities to help track data flow and diagnose issues:

```typescript
// Venue data logging
// Logs venue count whenever venuesData changes
// Format: "📊 Venues data: X venues"
const venues = useMemo(() => {
  console.log('📊 Venues data:', venuesData?.length || 0, 'venues');
  return venuesData || [];
}, [venuesData]);

// Error logging
// Automatically logs venue query errors to console
// Format: "❌ Venues error: [error details]"
useEffect(() => {
  if (venuesError) {
    console.error('❌ Venues error:', venuesError);
  }
}, [venuesError]);
```

**Debug Output Examples:**
- `📊 Venues data: 25 venues` - Successful venue fetch
- `📊 Venues data: 0 venues` - Empty result set
- `❌ Venues error: Network request failed` - Network error
- `❌ Venues error: RLS policy violation` - Permission error

**Monitoring Use Cases:**
- Track when venue data updates occur
- Identify query performance issues
- Diagnose empty result problems
- Debug filter application issues
- Monitor error patterns in production

---


## Navigation

**Location:** `src/navigation/AppNavigator.tsx`

### Navigation Structure

```
AppNavigator (Root)
├── SplashScreen (initializing)
├── AuthScreen (not authenticated)
├── VenueStack (venue owners)
│   ├── VenueDashboard
│   ├── FlashOfferList
│   ├── FlashOfferDetail
│   ├── FlashOfferCreation
│   └── TokenRedemption
└── MainTabNavigator (customers)
    ├── HomeStack
    │   ├── HomeList
    │   ├── VenueDetail
    │   ├── VenueReviews
    │   ├── FlashOfferDetail
    │   └── ClaimConfirmation
    ├── SearchStack
    │   ├── SearchList
    │   ├── VenueDetail
    │   └── UserProfile 🆕
    ├── FavoritesStack
    │   ├── FavoritesList
    │   └── VenueDetail
    ├── HistoryStack
    │   ├── HistoryList
    │   └── VenueDetail
    └── ProfileStack
        ├── ProfileMain
        ├── Settings
        └── SettingsStack
            ├── SettingsList
            ├── Favorites
            ├── Profile
            ├── MyClaims
            ├── ClaimDetail
            ├── NotificationSettings
            └── FlashOffersHelp
```

### Navigation Types

**Location:** `src/types/navigation.types.ts`

```typescript
// Root tab navigation types
export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  History: undefined;
  Profile: undefined;
};

// Home stack navigation types
export type HomeStackParamList = {
  HomeList: undefined;
  VenueDetail: { venueId: string; venueName: string };
  VenueReviews: { venueId: string; venueName: string };
  FlashOfferDetail: { offerId: string; venueName?: string };
  ClaimConfirmation: { 
    claim: any; // FlashOfferClaim type
    offerTitle: string; 
    venueName: string;
  };
};

// Search stack navigation types
export type SearchStackParamList = {
  SearchList: undefined;
  VenueDetail: { venueId: string; venueName: string };
  UserProfile: { userId: string };
};

// Favorites stack navigation types
export type FavoritesStackParamList = {
  FavoritesList: undefined;
  VenueDetail: { venueId: string; venueName: string };
};

// History stack navigation types
export type HistoryStackParamList = {
  HistoryList: undefined;
  VenueDetail: { venueId: string; venueName: string };
};

// Profile stack navigation types
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Favorites: undefined;
};

// Settings stack navigation types
export type SettingsStackParamList = {
  SettingsList: undefined;
  Favorites: undefined;
  Profile: undefined;
  MyClaims: undefined;
  ClaimDetail: { claimId: string };
  NotificationSettings: undefined;
  FlashOffersHelp: undefined;
};

// Venue stack navigation types
export type VenueStackParamList = {
  VenueDashboard: undefined;
  FlashOfferList: undefined;
  FlashOfferDetail: { offerId: string };
  FlashOfferCreation: undefined;
  TokenRedemption: undefined;
};
```

### Navigation Usage

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList, SearchStackParamList } from '../types/navigation.types';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'HomeList'
>;

function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  const navigateToVenue = (venueId: string, venueName: string) => {
    navigation.navigate('VenueDetail', { venueId, venueName });
  };
  
  const navigateToReviews = (venueId: string, venueName: string) => {
    navigation.navigate('VenueReviews', { venueId, venueName });
  };
  
  const navigateToFlashOffer = (offerId: string, venueName?: string) => {
    navigation.navigate('FlashOfferDetail', { offerId, venueName });
  };
  
  return (
    <View>
      <Button 
        title="View Venue" 
        onPress={() => navigateToVenue('venue-123', 'Coffee Shop')} 
      />
      <Button 
        title="View Reviews" 
        onPress={() => navigateToReviews('venue-123', 'Coffee Shop')} 
      />
      <Button 
        title="View Flash Offer" 
        onPress={() => navigateToFlashOffer('offer-456', 'Coffee Shop')} 
      />
    </View>
  );
}

// Example: SearchScreen with @ search feature
type SearchScreenNavigationProp = NativeStackNavigationProp<
  SearchStackParamList,
  'SearchList'
>;

function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  
  const navigateToVenue = (venueId: string, venueName: string) => {
    navigation.navigate('VenueDetail', { venueId, venueName });
  };
  
  const navigateToUserProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };
  
  return (
    <View>
      <Button 
        title="View Venue" 
        onPress={() => navigateToVenue('venue-123', 'Coffee Shop')} 
      />
      <Button 
        title="View User Profile" 
        onPress={() => navigateToUserProfile('user-456')} 
      />
    </View>
  );
}

// Example: Navigating to UserProfile from user search results
function UserSearchResultItem({ user }: { user: UserSearchResult }) {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  
  const handlePress = () => {
    navigation.navigate('UserProfile', { userId: user.id });
  };
  
  return (
    <TouchableOpacity onPress={handlePress}>
      <Image source={{ uri: user.avatar_url || placeholderAvatar }} />
      <Text>{user.display_name || user.username}</Text>
      <Text>@{user.username}</Text>
    </TouchableOpacity>
  );
}
```

### Route Parameters

Access route parameters in screen components:

```typescript
import { useRoute, RouteProp } from '@react-navigation/native';
import type { HomeStackParamList, SearchStackParamList, SettingsStackParamList } from '../types/navigation.types';

// Example 1: VenueDetail screen
type VenueDetailRouteProp = RouteProp<HomeStackParamList, 'VenueDetail'>;

function VenueDetailScreen() {
  const route = useRoute<VenueDetailRouteProp>();
  const { venueId, venueName } = route.params;
  
  return (
    <View>
      <Text>Venue: {venueName}</Text>
      <Text>ID: {venueId}</Text>
    </View>
  );
}

// Example 2: UserProfile screen (@ search feature)
type UserProfileRouteProp = RouteProp<SearchStackParamList, 'UserProfile'>;

function UserProfileScreen() {
  const route = useRoute<UserProfileRouteProp>();
  const { userId } = route.params;
  
  return (
    <View>
      <Text>User ID: {userId}</Text>
    </View>
  );
}

// Example 3: ClaimDetail screen with single parameter
type ClaimDetailRouteProp = RouteProp<SettingsStackParamList, 'ClaimDetail'>;

function ClaimDetailScreen() {
  const route = useRoute<ClaimDetailRouteProp>();
  const { claimId } = route.params;
  
  return (
    <View>
      <Text>Claim ID: {claimId}</Text>
    </View>
  );
}

// Example 4: ClaimConfirmation screen with complex parameters
type ClaimConfirmationRouteProp = RouteProp<HomeStackParamList, 'ClaimConfirmation'>;

function ClaimConfirmationScreen() {
  const route = useRoute<ClaimConfirmationRouteProp>();
  const { claim, offerTitle, venueName } = route.params;
  
  return (
    <View>
      <Text>Offer: {offerTitle}</Text>
      <Text>Venue: {venueName}</Text>
      <Text>Claim ID: {claim.id}</Text>
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

### Display Name Utility 🆕

**Location:** `src/utils/displayName.ts`

Provides functions for determining the appropriate display name for a user based on available profile fields with priority logic.

**Interface:**
```typescript
interface UserDisplayInfo {
  username?: string | null;
  display_name?: string | null;
  name?: string | null;
}

function getDisplayName(user: UserDisplayInfo): string
```

**Usage:**
```typescript
import { getDisplayName } from '../utils/displayName';

// User with display_name
const user1 = { 
  username: 'johndoe', 
  display_name: 'John Doe', 
  name: 'John' 
};
getDisplayName(user1); // "John Doe"

// User with only username
const user2 = { 
  username: 'johndoe', 
  display_name: null, 
  name: null 
};
getDisplayName(user2); // "johndoe"

// User with only name
const user3 = { 
  username: null, 
  display_name: null, 
  name: 'John' 
};
getDisplayName(user3); // "John"

// User with no display information
const user4 = { 
  username: null, 
  display_name: null, 
  name: null 
};
getDisplayName(user4); // "Anonymous"
```

**Priority Logic:**
1. **display_name** (highest priority) - User's custom display name
2. **username** - User's unique username
3. **name** - User's profile name
4. **"Anonymous"** (fallback) - When all fields are null

**Features:**
- Type-safe with TypeScript interface
- Handles null and undefined values gracefully
- Clear priority hierarchy for display name selection
- Consistent fallback behavior
- Used in user search results and profile displays

**Requirements:**
- 10.1: Prioritize display_name over username when both exist
- 10.4: Provide fallback when display_name is not set

**Related Components:**
- Used in `SearchScreen` for user result display
- Used in user profile components
- Used in social features (friends list, activity feed)

---

### Username Validation Utility 🆕

**Location:** `src/utils/usernameValidation.ts`

Provides validation and normalization functions for usernames in the @ search feature. Ensures usernames meet format requirements before storage.

**Interface:**
```typescript
enum UsernameValidationError {
  REQUIRED = 'Username is required',
  TOO_SHORT = 'Username must be at least 3 characters',
  TOO_LONG = 'Username must be at most 30 characters',
  INVALID_CHARACTERS = 'Username can only contain lowercase letters, numbers, and underscores',
}

interface UsernameValidationResult {
  isValid: boolean;
  error?: UsernameValidationError;
}

function validateUsername(username: string): UsernameValidationResult
function normalizeUsername(username: string): string
```

**Usage:**
```typescript
import { 
  validateUsername, 
  normalizeUsername, 
  UsernameValidationError 
} from '../utils/usernameValidation';

// Validate username
const result = validateUsername('john_doe');
if (result.isValid) {
  console.log('Username is valid');
} else {
  console.error(result.error);
}

// Normalize username (convert to lowercase and trim)
const normalized = normalizeUsername('JohnDoe');
console.log(normalized); // 'johndoe'

// Handle validation errors
const invalidResult = validateUsername('ab');
if (!invalidResult.isValid) {
  switch (invalidResult.error) {
    case UsernameValidationError.TOO_SHORT:
      alert('Username must be at least 3 characters');
      break;
    case UsernameValidationError.INVALID_CHARACTERS:
      alert('Username can only contain lowercase letters, numbers, and underscores');
      break;
    // ... handle other errors
  }
}
```

**Validation Rules:**

The validation function checks rules in this specific order for optimal user experience:

1. **Required**: Username cannot be empty, null, or undefined
2. **Characters**: Only lowercase letters (a-z), numbers (0-9), and underscores (_) - *checked first for better UX*
3. **Minimum Length**: Must be at least 3 characters
4. **Maximum Length**: Must be at most 30 characters
5. **Format**: Final result must match regex `^[a-z0-9_]{3,30}$`

**Validation Order Rationale:**
- Character validation is performed **before** length validation
- This provides better user feedback - users learn format rules before length constraints
- Example: Input "A" fails with "invalid characters" (more helpful) rather than "too short"

**Normalization:**
- Converts to lowercase
- Trims leading and trailing whitespace
- Idempotent (normalizing twice produces same result)

**Features:**
- Type-safe error handling with enum
- Clear validation error messages
- Optimized validation order (character format checked before length)
- Better UX through early format feedback
- Separate validation and normalization functions
- Handles edge cases (null, undefined, empty strings)
- Deterministic and consistent results
- Comprehensive property-based test coverage

**Requirements:**
- 1.3: Username format validation (alphanumeric + underscore)
- 1.4: Username length validation (3-30 characters)
- 1.5: Username lowercase transformation
- 6.1: Client-side validation before submission
- 6.2: User-friendly error messages
- 6.4: Real-time validation feedback

**Testing:**
- Property-based tests in `src/utils/__tests__/usernameValidation.pbt.test.ts`
- 100+ iterations per property test
- Validates correctness across all possible inputs
- See [Property-Based Testing](#property-based-testing-for-username-validation) section below

**Related Components:**
- Used in user profile edit forms
- Used in username setup flows
- Integrated with database trigger for server-side enforcement

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

### Search Types 🆕

**Location:** `src/types/search.types.ts`

Types for the @ search feature that enables searching for both venues and users.

```typescript
// Search mode type
// - 'venue': Default search mode for finding venues
// - 'user': User search mode triggered by @ prefix
type SearchMode = 'venue' | 'user';

// User search result type
// Contains minimal user profile information for search results
interface UserSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Search state type
// Manages the complete search state including mode, queries, and results
interface SearchState {
  mode: SearchMode;
  query: string;
  debouncedQuery: string;
  isLoading: boolean;
  venueResults: Venue[];
  userResults: UserSearchResult[];
}
```

**Usage:**
```typescript
import type { SearchMode, UserSearchResult, SearchState } from '../types/search.types';

// Detect search mode based on query
const mode: SearchMode = query.startsWith('@') ? 'user' : 'venue';

// Handle user search results
const users: UserSearchResult[] = await searchUsers(cleanQuery);

// Manage complete search state
const [searchState, setSearchState] = useState<SearchState>({
  mode: 'venue',
  query: '',
  debouncedQuery: '',
  isLoading: false,
  venueResults: [],
  userResults: [],
});
```

**Features:**
- Dual search modes (venue and user search)
- Minimal user data exposure for privacy
- Complete search state management
- Type-safe search result handling

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

4. **Manage Timers Properly in Tests** 🆕

Always use fake timers and clean them up to prevent Jest from hanging:

```typescript
describe('MyComponent with timers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('handles delayed operations', () => {
    const callback = jest.fn();
    
    // Instead of: await new Promise(resolve => setTimeout(resolve, 100))
    // Use fake timers:
    setTimeout(callback, 100);
    jest.advanceTimersByTime(100);
    
    expect(callback).toHaveBeenCalled();
  });
});
```

**Timer Cleanup Best Practices:**

- **Always use `jest.useFakeTimers()`** in `beforeEach` for tests with `setTimeout` or `setInterval`
- **Always clean up** with `jest.runOnlyPendingTimers()` and `jest.useRealTimers()` in `afterEach`
- **Avoid real delays** in tests - use `jest.advanceTimersByTime()` instead of `await new Promise(resolve => setTimeout(resolve, delay))`
- **Use `waitFor` from @testing-library** for async assertions instead of manual delays
- **Global cleanup** is configured in `jest.setup.after.js` as a safety net

**Example: Converting setTimeout to fake timers**

```typescript
// ❌ Bad: Real timer that blocks test execution
it('waits for state update', async () => {
  render(<MyComponent />);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// ✅ Good: Fake timers for instant execution
it('waits for state update', () => {
  jest.useFakeTimers();
  render(<MyComponent />);
  jest.advanceTimersByTime(100);
  expect(screen.getByText('Updated')).toBeInTheDocument();
  jest.useRealTimers();
});

// ✅ Better: Use waitFor for async assertions
it('waits for state update', async () => {
  render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument();
  }, { timeout: 100 });
});
```

**Why This Matters:**

- Prevents Jest from hanging after tests complete
- Eliminates real delays in test execution (tests run instantly)
- Improves test reliability and determinism
- Reduces total test suite execution time by 5-10 seconds

**Files with Timer Cleanup:**

The following test files properly implement timer cleanup:
- `src/lib/__tests__/cachePersistence.test.ts` - Cache persistence with 100ms delays
- `src/services/__tests__/FCMService.retry.test.ts` - FCM retry logic with exponential backoff

See `TIMER_CLEANUP_ANALYSIS.md` for a comprehensive analysis of timer usage across the test suite.

---

### Property-Based Testing for Username Validation 🆕

**Location:** `src/utils/__tests__/usernameValidation.pbt.test.ts`

Comprehensive property-based tests for username validation using fast-check. These tests validate correctness across all possible inputs with 100+ iterations per property.

**Test Coverage:**

#### Property 1: Username Character Validation
**Validates:** Requirements 1.3

Tests that usernames with invalid characters are properly rejected:
- Rejects usernames with uppercase letters
- Rejects usernames with special characters (anything other than a-z, 0-9, _)
- Accepts usernames with only valid characters (lowercase letters, numbers, underscores)

```typescript
// Example test
it('should reject usernames with invalid characters (uppercase letters)', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 3, maxLength: 30 })
        .filter((s) => /[A-Z]/.test(s)), // Contains uppercase
      (username) => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 2: Username Length Validation
**Validates:** Requirements 1.4

Tests that username length constraints are properly enforced:
- Rejects usernames shorter than 3 characters
- Rejects usernames longer than 30 characters
- Accepts usernames with length between 3 and 30 characters (inclusive)
- Accepts usernames at boundary lengths (exactly 3 and 30 characters)

```typescript
// Example test
it('should accept usernames with length between 3 and 30 characters', () => {
  fc.assert(
    fc.property(
      fc.stringMatching(/^[a-z0-9_]{3,30}$/), // Valid length and characters
      (username) => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(username.length).toBeGreaterThanOrEqual(3);
        expect(username.length).toBeLessThanOrEqual(30);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 3: Username Lowercase Transformation
**Validates:** Requirements 1.5

Tests that usernames are properly normalized to lowercase:
- Normalizes usernames with uppercase letters to all lowercase
- Preserves already-lowercase usernames during normalization
- Trims whitespace during normalization
- Handles mixed case strings consistently (idempotent)

```typescript
// Example test
it('should normalize usernames to lowercase', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 3, maxLength: 30 })
        .filter((s) => /[A-Z]/.test(s)), // Contains uppercase
      (username) => {
        const normalized = normalizeUsername(username);
        expect(normalized).toBe(username.toLowerCase().trim());
        expect(/[A-Z]/.test(normalized)).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Additional Property: Empty and Null Handling

Tests robust handling of edge cases:
- Rejects null values
- Rejects undefined values
- Rejects empty strings
- Rejects whitespace-only strings

```typescript
it('should reject null, undefined, and empty strings', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(null, undefined, '', '   ', '\t', '\n'),
      (username) => {
        const result = validateUsername(username as any);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(UsernameValidationError.REQUIRED);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Additional Property: Validation Consistency

Ensures validation is deterministic:
- Returns consistent results for the same input
- Multiple validations produce identical results
- No randomness or side effects

```typescript
it('should return consistent results for the same input', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 0, maxLength: 50 }),
      (username) => {
        const result1 = validateUsername(username);
        const result2 = validateUsername(username);
        const result3 = validateUsername(username);
        
        expect(result1.isValid).toBe(result2.isValid);
        expect(result1.isValid).toBe(result3.isValid);
        expect(result1.error).toBe(result2.error);
        expect(result1.error).toBe(result3.error);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Test Execution:**
```bash
# Run username validation property tests
npm test -- usernameValidation.pbt.test.ts

# Run with verbose output
npm test -- usernameValidation.pbt.test.ts --verbose

# Run with coverage
npm test -- usernameValidation.pbt.test.ts --coverage
```

**Benefits of Property-Based Testing:**
- Tests thousands of input combinations automatically
- Discovers edge cases that manual tests might miss
- Validates universal properties across all inputs
- Provides high confidence in correctness
- Complements unit tests with broader coverage

**Related Files:**
- Implementation: `src/utils/usernameValidation.ts`
- Property-based tests: `src/utils/__tests__/usernameValidation.pbt.test.ts`
- Unit tests: `src/utils/__tests__/usernameValidation.test.ts`
- Feature spec: `.kiro/specs/at-search-feature/`

---

### Property-Based Testing for Display Name Utility 🆕

**Location:** `src/utils/__tests__/displayName.pbt.test.ts`

Comprehensive property-based tests for the display name utility using fast-check. These tests validate the priority logic and fallback behavior across all possible user profile combinations with 100+ iterations per property.

**Test Coverage:**

#### Property 18: Display Name Priority and Fallback
**Validates:** Requirements 10.1, 10.4

Tests the complete priority hierarchy for determining user display names:
1. display_name (highest priority)
2. username (fallback when display_name is null)
3. name (fallback when both display_name and username are null)
4. "Anonymous" (final fallback when all fields are null)

**Sub-Properties:**

##### 18.1: Prioritize display_name when present
Tests that display_name is always used when available, regardless of other fields:
```typescript
it('should prioritize display_name when present', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }), // display_name (non-empty)
      fc.option(fc.string(), { nil: null }), // username (optional)
      fc.option(fc.string(), { nil: null }), // name (optional)
      (display_name, username, name) => {
        const user: UserDisplayInfo = {
          display_name: display_name.trim() ? display_name : null,
          username,
          name,
        };
        const result = getDisplayName(user);
        
        if (display_name.trim()) {
          expect(result).toBe(display_name.trim());
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.2: Use username when display_name is null
Tests that username is used as fallback when display_name is not available:
```typescript
it('should use username when display_name is null or empty', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }), // username (non-empty)
      fc.option(fc.string(), { nil: null }), // name (optional)
      (username, name) => {
        const user: UserDisplayInfo = {
          display_name: null,
          username: username.trim() ? username : null,
          name,
        };
        const result = getDisplayName(user);
        
        if (username.trim()) {
          expect(result).toBe(username.trim());
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.3: Use name when both display_name and username are null
Tests that name field is used when higher-priority fields are unavailable:
```typescript
it('should use name when both display_name and username are null', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }), // name (non-empty)
      (name) => {
        const user: UserDisplayInfo = {
          display_name: null,
          username: null,
          name: name.trim() ? name : null,
        };
        const result = getDisplayName(user);
        
        if (name.trim()) {
          expect(result).toBe(name.trim());
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.4: Return "Anonymous" when all fields are null
Tests the final fallback behavior:
```typescript
it('should return "Anonymous" when all fields are null or empty', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(null, '', '   ', '\t', '\n'), // Various empty values
      fc.constantFrom(null, '', '   ', '\t', '\n'),
      fc.constantFrom(null, '', '   ', '\t', '\n'),
      (display_name, username, name) => {
        const user: UserDisplayInfo = {
          display_name,
          username,
          name,
        };
        const result = getDisplayName(user);
        expect(result).toBe('Anonymous');
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.5: Handle null or undefined user object
Tests robustness with invalid inputs:
```typescript
it('should handle null or undefined user object', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(null, undefined),
      (user) => {
        const result = getDisplayName(user);
        expect(result).toBe('Anonymous');
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.6: Always return non-empty string
Tests that the function never returns empty values:
```typescript
it('should always return a non-empty string', () => {
  fc.assert(
    fc.property(
      fc.option(fc.string(), { nil: null }),
      fc.option(fc.string(), { nil: null }),
      fc.option(fc.string(), { nil: null }),
      (display_name, username, name) => {
        const user: UserDisplayInfo = {
          display_name,
          username,
          name,
        };
        const result = getDisplayName(user);
        
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.7: Trim whitespace from all fields
Tests that whitespace is properly handled:
```typescript
it('should trim whitespace from all fields', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
      fc.constantFrom('', ' ', '  ', '\t', '\n', ' \t\n '),
      fc.constantFrom('', ' ', '  ', '\t', '\n', ' \t\n '),
      (content, leading, trailing) => {
        const paddedString = leading + content + trailing;
        
        // Test with display_name
        const user1: UserDisplayInfo = {
          display_name: paddedString,
          username: null,
          name: null,
        };
        expect(getDisplayName(user1)).toBe(paddedString.trim());
        
        // Test with username
        const user2: UserDisplayInfo = {
          display_name: null,
          username: paddedString,
          name: null,
        };
        expect(getDisplayName(user2)).toBe(paddedString.trim());
        
        // Test with name
        const user3: UserDisplayInfo = {
          display_name: null,
          username: null,
          name: paddedString,
        };
        expect(getDisplayName(user3)).toBe(paddedString.trim());
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.8: Maintain strict priority order
Tests that priority is maintained regardless of field values:
```typescript
it('should maintain strict priority order regardless of field values', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),
      fc.string({ minLength: 1 }),
      fc.string({ minLength: 1 }),
      (display_name, username, name) => {
        // All fields present - should use display_name
        const user1: UserDisplayInfo = {
          display_name: display_name.trim() || 'display',
          username: username.trim() || 'user',
          name: name.trim() || 'name',
        };
        expect(getDisplayName(user1)).toBe(display_name.trim() || 'display');
        
        // Only username and name - should use username
        const user2: UserDisplayInfo = {
          display_name: null,
          username: username.trim() || 'user',
          name: name.trim() || 'name',
        };
        expect(getDisplayName(user2)).toBe(username.trim() || 'user');
        
        // Only name - should use name
        const user3: UserDisplayInfo = {
          display_name: null,
          username: null,
          name: name.trim() || 'name',
        };
        expect(getDisplayName(user3)).toBe(name.trim() || 'name');
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.9: Deterministic behavior
Tests that the function produces consistent results:
```typescript
it('should be deterministic for the same input', () => {
  fc.assert(
    fc.property(
      fc.option(fc.string(), { nil: null }),
      fc.option(fc.string(), { nil: null }),
      fc.option(fc.string(), { nil: null }),
      (display_name, username, name) => {
        const user: UserDisplayInfo = {
          display_name,
          username,
          name,
        };
        
        const result1 = getDisplayName(user);
        const result2 = getDisplayName(user);
        const result3 = getDisplayName(user);
        
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      }
    ),
    { numRuns: 100 }
  );
});
```

##### 18.10: Handle special characters and unicode
Tests that the function handles various character types:
```typescript
it('should handle special characters and unicode correctly', () => {
  fc.assert(
    fc.property(
      fc.unicodeString({ minLength: 1 }),
      (unicodeStr) => {
        const user: UserDisplayInfo = {
          display_name: unicodeStr.trim() ? unicodeStr : null,
          username: null,
          name: null,
        };
        const result = getDisplayName(user);
        
        if (unicodeStr.trim()) {
          expect(result).toBe(unicodeStr.trim());
        } else {
          expect(result).toBe('Anonymous');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Additional Property: Fallback Chain Completeness

Tests that the fallback chain is complete and handles all edge cases:

##### Never return null or undefined
```typescript
it('should never return null or undefined', () => {
  fc.assert(
    fc.property(
      fc.option(fc.string(), { nil: null }),
      fc.option(fc.string(), { nil: null }),
      fc.option(fc.string(), { nil: null }),
      (display_name, username, name) => {
        const user: UserDisplayInfo = {
          display_name,
          username,
          name,
        };
        const result = getDisplayName(user);
        
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(typeof result).toBe('string');
      }
    ),
    { numRuns: 100 }
  );
});
```

##### Handle partial objects
```typescript
it('should handle partial objects correctly', () => {
  fc.assert(
    fc.property(
      fc.option(fc.string(), { nil: null }),
      fc.option(fc.string(), { nil: null }),
      fc.option(fc.string(), { nil: null }),
      (display_name, username, name) => {
        // Test with various partial objects
        const partialUser1 = { display_name } as UserDisplayInfo;
        const partialUser2 = { username } as UserDisplayInfo;
        const partialUser3 = { name } as UserDisplayInfo;
        const partialUser4 = { display_name, username } as UserDisplayInfo;
        
        // All should return valid strings
        expect(typeof getDisplayName(partialUser1)).toBe('string');
        expect(typeof getDisplayName(partialUser2)).toBe('string');
        expect(typeof getDisplayName(partialUser3)).toBe('string');
        expect(typeof getDisplayName(partialUser4)).toBe('string');
      }
    ),
    { numRuns: 100 }
  );
});
```

**Test Execution:**
```bash
# Run display name property tests
npm test -- displayName.pbt.test.ts

# Run with verbose output
npm test -- displayName.pbt.test.ts --verbose

# Run with coverage
npm test -- displayName.pbt.test.ts --coverage
```

**Benefits of Property-Based Testing:**
- Validates priority logic across all possible user profile combinations
- Tests thousands of input combinations automatically (100+ iterations per property)
- Discovers edge cases with whitespace, null values, and special characters
- Ensures deterministic behavior and consistency
- Validates complete fallback chain from display_name → username → name → "Anonymous"
- Provides high confidence in correctness for user-facing display logic
- Complements unit tests with broader coverage

**Related Files:**
- Implementation: `src/utils/displayName.ts`
- Property-based tests: `src/utils/__tests__/displayName.pbt.test.ts`
- Unit tests: `src/utils/__tests__/displayName.test.ts` (if exists)
- Feature spec: `.kiro/specs/at-search-feature/`
- Used in: `SearchScreen`, `ProfileScreen`, `HeroSection` component

---

### Unit Testing for Username Validation 🆕

**Location:** `src/utils/__tests__/usernameValidation.test.ts`

Comprehensive unit tests for username validation covering specific examples and edge cases. These tests complement the property-based tests by validating concrete scenarios and error messages.

**Test Coverage:**

#### Valid Username Examples

Tests that valid usernames are accepted:
- Lowercase usernames with letters, numbers, and underscores
- Usernames at minimum length (3 characters)
- Usernames at maximum length (30 characters)
- Usernames with only numbers
- Usernames with only underscores and letters

```typescript
it('should accept valid lowercase username', () => {
  const result = validateUsername('john_doe');
  expect(result.isValid).toBe(true);
  expect(result.error).toBeUndefined();
});

it('should accept username at minimum length (3 characters)', () => {
  const result = validateUsername('abc');
  expect(result.isValid).toBe(true);
  expect(result.error).toBeUndefined();
});
```

#### Invalid Username Examples - Special Characters

Tests that usernames with invalid characters are rejected:
- Uppercase letters
- Spaces
- Hyphens
- Dots
- Special characters (@, #, $, !)

```typescript
it('should reject username with uppercase letters', () => {
  const result = validateUsername('JohnDoe');
  expect(result.isValid).toBe(false);
  expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
});

it('should reject username with spaces', () => {
  const result = validateUsername('john doe');
  expect(result.isValid).toBe(false);
  expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
});
```

#### Invalid Username Examples - Length Constraints

Tests that length constraints are enforced:
- Too short (1-2 characters)
- Too long (31+ characters)
- Empty strings

```typescript
it('should reject username with 2 characters', () => {
  const result = validateUsername('ab');
  expect(result.isValid).toBe(false);
  expect(result.error).toBe(UsernameValidationError.TOO_SHORT);
});

it('should reject username with 31 characters', () => {
  const result = validateUsername('a'.repeat(31));
  expect(result.isValid).toBe(false);
  expect(result.error).toBe(UsernameValidationError.TOO_LONG);
});
```

#### Error Message Content

Tests that error messages are correct and user-friendly:
- Validates exact error message text
- Tests all error types (REQUIRED, TOO_SHORT, TOO_LONG, INVALID_CHARACTERS)
- Handles null and undefined inputs

```typescript
it('should return correct error message for too short username', () => {
  const result = validateUsername('ab');
  expect(result.error).toBe(UsernameValidationError.TOO_SHORT);
  expect(result.error).toBe('Username must be at least 3 characters');
});

it('should return correct error message for invalid characters', () => {
  const result = validateUsername('John@Doe');
  expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
  expect(result.error).toBe('Username can only contain lowercase letters, numbers, and underscores');
});
```

#### Edge Cases

Tests edge cases and boundary conditions:
- Whitespace-only strings
- Leading/trailing spaces (should be trimmed)
- Usernames that become too short after trimming
- Validation order priority (character validation before length validation)

```typescript
it('should reject whitespace-only string', () => {
  const result = validateUsername('   ');
  expect(result.isValid).toBe(false);
  expect(result.error).toBe(UsernameValidationError.REQUIRED);
});

it('should handle username with leading/trailing spaces (trimmed)', () => {
  const result = validateUsername('  john_doe  ');
  expect(result.isValid).toBe(true);
  expect(result.error).toBeUndefined();
});

it('should prioritize character validation over length validation', () => {
  // Single uppercase character - should fail on INVALID_CHARACTERS, not TOO_SHORT
  const result = validateUsername('A');
  expect(result.isValid).toBe(false);
  expect(result.error).toBe(UsernameValidationError.INVALID_CHARACTERS);
});
```

#### Username Normalization

Tests the normalization function:
- Converts uppercase to lowercase
- Handles mixed case
- Preserves already-lowercase usernames
- Trims leading and trailing whitespace
- Handles whitespace-only strings
- Combines normalization and trimming in one operation

```typescript
it('should normalize uppercase username to lowercase', () => {
  const normalized = normalizeUsername('JohnDoe');
  expect(normalized).toBe('johndoe');
});

it('should trim leading and trailing whitespace', () => {
  const normalized = normalizeUsername('  john_doe  ');
  expect(normalized).toBe('john_doe');
});

it('should normalize and trim in one operation', () => {
  const normalized = normalizeUsername('  JohnDoe  ');
  expect(normalized).toBe('johndoe');
});
```

**Test Execution:**
```bash
# Run username validation unit tests
npm test -- usernameValidation.test.ts

# Run with verbose output
npm test -- usernameValidation.test.ts --verbose

# Run with coverage
npm test -- usernameValidation.test.ts --coverage

# Run both unit and property-based tests
npm test -- usernameValidation
```

**Test Organization:**
- **Valid Username Examples**: 7 tests
- **Invalid Username Examples - Special Characters**: 8 tests
- **Invalid Username Examples - Too Short**: 3 tests
- **Invalid Username Examples - Too Long**: 3 tests
- **Error Message Content**: 6 tests
- **Edge Cases**: 5 tests
- **Username Normalization**: 6 tests
- **Total**: 38 unit tests

**Benefits of Unit Testing:**
- Validates specific examples and known edge cases
- Ensures error messages are user-friendly and accurate
- Documents expected behavior through concrete examples
- Fast execution for quick feedback during development
- Complements property-based tests with targeted scenarios
- Validates validation order priority (character format before length)

**Testing Strategy:**
The username validation feature uses a dual testing approach:
1. **Property-Based Tests** (`usernameValidation.pbt.test.ts`): Validate universal properties across thousands of generated inputs
2. **Unit Tests** (`usernameValidation.test.ts`): Validate specific examples, error messages, and edge cases

This combination provides comprehensive coverage and high confidence in correctness.

**Requirements Validated:**
- 1.3: Username format validation (alphanumeric + underscore)
- 1.4: Username length validation (3-30 characters)
- 1.5: Username lowercase transformation
- 6.1: Client-side validation before submission
- 6.2: User-friendly error messages
- 6.4: Real-time validation feedback

**Related Files:**
- Implementation: `src/utils/usernameValidation.ts`
- Property-based tests: `src/utils/__tests__/usernameValidation.pbt.test.ts`
- Feature spec: `.kiro/specs/at-search-feature/`

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
import type { HomeStackParamList } from '../types/navigation.types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

function VenueCard({ venue }: { venue: Venue }) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    navigation.navigate('VenueDetail', { 
      venueId: venue.id,
      venueName: venue.name 
    });
  };

  const handleReviewsPress = () => {
    navigation.navigate('VenueReviews', { 
      venueId: venue.id,
      venueName: venue.name 
    });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{venue.name}</Text>
      <Button title="View Reviews" onPress={handleReviewsPress} />
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

#### @ Search Feature 🆕

**Completed Implementation:**

- **SearchScreen Component**: Fully implemented dual-mode search interface
  - Automatic mode switching based on @ prefix
  - Venue search with advanced filtering (categories, price ranges, trending)
  - User search with username and display_name matching
  - Filter drawer with comprehensive options
  - Mode indicator showing current search mode
  - Context-aware empty states and loading indicators
  - Navigation to VenueDetail and UserProfile screens
  
- **Navigation Enhancement**: UserProfile route added to SearchStack 🆕
  - Location: `src/navigation/AppNavigator.tsx`
  - Route: `SearchStack.Screen` with name "UserProfile"
  - Component: Reuses existing `ProfileScreen` component
  - Parameters: `{ userId: string }`
  - Animation: Slide from right transition
  - Purpose: Display user profiles when tapped from @ search results
  - Integration: Seamlessly navigates from SearchScreen user results to full profile view
  
- **New Hook**: `useSearchMode` - Detects search mode and cleans query for dual-mode search
  - Automatically detects user search mode when query starts with @
  - Removes @ prefix for clean API calls
  - Memoized for performance optimization
  - Returns `{ mode: 'venue' | 'user', cleanQuery: string }`
  
- **New Hook**: `useUsersQuery` - React Query hook for user search
  - Case-insensitive search on username and display_name fields
  - Automatic caching with 30s stale time
  - Filters out users without usernames
  - Limits results to 20 users maximum
  - Only queries when searchQuery is at least 2 characters
  - Loading and error state management
  
- **New Types Module**: `src/types/search.types.ts` - Type definitions for dual-mode search
  - `SearchMode` - Type union for 'venue' | 'user' search modes
  - `UserSearchResult` - Minimal user profile data for search results
  - `SearchState` - Complete search state management type
  
- **Features**:
  - Type-safe search mode detection (@ prefix triggers user search)
  - Privacy-focused user result type (only public fields)
  - Comprehensive search state tracking
  - Support for both venue and user search results
  - Debounced search with 300ms delay
  - Conditional query enabling based on search mode
  
- **Integration**: SearchScreen component fully integrated with dual search functionality
  - Venue search enabled only in venue mode
  - User search enabled only in user mode
  - Smooth mode transitions
  - Consistent UI patterns across both modes

#### Navigation Types Refactor 🆕

- **Updated Navigation Structure**: Comprehensive navigation type definitions in `src/types/navigation.types.ts`
- **New Stacks**:
  - `RootTabParamList` - Main tab navigation (Home, Search, Favorites, History, Profile)
  - `HomeStackParamList` - Home flow with venue details, reviews, flash offers, and claim confirmation
  - `SearchStackParamList` - Search flow with venue details
  - `FavoritesStackParamList` - Favorites flow with venue details
  - `HistoryStackParamList` - Check-in history flow with venue details
  - `ProfileStackParamList` - Profile flow with settings
  - `SettingsStackParamList` - Settings flow with notifications, claims, and help screens
  - `VenueStackParamList` - Venue owner dashboard flow
- **Enhanced Parameters**:
  - Venue screens now include `venueName` for better UX
  - Flash offer screens support optional venue context
  - Claim confirmation includes full claim details
- **Type Safety**: All navigation parameters are strongly typed for compile-time safety

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
  - SearchScreen venue filtering functionality
  - User search sensitive data protection

**New Test Files:**

- **SearchScreen.venue-filter.test.tsx** 🆕
  - Location: `src/screens/customer/__tests__/SearchScreen.venue-filter.test.tsx`
  - Tests venue filtering functionality in SearchScreen
  - Verifies venue search results rendering
  - Validates filter application and result counts
  - Mocks dependencies: navigation, theme, auth, venue queries, user queries
  - Includes mock venue data with various categories and locations
  - Tests search input rendering and basic filtering behavior
  - Smoke tests to ensure component renders without errors

- **useUsersQuery.sensitiveData.test.ts** 🆕
  - Location: `src/hooks/queries/__tests__/useUsersQuery.sensitiveData.test.ts`
  - Tests sensitive data exclusion in user search results
  - Validates that only public profile fields are returned (id, username, display_name, avatar_url)
  - Verifies email, preferences, and other sensitive fields are not exposed
  - Ensures exactly 4 fields per user result for privacy compliance
  - Mocks Supabase client and query chain
  - Requirements coverage: 9.3 (public profile information only), 9.4 (no sensitive data exposure)
  - Uses React Query testing utilities for async state management
  - Comprehensive field validation to prevent data leaks

- **useUsersQuery.errorHandling.test.tsx** 🆕
  - Location: `src/hooks/queries/__tests__/useUsersQuery.errorHandling.test.tsx`
  - Task 10.3: Error handling unit tests for useUsersQuery hook
  - Tests error handling scenarios for user search functionality
  - **Network Error Handling Tests**:
    - Network connection errors (connection failed)
    - Database connection timeout errors
    - Authentication errors (auth required)
    - RLS policy violation errors
    - Error message formatting and user-friendly messages
  - **Empty Query Handling Tests**:
    - Empty string queries (should not execute)
    - Single character queries (should not execute)
    - Whitespace-only queries (should not execute)
    - Transition from empty to valid query
    - Minimum 2-character requirement validation
  - **Loading State Display Tests**:
    - Initial loading state display
    - Transition from loading to success state
    - Transition from loading to error state
    - Disabled query state (no loading)
    - Refetch loading state handling
    - Data persistence during refetch
  - **Edge Cases**:
    - Null data with no error (graceful handling)
    - Unexpected error format handling
    - Query cancellation on component unmount
    - Rapid query changes without race conditions
    - Disabled to enabled transition
  - Mocks Supabase client with various error scenarios
  - Uses React Query testing utilities with retry disabled for error tests
  - Requirements coverage: 8.3 (search performance and error handling)
  - Validates graceful degradation and user experience during failures
  - Tests query client cleanup and memory management
  - Comprehensive coverage of all error paths and edge cases

- **usernameValidation.pbt.test.ts** 🆕
  - Location: `src/utils/__tests__/usernameValidation.pbt.test.ts`
  - Property-based tests for username validation using fast-check
  - 100+ iterations per property test for comprehensive coverage
  - **Property 1**: Username character validation (Requirements 1.3)
    - Rejects uppercase letters and special characters
    - Accepts only lowercase letters, numbers, and underscores
  - **Property 2**: Username length validation (Requirements 1.4)
    - Rejects usernames shorter than 3 or longer than 30 characters
    - Accepts usernames with valid length (3-30 characters)
  - **Property 3**: Username lowercase transformation (Requirements 1.5)
    - Normalizes usernames to lowercase
    - Trims whitespace during normalization
  - Additional properties test edge cases, consistency, and idempotency
  - Validates validation order priority (character format before length)

- **SearchScreen.venueSearch.pbt.test.tsx** 🆕
  - Location: `src/screens/customer/__tests__/SearchScreen.venueSearch.pbt.test.tsx`
  - Property-based tests for venue search filtering logic in SearchScreen
  - 100+ iterations per property test for comprehensive coverage
  - **Property 16**: Venue Search Multi-Field Coverage (Requirements 7.1)
    - Validates search matches across name, category, location, and description fields
    - Tests case-insensitive matching across all fields
    - Verifies partial string matching (start, middle, end of strings)
    - Handles null/undefined descriptions gracefully
    - Tests special characters and unicode/international characters
    - Validates empty query returns all venues
    - Ensures whitespace-only queries return all venues
    - Verifies deterministic results (same query returns same results)
    - Validates venue object structure preservation in results
    - Tests multi-field simultaneous matching
  - **Additional Properties**:
    - Search results are always a subset of input venues
    - Input venues array is never modified (immutability)
  - **Test Arbitraries**:
    - `venueNameArbitrary` - Generates realistic venue names
    - `venueCategoryArbitrary` - Generates venue categories (Fast Food, Fine Dining, etc.)
    - `venueLocationArbitrary` - Generates venue locations (Downtown, Uptown, etc.)
    - `venueDescriptionArbitrary` - Generates descriptions (including null/undefined)
    - `venueArbitrary` - Generates complete Venue objects with all required fields
  - **Test Coverage**: 15 comprehensive property tests covering all search scenarios
  - Validates the `searchVenues` function extracted from SearchScreen filtering logic
  - Ensures search functionality is robust across thousands of generated test cases
  - Complements unit tests with broad input coverage and edge case discovery

- **SearchScreen.venueSearch.test.tsx** 🆕
  - Location: `src/screens/customer/__tests__/SearchScreen.venueSearch.test.tsx`
  - Unit tests for venue search filtering logic in SearchScreen
  - Tests specific examples and edge cases for venue search (Requirements 7.1, 7.3)
  - **Test Coverage**:
    - **Search by venue name**: Exact match, partial match, multiple matches, case-insensitive
    - **Search by category**: Exact match, partial match, multiple venues in same category, case-insensitive
    - **Search by location**: Exact match, partial match, multiple venues in same location, case-insensitive
    - **Search by description**: Full match, partial match, case-insensitive, null/undefined handling
    - **Multi-field search**: Matches any field, matches multiple fields, distinct results
    - **Empty results handling**: No matches, empty venue list, empty query, whitespace-only query
    - **Edge cases**: Special characters (&, ', -), numbers, unicode (Café), whitespace trimming, very long queries, empty strings
    - **Performance and consistency**: Consistent results, large venue lists (1000 venues < 100ms), object structure preservation
  - **Helper Functions**:
    - `searchVenues(venues, searchQuery)` - Extracted filtering logic from SearchScreen
    - `createTestVenue(overrides)` - Creates test venue objects with all required fields
  - **Test Features**:
    - Validates case-insensitive substring matching across all searchable fields
    - Tests null/undefined description handling with optional chaining
    - Verifies empty/whitespace queries return all venues
    - Ensures original venues array is never modified (immutability)
    - Performance test validates search completes in < 100ms for 1000 venues
    - Validates venue object structure includes all required fields
  - **Requirements Coverage**: 7.1 (multi-field search), 7.3 (empty results handling)
  - Complements property-based tests with specific, documented test cases
  - Provides regression protection for known edge cases
  - 60+ unit tests covering all search scenarios

- **SearchScreen.resultsCounter.pbt.test.tsx** 🆕
  - Location: `src/screens/customer/__tests__/SearchScreen.resultsCounter.pbt.test.tsx`
  - Property-based tests for SearchScreen results counter display logic
  - 100+ iterations per property test for comprehensive validation
  - **Property 13**: Results Counter Accuracy (Requirements 4.5)
    - Validates accurate venue count for any number of venues (0-100)
    - Validates accurate user count for any number of users (0-100)
    - Validates correct count for zero results in both modes
    - Validates handling of large result counts (100-10,000)
    - Validates counter displays only the active mode's count
    - Validates loading state display when isLoading is true
    - Validates transition from loading to count display
    - Validates count updates when results change
    - Validates text updates when mode changes
  - **Additional Properties**: Counter format consistency
    - Validates lowercase "venues" and "users" text
    - Validates "found" always included in message
    - Validates count formatted as number without separators
    - Validates consistent spacing in message (no extra spaces)
  - Uses mock `ResultsCounter` component to isolate counter logic
  - Generates test data with fast-check arbitraries:
    - `venueArbitrary`: Venue objects with all required fields
    - `userSearchResultArbitrary`: UserSearchResult objects
    - Integer generators for counts (0-100, 100-10,000)
    - Mode generators ('venue' | 'user')
  - Tests edge cases:
    - Zero results in both modes
    - Exactly 1 result (documents current plural form behavior)
    - Large counts (1000-9999) without comma separators
    - Mode switching with different counts
  - Validates counter behavior across all possible states
  - Ensures consistent formatting and accurate counts
  - Critical for dual-mode search UX

- **SearchScreen.userDisplay.pbt.test.tsx** 🆕
  - Location: `src/screens/customer/__tests__/SearchScreen.userDisplay.pbt.test.tsx`
  - Property-based tests for SearchScreen user result display rendering
  - 100+ iterations per property test for comprehensive UI validation
  - **Property 10**: User Result Display Completeness (Requirements 4.1)
    - Validates username always displayed in rendered output
    - Validates display_name shown when present
    - Validates username used as fallback when display_name is null
    - Validates both display_name and username rendered when both present
    - Validates user info container always present
  - **Property 11**: Avatar Fallback (Requirements 4.3)
    - Validates placeholder avatar used when avatar_url is null
    - Validates actual avatar_url used when present
    - Validates avatar source never undefined
    - Validates placeholder for empty string avatar_url
    - Validates accessibility label for avatar
  - **Property 12**: Username Display Formatting (Requirements 4.4)
    - Validates username always prefixed with @ character
    - Validates format as exactly @{username}
    - Validates no extra characters or spaces added
    - Validates username case and characters preserved after @
    - Validates underscores and numeric usernames handled correctly
  - Additional properties test display consistency and determinism
  - Uses mock `UserResultItem` component to isolate rendering logic
  - Generates test data with fast-check arbitraries:
    - `usernameArbitrary`: Valid usernames (lowercase alphanumeric + underscore, 3-30 chars)
    - `displayNameArbitrary`: Display names (1-100 chars, can include spaces and mixed case)
    - `avatarUrlArbitrary`: Avatar URLs (valid URL format or null)
    - `userSearchResultArbitrary`: Complete UserSearchResult objects
  - Validates integration with `getDisplayName` utility function
  - Ensures consistent rendering across multiple renders (deterministic)
  - Tests all valid username formats (letters, numbers, underscores)
  - Comprehensive coverage of user search result display requirements

- **useUsersQuery.pbt.test.ts** 🆕
  - Location: `src/hooks/queries/__tests__/useUsersQuery.pbt.test.ts`
  - Property-based tests for useUsersQuery hook using fast-check
  - 20-100 iterations per property test for async query validation
  - **Property 4**: User Search Table Routing (Requirements 2.1)
    - Validates queries target profiles table, not venues table
    - Validates user data returned, not venue data
  - **Property 5**: User Search Multi-Field Matching (Requirements 2.2)
    - Validates matching by username field
    - Validates matching by display_name field
    - Validates matching in either field
  - **Property 6**: User Search Case Insensitivity (Requirements 2.3)
    - Validates same results regardless of query case
    - Validates case-insensitive matching in username field
    - Validates case-insensitive matching in display_name field
  - **Property 7**: User Search Result Ordering (Requirements 2.4)
    - Validates consistent ordering for same query
    - Validates all matching users returned regardless of match position
    - Validates result limit of 20 users maximum
  - **Property 17**: Sensitive Data Exclusion (Requirements 9.3) 🆕
    - Validates only allowed fields returned: id, username, display_name, avatar_url
    - Ensures sensitive fields excluded: email, phone, created_at, updated_at, preferences, name
    - Tests field exclusion across various search terms
    - Validates field exclusion for multiple users simultaneously
    - Maintains data exclusion consistency across different search queries
    - Verifies exact field count (maximum 4 allowed fields per result)
    - Tests with users containing sensitive data in mock database
    - Ensures privacy protection regardless of database content
  - Additional properties test query behavior:
    - Empty/undefined results for queries less than 2 characters
    - Filters out users without usernames
  - Uses mock Supabase database with seed/reset functionality
  - Creates test wrappers with QueryClient for React Query testing
  - Handles async operations with waitFor from @testing-library
  - Reduced numRuns (20-100) for reliability with async operations
  - Comprehensive coverage of user search query requirements including privacy protection
    - Accepts usernames with length between 3 and 30 characters (inclusive)
  - **Property 3**: Username lowercase transformation (Requirements 1.5)
    - Normalizes usernames with uppercase letters to all lowercase
    - Preserves already-lowercase usernames during normalization
    - Trims whitespace during normalization
  - **Additional Properties**: Empty/null handling, validation consistency, normalization idempotency
  - Uses React Query testing utilities for async state management
  - Comprehensive edge case coverage (null, undefined, empty strings, whitespace)

- **useUsersQuery.pbt.test.ts** 🆕
  - Location: `src/hooks/queries/__tests__/useUsersQuery.pbt.test.ts`
  - Property-based tests for user search query hook using fast-check
  - 100+ iterations per property test for comprehensive coverage
  - **Property 4**: User Search Table Routing (Requirements 2.1)
    - Validates that user search queries the profiles table, not venues table
    - Ensures query completes without error for any non-empty search query
    - Verifies user data structure (has username, display_name) vs venue data (has name)
    - Tests that venue data is not returned when searching for users
  - **Property 5**: User Search Multi-Field Matching (Requirements 2.2)
    - Tests matching users by username field with various search terms
    - Tests matching users by display_name field with various search terms
    - Validates that search matches in either username OR display_name
    - Ensures all matching users are returned regardless of which field matches
    - Uses fixed search terms for reliability (test, user, john, alice, bob)
  - **Property 6**: User Search Case Insensitivity (Requirements 2.3)
    - Validates same results regardless of query case (lowercase, uppercase, mixed)
    - Tests case-insensitive matching in username field across multiple case variations
    - Tests case-insensitive matching in display_name field across multiple case variations
    - Ensures consistent user IDs returned across different case variations
    - Tests with specific case combinations: lowercase, UPPERCASE, Title Case, MiXeD CaSe
  - **Property 7**: User Search Result Ordering (Requirements 2.4)
    - Validates consistent ordering for the same query across multiple executions
    - Tests that all matching users are returned regardless of match position (start, middle, end)
    - Enforces result limit of 20 users maximum
    - Validates ordering consistency with multiple users (exact matches, partial matches)
  - **Additional Properties**: Query behavior validation
    - Returns empty or undefined for queries less than 2 characters
    - Filters out users without usernames (null username values excluded)
    - Validates query behavior with short queries (0-1 characters)
  - Uses mock database with seed/reset functionality for isolated test execution
  - Creates separate QueryClient instances per test for isolation
  - Proper cleanup with `queryClient.clear()` after each test
  - Reduced iteration counts (20 runs) for async tests to balance coverage and performance
  - Comprehensive test coverage validates all user search requirements
  - Tests use `waitFor` from @testing-library/react-native for async assertions
  - Mock database seeding happens before wrapper creation for proper test isolation
    - Tests boundary conditions (exactly 3 and 30 characters)
  - **Property 3**: Username lowercase transformation (Requirements 1.5)
    - Validates normalization to lowercase
    - Tests whitespace trimming
    - Ensures idempotent normalization (consistent results)
  - **Additional Properties**:
    - Empty and null handling (rejects null, undefined, empty strings)
    - Validation consistency (deterministic results)
  - Validates correctness across all possible input combinations
  - Discovers edge cases automatically through property-based testing
  - Complements unit tests with broader input coverage
  - See [Property-Based Testing for Username Validation](#property-based-testing-for-username-validation) section for detailed examples

- **useSearchMode.pbt.test.ts** 🆕
  - Location: `src/hooks/__tests__/useSearchMode.pbt.test.ts`
  - Property-based tests for search mode detection hook using fast-check
  - 100+ iterations per property test for comprehensive coverage
  - **Property 8**: Search mode detection (Requirements 3.1, 3.2)
    - Returns 'user' mode for any query starting with @
    - Returns 'venue' mode for any query not starting with @
    - Returns 'venue' mode for empty strings
    - Consistently detects mode regardless of query content after @
    - Handles multiple @ symbols (only first @ matters)
  - **Property 9**: Query prefix removal (Requirements 3.3)
    - Removes @ prefix from queries starting with @
    - Does not modify queries not starting with @
    - Handles empty strings correctly
    - Handles single @ character (cleanQuery becomes empty string)
    - Preserves all characters after @ prefix
    - Handles special characters in suffix correctly
    - Removes only the first @ when multiple @ symbols present
  - **Additional Properties**:
    - Mode and query consistency (mode matches @ prefix presence)
    - Deterministic behavior (same input produces same output)
    - Idempotency for venue mode (applying cleaning multiple times doesn't change result)
  - Validates search mode switching logic across all possible inputs
  - Ensures @ prefix detection is robust and consistent
  - Tests edge cases like empty strings, multiple @, special characters
  - Complements unit tests with exhaustive input coverage
  - Critical for @ search feature reliability

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

### Inline Documentation Best Practices

When writing inline comments, follow these guidelines to maintain code clarity and traceability:

**1. Explain the "Why", Not the "What"**
```typescript
// ❌ Bad: Obvious comment
const debouncedQuery = useDebounce(query, 300); // Debounce the query

// ✅ Good: Explains purpose and reasoning
// Debounce search query to optimize filtering and reduce API calls
// 300ms delay ensures we don't query on every keystroke (Requirement 8.1)
const debouncedQuery = useDebounce(query, 300);
```

**2. Link to Requirements When Applicable**
```typescript
// Detect search mode based on @ prefix (Requirements 3.1, 3.2, 3.3)
// - mode: 'user' if query starts with @, otherwise 'venue'
// - cleanQuery: query with @ prefix removed for API calls
const { mode, cleanQuery } = useSearchMode(debouncedSearchQuery);
```

**3. Document Performance Optimizations**
```typescript
// Memoize the filters object to prevent recreating on every render
// This optimization ensures the venueFilters object reference stays stable
const venueFilters = useMemo(() => ({ limit: 50 }), []);
```

**4. Explain Conditional Logic**
```typescript
// Venue search query - only enabled when in venue mode (Requirement 7.1)
const { data: venuesData, isLoading: loading } = useVenuesQuery({ 
  filters: venueFilters,
  enabled: mode === 'venue', // Conditional fetching prevents unnecessary API calls
});
```

**5. Document Complex State Management**
```typescript
// User search query - only enabled when in user mode (Requirements 2.1, 2.2, 2.3)
// Searches profiles table for matching usernames and display names
const { data: usersData, isLoading: usersLoading } = useUsersQuery({
  searchQuery: cleanQuery,
  enabled: mode === 'user', // Conditional fetching based on search mode
});
```

**Comment Placement Guidelines:**
- Place comments **above** the code they describe
- Use multi-line comments for complex explanations
- Use inline comments for brief clarifications
- Group related comments with the code block they describe
- Leave a blank line before comment blocks for readability

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

**Last Updated:** January 25, 2026

