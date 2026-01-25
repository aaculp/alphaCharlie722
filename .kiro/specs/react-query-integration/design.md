# Design Document: React Query Integration

## Overview

This design document outlines the implementation of React Query (TanStack Query v5) into the React Native application to solve data staleness issues. The integration will replace existing ad-hoc data fetching patterns with a centralized, cache-aware solution that automatically manages data freshness, handles loading/error states consistently, and provides optimistic updates for better user experience.

The design focuses on:
- Centralized query client configuration with sensible defaults
- Migration strategy from existing hooks to React Query hooks
- Integration with Supabase for real-time updates
- Navigation-aware cache invalidation
- Optimistic updates for immediate UI feedback
- Performance optimization through intelligent caching and prefetching

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           QueryClientProvider (Root)                  │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │         Navigation Container                     │ │  │
│  │  │  ┌───────────────┐  ┌──────────────────────┐   │ │  │
│  │  │  │  HomeScreen   │  │  VenueDetailScreen   │   │ │  │
│  │  │  │  - useVenues  │  │  - useVenue          │   │ │  │
│  │  │  │  - useFlash   │  │  - useCheckIn        │   │ │  │
│  │  │  └───────┬───────┘  └──────────┬───────────┘   │ │  │
│  │  └──────────┼────────────────────┼─────────────────┘ │  │
│  └─────────────┼────────────────────┼───────────────────┘  │
│                │                    │                       │
│  ┌─────────────▼────────────────────▼───────────────────┐  │
│  │              Query Client (Cache Manager)            │  │
│  │  - Query Cache (venues, users, check-ins, etc.)     │  │
│  │  - Mutation Queue                                    │  │
│  │  - Invalidation Logic                                │  │
│  └─────────────┬────────────────────┬───────────────────┘  │
│                │                    │                       │
│  ┌─────────────▼────────────────────▼───────────────────┐  │
│  │           Query/Mutation Hooks Layer                 │  │
│  │  - useVenuesQuery                                    │  │
│  │  - useVenueQuery                                     │  │
│  │  - useCheckInMutation                                │  │
│  │  - useFlashOffersQuery                               │  │
│  └─────────────┬────────────────────┬───────────────────┘  │
│                │                    │                       │
│  ┌─────────────▼────────────────────▼───────────────────┐  │
│  │              API Services Layer                      │  │
│  │  - venueService.ts                                   │  │
│  │  - checkInService.ts                                 │  │
│  │  - userService.ts                                    │  │
│  └─────────────┬────────────────────┬───────────────────┘  │
│                │                    │                       │
└────────────────┼────────────────────┼───────────────────────┘
                 │                    │
         ┌───────▼────────────────────▼──────────┐
         │      Supabase Client                   │
         │  - Database Operations                 │
         │  - Real-time Subscriptions             │
         └────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Screen Component** requests data via React Query hook
2. **Query Hook** checks Query Client cache
3. If cached and fresh, return immediately
4. If stale or missing, **Query Hook** calls API Service
5. **API Service** interacts with Supabase Client
6. Response flows back through layers, updating cache
7. **Real-time subscriptions** trigger cache invalidation
8. **Navigation events** trigger selective refetching

## Components and Interfaces

### 1. Query Client Configuration

**File:** `src/lib/queryClient.ts`

```typescript
interface QueryClientConfig {
  defaultOptions: {
    queries: {
      staleTime: number;
      cacheTime: number;
      retry: number | ((failureCount: number, error: Error) => boolean);
      refetchOnWindowFocus: boolean;
      refetchOnReconnect: boolean;
    };
    mutations: {
      retry: number;
      onError: (error: Error) => void;
    };
  };
}

function createQueryClient(): QueryClient;
function setupQueryPersistence(queryClient: QueryClient): void;
```

**Responsibilities:**
- Create and configure QueryClient instance
- Set default stale/cache times
- Configure retry logic
- Set up cache persistence with AsyncStorage
- Initialize dev tools in development mode

**Configuration Values:**
- Default staleTime: 30 seconds (data considered fresh for 30s)
- Default cacheTime: 5 minutes (inactive data kept for 5min)
- Retry: 3 attempts with exponential backoff
- RefetchOnWindowFocus: true (refetch when app returns to foreground)
- RefetchOnReconnect: true (refetch when network reconnects)

### 2. Query Key Factory

**File:** `src/lib/queryKeys.ts`

