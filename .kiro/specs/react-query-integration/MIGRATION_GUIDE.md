# React Query Migration Guide

## Overview

This guide documents the migration from custom data fetching hooks to React Query. All legacy hooks have been removed and replaced with React Query equivalents.

## Migration Status

✅ **Completed** - All components have been migrated to React Query

## What Changed

### Before (Legacy Hooks)

```typescript
// Old custom hook with manual state management
import { useVenues } from '../hooks/useVenues';

function VenueList() {
  const { venues, loading, error, refetch } = useVenues({
    featured: true,
    limit: 10,
  });

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <VenueCards venues={venues} />;
}
```

### After (React Query)

```typescript
// New React Query hook with automatic cache management
import { useVenuesQuery } from '../hooks/queries/useVenuesQuery';

function VenueList() {
  const { data: venues, isLoading, isError, error, refetch } = useVenuesQuery({
    filters: { featured: true, limit: 10 },
  });

  if (isLoading) return <Spinner />;
  if (isError) return <Error message={error.message} />;

  return <VenueCards venues={venues} />;
}
```

## Key Differences

### 1. Return Value Structure

| Legacy Hook | React Query | Notes |
|------------|-------------|-------|
| `loading` | `isLoading` | First-time loading |
| N/A | `isFetching` | Background refetch |
| `error` | `error` | Same |
| N/A | `isError` | Boolean flag |
| `data` | `data` | Same |
| `refetch()` | `refetch()` | Same |

### 2. Options Structure

**Legacy:**
```typescript
useVenues({
  featured: true,
  search: 'coffee',
  category: 'cafe',
  limit: 10,
})
```

**React Query:**
```typescript
useVenuesQuery({
  filters: {
    featured: true,
    search: 'coffee',
    category: 'cafe',
    limit: 10,
  },
  enabled: true,
  staleTime: 30000,
})
```

### 3. Mutations

**Legacy:**
```typescript
const { checkIn, loading, error } = useCheckInActions({
  onCheckInSuccess: (data) => console.log('Success!'),
  onError: (error) => Alert.alert('Error', error.message),
});

await checkIn(venueId);
```

**React Query:**
```typescript
const { mutate: checkIn, isPending, error } = useCheckInMutation({
  onSuccess: (data) => console.log('Success!'),
  onError: (error) => Alert.alert('Error', error.message),
});

checkIn({ venueId, userId });
```

## Hook Migration Map

### Query Hooks

| Legacy Hook | React Query Hook | Location |
|------------|------------------|----------|
| `useVenues()` | `useVenuesQuery()` | `src/hooks/queries/useVenuesQuery.ts` |
| `useVenue(id)` | `useVenueQuery({ venueId })` | `src/hooks/queries/useVenueQuery.ts` |
| `useFriends()` | `useFriendsQuery({ userId })` | `src/hooks/queries/useFriendsQuery.ts` |
| `useCollections()` | `useCollectionsQuery({ userId })` | `src/hooks/queries/useCollectionsQuery.ts` |
| `useFlashOffers()` | `useFlashOffersQuery({ venueId })` | `src/hooks/queries/useFlashOffersQuery.ts` |
| `useUserProfile(id)` | `useUserProfileQuery({ userId })` | `src/hooks/queries/useUserProfileQuery.ts` |
| `useActivityFeed()` | `useActivityFeedQuery({ userId })` | `src/hooks/queries/useActivityFeedQuery.ts` |

### Mutation Hooks

| Legacy Hook | React Query Hook | Location |
|------------|------------------|----------|
| `useCheckInActions()` | `useCheckInMutation()` | `src/hooks/mutations/useCheckInMutation.ts` |
| `useCollections().createCollection` | `useCollectionMutations().createCollection` | `src/hooks/mutations/useCollectionMutations.ts` |
| `useFriends().sendFriendRequest` | `useAddFriendMutation()` | `src/hooks/mutations/useAddFriendMutation.ts` |
| `useProfile().updateProfile` | `useUpdateProfileMutation()` | `src/hooks/mutations/useUpdateProfileMutation.ts` |
| `useFlashOffers().claimOffer` | `useClaimFlashOfferMutation()` | `src/hooks/mutations/useClaimFlashOfferMutation.ts` |

## Component Migration Examples

### Example 1: Simple Query

