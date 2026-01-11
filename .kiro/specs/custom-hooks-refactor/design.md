# Design Document

## Overview

This design outlines the implementation of custom React hooks to extract business logic from screen components in the OTW application. The refactoring will improve code maintainability, reduce duplication, and establish patterns for scalable development.

## Architecture

### Current Architecture
```
Screen Components (HomeScreen, SearchScreen, etc.)
├── Data Fetching Logic
├── State Management
├── Business Logic
└── UI Rendering
```

### Target Architecture
```
Screen Components
└── UI Rendering (calls hooks)

Custom Hooks
├── Data Fetching
├── State Management
└── Business Logic
    └── Service Layer (VenueService, CheckInService, etc.)
```

### Design Principles

1. **Separation of Concerns**: Hooks handle data/logic, components handle UI
2. **Single Responsibility**: Each hook has one clear purpose
3. **Composability**: Hooks can be combined in components
4. **Reusability**: Same hook used across multiple screens
5. **Type Safety**: Full TypeScript support with proper types

## Components and Interfaces

### Hook Directory Structure

```
src/hooks/
├── index.ts                    # Export all hooks
├── useVenues.ts               # Venue data management
├── useFavorites.ts            # Favorites management
├── useCheckInStats.ts         # Check-in statistics
├── useCheckInActions.ts       # Check-in/out actions
└── useDebounce.ts             # Debounce utility
```

### 1. useVenues Hook

**Purpose**: Manage venue data fetching and state

**Interface**:
```typescript
interface UseVenuesOptions {
  featured?: boolean;
  search?: string;
  category?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

interface UseVenuesReturn {
  venues: Venue[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useVenues(options?: UseVenuesOptions): UseVenuesReturn
```

**Implementation Strategy**:
- Use `useState` for venues, loading, and error
- Use `useEffect` to fetch on mount and when options change
- Use `useCallback` for refetch function
- Call `VenueService.getVenues()` or `VenueService.getFeaturedVenues()`
- Handle errors gracefully with try-catch
- Clean up with abort controller on unmount

**Key Features**:
- Automatic data fetching on mount
- Re-fetch when options change
- Manual refetch capability
- Error state management
- Loading state management

### 2. useFavorites Hook

**Purpose**: Manage user favorites state and actions

**Interface**:
```typescript
interface UseFavoritesReturn {
  favorites: Set<string>;
  loading: boolean;
  error: Error | null;
  toggleFavorite: (venueId: string) => Promise<boolean>;
  isFavorite: (venueId: string) => boolean;
}

function useFavorites(): UseFavoritesReturn
```

**Implementation Strategy**:
- Use `useState` for favorites Set, loading, and error
- Use `useAuth` to get current user
- Use `useEffect` to load favorites when user changes
- Implement optimistic updates in toggleFavorite
- Revert on error
- Call `FavoriteService.getUserFavorites()` and `FavoriteService.toggleFavorite()`

**Key Features**:
- Optimistic UI updates
- Error rollback
- Authentication-aware
- Helper function to check if venue is favorited

### 3. useCheckInStats Hook

**Purpose**: Fetch and manage check-in statistics for venues

**Interface**:
```typescript
interface UseCheckInStatsOptions {
  venueIds: string[];
  userId?: string;
  enabled?: boolean;
}

interface UseCheckInStatsReturn {
  stats: Map<string, VenueCheckInStats>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useCheckInStats(
  venueIds: string[],
  options?: { enabled?: boolean }
): UseCheckInStatsReturn
```

**Implementation Strategy**:
- Use `useState` for stats Map, loading, and error
- Use `useAuth` to get current user ID
- Use `useEffect` to fetch when venueIds change
- Debounce venueIds changes to prevent excessive API calls
- Call `CheckInService.getMultipleVenueStats()`
- Support single venue queries
- Handle empty venue ID arrays