```typescript
const queryKeys = {
  venues: {
    all: ['venues'] as const,
    lists: () => [...queryKeys.venues.all, 'list'] as const,
    list: (filters: VenueFilters) => [...queryKeys.venues.lists(), filters] as const,
    details: () => [...queryKeys.venues.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.venues.details(), id] as const,
  },
  
  checkIns: {
    all: ['check-ins'] as const,
    byUser: (userId: string) => [...queryKeys.checkIns.all, 'user', userId] as const,
    byVenue: (venueId: string) => [...queryKeys.checkIns.all, 'venue', venueId] as const,
  },
  
  flashOffers: {
    all: ['flash-offers'] as const,
    byVenue: (venueId: string) => [...queryKeys.flashOffers.all, 'venue', venueId] as const,
  },
  
  users: {
    all: ['users'] as const,
    profile: (userId: string) => [...queryKeys.users.all, userId, 'profile'] as const,
    friends: (userId: string) => [...queryKeys.users.all, userId, 'friends'] as const,
  },
  
  collections: {
    all: ['collections'] as const,
    byUser: (userId: string) => [...queryKeys.collections.all, 'user', userId] as const,
    detail: (collectionId: string) => [...queryKeys.collections.all, collectionId] as const,
  },
  
  activityFeed: {
    byUser: (userId: string) => ['activity-feed', userId] as const,
  },
};
```

**Responsibilities:**
- Provide centralized, type-safe query key generation
- Ensure consistent key structure across the app
- Enable hierarchical invalidation (e.g., invalidate all venue queries)
- Support filtering and parameterization

### 3. Venue Query Hooks

**File:** `src/hooks/queries/useVenuesQuery.ts`

```typescript
interface VenueFilters {
  location?: { lat: number; lng: number; radius: number };
  category?: string;
  hasFlashOffers?: boolean;
}

interface UseVenuesQueryOptions {
  filters?: VenueFilters;
  enabled?: boolean;
  staleTime?: number;
}

interface UseVenuesQueryResult {
  venues: Venue[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useVenuesQuery(options?: UseVenuesQueryOptions): UseVenuesQueryResult;
```

**File:** `src/hooks/queries/useVenueQuery.ts`

```typescript
interface UseVenueQueryOptions {
  venueId: string;
  enabled?: boolean;
}

interface UseVenueQueryResult {
  venue: Venue | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useVenueQuery(options: UseVenueQueryOptions): UseVenueQueryResult;
```

**Responsibilities:**
- Fetch venue list with optional filters
- Fetch single venue details
- Manage loading/error states
- Provide refetch capability
- Integrate with query key factory

### 4. Check-In Mutation Hooks

**File:** `src/hooks/mutations/useCheckInMutation.ts`

```typescript
interface CheckInData {
  venueId: string;
  userId: string;
  timestamp: Date;
  note?: string;
}

interface UseCheckInMutationOptions {
  onSuccess?: (data: CheckIn) => void;
  onError?: (error: Error) => void;
}

interface UseCheckInMutationResult {
  checkIn: (data: CheckInData) => Promise<CheckIn>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

function useCheckInMutation(options?: UseCheckInMutationOptions): UseCheckInMutationResult;
```

**Responsibilities:**
- Execute check-in mutation
- Implement optimistic updates
- Invalidate related queries on success
- Rollback on failure
- Handle error states

**Optimistic Update Strategy:**
```typescript
// Optimistically update venue check-in count
onMutate: async (checkInData) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: queryKeys.venues.detail(checkInData.venueId) });
  
  // Snapshot previous value
  const previousVenue = queryClient.getQueryData(queryKeys.venues.detail(checkInData.venueId));
  
  // Optimistically update
  queryClient.setQueryData(queryKeys.venues.detail(checkInData.venueId), (old) => ({
    ...old,
    checkInCount: old.checkInCount + 1,
    userHasCheckedIn: true,
  }));
  
  return { previousVenue };
},

onError: (err, variables, context) => {
  // Rollback on error
  if (context?.previousVenue) {
    queryClient.setQueryData(
      queryKeys.venues.detail(variables.venueId),
      context.previousVenue
    );
  }
},

onSettled: (data, error, variables) => {
  // Always refetch after mutation
  queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(variables.venueId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.checkIns.byUser(variables.userId) });
}
```

### 5. Flash Offers Query Hooks

**File:** `src/hooks/queries/useFlashOffersQuery.ts`

```typescript
interface UseFlashOffersQueryOptions {
  venueId?: string;
  enabled?: boolean;
}

interface UseFlashOffersQueryResult {
  flashOffers: FlashOffer[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useFlashOffersQuery(options?: UseFlashOffersQueryOptions): UseFlashOffersQueryResult;
```

**Configuration:**
- staleTime: 10 seconds (flash offers are time-sensitive)
- refetchInterval: 30 seconds (poll for new offers)
- refetchOnWindowFocus: true

**File:** `src/hooks/mutations/useClaimFlashOfferMutation.ts`

