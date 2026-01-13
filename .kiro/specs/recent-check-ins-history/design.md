# Design Document: Recent Check-Ins History

## Overview

The Recent Check-Ins History feature allows users to view a chronological list of venues they have recently visited. This feature leverages the existing `check_ins` table in Supabase and integrates seamlessly with the current venue display components. The implementation will include a new screen, backend service methods, and reusable UI components for displaying check-in history.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  History Screen │
│   (React Native)│
└────────┬────────┘
         │
         ├─ useCheckInHistory (Custom Hook)
         │
         ├─ CheckInHistoryService (API Layer)
         │
         └─ Supabase Client
                  │
                  ▼
         ┌────────────────┐
         │  check_ins     │
         │  (PostgreSQL)  │
         │  JOIN venues   │
         └────────────────┘
```

### Component Hierarchy

```
HistoryScreen
├── SafeAreaView
├── ScrollView (with RefreshControl)
│   ├── CheckInHistoryList
│   │   ├── CheckInHistoryItem (multiple)
│   │   │   ├── VenueImage
│   │   │   ├── VenueInfo
│   │   │   │   ├── VenueName
│   │   │   │   ├── VenueLocation
│   │   │   │   └── VenueCategory (Badge)
│   │   │   ├── CheckInMetadata
│   │   │   │   ├── CheckInTimestamp
│   │   │   │   ├── CheckInDuration
│   │   │   │   └── VisitCountBadge
│   │   │   └── NavigationChevron
│   │   └── LoadMoreIndicator
│   └── EmptyState (conditional)
└── LoadingIndicator (conditional)
```

## Components and Interfaces

### 1. CheckInHistoryService (Backend Service)

**Location**: `src/services/api/checkins.ts` (extend existing service)

**New Methods**:

```typescript
interface CheckInWithVenue {
  id: string;
  venue_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
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

interface CheckInHistoryOptions {
  userId: string;
  limit?: number;
  offset?: number;
  daysBack?: number; // Default: 30
}

interface CheckInHistoryResponse {
  checkIns: CheckInWithVenue[];
  hasMore: boolean;
  total: number;
}

// Get user's check-in history with venue details
static async getUserCheckInHistory(
  options: CheckInHistoryOptions
): Promise<CheckInHistoryResponse>

// Get visit count for a specific venue
static async getUserVenueVisitCount(
  userId: string,
  venueId: string
): Promise<number>

// Get visit counts for multiple venues (batch)
static async getUserVenueVisitCounts(
  userId: string,
  venueIds: string[]
): Promise<Map<string, number>>
```

**Implementation Details**:

- Query `check_ins` table with `.select()` including venue join
- Filter by `user_id` and date range (past 30 days by default)
- Order by `checked_in_at DESC`
- Support pagination with `limit` and `offset`
- Return structured response with `hasMore` flag for pagination

### 2. useCheckInHistory (Custom Hook)

**Location**: `src/hooks/useCheckInHistory.ts` (new file)

**Interface**:

```typescript
interface UseCheckInHistoryOptions {
  userId: string;
  enabled?: boolean;
  daysBack?: number;
}

interface UseCheckInHistoryReturn {
  checkIns: CheckInWithVenue[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  refreshing: boolean;
}

export function useCheckInHistory(
  options: UseCheckInHistoryOptions
): UseCheckInHistoryReturn
```

**Behavior**:

- Fetches initial batch of 50 check-ins on mount
- Provides `loadMore()` for pagination
- Provides `refetch()` for pull-to-refresh
- Manages loading states and errors
- Caches results to prevent unnecessary re-fetches

### 3. HistoryScreen Component

**Location**: `src/screens/customer/HistoryScreen.tsx` (new file)

**Props**: None (uses navigation and auth context)

**Features**:

- Displays list of recent check-ins
- Pull-to-refresh functionality
- Infinite scroll pagination
- Empty state when no check-ins
- Loading indicators
- Navigation to venue detail on tap

### 4. CheckInHistoryItem Component

**Location**: `src/components/checkin/CheckInHistoryItem.tsx` (new file)

**Props**:

```typescript
interface CheckInHistoryItemProps {
  checkIn: CheckInWithVenue;
  visitCount: number;
  onPress: () => void;
}
```

**Features**:

- Displays venue image, name, location, category
- Shows formatted check-in timestamp
- Shows check-in duration (if checked out)
- Shows visit count badge
- Tappable to navigate to venue detail

### 5. Time Formatting Utilities

**Location**: `src/utils/formatting/time.ts` (new file)

**Functions**:

```typescript
// Format timestamp as relative time or full date
export function formatCheckInTime(timestamp: string): string

// Calculate and format duration between two timestamps
export function formatDuration(
  startTime: string,
  endTime: string | null
): string

// Format visit count with ordinal suffix
export function formatVisitCount(count: number): string
```

## Data Models

### CheckInWithVenue (Extended Type)

```typescript
interface CheckInWithVenue {
  // Check-in fields
  id: string;
  venue_id: string;
  user_id: string;
  checked_in_at: string; // ISO 8601 timestamp
  checked_out_at: string | null; // ISO 8601 timestamp or null if active
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Nested venue fields
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
```

### CheckInHistoryState (Component State)

```typescript
interface CheckInHistoryState {
  checkIns: CheckInWithVenue[];
  visitCounts: Map<string, number>; // venue_id -> count
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  offset: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following properties and consolidated redundant ones:

**Consolidated Properties:**
- Properties 1.1 and 2.3 both test the 30-day filter → Combined into Property 1
- Properties 1.2 and sorting behavior → Property 2
- Properties 2.1 and user filtering → Property 3
- Properties 2.2 and 2.4 about venue data inclusion → Combined into Property 4
- Properties 6.1 and 6.2 about duration calculation and formatting → Combined into Property 5
- Properties 10.1 and 10.4 about visit count calculation → Combined into Property 6

**Unique Properties Retained:**
- Property 7: Timestamp formatting (5.1, 5.2)
- Property 8: Pagination limits (7.1, 7.2)
- Property 9: Navigation parameter passing (3.2)
- Property 10: Refresh triggers re-query (4.2, 4.3)
- Property 11: Error handling (2.5)
- Property 12: Visit count formatting (10.3)
- Property 13: Venue category display (9.1)
- Property 14: Data structure validation (1.3)

### Property 1: 30-Day Filter

*For any* user and any set of check-ins in the database, when fetching check-in history, all returned check-ins should have a `checked_in_at` timestamp within the past 30 days from the current date.

**Validates: Requirements 1.1, 2.3**

### Property 2: Descending Chronological Order

*For any* list of check-ins returned by the history service, each check-in should have a `checked_in_at` timestamp that is greater than or equal to the timestamp of the check-in that follows it in the list.

**Validates: Requirements 1.2**

### Property 3: User Isolation

*For any* user ID provided to the history service, all returned check-ins should have a `user_id` field that matches the provided user ID.

**Validates: Requirements 2.1**

### Property 4: Venue Data Inclusion

*For any* check-in returned by the history service, the check-in object should contain a nested `venue` object with all required venue fields (id, name, location, category, image_url, rating).

**Validates: Requirements 2.2, 2.4**

### Property 5: Duration Calculation and Formatting

*For any* check-in with both `checked_in_at` and `checked_out_at` timestamps, the calculated duration should equal the time difference between the two timestamps, and the formatted duration should display hours and minutes correctly (e.g., "2h 30m" for 150 minutes).

**Validates: Requirements 6.1, 6.2**

### Property 6: Visit Count Accuracy

*For any* user and venue combination, the visit count should equal the total number of check-in records in the database for that user-venue pair, regardless of the date range filter applied to the history display.

**Validates: Requirements 10.1, 10.4**

### Property 7: Timestamp Formatting

*For any* check-in timestamp, if the timestamp is within the past 7 days, the formatted output should be a relative time string (e.g., "2 hours ago", "Yesterday"), and if the timestamp is older than 7 days, the formatted output should be a full date string (e.g., "Jan 5, 2026").

**Validates: Requirements 5.1, 5.2**

### Property 8: Pagination Limits

*For any* request to fetch check-in history, the number of check-ins returned should not exceed the specified limit (default 50), and subsequent pagination requests with an offset should return the next batch of check-ins in chronological order without duplicates.

**Validates: Requirements 7.1, 7.2**

### Property 9: Navigation Parameter Passing

*For any* check-in item that is tapped, the navigation action should pass the correct `venue_id` from that check-in to the venue detail screen.

**Validates: Requirements 3.2**

### Property 10: Refresh Re-Query

*For any* refresh action triggered by the user, the system should make a new query to the backend service and update the displayed check-ins with the fresh data.

**Validates: Requirements 4.2, 4.3**

### Property 11: Error Handling

*For any* query that fails due to network issues or database errors, the service should return an error object with a descriptive message rather than throwing an unhandled exception.

**Validates: Requirements 2.5**

### Property 12: Visit Count Formatting

*For any* visit count greater than 1, the formatted string should include the ordinal suffix (e.g., "2nd visit", "3rd visit", "10th visit").

**Validates: Requirements 10.3**

### Property 13: Venue Category Display

*For any* check-in displayed in the history list, the venue category field should be rendered and visible to the user.

**Validates: Requirements 9.1**

### Property 14: Required Data Fields

*For any* check-in displayed in the history UI, the rendered component should include venue name, location, check-in timestamp, and venue image (or placeholder if null).

**Validates: Requirements 1.3**

## Error Handling

### Service Layer Errors

1. **Network Errors**: Catch and return user-friendly error messages
2. **Authentication Errors**: Redirect to login if session expired
3. **Database Query Errors**: Log error details, return generic error to user
4. **Empty Results**: Return empty array, not an error

### UI Layer Errors

1. **Display Error Messages**: Show error banner at top of screen
2. **Retry Mechanism**: Provide "Retry" button on error
3. **Graceful Degradation**: Show cached data if available during error
4. **Loading States**: Prevent multiple simultaneous requests

### Edge Cases

1. **No Check-Ins**: Display empty state with call-to-action
2. **Active Check-In**: Handle null `checked_out_at` gracefully
3. **Missing Venue Data**: Use placeholder image and "Unknown" for missing fields
4. **Pagination End**: Disable load more when all data fetched

## Testing Strategy

### Unit Tests

**Service Layer** (`CheckInHistoryService`):
- Test query construction with various parameters
- Test date filtering logic
- Test pagination offset calculation
- Test error handling for failed queries
- Test visit count calculation

**Formatting Utilities** (`time.ts`):
- Test relative time formatting for various time ranges
- Test duration calculation and formatting
- Test visit count ordinal suffix generation
- Test edge cases (0 duration, null timestamps)

**Custom Hook** (`useCheckInHistory`):
- Test initial data fetch
- Test pagination behavior
- Test refresh functionality
- Test error state management
- Test loading state transitions

### Property-Based Tests

All property-based tests should run a minimum of 100 iterations to ensure comprehensive coverage.

**Property 1: 30-Day Filter**
- Generate random check-ins with timestamps ranging from 60 days ago to today
- Fetch history with 30-day filter
- Verify all returned check-ins are within 30 days
- **Feature: recent-check-ins-history, Property 1: 30-Day Filter**

**Property 2: Descending Chronological Order**
- Generate random check-ins with various timestamps
- Fetch history
- Verify list is sorted in descending order by `checked_in_at`
- **Feature: recent-check-ins-history, Property 2: Descending Chronological Order**

**Property 3: User Isolation**
- Generate check-ins for multiple users
- Fetch history for specific user
- Verify all returned check-ins belong to that user
- **Feature: recent-check-ins-history, Property 3: User Isolation**

**Property 4: Venue Data Inclusion**
- Generate random check-ins with venue joins
- Fetch history
- Verify each check-in contains complete venue object
- **Feature: recent-check-ins-history, Property 4: Venue Data Inclusion**

**Property 5: Duration Calculation and Formatting**
- Generate random check-in/check-out timestamp pairs
- Calculate duration
- Verify duration equals time difference
- Verify formatting is correct (hours and minutes)
- **Feature: recent-check-ins-history, Property 5: Duration Calculation and Formatting**

**Property 6: Visit Count Accuracy**
- Generate random check-in histories for user-venue pairs
- Calculate visit count
- Verify count matches total check-ins for that pair
- **Feature: recent-check-ins-history, Property 6: Visit Count Accuracy**

**Property 7: Timestamp Formatting**
- Generate random timestamps from various time ranges
- Format timestamps
- Verify relative time for recent (<7 days) and full date for older
- **Feature: recent-check-ins-history, Property 7: Timestamp Formatting**

**Property 8: Pagination Limits**
- Generate large set of check-ins (>100)
- Fetch with limit of 50
- Verify exactly 50 returned
- Fetch next page with offset
- Verify no duplicates and correct order
- **Feature: recent-check-ins-history, Property 8: Pagination Limits**

**Property 9: Navigation Parameter Passing**
- Generate random check-ins
- Simulate tap on check-in item
- Verify correct venue_id is passed to navigation
- **Feature: recent-check-ins-history, Property 9: Navigation Parameter Passing**

**Property 10: Refresh Re-Query**
- Fetch initial history
- Add new check-in to database
- Trigger refresh
- Verify new check-in appears in list
- **Feature: recent-check-ins-history, Property 10: Refresh Re-Query**

**Property 11: Error Handling**
- Simulate various error conditions (network, database)
- Verify service returns error object with message
- Verify no unhandled exceptions
- **Feature: recent-check-ins-history, Property 11: Error Handling**

**Property 12: Visit Count Formatting**
- Generate random visit counts (1-100)
- Format counts
- Verify ordinal suffixes are correct (1st, 2nd, 3rd, 4th, etc.)
- **Feature: recent-check-ins-history, Property 12: Visit Count Formatting**

**Property 13: Venue Category Display**
- Generate random check-ins with various venue categories
- Render history items
- Verify category is present in rendered output
- **Feature: recent-check-ins-history, Property 13: Venue Category Display**

**Property 14: Required Data Fields**
- Generate random check-ins
- Render history items
- Verify venue name, location, timestamp, and image are present
- **Feature: recent-check-ins-history, Property 14: Required Data Fields**

### Integration Tests

- Test full flow: fetch history → display → tap item → navigate
- Test pull-to-refresh with real backend
- Test pagination with real backend
- Test empty state display
- Test error state display and recovery

### Testing Framework

- **Unit Tests**: Jest with React Native Testing Library
- **Property-Based Tests**: fast-check (JavaScript property-based testing library)
- **Integration Tests**: Detox (React Native E2E testing)

## Implementation Notes

### Performance Considerations

1. **Pagination**: Load 50 items at a time to balance performance and UX
2. **Caching**: Cache check-in history in memory to reduce API calls
3. **Debouncing**: Debounce scroll events for pagination triggers
4. **Image Loading**: Use lazy loading for venue images
5. **Batch Queries**: Fetch visit counts in batch rather than individual queries

### Accessibility

1. **Screen Reader Support**: Add accessibility labels to all interactive elements
2. **Touch Targets**: Ensure minimum 44x44pt touch targets
3. **Color Contrast**: Ensure text meets WCAG AA standards
4. **Focus Management**: Proper focus order for keyboard navigation

### Future Enhancements

1. **Search/Filter**: Allow users to search or filter their history
2. **Export**: Allow users to export their check-in history
3. **Statistics**: Show aggregate stats (most visited venue, total visits, etc.)
4. **Date Range Selector**: Allow users to customize the date range
5. **Map View**: Display check-ins on a map
