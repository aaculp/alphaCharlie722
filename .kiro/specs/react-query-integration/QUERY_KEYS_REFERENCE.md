# Query Keys Reference

## Overview

This document provides a quick reference for all query keys used in the application. Query keys are defined in `src/lib/queryKeys.ts` and follow a hierarchical structure for easy invalidation and type safety.

## Query Key Structure

All query keys follow this pattern:
```
[entity, scope, ...identifiers/filters]
```

## Complete Query Key List

### Venues

| Query | Key Structure | Example |
|-------|--------------|---------|
| All venues | `['venues']` | `['venues']` |
| Venue lists | `['venues', 'list']` | `['venues', 'list']` |
| Filtered venue list | `['venues', 'list', filters]` | `['venues', 'list', { category: 'bar' }]` |
| Venue details | `['venues', 'detail']` | `['venues', 'detail']` |
| Single venue | `['venues', 'detail', venueId]` | `['venues', 'detail', 'venue-123']` |

**Usage:**
```typescript
import { queryKeys } from '../lib/queryKeys';

// All venue queries
queryKeys.venues.all

// All venue lists
queryKeys.venues.lists()

// Filtered venue list
queryKeys.venues.list({ category: 'restaurant', hasFlashOffers: true })

// All venue details
queryKeys.venues.details()

// Specific venue
queryKeys.venues.detail('venue-123')
```

### Check-Ins

| Query | Key Structure | Example |
|-------|--------------|---------|
| All check-ins | `['check-ins']` | `['check-ins']` |
| User's check-ins | `['check-ins', 'user', userId]` | `['check-ins', 'user', 'user-456']` |
| Venue's check-ins | `['check-ins', 'venue', venueId]` | `['check-ins', 'venue', 'venue-123']` |

**Usage:**
```typescript
// All check-in queries
queryKeys.checkIns.all

// User's check-ins
queryKeys.checkIns.byUser('user-456')

// Venue's check-ins
queryKeys.checkIns.byVenue('venue-123')
```

### Flash Offers

| Query | Key Structure | Example |
|-------|--------------|---------|
| All flash offers | `['flash-offers']` | `['flash-offers']` |
| Venue's flash offers | `['flash-offers', 'venue', venueId]` | `['flash-offers', 'venue', 'venue-123']` |

**Usage:**
```typescript
// All flash offer queries
queryKeys.flashOffers.all

// Venue's flash offers
queryKeys.flashOffers.byVenue('venue-123')
```

### Users

| Query | Key Structure | Example |
|-------|--------------|---------|
| All users | `['users']` | `['users']` |
| User profile | `['users', userId, 'profile']` | `['users', 'user-456', 'profile']` |
| User's friends | `['users', userId, 'friends']` | `['users', 'user-456', 'friends']` |

**Usage:**
```typescript
// All user queries
queryKeys.users.all

// User profile
queryKeys.users.profile('user-456')

// User's friends
queryKeys.users.friends('user-456')
```

### Collections

| Query | Key Structure | Example |
|-------|--------------|---------|
| All collections | `['collections']` | `['collections']` |
| User's collections | `['collections', 'user', userId]` | `['collections', 'user', 'user-456']` |
| Single collection | `['collections', collectionId]` | `['collections', 'collection-789']` |

**Usage:**
```typescript
// All collection queries
queryKeys.collections.all

// User's collections
queryKeys.collections.byUser('user-456')

// Specific collection
queryKeys.collections.detail('collection-789')
```

### Activity Feed

| Query | Key Structure | Example |
|-------|--------------|---------|
| User's activity feed | `['activity-feed', userId]` | `['activity-feed', 'user-456']` |

**Usage:**
```typescript
// User's activity feed
queryKeys.activityFeed.byUser('user-456')
```

## Invalidation Patterns

### Invalidate All Queries of a Type

```typescript
// Invalidate all venue queries
queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });

// Invalidate all check-in queries
queryClient.invalidateQueries({ queryKey: queryKeys.checkIns.all });

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
```

### Invalidate Specific Scope

```typescript
// Invalidate all venue lists (but not details)
queryClient.invalidateQueries({ queryKey: queryKeys.venues.lists() });

// Invalidate all venue details (but not lists)
queryClient.invalidateQueries({ queryKey: queryKeys.venues.details() });
```

### Invalidate Single Entity