```typescript
interface ClaimFlashOfferData {
  offerId: string;
  userId: string;
  venueId: string;
}

function useClaimFlashOfferMutation(): UseMutationResult<FlashOffer, Error, ClaimFlashOfferData>;
```

### 6. User and Social Query Hooks

**File:** `src/hooks/queries/useUserProfileQuery.ts`

```typescript
interface UseUserProfileQueryOptions {
  userId: string;
  enabled?: boolean;
}

function useUserProfileQuery(options: UseUserProfileQueryOptions): UseQueryResult<UserProfile>;
```

**File:** `src/hooks/queries/useFriendsQuery.ts`

```typescript
interface UseFriendsQueryOptions {
  userId: string;
  enabled?: boolean;
}

function useFriendsQuery(options: UseFriendsQueryOptions): UseQueryResult<Friend[]>;
```

**File:** `src/hooks/queries/useActivityFeedQuery.ts`

```typescript
interface UseActivityFeedQueryOptions {
  userId: string;
  enabled?: boolean;
}

function useActivityFeedQuery(options: UseActivityFeedQueryOptions): UseInfiniteQueryResult<ActivityItem[]>;
```

**Note:** Activity feed uses `useInfiniteQuery` for pagination.

### 7. Collection Query and Mutation Hooks

**File:** `src/hooks/queries/useCollectionsQuery.ts`

```typescript
interface UseCollectionsQueryOptions {
  userId: string;
  enabled?: boolean;
}

function useCollectionsQuery(options: UseCollectionsQueryOptions): UseQueryResult<Collection[]>;
```

**File:** `src/hooks/queries/useCollectionQuery.ts`

```typescript
interface UseCollectionQueryOptions {
  collectionId: string;
  enabled?: boolean;
}

function useCollectionQuery(options: UseCollectionQueryOptions): UseQueryResult<Collection>;
```

**File:** `src/hooks/mutations/useAddVenueToCollectionMutation.ts`

```typescript
interface AddVenueToCollectionData {
  collectionId: string;
  venueId: string;
  userId: string;
}

function useAddVenueToCollectionMutation(): UseMutationResult<void, Error, AddVenueToCollectionData>;
```

### 8. Supabase Real-Time Integration

**File:** `src/lib/realtimeSync.ts`

```typescript
interface RealtimeSubscriptionConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onEvent: (payload: RealtimePayload) => void;
}

function setupRealtimeSync(queryClient: QueryClient): () => void;
function subscribeToVenueUpdates(queryClient: QueryClient): RealtimeChannel;
function subscribeToCheckInUpdates(queryClient: QueryClient): RealtimeChannel;
function subscribeToFlashOfferUpdates(queryClient: QueryClient): RealtimeChannel;
```

**Implementation Strategy:**
```typescript
function setupRealtimeSync(queryClient: QueryClient) {
  const venueChannel = supabase
    .channel('venue-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'venues' },
      (payload) => {
        // Invalidate affected venue queries
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.venues.detail(payload.new.id) 
          });
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.venues.lists() 
          });
        }
      }
    )
    .subscribe();

  const checkInChannel = supabase
    .channel('checkin-changes')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'check_ins' },
      (payload) => {
        // Invalidate venue and user check-in queries
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.checkIns.byVenue(payload.new.venue_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.venues.detail(payload.new.venue_id) 
        });
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    venueChannel.unsubscribe();
    checkInChannel.unsubscribe();
  };
}
```

### 9. Navigation Integration

**File:** `src/lib/navigationSync.ts`

```typescript
interface NavigationSyncConfig {
  queryClient: QueryClient;
  navigationRef: NavigationContainerRef;
}

function setupNavigationSync(config: NavigationSyncConfig): () => void;
```

**Implementation Strategy:**
```typescript
function setupNavigationSync({ queryClient, navigationRef }: NavigationSyncConfig) {
  const unsubscribe = navigationRef.addListener('state', (e) => {
    const currentRoute = navigationRef.getCurrentRoute();
    const previousRoute = getPreviousRoute(e);

    // Invalidate list queries when returning from detail screens
    if (previousRoute?.name === 'VenueDetail' && currentRoute?.name === 'Home') {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.lists() });
    }

    // Prefetch venue details when navigating to detail screen
    if (currentRoute?.name === 'VenueDetail' && currentRoute.params?.venueId) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.venues.detail(currentRoute.params.venueId),
        queryFn: () => venueService.getVenue(currentRoute.params.venueId),
      });
    }
  });

  return unsubscribe;
}
```

### 10. Cache Persistence

**File:** `src/lib/cachePersistence.ts`