**Key Features**:
- Debounced fetching
- Supports multiple venues
- User-specific check-in status
- Conditional fetching with enabled flag

### 4. useCheckInActions Hook

**Purpose**: Handle check-in and check-out actions

**Interface**:
```typescript
interface UseCheckInActionsOptions {
  onSuccess?: (isCheckedIn: boolean) => void;
  onError?: (error: Error) => void;
}

interface UseCheckInActionsReturn {
  checkIn: (venueId: string, venueName: string) => Promise<void>;
  checkOut: (checkInId: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

function useCheckInActions(
  options?: UseCheckInActionsOptions
): UseCheckInActionsReturn
```

**Implementation Strategy**:
- Use `useState` for loading and error
- Use `useAuth` to get current user
- Use `useCallback` for checkIn and checkOut functions
- Call `CheckInService.checkIn()` and `CheckInService.checkOut()`
- Prevent duplicate requests with loading state
- Invoke callbacks on success/error
- Handle authentication errors

**Key Features**:
- Prevents duplicate requests
- Success/error callbacks
- Authentication-aware
- Automatic previous check-out

### 5. useDebounce Hook

**Purpose**: Debounce rapidly changing values

**Interface**:
```typescript
function useDebounce<T>(value: T, delay?: number): T
```

**Implementation Strategy**:
- Use `useState` for debounced value
- Use `useEffect` to set timeout on value change
- Clear timeout on cleanup
- Default delay of 300ms
- Return debounced value

**Key Features**:
- Generic type support
- Configurable delay
- Automatic cleanup

## Data Models

### Venue Type (Existing)
```typescript
type Venue = Database['public']['Tables']['venues']['Row'];
```

### VenueCheckInStats Type (Existing)
```typescript
interface VenueCheckInStats {
  venue_id: string;
  active_checkins: number;
  recent_checkins: number;
  user_is_checked_in: boolean;
  user_checkin_id?: string;
  user_checkin_time?: string;
}
```

### Hook Return Types (New)
All hook return types defined in interfaces above.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Hook State Consistency
*For any* custom hook, when data is successfully fetched, the loading state should be false and error state should be null.
**Validates: Requirements 1.1, 2.2, 3.3, 4.2**

### Property 2: Optimistic Update Rollback
*For any* toggleFavorite operation that fails, the favorites set should revert to its previous state.
**Validates: Requirements 2.8**

### Property 3: Debounce Delay Accuracy
*For any* debounced value, when the input changes, the output should not update until the specified delay has elapsed without further changes.
**Validates: Requirements 5.3, 5.4, 5.5**

### Property 4: Hook Cleanup
*For any* custom hook with subscriptions or timers, when the component unmounts, all subscriptions and timers should be cleaned up.
**Validates: Requirements 1.10, 2.10, 3.10, 5.7**

### Property 5: Authentication-Aware Behavior
*For any* hook that requires authentication, when no user is authenticated, the hook should return empty/default state without crashing.
**Validates: Requirements 2.3, 4.9**

### Property 6: Refetch Idempotency
*For any* hook with a refetch function, calling refetch multiple times should produce the same result as calling it once.
**Validates: Requirements 1.7**

### Property 7: Screen Component Size Reduction
*For any* refactored screen component, the line count should be reduced by at least 30% compared to the original.
**Validates: Requirements 6.9, 7.9, 8.9**

### Property 8: Functional Equivalence
*For any* refactored screen, all user interactions and data displays should behave identically to the original implementation.
**Validates: Requirements 10.1, 10.2, 10.3**

### Property 9: Error State Propagation
*For any* hook that encounters an error, the error should be captured and exposed to the consuming component without crashing.
**Validates: Requirements 1.8, 3.8**

### Property 10: Venue ID Change Reactivity
*For any* useCheckInStats hook, when the venueIds array changes, the hook should fetch new statistics for the updated venues.
**Validates: Requirements 3.4**

## Error Handling

