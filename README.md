# alphaCharlie722

A React Native app with bottom tab navigation featuring venue discovery and user settings.

## Navigation Structure

### Bottom Tab Navigator
- **Home (Feed)**: Displays a feed of featured venues with images, ratings, and descriptions
- **Search**: Search and browse all venues with detailed filtering
- **Settings**: User settings and experimental features

### Search Stack
- **Search List**: Main search interface with search bar and venue list
- **Venue Detail**: Detailed venue information including contact info, hours, and amenities

## Features

### Home Screen
- Feed of featured venues
- Venue cards with images, ratings, and descriptions
- Smooth scrolling interface

### Search Screen
- Real-time search functionality
- Filter by venue name, category, or location
- Venue list with ratings and distance
- Navigation to detailed venue pages
- **@ Search Feature**: Search for users by typing @ followed by username

### @ Search Feature

The @ Search Feature enables seamless user discovery within the app by using a simple @ prefix in the search bar.

#### How It Works

The search screen operates in two modes:

1. **Venue Search Mode (Default)**
   - Search for venues by name, category, location, or description
   - Apply filters for categories, price ranges, and trending options
   - View venue ratings, locations, and details

2. **User Search Mode (@ Prefix)**
   - Type `@` followed by a username or display name
   - Search results show matching users with avatars and usernames
   - Tap any user to view their profile

#### Usage Examples

```
# Venue search (default)
"coffee shop"          → Searches venues
"downtown"             → Searches venues by location
"fine dining"          → Searches venues by category

# User search (@ prefix)
"@john_doe"            → Searches for users with username or display name matching "john_doe"
"@sarah"               → Searches for users with username or display name matching "sarah"
```

#### Username Requirements

Usernames must follow these rules:
- **Length**: 3-30 characters
- **Characters**: Lowercase letters (a-z), numbers (0-9), and underscores (_)
- **Format**: Must match pattern `^[a-z0-9_]{3,30}$`
- **Uniqueness**: Each username must be unique across all users
- **Storage**: Always stored in lowercase

#### Search Behavior

- **Debounced Search**: 300ms delay after typing to optimize performance
- **Multi-Field Matching**: Searches both username and display_name fields
- **Case Insensitive**: Search is case-insensitive for better user experience
- **Result Limit**: Returns up to 20 users per search
- **Minimum Query Length**: Requires at least 2 characters after @ to search

#### Display Priority

When displaying user information, the app follows this priority:
1. **Display Name** (if set) - shown as primary identifier
2. **Username** (if display name not set) - shown as primary identifier
3. **Name** (if neither username nor display name set) - fallback identifier

The username is always shown with @ prefix as a secondary identifier when display name is present.

#### Privacy & Security

- **Authentication Required**: Only authenticated users can search for other users
- **Public Profile Data Only**: Search results only include:
  - User ID
  - Username
  - Display Name
  - Avatar URL
- **Sensitive Data Protected**: Email, phone, and other sensitive fields are never exposed in search results
- **RLS Policies**: Row Level Security policies enforce access control at the database level

#### Technical Implementation

The @ Search Feature is built with:
- **Mode Detection**: `useSearchMode` hook detects @ prefix and switches modes
- **User Query**: `useUsersQuery` hook fetches matching users from profiles table
- **Validation**: `validateUsername` function ensures username format compliance
- **Display Utility**: `getDisplayName` function handles display name priority logic

For more technical details, see:
- Design Document: `.kiro/specs/at-search-feature/design.md`
- Requirements: `.kiro/specs/at-search-feature/requirements.md`
- Implementation Tasks: `.kiro/specs/at-search-feature/tasks.md`

### Venue Detail Screen
- Comprehensive venue information
- Contact details with direct calling and website links
- Operating hours
- Amenities and features
- Google Maps integration for directions
- **Flash offers with one-tap claiming** 🆕
- **Claim token display and management** 🆕

### Settings Screen
- User profile management
- Notification preferences
- Location services toggle
- Dark mode support
- Experimental features section
- Support and legal information
- Account management

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

For detailed setup and deployment guides, see the [docs](./docs) folder:
- [Quick Start Guide](./docs/QUICK_START.md)
- [Firebase Setup](./docs/FIREBASE_SETUP.md)
- [Supabase Setup](./docs/supabase-setup.md)
- [Deployment Quick Reference](./docs/DEPLOYMENT_QUICK_REFERENCE.md)
- [Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Secrets Management](./docs/SECRETS_MANAGEMENT.md)