```typescript
interface PersistOptions {
  maxAge?: number;
  buster?: string;
  serialize?: (data: any) => string;
  deserialize?: (data: string) => any;
}

function createAsyncStoragePersister(options?: PersistOptions): Persister;
```

**Implementation:**
- Use `@tanstack/query-async-storage-persister` package
- Persist to React Native AsyncStorage
- Set maxAge to 24 hours
- Exclude sensitive queries from persistence using query metadata
- Restore cache on app launch
- Mark restored data as stale to trigger background refetch

## Data Models

### Query State Model

```typescript
interface QueryState<TData> {
  data: TData | undefined;
  dataUpdatedAt: number;
  error: Error | null;
  errorUpdatedAt: number;
  fetchFailureCount: number;
  fetchFailureReason: Error | null;
  fetchMeta: any;
  isInvalidated: boolean;
  status: 'pending' | 'error' | 'success';
  fetchStatus: 'fetching' | 'paused' | 'idle';
}
```

### Mutation State Model

```typescript
interface MutationState<TData, TVariables> {
  context: unknown;
  data: TData | undefined;
  error: Error | null;
  failureCount: number;
  failureReason: Error | null;
  isPaused: boolean;
  status: 'idle' | 'pending' | 'error' | 'success';
  variables: TVariables | undefined;
  submittedAt: number;
}
```

### Query Key Structure

```typescript
type QueryKey = readonly unknown[];

// Examples:
['venues'] // All venue queries
['venues', 'list'] // All venue list queries
['venues', 'list', { category: 'restaurant' }] // Filtered venue list
['venues', 'detail'] // All venue detail queries
['venues', 'detail', 'venue-123'] // Specific venue detail
['users', 'user-456', 'profile'] // User profile
['check-ins', 'user', 'user-456'] // User's check-ins
```

### Cache Entry Model

```typescript
interface CacheEntry {
  queryKey: QueryKey;
  queryHash: string;
  state: QueryState<unknown>;
  meta?: {
    persist?: boolean; // Whether to persist this query
    sensitive?: boolean; // Whether data is sensitive
  };
}
```

## Data Flow Examples

### Example 1: User Checks In at Venue

```
1. User taps "Check In" button
   ↓
2. useCheckInMutation.mutate() called
   ↓
3. onMutate: Optimistically update UI
   - Increment venue check-in count
   - Mark user as checked in
   - Save previous state for rollback
   ↓
4. Execute mutation: checkInService.createCheckIn()
   ↓
5. Supabase inserts check-in record
   ↓
6. onSuccess: Invalidate related queries
   - queryKeys.venues.detail(venueId)
   - queryKeys.checkIns.byUser(userId)
   - queryKeys.checkIns.byVenue(venueId)
   ↓
7. React Query refetches invalidated queries
   ↓
8. UI updates with server data
   ↓
9. Supabase real-time event fires
   ↓
10. Other users see updated check-in count
```

### Example 2: Navigate from Home to Venue Detail

```
1. User taps venue card on HomeScreen
   ↓
2. Navigation event fires
   ↓
3. navigationSync detects route change
   ↓
4. Prefetch venue details
   - queryClient.prefetchQuery(queryKeys.venues.detail(venueId))
   ↓
5. Navigate to VenueDetailScreen
   ↓
6. useVenueQuery hook activates
   ↓
7. Check cache for venue data
   ↓
8. If cached and fresh: Return immediately
   If stale: Return cached + refetch in background
   If missing: Show loading + fetch
   ↓
9. Screen renders with data
```

### Example 3: Return from Venue Detail to Home

```
1. User navigates back to HomeScreen
   ↓
2. Navigation event fires
   ↓
3. navigationSync detects route change
   ↓
4. Check if mutations occurred on detail screen
   ↓
5. If mutations occurred:
   - Invalidate queryKeys.venues.lists()
   ↓
6. useVenuesQuery hook on HomeScreen
   ↓
7. Detect stale data
   ↓
8. Refetch venue list in background
   ↓
9. UI updates with fresh data
```

### Example 4: App Returns to Foreground

```
1. App state changes to 'active'
   ↓
2. React Query detects focus event
   ↓
3. Iterate through active queries
   ↓
4. For each query:
   - Check if data is stale
   - If stale: Trigger refetch
   ↓
5. Queries refetch in parallel
   ↓
6. UI updates as data arrives
```

## Migration Strategy

### Phase 1: Setup and Infrastructure (Week 1)

1. Install React Query and dependencies
2. Create query client configuration
3. Set up QueryClientProvider at app root
4. Create query key factory
5. Set up cache persistence
6. Add dev tools for development

### Phase 2: High-Impact Migrations (Week 2)

Priority order based on staleness issues:

1. **Venue queries** (highest impact)
   - Migrate useVenues hook
   - Migrate useVenue hook
   - Add navigation-based invalidation

2. **Check-in mutations** (high user interaction)
   - Migrate check-in actions
   - Implement optimistic updates
   - Add query invalidation

3. **Flash offers** (time-sensitive)
   - Migrate flash offer queries
   - Configure aggressive refetching
   - Add claim mutation

### Phase 3: Social Features (Week 3)

1. User profile queries
2. Friends list queries
3. Activity feed (with infinite scroll)
4. Collection queries and mutations

### Phase 4: Real-Time Integration (Week 4)

1. Set up Supabase real-time subscriptions
2. Connect to query invalidation
3. Test multi-user scenarios

### Phase 5: Optimization and Cleanup (Week 5)

1. Add prefetching for common navigation paths
2. Optimize cache times based on usage patterns
3. Remove legacy data fetching code
4. Performance testing and tuning

### Backward Compatibility Strategy

During migration, maintain existing hook interfaces:

```typescript
// Legacy hook (to be replaced)
function useVenues(filters?: VenueFilters) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  // ... existing implementation
  return { venues, loading, refetch };
}

// New React Query hook with same interface
function useVenues(filters?: VenueFilters) {
  const { data: venues = [], isLoading: loading, refetch } = useVenuesQuery({ filters });
  return { venues, loading, refetch };
}
```

This allows gradual migration without breaking existing components.



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

1. **Query key structure properties (2.1, 2.2, 3.5, 4.1, 5.1, 5.2, 5.3, 6.1, 6.2)**: All of these test that query keys follow the correct pattern. These can be consolidated into a single property that validates query key structure across all query types.

2. **Post-mutation invalidation properties (2.5, 3.2, 4.3, 5.4, 5.5, 6.3, 6.4, 6.5)**: All of these test that mutations invalidate the correct queries. These can be consolidated into properties grouped by mutation type.

3. **Optimistic update properties (3.3, 9.1, 9.2, 9.3)**: All test that UI updates before server confirmation. These can be consolidated into a single property about optimistic updates.

4. **Rollback properties (3.4, 9.4)**: Both test rollback on failure. These are the same property stated twice.

5. **Real-time invalidation properties (7.1, 7.2, 7.3)**: All test that real-time events trigger invalidation. These can be consolidated into a single property.

The consolidated properties below eliminate redundancy while maintaining comprehensive coverage.

### Core Query Properties

**Property 1: Query key structure consistency**

*For any* query type (venues, users, check-ins, flash-offers, collections, activity-feed), the query key SHALL follow the hierarchical pattern defined in the query key factory, with the entity type as the first element and specific identifiers or filters as subsequent elements.

**Validates: Requirements 2.1, 2.2, 3.5, 4.1, 5.1, 5.2, 5.3, 6.1, 6.2**

**Property 2: Request deduplication**

*For any* query key, when multiple components request the same data simultaneously, only one network request SHALL be made and the result SHALL be shared across all requesters.

**Validates: Requirements 13.1**

**Property 3: Query state availability**

*For any* query hook, the return value SHALL include isLoading, isFetching, isError, and error states that accurately reflect the current query status.

**Validates: Requirements 11.5**

**Property 4: Backward compatibility**

*For any* migrated query hook, the return value structure SHALL match the original hook's interface, ensuring existing components continue to function without modification.

**Validates: Requirements 12.1, 12.2**

### Mutation and Invalidation Properties

**Property 5: Venue mutation invalidation**

*For any* venue mutation (check-in, favorite, update), upon successful completion, the system SHALL invalidate all queries with keys that include the affected venue ID, including detail queries, list queries, and related entity queries.

**Validates: Requirements 2.5, 3.2**

**Property 6: Check-in mutation invalidation**

*For any* successful check-in mutation, the system SHALL invalidate queries with keys ["venues"], ["venue", venueId], ["check-ins", "user", userId], and ["check-ins", "venue", venueId].

**Validates: Requirements 3.2**

**Property 7: Flash offer mutation invalidation**

*For any* flash offer claim mutation, upon success, the system SHALL invalidate queries with keys ["flash-offers", venueId] and ["venue", venueId].

**Validates: Requirements 4.3**

**Property 8: User profile mutation invalidation**

*For any* user profile update mutation, upon success, the system SHALL invalidate queries with key ["user", userId, "profile"].

**Validates: Requirements 5.4**

**Property 9: Friendship mutation invalidation**

*For any* friendship addition or removal mutation, upon success, the system SHALL invalidate queries with keys ["user", userId, "friends"] and ["activity-feed", userId].

**Validates: Requirements 5.5**

**Property 10: Collection mutation invalidation**

