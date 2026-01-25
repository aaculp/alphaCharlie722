# React Query Integration Guide

## Overview

This application uses [TanStack Query (React Query) v5](https://tanstack.com/query/latest) for data fetching, caching, and state management. React Query provides automatic cache management, intelligent refetching, optimistic updates, and real-time synchronization with Supabase.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Query Key Structure](#query-key-structure)
- [Common Patterns](#common-patterns)
- [Query Hooks](#query-hooks)
- [Mutation Hooks](#mutation-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Core Concepts

### Query Client

The Query Client is the central manager for all queries and mutations. It's configured in `src/lib/queryClient.ts` with sensible defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,        // Data is fresh for 30 seconds
      gcTime: 300000,          // Inactive data kept for 5 minutes
      retry: 3,                // Retry failed requests 3 times
      refetchOnWindowFocus: true,  // Refetch when app returns to foreground
      refetchOnReconnect: true,    // Refetch when network reconnects
    },
  },
});
```

### Query Keys

Query keys uniquely identify cached data. They follow a hierarchical structure defined in `src/lib/queryKeys.ts`:

```typescript
// Examples:
['venues']                              // All venue queries
['venues', 'list', { category: 'bar' }] // Filtered venue list
['venues', 'detail', 'venue-123']       // Specific venue
['users', 'user-456', 'profile']        // User profile
```

### Stale Time vs Cache Time

- **Stale Time**: How long data is considered "fresh" before refetching
- **Cache Time (gcTime)**: How long inactive data stays in memory

## Query Key Structure

All query keys are defined in `src/lib/queryKeys.ts` using a hierarchical factory pattern:

```typescript
export const queryKeys = {
  // Venues
  venues: {
    all: ['venues'] as const,
    lists: () => [...queryKeys.venues.all, 'list'] as const,
    list: (filters: VenueFilters) => [...queryKeys.venues.lists(), filters] as const,
    details: () => [...queryKeys.venues.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.venues.details(), id] as const,
  },
  
  // Check-ins
  checkIns: {
    all: ['check-ins'] as const,
    byUser: (userId: string) => [...queryKeys.checkIns.all, 'user', userId] as const,
    byVenue: (venueId: string) => [...queryKeys.checkIns.all, 'venue', venueId] as const,
  },
  
  // Flash Offers
  flashOffers: {
    all: ['flash-offers'] as const,
    byVenue: (venueId: string) => [...queryKeys.flashOffers.all, 'venue', venueId] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    profile: (userId: string) => [...queryKeys.users.all, userId, 'profile'] as const,
    friends: (userId: string) => [...queryKeys.users.all, userId, 'friends'] as const,
  },
  
  // Collections
  collections: {
    all: ['collections'] as const,
    byUser: (userId: string) => [...queryKeys.collections.all, 'user', userId] as const,
    detail: (collectionId: string) => [...queryKeys.collections.all, collectionId] as const,
  },
  
  // Activity Feed
  activityFeed: {
    byUser: (userId: string) => ['activity-feed', userId] as const,
  },
};
```

### Benefits of Hierarchical Keys

1. **Selective Invalidation**: Invalidate all venue queries with `queryKeys.venues.all`
2. **Type Safety**: TypeScript ensures correct key structure
3. **Consistency**: Centralized key management prevents typos
4. **Discoverability**: Easy to find and understand query relationships

## Common Patterns

### 1. Fetching Data (Queries)

```typescript
import { useVenuesQuery } from '../hooks/queries/useVenuesQuery';