### Hook-Level Error Handling

1. **Try-Catch Blocks**: All async operations wrapped in try-catch
2. **Error State**: Expose error state to consuming components
3. **Graceful Degradation**: Return empty/default data on error
4. **Error Logging**: Console.error for debugging
5. **No Crashes**: Never throw unhandled errors

### Component-Level Error Handling

1. **Error Display**: Components show user-friendly error messages
2. **Retry Mechanisms**: Components provide retry buttons
3. **Fallback UI**: Show empty states or cached data
4. **Error Boundaries**: Catch any unhandled errors (future enhancement)

### Authentication Errors

1. **Check User State**: Verify user exists before operations
2. **Return Indicators**: Return boolean or null to indicate auth failure
3. **No Alerts in Hooks**: Let components handle user notifications
4. **Graceful Fallback**: Return empty data for unauthenticated users

## Testing Strategy

### Unit Testing Approach

**Test Framework**: Jest + React Native Testing Library

**Hook Testing Pattern**:
```typescript
import { renderHook, waitFor } from '@testing-library/react-hooks';
import { useVenues } from '../useVenues';

describe('useVenues', () => {
  it('should fetch venues on mount', async () => {
    const { result } = renderHook(() => useVenues());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.venues.length).toBeGreaterThan(0);
    });
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript property testing library)

**Test Configuration**: Minimum 100 iterations per property test

**Property Test Examples**:

1. **Property 1: Hook State Consistency**
   - Generate random venue data
   - Mock successful API response
   - Verify loading=false and error=null after fetch

2. **Property 2: Optimistic Update Rollback**
   - Generate random venue IDs
   - Mock failed toggleFavorite
   - Verify favorites set reverts to original

3. **Property 3: Debounce Delay Accuracy**
   - Generate random values and delays
   - Verify debounced value updates only after delay

### Integration Testing

**Test Scenarios**:
1. HomeScreen with real hooks
2. SearchScreen with debounced search
3. VenueDetailScreen with check-in stats
4. Favorites toggle across multiple screens

### Manual Testing Checklist

- [ ] HomeScreen loads venues correctly
- [ ] SearchScreen filters work with debounce
- [ ] VenueDetailScreen shows check-in stats
- [ ] Favorites toggle works across screens
- [ ] Check-in/out actions work correctly
- [ ] Pull-to-refresh works
- [ ] Navigation between screens works
- [ ] No console errors
- [ ] Loading states display correctly
- [ ] Error states display correctly

## Implementation Notes

### Migration Strategy

1. **Phase 1**: Create hooks directory and implement hooks
2. **Phase 2**: Refactor HomeScreen (simplest)
3. **Phase 3**: Refactor VenueDetailScreen
4. **Phase 4**: Refactor SearchScreen (most complex)
5. **Phase 5**: Test all screens thoroughly
6. **Phase 6**: Remove unused code from screens

### Performance Considerations

1. **Memoization**: Use `useMemo` for expensive computations
2. **Callback Stability**: Use `useCallback` for functions passed as props
3. **Debouncing**: Prevent excessive API calls with useDebounce
4. **Abort Controllers**: Cancel in-flight requests on unmount
5. **Lazy Loading**: Only fetch data when needed (enabled flag)

### TypeScript Best Practices

1. **Explicit Types**: Define interfaces for all hook parameters and returns
2. **Generic Types**: Use generics where appropriate (useDebounce)
3. **Strict Null Checks**: Handle null/undefined explicitly
4. **Type Guards**: Use type guards for runtime type checking
5. **No Any**: Avoid `any` type, use `unknown` if needed

### Code Style Guidelines

1. **Naming**: use[Feature][Action] pattern
2. **File Organization**: One hook per file (unless closely related)
3. **Comments**: JSDoc for all exported hooks
4. **Exports**: Named exports only (no default exports)
5. **Dependencies**: List all dependencies in useEffect arrays