*For any* collection mutation (create, delete, add venue, remove venue, follow, unfollow), upon success, the system SHALL invalidate the affected collection query and the user's collections list query.

**Validates: Requirements 6.3, 6.4, 6.5**

**Property 11: Selective invalidation**

*For any* query invalidation operation, only queries whose keys match the invalidation pattern SHALL be marked as stale and refetched, ensuring unrelated queries remain unaffected.

**Validates: Requirements 13.4**

### Optimistic Update Properties

**Property 12: Optimistic UI updates**

*For any* mutation with optimistic update configuration (check-in, favorite, flash offer claim), the UI SHALL update immediately upon mutation initiation, before receiving server confirmation.

**Validates: Requirements 3.3, 9.1, 9.2, 9.3**

**Property 13: Optimistic update rollback**

*For any* mutation with optimistic updates, if the mutation fails, the system SHALL restore the previous state that was captured before the optimistic update was applied.

**Validates: Requirements 3.4, 9.4**

**Property 14: Server data reconciliation**

*For any* successful mutation with optimistic updates, the system SHALL merge the server response with the optimistically updated data, ensuring the final state reflects the server's authoritative response.

**Validates: Requirements 9.5**

### Real-Time Integration Properties

**Property 15: Real-time event invalidation**

*For any* Supabase real-time event (INSERT, UPDATE, DELETE) on tracked tables (venues, check_ins, flash_offers), the system SHALL invalidate the corresponding queries based on the affected entity ID and type.

**Validates: Requirements 7.1, 7.2, 7.3**

### Cache Persistence Properties

**Property 16: Restored cache staleness**

*For any* query cache entry restored from AsyncStorage on app launch, the entry SHALL be marked as stale to trigger a background refetch, ensuring users see cached data immediately while fresh data loads.

**Validates: Requirements 14.4**

**Property 17: Sensitive data exclusion**

*For any* query marked with metadata `{ sensitive: true }`, the query data SHALL NOT be persisted to AsyncStorage, ensuring sensitive information is not stored locally.

**Validates: Requirements 14.5**

### Example-Based Tests

The following criteria are best validated through specific example tests rather than property-based tests:

**Example 1: Query client initialization**
- Verify QueryClient is created with staleTime: 30000ms and cacheTime: 300000ms
- **Validates: Requirements 1.1, 1.2, 1.3**

**Example 2: QueryClientProvider setup**
- Verify root component is wrapped with QueryClientProvider
- **Validates: Requirements 1.4**

**Example 3: DevTools in development**
- Verify React Query DevTools are included when `__DEV__` is true
- **Validates: Requirements 1.5**

**Example 4: Flash offer stale time**
- Verify flash offer queries have staleTime: 10000ms
- **Validates: Requirements 4.2**

**Example 5: Flash offer background refetch**
- Verify flash offer queries have refetchOnWindowFocus: true
- **Validates: Requirements 4.5**

**Example 6: Navigation prefetching**
- Verify prefetchQuery is called when navigating to VenueDetailScreen
- **Validates: Requirements 2.3**

**Example 7: Navigation invalidation**
- Verify invalidateQueries is called when returning from VenueDetailScreen to HomeScreen
- **Validates: Requirements 2.4**

**Example 8: Real-time subscription lifecycle**
- Verify Supabase channels are subscribed when queries mount
- Verify Supabase channels are unsubscribed when queries unmount
- **Validates: Requirements 7.4, 7.5**

**Example 9: Navigation refetch on stale data**
- Verify refetch is called when navigating to HomeScreen with stale venue data
- Verify refetch is called when navigating to VenueDetailScreen with stale venue data
- **Validates: Requirements 8.1, 8.2**

**Example 10: App foreground refetch**
- Verify all active queries refetch when app returns to foreground
- **Validates: Requirements 8.3**

**Example 11: Navigation event tracking**
- Verify navigation listeners are registered with navigationRef
- **Validates: Requirements 8.5**

**Example 12: Retry configuration**
- Verify failed queries retry up to 3 times with exponential backoff
- **Validates: Requirements 10.1**

**Example 13: Mutation error display**
- Verify error message is displayed when mutation fails
- **Validates: Requirements 10.2**

**Example 14: Stale data fallback**
- Verify cached data with stale indicator is shown after retries exhausted
- **Validates: Requirements 10.3**

**Example 15: Network reconnect refetch**
- Verify refetch is triggered when network connectivity is restored
- **Validates: Requirements 10.4**

**Example 16: Pull-to-refresh**
- Verify pull-to-refresh gesture triggers query refetch
- **Validates: Requirements 10.5**