```typescript
// Invalidate specific venue
queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail('venue-123') });

// Invalidate specific user profile
queryClient.invalidateQueries({ queryKey: queryKeys.users.profile('user-456') });

// Invalidate specific collection
queryClient.invalidateQueries({ queryKey: queryKeys.collections.detail('collection-789') });
```

### Invalidate Related Queries

When a mutation affects multiple entities, invalidate all related queries:

```typescript
// After check-in, invalidate:
queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(venueId) });
queryClient.invalidateQueries({ queryKey: queryKeys.checkIns.byUser(userId) });
queryClient.invalidateQueries({ queryKey: queryKeys.checkIns.byVenue(venueId) });

// After claiming flash offer, invalidate:
queryClient.invalidateQueries({ queryKey: queryKeys.flashOffers.byVenue(venueId) });
queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(venueId) });

// After adding friend, invalidate:
queryClient.invalidateQueries({ queryKey: queryKeys.users.friends(userId) });
queryClient.invalidateQueries({ queryKey: queryKeys.activityFeed.byUser(userId) });
```

## Common Mutation Invalidation Patterns

### Check-In Mutation

```typescript
onSuccess: (data, variables) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(variables.venueId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.checkIns.byUser(variables.userId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.checkIns.byVenue(variables.venueId) });
}
```

### Flash Offer Claim Mutation

```typescript
onSuccess: (data, variables) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.flashOffers.byVenue(variables.venueId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(variables.venueId) });
}
```

### Profile Update Mutation

```typescript
onSuccess: (data, variables) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(variables.userId) });
}
```

### Add Friend Mutation

```typescript
onSuccess: (data, variables) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.users.friends(variables.fromUserId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.activityFeed.byUser(variables.fromUserId) });
}
```

### Collection Mutation

```typescript
onSuccess: (data, variables) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.collections.detail(variables.collectionId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.collections.byUser(variables.userId) });
}
```

## Prefetching Patterns

### Prefetch Before Navigation

```typescript
// Prefetch venue details before navigating
const handleVenuePress = (venueId: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.venues.detail(venueId),
    queryFn: () => VenueService.getVenue(venueId),
  });
  
  navigation.navigate('VenueDetail', { venueId });
};
```

### Prefetch Related Data

```typescript
// When loading a venue, prefetch its flash offers
const { data: venue } = useVenueQuery({ venueId });

useEffect(() => {
  if (venue) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.flashOffers.byVenue(venueId),
      queryFn: () => FlashOfferService.getByVenue(venueId),
    });
  }
}, [venue, venueId]);
```

## Cache Management

### Set Query Data Manually

```typescript
// Update cache without refetching
queryClient.setQueryData(
  queryKeys.venues.detail(venueId),
  (oldData) => ({
    ...oldData,
    isFavorite: true,
  })
);
```

### Get Query Data

```typescript
// Read from cache
const venue = queryClient.getQueryData(queryKeys.venues.detail(venueId));
```

### Remove Query Data

```typescript
// Remove from cache
queryClient.removeQueries({ queryKey: queryKeys.venues.detail(venueId) });
```

### Reset All Queries

```typescript
// Clear all cache
queryClient.clear();

// Reset to initial state
queryClient.resetQueries();
```

## Best Practices

1. **Always use the query key factory** - Never hardcode query keys
2. **Invalidate hierarchically** - Use `queryKeys.venues.all` to invalidate all venue queries
3. **Be specific when possible** - Invalidate only what changed
4. **Prefetch for better UX** - Load data before navigation
5. **Use TypeScript** - Query keys are type-safe with `as const`

## TypeScript Support

All query keys are typed with `as const` for maximum type safety:

```typescript
// Type: readonly ["venues", "detail", string]
const key = queryKeys.venues.detail('venue-123');

// TypeScript will catch typos
queryClient.invalidateQueries({ 
  queryKey: queryKeys.venues.detial('venue-123') // ❌ Error: Property 'detial' does not exist
});
```

## Related Files

- **Query Key Factory**: `src/lib/queryKeys.ts`
- **Query Client Config**: `src/lib/queryClient.ts`
- **Query Hooks**: `src/hooks/queries/`
- **Mutation Hooks**: `src/hooks/mutations/`
- **Real-time Sync**: `src/lib/realtimeSync.ts`
- **Navigation Sync**: `src/lib/navigationSync.ts`
