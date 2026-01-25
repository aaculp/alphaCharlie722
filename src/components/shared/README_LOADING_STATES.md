# React Query Loading States Guide

This guide demonstrates how to use the loading state components with React Query hooks.

## Components

### 1. QueryLoadingSkeleton
Used for first-time loads when `isLoading` is true (no cached data).

### 2. BackgroundRefetchIndicator
Used for background refetches when `isFetching` is true (data exists but refetching).

### 3. QueryErrorDisplay
Used when `isError` is true (query failed after retries).

### 4. StaleDataIndicator
Used when showing cached data that may be outdated.

### 5. QueryRefreshControl
Used for pull-to-refresh functionality.

## Usage Patterns

### Pattern 1: List Screen with Loading States

```tsx
import React from 'react';
import { View, FlatList } from 'react-native';
import { useVenuesQuery } from '../../hooks/queries';
import {
  QueryLoadingSkeleton,
  BackgroundRefetchIndicator,
  QueryErrorDisplay,
  QueryRefreshControl,
} from '../../components/shared';

export const VenueListScreen = () => {
  const { 
    data: venues = [], 
    isLoading, 
    isFetching, 
    isError, 
    error, 
    refetch 
  } = useVenuesQuery();

  // First-time load: Show skeleton
  if (isLoading) {
    return <QueryLoadingSkeleton count={5} variant="list" />;
  }

  // Error state: Show error with retry
  if (isError && venues.length === 0) {
    return <QueryErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Background refetch indicator */}
      <BackgroundRefetchIndicator isVisible={isFetching} />
      
      <FlatList
        data={venues}
        renderItem={({ item }) => <VenueCard venue={item} />}
        refreshControl={
          <QueryRefreshControl
            isRefetching={isFetching}
            onRefresh={refetch}
          />
        }
      />
    </View>
  );
};
```

### Pattern 2: Detail Screen with Loading States

```tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useVenueQuery } from '../../hooks/queries';
import {
  QueryLoadingSkeleton,
  BackgroundRefetchIndicator,
  QueryErrorDisplay,
  QueryRefreshControl,
} from '../../components/shared';

export const VenueDetailScreen = ({ route }) => {
  const { venueId } = route.params;
  const { 
    data: venue, 
    isLoading, 
    isFetching, 
    isError, 
    error, 
    refetch 
  } = useVenueQuery({ venueId });

  // First-time load: Show skeleton
  if (isLoading) {
    return <QueryLoadingSkeleton variant="detail" />;
  }

  // Error state: Show error with retry
  if (isError || !venue) {
    return <QueryErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Background refetch indicator */}
      <BackgroundRefetchIndicator isVisible={isFetching} />
      
      <ScrollView
        refreshControl={
          <QueryRefreshControl
            isRefetching={isFetching}
            onRefresh={refetch}
          />
        }
      >
        <VenueDetailContent venue={venue} />
      </ScrollView>
    </View>
  );
};
```

### Pattern 3: Card Grid with Loading States

```tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { useCollectionsQuery } from '../../hooks/queries';
import {
  QueryLoadingSkeleton,
  BackgroundRefetchIndicator,
  QueryErrorDisplay,
  StaleDataIndicator,
} from '../../components/shared';

export const CollectionsScreen = ({ userId }) => {
  const { 
    data: collections = [], 
    isLoading, 
    isFetching, 
    isError, 
    error, 
    refetch,
    isStale 
  } = useCollectionsQuery({ userId });

  // First-time load: Show skeleton
  if (isLoading) {
    return <QueryLoadingSkeleton count={4} variant="card" />;
  }

  // Error with cached data: Show stale indicator
  if (isError && collections.length > 0) {
    return (
      <View style={{ flex: 1 }}>
        <StaleDataIndicator onRefresh={refetch} />
        <CollectionGrid collections={collections} />
      </View>
    );
  }

  // Error without cached data: Show error
  if (isError) {
    return <QueryErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Background refetch indicator */}
      <BackgroundRefetchIndicator isVisible={isFetching} />
      
      <ScrollView>
        <CollectionGrid collections={collections} />
      </ScrollView>
    </View>
  );
};
```

### Pattern 4: Mutation with Loading States

```tsx
import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useCheckInMutation } from '../../hooks/mutations';
import { MutationErrorToast } from '../../components/shared';

export const CheckInButton = ({ venueId, userId }) => {
  const { 
    mutate: checkIn, 
    isLoading, 
    isError, 
    error 
  } = useCheckInMutation();

  const handleCheckIn = () => {
    checkIn({ venueId, userId });
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handleCheckIn}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#007AFF',
          padding: 16,
          borderRadius: 8,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white' }}>Check In</Text>
        )}
      </TouchableOpacity>
      
      {isError && (
        <MutationErrorToast
          error={error}
          onDismiss={() => {}}
          onRetry={handleCheckIn}
        />
      )}
    </View>
  );
};
```

## Best Practices

1. **Always handle isLoading first**: Show skeleton for first-time loads
2. **Use BackgroundRefetchIndicator for isFetching**: Don't block UI during refetch
3. **Provide retry functionality**: Always give users a way to retry failed queries
4. **Show stale data when possible**: Better to show old data than nothing
5. **Use appropriate skeleton variants**: Match the skeleton to your content layout
6. **Coordinate loading states**: Avoid showing multiple loading indicators simultaneously

## Loading State Priority

When multiple states are true, follow this priority:

1. `isLoading` → Show QueryLoadingSkeleton (first-time load)
2. `isError && !data` → Show QueryErrorDisplay (error with no cached data)
3. `isError && data` → Show StaleDataIndicator (error with cached data)
4. `isFetching` → Show BackgroundRefetchIndicator (background refetch)
5. `data` → Show content normally

## Testing Loading States

```tsx
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('VenueListScreen Loading States', () => {
  it('should show skeleton when loading', () => {
    // Mock useVenuesQuery to return isLoading: true
    const { getByTestId } = render(<VenueListScreen />);
    expect(getByTestId('query-loading-skeleton')).toBeTruthy();
  });

  it('should show error display when error occurs', () => {
    // Mock useVenuesQuery to return isError: true
    const { getByText } = render(<VenueListScreen />);
    expect(getByText('Unable to Load Data')).toBeTruthy();
  });

  it('should show background indicator when refetching', () => {
    // Mock useVenuesQuery to return isFetching: true with data
    const { getByTestId } = render(<VenueListScreen />);
    expect(getByTestId('background-refetch-indicator')).toBeTruthy();
  });
});
```