**Example 17: Loading states**
- Verify loading skeleton is shown when isLoading is true
- Verify subtle indicator is shown when isFetching is true with existing data
- Verify error UI with retry is shown when isError is true
- **Validates: Requirements 11.1, 11.2, 11.3**

**Example 18: Migration wrapper functions**
- Verify wrapper functions exist for gradual component migration
- **Validates: Requirements 12.4**

**Example 19: Infinite query pagination**
- Verify useInfiniteQuery is used for activity feed pagination
- **Validates: Requirements 13.2**

**Example 20: Prefetching strategy**
- Verify prefetchQuery is called for anticipated navigation targets
- **Validates: Requirements 13.3**

**Example 21: Cache persistence**
- Verify cache is saved to AsyncStorage when app backgrounds
- Verify cache is restored from AsyncStorage on app launch
- Verify persisted data older than 24 hours is not restored
- **Validates: Requirements 14.1, 14.2, 14.3**

## Error Handling

### Query Error Handling

**Retry Strategy:**
- Automatic retry up to 3 times
- Exponential backoff: 1s, 2s, 4s
- Custom retry logic for specific error types:
  - 401 Unauthorized: No retry (redirect to login)
  - 403 Forbidden: No retry (show permission error)
  - 404 Not Found: No retry (show not found message)
  - 5xx Server Error: Retry with backoff
  - Network Error: Retry with backoff

**Error Display:**
- First load error: Show error message with retry button
- Background refetch error: Show toast notification, keep stale data
- After all retries: Show cached data with "Data may be outdated" indicator

**Implementation:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth or permission errors
        if (error.status === 401 || error.status === 403 || error.status === 404) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### Mutation Error Handling

**Error Feedback:**
- Show toast notification with error message
- Provide retry button for transient errors
- Log error details for debugging

**Rollback Strategy:**
- Capture previous state in `onMutate`
- Restore previous state in `onError`
- Always refetch in `onSettled` to ensure consistency

**Implementation:**
```typescript
const mutation = useMutation({
  mutationFn: checkInService.createCheckIn,
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.venues.detail(data.venueId) });
    const previous = queryClient.getQueryData(queryKeys.venues.detail(data.venueId));
    queryClient.setQueryData(queryKeys.venues.detail(data.venueId), (old) => ({
      ...old,
      checkInCount: old.checkInCount + 1,
    }));
    return { previous };
  },
  onError: (error, variables, context) => {
    if (context?.previous) {
      queryClient.setQueryData(queryKeys.venues.detail(variables.venueId), context.previous);
    }
    showErrorToast(error.message);
  },
  onSettled: (data, error, variables) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(variables.venueId) });
  },
});
```

### Network Error Handling

**Offline Detection:**
- Use React Native NetInfo to detect connectivity
- Pause queries when offline
- Resume and refetch when online

**Implementation:**
```typescript
import NetInfo from '@react-native-community/netinfo';

function setupNetworkSync(queryClient: QueryClient) {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
    }
  });
  
  return unsubscribe;
}
```

### Real-Time Error Handling

**Subscription Errors:**
- Log subscription errors
- Attempt to reconnect with exponential backoff
- Fall back to polling if real-time fails

**Implementation:**
```typescript
function subscribeToVenueUpdates(queryClient: QueryClient) {
  const channel = supabase
    .channel('venue-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'venues' }, (payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(payload.new.id) });
    })
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Supabase subscription error:', error);
        // Fall back to polling
        queryClient.setQueryDefaults(queryKeys.venues.all, {
          refetchInterval: 30000, // Poll every 30s
        });
      }
    });
  
  return channel;
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific configuration examples (query client setup, stale times)
- Navigation event handling
- Real-time subscription lifecycle
- Error handling scenarios
- UI state rendering (loading, error states)
- Cache persistence operations

**Property-Based Tests:**
- Query key structure consistency across all entity types
- Mutation invalidation patterns
- Optimistic update behavior
- Rollback mechanisms
- Request deduplication
- Selective invalidation

### Property-Based Testing Configuration

**Library:** Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: react-query-integration, Property {number}: {property_text}`
- Custom generators for:
  - Query keys (various entity types and IDs)
  - Mutation data (check-ins, favorites, collections)
  - Real-time events (INSERT, UPDATE, DELETE payloads)
  - Cache states (fresh, stale, missing)