**Before:**
```typescript
import { useVenues } from '../hooks/useVenues';

function HomeScreen() {
  const { venues, loading, error, refetch } = useVenues({ featured: true });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FlatList
      data={venues}
      renderItem={({ item }) => <VenueCard venue={item} />}
      onRefresh={refetch}
      refreshing={loading}
    />
  );
}
```

**After:**
```typescript
import { useVenuesQuery } from '../hooks/queries/useVenuesQuery';

function HomeScreen() {
  const { 
    data: venues = [], 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching,
  } = useVenuesQuery({ 
    filters: { featured: true } 
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <FlatList
      data={venues}
      renderItem={({ item }) => <VenueCard venue={item} />}
      onRefresh={refetch}
      refreshing={isFetching} // Use isFetching for pull-to-refresh
    />
  );
}
```

### Example 2: Mutation with Callbacks

**Before:**
```typescript
import { useCheckInActions } from '../hooks/useCheckInActions';

function CheckInButton({ venueId }: { venueId: string }) {
  const { checkIn, loading } = useCheckInActions({
    onCheckInSuccess: (data) => {
      Alert.alert('Success', 'Checked in!');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  return (
    <Button
      onPress={() => checkIn(venueId)}
      disabled={loading}
    >
      {loading ? 'Checking in...' : 'Check In'}
    </Button>
  );
}
```

**After:**
```typescript
import { useCheckInMutation } from '../hooks/mutations/useCheckInMutation';
import { useAuth } from '../contexts/AuthContext';

function CheckInButton({ venueId }: { venueId: string }) {
  const { user } = useAuth();
  const { mutate: checkIn, isPending } = useCheckInMutation({
    onSuccess: (data) => {
      Alert.alert('Success', 'Checked in!');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  return (
    <Button
      onPress={() => checkIn({ venueId, userId: user.id })}
      disabled={isPending}
    >
      {isPending ? 'Checking in...' : 'Check In'}
    </Button>
  );
}
```

### Example 3: Dependent Queries

**Before:**
```typescript
function VenueDetail({ venueId }: { venueId: string }) {
  const { venue, loading: venueLoading } = useVenue(venueId);
  const { offers, loading: offersLoading } = useFlashOffers(venueId);

  if (venueLoading || offersLoading) return <LoadingSpinner />;

  return (
    <View>
      <VenueInfo venue={venue} />
      <FlashOfferList offers={offers} />
    </View>
  );
}
```

**After:**
```typescript
function VenueDetail({ venueId }: { venueId: string }) {
  const { data: venue, isLoading: venueLoading } = useVenueQuery({ venueId });
  const { data: offers = [], isLoading: offersLoading } = useFlashOffersQuery({ 
    venueId,
    enabled: !!venue, // Only fetch offers if venue exists
  });

  if (venueLoading) return <LoadingSpinner />;

  return (
    <View>
      <VenueInfo venue={venue} />
      {offersLoading ? (
        <LoadingSpinner />
      ) : (
        <FlashOfferList offers={offers} />
      )}
    </View>
  );
}
```

### Example 4: Infinite Scroll

**Before:**
```typescript
function ActivityFeed() {
  const [page, setPage] = useState(0);
  const { activities, loading, hasMore } = useActivityFeed({ page });

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  };

  return (
    <FlatList
      data={activities}
      renderItem={({ item }) => <ActivityItem activity={item} />}
      onEndReached={loadMore}
    />
  );
}
```

**After:**
```typescript
function ActivityFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityFeedQuery({ userId: user.id });

  const activities = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <FlatList
      data={activities}
      renderItem={({ item }) => <ActivityItem activity={item} />}
      onEndReached={() => hasNextPage && fetchNextPage()}
      ListFooterComponent={
        isFetchingNextPage ? <LoadingSpinner /> : null
      }
    />
  );
}
```

## Benefits of React Query

### 1. Automatic Cache Management

React Query automatically caches data and manages staleness:

```typescript
// First render: Fetches from server
const { data } = useVenuesQuery();

// Navigate away and back within 30 seconds: Returns cached data instantly
const { data } = useVenuesQuery();

// After 30 seconds: Returns cached data + refetches in background
const { data } = useVenuesQuery();
```

### 2. Request Deduplication

Multiple components requesting the same data only trigger one network request:

```typescript
// Component A
const { data: venue } = useVenueQuery({ venueId: '123' });

// Component B (same query key)
const { data: venue } = useVenueQuery({ venueId: '123' });

// Only ONE network request is made!
```

