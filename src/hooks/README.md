# Hooks Directory

This directory contains all custom React hooks used throughout the application.

## Directory Structure

```
hooks/
├── queries/           # React Query hooks for data fetching
├── mutations/         # React Query hooks for data modification
├── __tests__/         # Hook tests
├── index.ts           # Main exports
└── *.ts               # Individual hook files
```

## React Query Hooks (Recommended)

For data fetching and mutations, **always use React Query hooks** for automatic caching, optimistic updates, and better performance.

### Query Hooks (`./queries/`)

Query hooks fetch and cache data automatically:

```typescript
import { useVenuesQuery, useVenueQuery } from './hooks/queries';

// Fetch venue list
const { data: venues, isLoading, error } = useVenuesQuery({
  filters: { category: 'restaurant', limit: 20 }
});

// Fetch single venue
const { data: venue } = useVenueQuery({ venueId: 'venue-123' });
```

**Available Query Hooks:**
- `useVenuesQuery` - Fetch venue lists with filters
- `useVenueQuery` - Fetch single venue details
- `useFriendsQuery` - Fetch user's friends
- `useUserProfileQuery` - Fetch user profile
- `useCollectionsQuery` - Fetch user's collections
- `useCollectionQuery` - Fetch single collection
- `useFlashOffersQuery` - Fetch flash offers
- `useActivityFeedQuery` - Fetch activity feed (infinite scroll)

### Mutation Hooks (`./mutations/`)

Mutation hooks modify data with optimistic updates:

```typescript
import { useCheckInMutation, useAddFriendMutation } from './hooks/mutations';

// Check in mutation
const { mutate: checkIn, isPending } = useCheckInMutation({
  onSuccess: () => console.log('Checked in!'),
  onError: (error) => Alert.alert('Error', error.message),
});

checkIn({ venueId: 'venue-123', userId: user.id });
```

**Available Mutation Hooks:**
- `useCheckInMutation` - Check in at a venue
- `useClaimFlashOfferMutation` - Claim a flash offer
- `useUpdateProfileMutation` - Update user profile
- `useAddFriendMutation` - Send friend request
- `useCreateCollectionMutation` - Create a collection
- `useDeleteCollectionMutation` - Delete a collection
- `useAddVenueToCollectionMutation` - Add venue to collection
- `useFollowCollectionMutation` - Follow a collection
- `useUnfollowCollectionMutation` - Unfollow a collection

## Legacy Hooks (Deprecated)

The following hooks use traditional state management and are **deprecated**. They remain for backward compatibility but should not be used in new code:

- ~~`useVenues`~~ → Use `useVenuesQuery`
- ~~`useCheckInActions`~~ → Use `useCheckInMutation`
- ~~`useFriends`~~ → Use `useFriendsQuery` + `useAddFriendMutation`
- ~~`useCollections`~~ → Use `useCollectionsQuery` + collection mutations

## Utility Hooks

These hooks provide reusable functionality:

- `useDebounce` - Debounce a value
- `useHapticFeedback` - Trigger haptic feedback
- `useSwipeGesture` - Swipe gesture handling
- `useCountdownTimer` - Countdown timer
- `useEngagementColor` - Calculate engagement colors
- `usePhotoSelection` - Photo picker
- `useProfilePhotoUpload` - Profile photo upload
- `useAboutMe` - About me section state
- `useNotificationPreferences` - Notification settings

## Domain-Specific Hooks

These hooks encapsulate specific business logic:

- `useCheckInStats` - Check-in statistics
- `useCheckInHistory` - User check-in history
- `useFavorites` - Favorite venues management
- `useNewVenues` - New venues in spotlight
- `useFlashOffers` - Flash offers (legacy)
- `useRealtimeOffer` - Real-time offer updates
- `useSharedVenues` - Venue sharing
- `useFriendActivity` - Friend activity feed
- `useSocialNotifications` - Social notifications

## Quick Start

### Fetching Data

```typescript
import { useVenuesQuery } from './hooks/queries';

function VenueList() {
  const { data: venues = [], isLoading, isError, error } = useVenuesQuery({
    filters: { featured: true }
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage error={error} />;

  return <VenueCards venues={venues} />;
}
```

### Modifying Data

```typescript
import { useCheckInMutation } from './hooks/mutations';

function CheckInButton({ venueId }: { venueId: string }) {
  const { mutate: checkIn, isPending } = useCheckInMutation({
    onSuccess: () => Alert.alert('Success', 'Checked in!'),
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

### Infinite Scroll

```typescript
import { useActivityFeedQuery } from './hooks/queries';

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
      onEndReached={() => hasNextPage && fetchNextPage()}
      ListFooterComponent={isFetchingNextPage ? <Spinner /> : null}
    />
  );
}
```

## Best Practices

1. **Always use React Query hooks** for data fetching and mutations
2. **Handle loading and error states** explicitly
3. **Use TypeScript** for type safety
4. **Provide default values** for data: `const { data: venues = [] } = useVenuesQuery()`
5. **Use `isLoading` for initial load**, `isFetching` for background refetch
6. **Implement optimistic updates** for better UX
7. **Invalidate queries** after mutations to keep data fresh

## Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVenuesQuery } from './useVenuesQuery';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(10);
});
```

## Documentation

For comprehensive guides, see:
- [React Query Guide](../../.kiro/specs/react-query-integration/REACT_QUERY_GUIDE.md)
- [Query Keys Reference](../../.kiro/specs/react-query-integration/QUERY_KEYS_REFERENCE.md)
- [Migration Guide](../../.kiro/specs/react-query-integration/MIGRATION_GUIDE.md)

## Support

For questions or issues:
1. Check the documentation above
2. Review existing hook implementations
3. Consult [TanStack Query Documentation](https://tanstack.com/query/latest)