**Example Property Test:**
```typescript
import fc from 'fast-check';

describe('Feature: react-query-integration, Property 1: Query key structure consistency', () => {
  it('should generate consistent query keys for all entity types', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ type: fc.constant('venue'), id: fc.uuid() }),
          fc.record({ type: fc.constant('user'), id: fc.uuid(), subtype: fc.constant('profile') }),
          fc.record({ type: fc.constant('check-in'), userId: fc.uuid() }),
        ),
        (entity) => {
          const key = generateQueryKey(entity);
          
          // Key should be an array
          expect(Array.isArray(key)).toBe(true);
          
          // First element should be entity type
          expect(key[0]).toBe(entity.type + 's');
          
          // Should include ID if present
          if (entity.id) {
            expect(key).toContain(entity.id);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**Query Client Setup:**
- Test QueryClient initialization with correct defaults
- Test QueryClientProvider wrapping
- Test DevTools inclusion in development mode

**Query Hooks:**
- Test useVenuesQuery returns correct data structure
- Test useVenueQuery handles loading states
- Test query hooks handle errors appropriately
- Test query hooks provide refetch capability

**Mutation Hooks:**
- Test useCheckInMutation executes mutation
- Test mutation hooks handle optimistic updates
- Test mutation hooks rollback on error
- Test mutation hooks invalidate correct queries

**Navigation Integration:**
- Test navigation listener registration
- Test prefetching on navigation
- Test invalidation on navigation back
- Test refetch on screen focus

**Real-Time Integration:**
- Test Supabase channel subscription
- Test real-time event triggers invalidation
- Test channel cleanup on unmount

**Cache Persistence:**
- Test cache saves to AsyncStorage
- Test cache restores from AsyncStorage
- Test cache expiration (24 hours)
- Test sensitive data exclusion

### Integration Testing

**End-to-End Flows:**
1. User checks in → UI updates optimistically → Server confirms → Cache invalidates → Other screens update
2. User navigates Home → Detail → Back → List refetches with fresh data
3. App backgrounds → Cache persists → App reopens → Cache restores → Background refetch
4. Network disconnects → Queries pause → Network reconnects → Queries resume and refetch
5. Real-time event received → Affected queries invalidate → UI updates automatically

### Performance Testing

**Metrics to Monitor:**
- Time to first render (with cached data)
- Time to fresh data (after refetch)
- Number of network requests per screen
- Cache hit rate
- Memory usage with large cache
- Battery impact of real-time subscriptions

**Performance Targets:**
- Cached data renders in < 100ms
- Fresh data loads in < 500ms
- Cache hit rate > 80% for common queries
- Memory usage < 50MB for typical cache size
- Real-time subscriptions < 5% battery impact

### Migration Testing

**Backward Compatibility:**
- Test migrated hooks maintain same interface
- Test existing components work without changes
- Test gradual migration doesn't break functionality

**Regression Testing:**
- Run full test suite after each hook migration
- Verify no performance degradation
- Verify no new bugs introduced

## Implementation Notes

### Dependencies

```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/query-async-storage-persister": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "@react-native-community/netinfo": "^11.0.0"
}
```

### File Structure

```
src/
├── lib/
│   ├── queryClient.ts          # Query client configuration
│   ├── queryKeys.ts            # Query key factory
│   ├── cachePersistence.ts     # AsyncStorage persister
│   ├── realtimeSync.ts         # Supabase real-time integration
│   └── navigationSync.ts       # Navigation event handling
├── hooks/
│   ├── queries/
│   │   ├── useVenuesQuery.ts
│   │   ├── useVenueQuery.ts
│   │   ├── useFlashOffersQuery.ts
│   │   ├── useUserProfileQuery.ts
│   │   ├── useFriendsQuery.ts
│   │   ├── useActivityFeedQuery.ts
│   │   ├── useCollectionsQuery.ts
│   │   └── useCollectionQuery.ts
│   └── mutations/
│       ├── useCheckInMutation.ts
│       ├── useClaimFlashOfferMutation.ts
│       ├── useFavoriteVenueMutation.ts
│       ├── useUpdateProfileMutation.ts
│       ├── useAddFriendMutation.ts
│       └── useAddVenueToCollectionMutation.ts
└── services/
    └── api/
        ├── venueService.ts     # Venue API calls
        ├── checkInService.ts   # Check-in API calls
        ├── userService.ts      # User API calls
        └── collectionService.ts # Collection API calls
```

### Key Implementation Considerations

1. **Query Key Consistency:** Always use the query key factory to ensure consistent key structure
2. **Optimistic Updates:** Only use for mutations where immediate feedback is critical
3. **Invalidation Precision:** Invalidate specific queries rather than broad patterns when possible
4. **Real-Time Subscriptions:** Clean up subscriptions properly to avoid memory leaks
5. **Cache Persistence:** Exclude sensitive data and set appropriate expiration
6. **Error Handling:** Provide clear feedback and recovery options for users
7. **Performance:** Monitor cache size and network requests to ensure optimal performance
8. **Migration:** Test thoroughly at each step to avoid breaking existing functionality