### 3. Optimistic Updates

UI updates immediately before server confirmation:

```typescript
const { mutate: checkIn } = useCheckInMutation();

// UI updates instantly, then syncs with server
checkIn({ venueId, userId });
```

### 4. Automatic Refetching

Data refetches automatically when:
- App returns to foreground
- Network reconnects
- Window regains focus
- Stale time expires

### 5. Real-Time Synchronization

Supabase real-time events automatically invalidate queries:

```typescript
// When another user checks in, your venue data updates automatically
// No manual polling or subscriptions needed!
```

## Common Pitfalls

### 1. Forgetting to Handle Undefined Data

❌ **Bad:**
```typescript
const { data } = useVenuesQuery();
return <VenueList venues={data} />; // data might be undefined!
```

✅ **Good:**
```typescript
const { data: venues = [] } = useVenuesQuery();
return <VenueList venues={venues} />;
```

### 2. Using Wrong Loading State

❌ **Bad:**
```typescript
const { data, isFetching } = useVenuesQuery();
if (isFetching) return <LoadingSpinner />; // Shows spinner on background refetch!
```

✅ **Good:**
```typescript
const { data, isLoading, isFetching } = useVenuesQuery();
if (isLoading) return <LoadingSpinner />; // Only shows on first load
// Use isFetching for pull-to-refresh indicator
```

### 3. Not Invalidating After Mutations

❌ **Bad:**
```typescript
const { mutate: checkIn } = useCheckInMutation();
// Venue data won't update after check-in!
```

✅ **Good:**
```typescript
const { mutate: checkIn } = useCheckInMutation({
  onSuccess: (data, variables) => {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.venues.detail(variables.venueId) 
    });
  },
});
```

### 4. Hardcoding Query Keys

❌ **Bad:**
```typescript
queryClient.invalidateQueries({ queryKey: ['venues', venueId] });
```

✅ **Good:**
```typescript
queryClient.invalidateQueries({ 
  queryKey: queryKeys.venues.detail(venueId) 
});
```

## Testing

### Testing Query Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVenuesQuery } from '../useVenuesQuery';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('fetches venues', async () => {
  const { result } = renderHook(() => useVenuesQuery(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toHaveLength(10);
});
```

### Testing Mutation Hooks

```typescript
test('checks in successfully', async () => {
  const { result } = renderHook(() => useCheckInMutation(), {
    wrapper: createWrapper(),
  });

  act(() => {
    result.current.mutate({ venueId: '123', userId: '456' });
  });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
});
```

## Performance Considerations

### 1. Stale Time Configuration

Adjust stale time based on data volatility:

```typescript
// Static data: 5 minutes
useVenueQuery({ venueId, staleTime: 5 * 60 * 1000 });

// Dynamic data: 30 seconds (default)
useVenuesQuery({ filters });

// Real-time data: 10 seconds
useFlashOffersQuery({ venueId, staleTime: 10 * 1000 });
```

### 2. Prefetching

Prefetch data before navigation for instant loading:

```typescript
const handleVenuePress = (venueId: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.venues.detail(venueId),
    queryFn: () => VenueService.getVenue(venueId),
  });
  
  navigation.navigate('VenueDetail', { venueId });
};
```

### 3. Selective Invalidation

Only invalidate what changed:

```typescript
// ❌ Invalidates everything
queryClient.invalidateQueries();

// ✅ Invalidates only venue lists
queryClient.invalidateQueries({ queryKey: queryKeys.venues.lists() });

// ✅ Invalidates only specific venue
queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(venueId) });
```

## Rollback Plan

If issues arise, the migration can be rolled back by:

1. Restoring legacy hooks from git history
2. Reverting component imports
3. Removing React Query dependencies

However, this is not recommended as React Query provides significant benefits.

## Support

For questions or issues:
1. Check the [React Query Guide](./REACT_QUERY_GUIDE.md)
2. Review the [Query Keys Reference](./QUERY_KEYS_REFERENCE.md)
3. Consult [TanStack Query Documentation](https://tanstack.com/query/latest)

## Conclusion

The migration to React Query is complete and provides:
- ✅ Automatic cache management
- ✅ Request deduplication
- ✅ Optimistic updates
- ✅ Real-time synchronization
- ✅ Better developer experience
- ✅ Improved performance

All legacy hooks have been removed and components updated to use React Query directly.