### Step 1: Database Setup

Set up your Supabase database by running the SQL scripts in the `database/` directory. See `database/README.md` for detailed instructions.

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Install iOS Dependencies (iOS only)

For iOS, install CocoaPods dependencies:

```bash
bundle install
bundle exec pod install
```

### Step 4: Start Metro

```bash
npm start
```

### Step 5: Run the App

#### Quick Start (Recommended)
```bash
npm run dev:full
```
This command starts the emulator, Metro bundler, and builds/installs the app all at once.

#### Individual Commands
```bash
# Start emulator only
npm run emulator

# Start Metro bundler only  
npm start

# Build and install app (after emulator and Metro are running)
npm run android

# For iOS
npm run ios
```

#### Development Scripts
```bash
# Start emulator + Metro (you'll need to run android separately)
npm run dev

# Clean build and fresh start (if you have build issues)
npm run fresh-start

# Clean build cache only
npm run clean
```

## Custom Hooks

The application uses custom React hooks to separate business logic from UI components, improving code reusability and maintainability.

### Available Hooks

#### useVenues
Manages venue data fetching and state.

```typescript
import { useVenues } from '@/hooks';

// Fetch featured venues
const { venues, loading, error, refetch } = useVenues({ 
  featured: true, 
  limit: 10 
});

// Fetch all venues with search
const { venues, loading, error } = useVenues({ 
  search: 'coffee',
  category: 'Cafe',
  limit: 50 
});

// Manual refetch (e.g., pull-to-refresh)
await refetch();
```

**Options:**
- `featured?: boolean` - Filter for featured venues only
- `search?: string` - Search query for venue name/description
- `category?: string` - Filter by category
- `location?: string` - Filter by location
- `limit?: number` - Maximum number of venues to fetch
- `offset?: number` - Pagination offset

**Returns:**
- `venues: Venue[]` - Array of venue objects
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => Promise<void>` - Function to manually refetch data

#### useFavorites
Manages user favorites with optimistic updates.

```typescript
import { useFavorites } from '@/hooks';

const { favorites, loading, toggleFavorite, isFavorite } = useFavorites();

// Check if venue is favorited
const isVenueFavorited = isFavorite(venueId);

// Toggle favorite (with optimistic update)
const success = await toggleFavorite(venueId);
if (!success) {
  // Handle error (e.g., show alert)
}
```

**Returns:**
- `favorites: Set<string>` - Set of favorited venue IDs
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `toggleFavorite: (venueId: string) => Promise<boolean>` - Toggle favorite status
- `isFavorite: (venueId: string) => boolean` - Check if venue is favorited

**Features:**
- Optimistic UI updates for instant feedback
- Automatic rollback on error
- Authentication-aware (returns empty set when not logged in)

#### useCheckInStats
Fetches check-in statistics for one or multiple venues.

```typescript
import { useCheckInStats } from '@/hooks';

// Single venue
const { stats, loading } = useCheckInStats({ 
  venueIds: venueId,
  enabled: !!venueId 
});
const venueStats = stats.get(venueId);

// Multiple venues
const venueIds = venues.map(v => v.id);
const { stats, loading } = useCheckInStats({ 
  venueIds,
  enabled: venueIds.length > 0 
});
```

**Options:**
- `venueIds: string | string[]` - Single venue ID or array of IDs
- `enabled?: boolean` - Conditionally enable/disable fetching

**Returns:**
- `stats: Map<string, VenueCheckInStats>` - Map of venue IDs to stats
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => Promise<void>` - Function to manually refetch data

**Features:**
- Debounced fetching to prevent excessive API calls
- Supports both single and multiple venue queries
- Includes user-specific check-in status

#### useCheckInActions
Handles check-in and check-out actions.

```typescript
import { useCheckInActions } from '@/hooks';

const { checkIn, checkOut, loading } = useCheckInActions({
  onSuccess: (isCheckedIn) => {
    console.log('Check-in status:', isCheckedIn);
    // Refresh data, show success message, etc.
  },
  onError: (error) => {
    console.error('Check-in error:', error);
    // Show error alert
  }
});

// Check in to a venue
await checkIn(venueId, venueName);

// Check out from current venue
await checkOut(checkInId);
```