function VenueList() {
  const { data: venues, isLoading, isError, error, refetch } = useVenuesQuery({
    filters: { category: 'restaurant' },
    enabled: true,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorDisplay error={error} onRetry={refetch} />;

  return <VenueCards venues={venues} />;
}
```

### 2. Modifying Data (Mutations)

```typescript
import { useCheckInMutation } from '../hooks/mutations/useCheckInMutation';

function CheckInButton({ venueId }: { venueId: string }) {
  const { mutate: checkIn, isPending } = useCheckInMutation({
    onSuccess: (data) => {
      console.log('Checked in!', data);
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

### 3. Optimistic Updates

Optimistic updates make the UI feel instant by updating before server confirmation:

```typescript
const checkInMutation = useCheckInMutation({
  onMutate: async (checkInData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ 
      queryKey: queryKeys.venues.detail(checkInData.venueId) 
    });
    
    // Snapshot previous value
    const previousVenue = queryClient.getQueryData(
      queryKeys.venues.detail(checkInData.venueId)
    );
    
    // Optimistically update
    queryClient.setQueryData(
      queryKeys.venues.detail(checkInData.venueId),
      (old) => ({
        ...old,
        checkInCount: old.checkInCount + 1,
        userHasCheckedIn: true,
      })
    );
    
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
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.venues.detail(variables.venueId) 
    });
  },
});
```

### 4. Infinite Queries (Pagination)

```typescript
import { useActivityFeedQuery } from '../hooks/queries/useActivityFeedQuery';

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

### 5. Dependent Queries

```typescript
function VenueWithReviews({ venueId }: { venueId: string }) {
  // First query: Get venue details
  const { data: venue } = useVenueQuery({ venueId });
  
  // Second query: Only fetch reviews if venue exists
  const { data: reviews } = useReviewsQuery({
    venueId,
    enabled: !!venue, // Only run if venue is loaded
  });

  return (
    <View>
      <VenueDetails venue={venue} />
      <ReviewList reviews={reviews} />
    </View>
  );
}
```

### 6. Manual Cache Updates

```typescript
// Update cache directly without refetching
queryClient.setQueryData(
  queryKeys.venues.detail(venueId),
  (oldData) => ({
    ...oldData,
    isFavorite: true,
  })
);

// Invalidate to trigger refetch
queryClient.invalidateQueries({ 
  queryKey: queryKeys.venues.detail(venueId) 
});

// Prefetch data before navigation
queryClient.prefetchQuery({
  queryKey: queryKeys.venues.detail(venueId),
  queryFn: () => VenueService.getVenue(venueId),
});
```

## Query Hooks

### useVenuesQuery

Fetches a list of venues with optional filters.

```typescript
const { data: venues, isLoading, error } = useVenuesQuery({
  filters: {
    search: 'coffee',
    category: 'cafe',
    location: { lat: 40.7128, lng: -74.0060, radius: 5 },
    hasFlashOffers: true,
  },
  enabled: true,
  staleTime: 30000,
});
```

**Configuration:**
- Stale Time: 30 seconds (default)
- Cache Time: 5 minutes (default)
- Refetch on window focus: Yes

### useVenueQuery

Fetches details for a single venue.

```typescript
const { data: venue, isLoading, refetch } = useVenueQuery({
  venueId: 'venue-123',
  enabled: true,
});
```

### useFlashOffersQuery

Fetches flash offers for a venue (time-sensitive data).

```typescript
const { data: offers, isLoading } = useFlashOffersQuery({
  venueId: 'venue-123',
  enabled: true,
});
```

**Configuration:**
- Stale Time: 10 seconds (more aggressive for time-sensitive data)
- Refetch Interval: 30 seconds (automatic polling)
- Refetch on window focus: Yes

### useUserProfileQuery

Fetches user profile data.

```typescript
const { data: profile, isLoading } = useUserProfileQuery({
  userId: 'user-456',
  enabled: true,
});
```

### useFriendsQuery

Fetches a user's friends list.

```typescript
const { data: friends, isLoading } = useFriendsQuery({
  userId: 'user-456',
  enabled: true,
  limit: 50,
  offset: 0,
});
```

### useCollectionsQuery

Fetches a user's venue collections.

```typescript
const { data: collections, isLoading } = useCollectionsQuery({
  userId: 'user-456',
  viewerId: currentUser.id,
  enabled: true,
});
```

### useActivityFeedQuery

Fetches activity feed with infinite scroll.

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useActivityFeedQuery({
  userId: 'user-456',
  enabled: true,
});
```

## Mutation Hooks

### useCheckInMutation

Creates a check-in at a venue with optimistic updates.

```typescript
const { mutate: checkIn, isPending, error } = useCheckInMutation({
  onSuccess: (checkIn) => {
    console.log('Checked in successfully!', checkIn);
  },
  onError: (error) => {
    Alert.alert('Error', error.message);
  },
});

// Usage
checkIn({ venueId: 'venue-123', userId: user.id });
```

**Features:**
- Optimistic UI updates
- Automatic rollback on error
- Invalidates related queries on success

### useClaimFlashOfferMutation

Claims a flash offer with optimistic updates.

```typescript
const { mutate: claimOffer, isPending } = useClaimFlashOfferMutation({
  onSuccess: (claim) => {
    navigation.navigate('ClaimDetail', { claimId: claim.id });
  },
});

// Usage
claimOffer({ offerId: 'offer-123', userId: user.id, venueId: 'venue-123' });
```

### useUpdateProfileMutation

Updates user profile information.

```typescript
const { mutate: updateProfile, isPending } = useUpdateProfileMutation({
  onSuccess: () => {
    Alert.alert('Success', 'Profile updated!');
  },
});

// Usage
updateProfile({ userId: user.id, displayName: 'New Name' });
```

### useAddFriendMutation

Sends a friend request.

```typescript
const { mutate: addFriend, isPending } = useAddFriendMutation({
  onSuccess: () => {
    Alert.alert('Success', 'Friend request sent!');
  },
});

// Usage
addFriend({ fromUserId: user.id, toUserId: 'user-456' });
```

### useCollectionMutations

Manages collection operations (create, delete, follow, unfollow).

```typescript
const {
  createCollection,
  deleteCollection,
  followCollection,
  unfollowCollection,
} = useCollectionMutations();

// Create collection
createCollection.mutate({
  name: 'Date Night Spots',
  description: 'Romantic venues',
  privacy_level: 'friends',
  user_id: user.id,
});

// Delete collection
deleteCollection.mutate({ collectionId: 'collection-123' });
```

## Best Practices

### 1. Always Use Query Keys from Factory

❌ **Bad:**
```typescript
useQuery({ queryKey: ['venues', venueId] })
```

✅ **Good:**
```typescript
useQuery({ queryKey: queryKeys.venues.detail(venueId) })
```

### 2. Handle Loading and Error States

❌ **Bad:**
```typescript
const { data } = useVenuesQuery();
return <VenueList venues={data} />; // data might be undefined!
```

✅ **Good:**
```typescript
const { data, isLoading, isError, error } = useVenuesQuery();

if (isLoading) return <LoadingSkeleton />;
if (isError) return <ErrorDisplay error={error} />;

return <VenueList venues={data} />;
```

### 3. Use Optimistic Updates for Better UX

For mutations that affect the UI immediately (like, favorite, check-in), use optimistic updates:

```typescript
const mutation = useMutation({
  mutationFn: likeVenue,
  onMutate: async (venueId) => {
    // Optimistically update UI
    await queryClient.cancelQueries({ queryKey: queryKeys.venues.detail(venueId) });
    const previous = queryClient.getQueryData(queryKeys.venues.detail(venueId));
    
    queryClient.setQueryData(queryKeys.venues.detail(venueId), (old) => ({
      ...old,
      isLiked: true,
      likeCount: old.likeCount + 1,
    }));
    
    return { previous };
  },
  onError: (err, venueId, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKeys.venues.detail(venueId), context.previous);
  },
});
```

### 4. Invalidate Queries After Mutations

Always invalidate related queries after successful mutations:

```typescript
const mutation = useMutation({
  mutationFn: createVenue,
  onSuccess: () => {
    // Invalidate venue list to show new venue
    queryClient.invalidateQueries({ queryKey: queryKeys.venues.lists() });
  },
});
```

### 5. Use Selective Invalidation

Invalidate only what's necessary:

❌ **Bad (invalidates everything):**
```typescript
queryClient.invalidateQueries();
```

✅ **Good (selective):**
```typescript
queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(venueId) });
```

### 6. Prefetch for Better Performance

Prefetch data before navigation:

```typescript
const handleVenuePress = (venueId: string) => {
  // Prefetch venue details
  queryClient.prefetchQuery({
    queryKey: queryKeys.venues.detail(venueId),
    queryFn: () => VenueService.getVenue(venueId),
  });
  
  // Navigate
  navigation.navigate('VenueDetail', { venueId });
};
```

### 7. Use Enabled Option for Conditional Queries

```typescript
const { data: venue } = useVenueQuery({
  venueId,
  enabled: !!venueId && isAuthenticated, // Only fetch if conditions met
});
```

### 8. Configure Stale Time Based on Data Volatility

- **Static data** (venue details): 5 minutes
- **Semi-static data** (user profile): 1 minute
- **Dynamic data** (check-in counts): 30 seconds
- **Real-time data** (flash offers): 10 seconds

## Troubleshooting

### Query Not Refetching

**Problem:** Data doesn't update when expected.

**Solutions:**
1. Check if data is still within `staleTime`
2. Manually invalidate: `queryClient.invalidateQueries({ queryKey })`
3. Force refetch: `refetch()`

### Stale Data After Mutation

**Problem:** UI shows old data after mutation.

**Solution:** Invalidate related queries in `onSuccess`:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(venueId) });
}
```

### Memory Leaks

**Problem:** Queries continue running after component unmounts.

**Solution:** React Query automatically cleans up. If issues persist, check for:
- Infinite loops in `useEffect`
- Missing dependencies in query functions
- Subscriptions not being cleaned up

### Duplicate Requests

**Problem:** Same query runs multiple times.

**Solution:** React Query deduplicates by default. If seeing duplicates:
1. Ensure query keys are identical
2. Check if `enabled` is toggling rapidly
3. Verify no manual `refetch()` calls in loops

### Cache Not Persisting

**Problem:** Cache doesn't restore on app restart.

**Solution:** Check cache persistence setup in `src/lib/cachePersistence.ts`:

```typescript
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

persistQueryClient({
  queryClient,
  persister,
});
```

## Additional Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Query Key Management](https://tkdodo.eu/blog/effective-react-query-keys)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)

## Migration Notes

This app has been fully migrated from custom hooks to React Query. The legacy hooks have been removed:
- ~~`useVenues.legacy.ts`~~ → Use `useVenuesQuery`
- ~~`useCheckInActions.legacy.ts`~~ → Use `useCheckInMutation`
- ~~`useFriends.legacy.ts`~~ → Use `useFriendsQuery` + `useAddFriendMutation`
- ~~`useCollections.legacy.ts`~~ → Use `useCollectionsQuery` + `useCollectionMutations`

All components have been updated to use React Query hooks directly.