**Options:**
- `onSuccess?: (isCheckedIn: boolean) => void` - Success callback
- `onError?: (error: Error) => void` - Error callback

**Returns:**
- `checkIn: (venueId: string, venueName: string) => Promise<void>` - Check in function
- `checkOut: (checkInId: string) => Promise<void>` - Check out function
- `loading: boolean` - Loading state
- `error: Error | null` - Error state

**Features:**
- Prevents duplicate requests
- Automatic previous check-out when checking into new venue
- Authentication-aware

#### useDebounce
Debounces rapidly changing values (useful for search inputs).

```typescript
import { useDebounce } from '@/hooks';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearchQuery = useDebounce(searchQuery, 300);

// Use debouncedSearchQuery for filtering/API calls
useEffect(() => {
  // This only runs 300ms after user stops typing
  filterVenues(debouncedSearchQuery);
}, [debouncedSearchQuery]);
```

**Parameters:**
- `value: T` - Value to debounce (generic type)
- `delay?: number` - Delay in milliseconds (default: 300ms)

**Returns:**
- `T` - Debounced value

**Features:**
- Generic type support
- Configurable delay
- Automatic cleanup on unmount

#### useSearchMode
Detects search mode based on @ prefix and cleans the query for API calls.

```typescript
import { useSearchMode } from '@/hooks';

const [searchQuery, setSearchQuery] = useState('');
const { mode, cleanQuery } = useSearchMode(searchQuery);

// mode will be 'user' if query starts with @, otherwise 'venue'
// cleanQuery will have @ prefix removed for API calls

if (mode === 'user') {
  // Fetch users with cleanQuery
} else {
  // Fetch venues with cleanQuery
}
```

**Parameters:**
- `searchQuery: string` - The raw search query from user input

**Returns:**
- `mode: 'user' | 'venue'` - Detected search mode
- `cleanQuery: string` - Query with @ prefix removed (if present)

**Features:**
- Automatic mode detection based on @ prefix
- Query cleaning for API calls
- Memoized to prevent unnecessary recalculations

#### useUsersQuery
Fetches users matching a search query (used for @ search feature).

```typescript
import { useUsersQuery } from '@/hooks/queries';

const { data: users, isLoading, error } = useUsersQuery({
  searchQuery: 'john',
  enabled: searchQuery.length >= 2,
});

// users will contain matching user profiles
```

**Options:**
- `searchQuery: string` - Search term to match against username and display_name
- `enabled?: boolean` - Conditionally enable/disable fetching

**Returns:**
- `data: UserSearchResult[]` - Array of matching user profiles
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state

**Features:**
- Searches both username and display_name fields
- Case-insensitive matching
- Returns up to 20 results
- Filters out users without usernames
- Requires minimum 2 characters to search

### Hook Usage Patterns

#### Pattern 1: Data Fetching in Screens

```typescript
// HomeScreen.tsx
import { useVenues, useCheckInStats } from '@/hooks';

const HomeScreen = () => {
  // Fetch venues
  const { venues, loading, refetch } = useVenues({ featured: true });
  
  // Fetch check-in stats for all venues
  const venueIds = venues.map(v => v.id);
  const { stats } = useCheckInStats({ venueIds });
  
  // Pull-to-refresh
  const onRefresh = async () => {
    await refetch();
  };
  
  return (
    <ScrollView refreshControl={<RefreshControl onRefresh={onRefresh} />}>
      {venues.map(venue => (
        <VenueCard 
          key={venue.id}
          venue={venue}
          checkInCount={stats.get(venue.id)?.active_checkins || 0}
        />
      ))}
    </ScrollView>
  );
};
```

#### Pattern 2: Search with Debouncing

```typescript
// SearchScreen.tsx
import { useState, useEffect } from 'react';
import { useVenues, useDebounce } from '@/hooks';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  const { venues, loading } = useVenues({ limit: 50 });
  const [filteredVenues, setFilteredVenues] = useState(venues);
  
  useEffect(() => {
    // Filter only runs after user stops typing for 300ms
    const filtered = venues.filter(v => 
      v.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
    setFilteredVenues(filtered);
  }, [debouncedQuery, venues]);
  
  return (
    <View>
      <TextInput 
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search venues..."
      />
      <FlatList data={filteredVenues} />
    </View>
  );
};
```

#### Pattern 3: Favorites Management

```typescript
// VenueCard.tsx
import { useFavorites } from '@/hooks';
import { Alert } from 'react-native';

const VenueCard = ({ venue }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const handleToggleFavorite = async () => {
    const success = await toggleFavorite(venue.id);
    if (!success) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  };
  
  return (
    <TouchableOpacity onPress={handleToggleFavorite}>
      <Icon 
        name={isFavorite(venue.id) ? 'heart' : 'heart-outline'}
        color={isFavorite(venue.id) ? '#FF3B30' : '#999'}
      />
    </TouchableOpacity>
  );
};
```

#### Pattern 4: Check-In Actions

```typescript
// VenueDetailScreen.tsx
import { useCheckInActions, useCheckInStats } from '@/hooks';

const VenueDetailScreen = ({ route }) => {
  const { venueId, venueName } = route.params;
  
  const { stats, refetch: refetchStats } = useCheckInStats({ venueIds: venueId });
  const venueStats = stats.get(venueId);
  
  const { checkIn, checkOut, loading } = useCheckInActions({
    onSuccess: async () => {
      await refetchStats(); // Refresh stats after check-in/out
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    }
  });
  
  const handleCheckIn = async () => {
    await checkIn(venueId, venueName);
  };
  
  const handleCheckOut = async () => {
    if (venueStats?.user_checkin_id) {
      await checkOut(venueStats.user_checkin_id);
    }
  };
  
  return (
    <View>
      {venueStats?.user_is_checked_in ? (
        <Button title="Check Out" onPress={handleCheckOut} disabled={loading} />
      ) : (
        <Button title="Check In" onPress={handleCheckIn} disabled={loading} />
      )}
    </View>
  );
};
```

### Best Practices

1. **Always handle loading states**: Show loading indicators while data is being fetched
2. **Handle errors gracefully**: Display user-friendly error messages
3. **Use debouncing for search**: Prevent excessive API calls with `useDebounce`
4. **Leverage optimistic updates**: Use `useFavorites` for instant UI feedback
5. **Conditional fetching**: Use the `enabled` flag to prevent unnecessary API calls
6. **Refetch on user actions**: Call `refetch()` after mutations to keep data fresh
7. **Type safety**: All hooks are fully typed with TypeScript interfaces

## Dependencies

- React Navigation v6 (Bottom Tabs & Native Stack)
- React Native Vector Icons (Ionicons)
- React Native Safe Area Context
- React Native Screens

## Project Structure

The OTW application follows a domain-driven folder structure for improved code organization and maintainability.

```
src/
├── assets/
│   └── images/              # Logo assets and images
├── components/              # UI Components organized by domain
│   ├── checkin/            # Check-in related components
│   │   ├── CheckInButton.tsx
│   │   ├── CheckInModal.tsx
│   │   ├── PulseLikeButton.tsx
│   │   ├── UserFeedback.tsx
│   │   └── index.ts
│   ├── navigation/         # Navigation components
│   │   ├── AnimatedTabBar.tsx
│   │   ├── NewFloatingTabBar.tsx
│   │   └── index.ts
│   ├── shared/             # Shared components across features
│   │   ├── OTWLogo.tsx
│   │   └── index.ts
│   ├── ui/                 # Reusable UI primitives (future)
│   ├── venue/              # Venue-specific components
│   │   ├── TestVenueCard.tsx
│   │   ├── VenueCardDialog.tsx
│   │   ├── VenueCustomerCount.tsx
│   │   ├── VenueEngagementChip.tsx
│   │   ├── VenueInfoComponents.tsx
│   │   ├── VenueSignUpForm.tsx
│   │   └── index.ts
│   └── index.ts            # Main component exports
├── contexts/               # React contexts
│   ├── AuthContext.tsx
│   ├── GridLayoutContext.tsx
│   ├── NavigationStyleContext.tsx
│   └── ThemeContext.tsx
├── hooks/                  # Custom React hooks
│   ├── useCheckInActions.ts  # Check-in/out actions
│   ├── useCheckInStats.ts    # Check-in statistics
│   ├── useDebounce.ts        # Debounce utility
│   ├── useEngagementColor.ts # Engagement color logic
│   ├── useFavorites.ts       # Favorites management
│   ├── useVenues.ts          # Venue data management
│   └── index.ts
├── lib/                    # External library configurations
│   └── supabase.ts
├── navigation/
│   └── AppNavigator.tsx    # Main navigation configuration
├── screens/                # Screen components organized by user type
│   ├── auth/              # Authentication screens
│   │   ├── AuthScreen.tsx
│   │   ├── SplashScreen.tsx
│   │   └── index.ts
│   ├── customer/          # Customer-facing screens
│   │   ├── FavoritesScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── QuickPicksScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── VenueDetailScreen.tsx
│   │   └── index.ts
│   ├── venue/             # Venue owner screens
│   │   ├── VenueDashboardScreen.tsx
│   │   └── index.ts
│   └── index.ts           # Main screen exports
├── services/               # Business logic and API layer
│   ├── api/               # API services organized by domain
│   │   ├── auth.ts
│   │   ├── checkins.ts
│   │   ├── favorites.ts
│   │   ├── feedback.ts
│   │   ├── venues.ts
│   │   └── index.ts
│   ├── venueAnalyticsService.ts
│   ├── venueApplicationService.ts
│   ├── venueBusinessService.ts
│   ├── venueContributionService.ts
│   └── index.ts
├── types/                  # Centralized TypeScript type definitions
│   ├── checkin.types.ts   # Check-in related types
│   ├── navigation.types.ts # Navigation types
│   ├── user.types.ts      # User related types
│   ├── venue.types.ts     # Venue related types
│   └── index.ts
└── utils/                  # Utility functions organized by purpose
    ├── constants/         # Application constants
    │   ├── colors.ts
    │   ├── spacing.ts
    │   └── index.ts
    ├── formatting/        # Formatting utilities
    │   ├── activity.ts
    │   └── index.ts
    ├── validation/        # Validation utilities (future)
    └── populateVenues.ts

database/                   # SQL setup scripts
├── mockdata/              # Mock data for testing
├── setup/                 # Database setup scripts
└── README.md

docs/                       # Documentation
├── supabase-setup.md
└── user-feedback-system.md
```

### Folder Structure Principles

1. **Domain-Driven Organization**: Code is grouped by feature/domain rather than by technical type
2. **Discoverability**: Related code lives together, making it easier to find and understand
3. **Scalability**: Easy to add new features without cluttering existing directories
4. **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers

### Key Directories

- **components/**: UI components organized by domain (venue, checkin, navigation, shared)
- **screens/**: Screen components organized by user type (customer, venue owner, auth)
- **types/**: Centralized TypeScript type definitions for better type reusability
- **services/api/**: API layer services organized by domain
- **utils/**: Utility functions organized by purpose (formatting, validation, constants)

## Import Patterns and Conventions

### Import Patterns

The project uses a combination of relative and absolute imports for optimal code organization:

#### Relative Imports (within same feature/domain)
Use relative imports when importing files within the same feature directory:

```typescript
// Within src/components/venue/
import { VenueCard } from './VenueCard';
import { VenueCustomerCount } from './VenueCustomerCount';
```

#### Absolute Imports (across features)
Use absolute imports when importing from different features or shared code:

```typescript
// From any file
import { VenueCard } from '@/components/venue';
import { useVenues } from '@/hooks';
import { Venue } from '@/types';
import { VenueService } from '@/services/api';
```

#### Index File Imports
Each domain folder has an `index.ts` file for clean imports:

```typescript
// Instead of:
import { VenueCard } from '@/components/venue/VenueCard';
import { VenueCustomerCount } from '@/components/venue/VenueCustomerCount';

// Use:
import { VenueCard, VenueCustomerCount } from '@/components/venue';
```

### Naming Conventions

#### Files
- **Components**: PascalCase (e.g., `VenueCard.tsx`, `CheckInButton.tsx`)
- **Screens**: PascalCase with "Screen" suffix (e.g., `HomeScreen.tsx`, `VenueDetailScreen.tsx`)
- **Services**: camelCase with "Service" suffix (e.g., `venueService.ts`, `authService.ts`)
- **Types**: camelCase with ".types" suffix (e.g., `venue.types.ts`, `user.types.ts`)
- **Utilities**: camelCase (e.g., `activity.ts`, `colors.ts`)
- **Index files**: Always `index.ts`

#### Code
- **Components**: PascalCase (e.g., `VenueCard`, `CheckInModal`)
- **Functions**: camelCase (e.g., `getActivityLevel`, `formatDate`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ACTIVITY_COLORS`, `SPACING`)
- **Types/Interfaces**: PascalCase (e.g., `Venue`, `CheckIn`, `VenueQueryOptions`)
- **Hooks**: camelCase with "use" prefix (e.g., `useVenues`, `useEngagementColor`)

#### Exports
- **Prefer named exports** over default exports for better tree-shaking and refactoring
- **Use index files** to create clean public APIs for each domain

```typescript
// Good: Named exports
export const VenueCard = () => { /* ... */ };
export const VenueCustomerCount = () => { /* ... */ };

// Avoid: Default exports
export default VenueCard;
```

## Adding New Features

### Component Placement Guidelines

When adding new components, follow these guidelines:

1. **Venue-specific components** → `src/components/venue/`
2. **Check-in related components** → `src/components/checkin/`
3. **Navigation components** → `src/components/navigation/`
4. **Reusable UI primitives** → `src/components/ui/`
5. **Shared across features** → `src/components/shared/`

### Screen Placement Guidelines

When adding new screens:

1. **Customer-facing screens** → `src/screens/customer/`
2. **Venue owner screens** → `src/screens/venue/`
3. **Authentication screens** → `src/screens/auth/`

### Service Placement Guidelines

When adding new services:

1. **API services** → `src/services/api/`
2. **Business logic services** → `src/services/`

### Type Placement Guidelines

When adding new types:

1. **Domain-specific types** → `src/types/{domain}.types.ts`
2. **Shared types** → `src/types/index.ts`

### Example: Adding a New Feature

Let's say you're adding a "Rewards" feature:

```
1. Create component directory:
   src/components/rewards/
   ├── RewardCard.tsx
   ├── RewardsList.tsx
   └── index.ts

2. Create screen:
   src/screens/customer/RewardsScreen.tsx
   (Add export to src/screens/customer/index.ts)

3. Create types:
   src/types/rewards.types.ts
   (Add export to src/types/index.ts)

4. Create service:
   src/services/api/rewards.ts
   (Add export to src/services/api/index.ts)

5. Update navigation:
   Add route to AppNavigator.tsx
```

### Migration Guide for Existing Code

If you're updating existing code that hasn't been refactored yet:

1. **Identify the domain**: Determine which domain the code belongs to (venue, checkin, etc.)
2. **Move the file**: Move it to the appropriate domain folder
3. **Update imports**: Update all import statements in the moved file
4. **Update exports**: Add the export to the domain's `index.ts` file
5. **Update consumers**: Update all files that import the moved code
6. **Test**: Verify the application still works correctly

## Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## Documentation

For more detailed documentation, see the [docs](./docs) folder:

### Architecture & Design
- [App Architecture](./docs/APP_ARCHITECTURE.md)
- [Backend Architecture](./docs/BACKEND_ARCHITECTURE.md)
- [Venue Data Structure](./docs/VENUE_DATA_STRUCTURE.md)
- [On The Way Overview](./docs/ON_THE_WAY_OVERVIEW.md)

### Setup & Deployment
- [Quick Start Guide](./docs/QUICK_START.md)
- [Firebase Setup](./docs/FIREBASE_SETUP.md)
- [Supabase Setup](./docs/supabase-setup.md)
- [Deployment Quick Reference](./docs/DEPLOYMENT_QUICK_REFERENCE.md)
- [Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Production Deployment Checklist](./docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Production Monitoring Guide](./docs/PRODUCTION_MONITORING_GUIDE.md)
- [Secrets Management](./docs/SECRETS_MANAGEMENT.md)

### Features
- [@ Search Feature](./docs/at-search-feature.md)
- [Push Notifications Production Checklist](./docs/PUSH_NOTIFICATIONS_PRODUCTION_CHECKLIST.md)
- [Reviews Deployment Guide](./docs/REVIEWS_DEPLOYMENT_GUIDE.md)
- [Reviews Deployment Checklist](./docs/REVIEWS_DEPLOYMENT_CHECKLIST.md)

### API Reference
- [API Reference](./docs/api-reference.md)
- [Frontend Reference](./docs/frontend-reference.md)
- [Review API Error Codes](./docs/review-api-error-codes.md)

### User Guides
- [Community Guidelines](./docs/user-guides/community-guidelines.md)
- [How to Write a Review](./docs/user-guides/how-to-write-a-review.md)
- [Venue Owner Review Guide](./docs/user-guides/venue-owner-review-guide.md)