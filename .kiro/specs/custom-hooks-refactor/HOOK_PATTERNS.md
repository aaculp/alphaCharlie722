# Custom Hook Patterns for Future Development

## Overview

This document provides guidelines and patterns for using and creating custom hooks in the OTW application. Following these patterns ensures consistency, maintainability, and scalability.

## Core Principles

### 1. Separation of Concerns
- **Hooks handle**: Data fetching, state management, business logic
- **Components handle**: UI rendering, user interactions, layout

### 2. Single Responsibility
- Each hook should have one clear purpose
- Avoid creating "god hooks" that do too many things
- Compose multiple hooks in components when needed

### 3. Reusability
- Design hooks to be used across multiple components
- Use generic parameters when appropriate
- Avoid component-specific logic in hooks

### 4. Type Safety
- Always define TypeScript interfaces for hook parameters and returns
- Use generic types for flexible, type-safe hooks
- Avoid `any` types

### 5. Error Handling
- Always handle errors gracefully within hooks
- Expose error state to consuming components
- Never throw unhandled errors from hooks

## Hook Naming Conventions

### Pattern: `use[Feature][Action]`

**Examples:**
- `useVenues` - Manages venue data
- `useFavorites` - Manages favorites
- `useCheckInStats` - Fetches check-in statistics
- `useCheckInActions` - Handles check-in/out actions
- `useDebounce` - Debounces values

### Rules:
1. Always start with "use" prefix
2. Use PascalCase after "use"
3. Be descriptive but concise
4. Indicate the feature domain
5. Optionally include the action (fetch, toggle, etc.)

## Hook Structure Template

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook description and purpose
 * 
 * @example
 * ```typescript
 * const { data, loading, error } = useFeature({ option: 'value' });
 * ```
 */

// 1. Define Options Interface (if needed)
interface UseFeatureOptions {
  option1?: string;
  option2?: number;
  enabled?: boolean;
}

// 2. Define Return Interface
interface UseFeatureReturn {
  data: DataType[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// 3. Implement Hook
export function useFeature(options?: UseFeatureOptions): UseFeatureReturn {
  // State
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch function
  const fetchData = useCallback(async () => {
    if (options?.enabled === false) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await ServiceLayer.getData(options);
      setData(result);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Auto-fetch on mount and when options change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup (if needed)
  useEffect(() => {
    return () => {
      // Cleanup logic (abort controllers, timers, etc.)
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

## Common Hook Patterns

### Pattern 1: Data Fetching Hook

**Use Case**: Fetch data from an API or service

**Structure:**
```typescript
interface UseDataFetchOptions {
  id?: string;
  filter?: string;
  enabled?: boolean;
}

interface UseDataFetchReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDataFetch<T>(
  options?: UseDataFetchOptions
): UseDataFetchReturn<T> {
  // Implementation
}
```

**Key Features:**
- Loading state
- Error state
- Refetch function
- Conditional fetching with `enabled` flag
- Automatic cleanup

**Examples:**
- `useVenues`
- `useCheckInStats`

### Pattern 2: Action Hook

**Use Case**: Perform actions (create, update, delete)

**Structure:**
```typescript
interface UseActionsOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

interface UseActionsReturn {
  performAction: (params: any) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useActions(
  options?: UseActionsOptions
): UseActionsReturn {
  // Implementation
}
```

**Key Features:**
- Action functions
- Loading state during action
- Success/error callbacks
- Prevent duplicate requests

**Examples:**
- `useCheckInActions`

### Pattern 3: State Management Hook

**Use Case**: Manage complex state with actions

**Structure:**
```typescript
interface UseStateManagementReturn {
  state: StateType;
  actions: {
    action1: (param: any) => void;
    action2: (param: any) => void;
  };
  loading: boolean;
  error: Error | null;
}

export function useStateManagement(): UseStateManagementReturn {
  // Implementation with useReducer or useState
}
```

**Key Features:**
- Centralized state
- Action functions
- Optimistic updates
- Rollback on error

**Examples:**
- `useFavorites`

### Pattern 4: Utility Hook

**Use Case**: Reusable utility logic

**Structure:**
```typescript
export function useUtility<T>(
  value: T,
  options?: UtilityOptions
): T {
  // Implementation
}
```

**Key Features:**
- Generic type support
- Simple, focused logic
- No external dependencies
- Automatic cleanup

**Examples:**
- `useDebounce`

## Advanced Patterns

### Pattern 5: Composed Hook

**Use Case**: Combine multiple hooks for complex logic

```typescript
export function useVenueDetails(venueId: string) {
  // Compose multiple hooks
  const { venues, loading: venuesLoading } = useVenues();
  const { stats, loading: statsLoading } = useCheckInStats({ venueIds: venueId });
  const { isFavorite, toggleFavorite } = useFavorites();

  const venue = venues.find(v => v.id === venueId);
  const venueStats = stats.get(venueId);
  const loading = venuesLoading || statsLoading;

  return {
    venue,
    stats: venueStats,
    isFavorite: isFavorite(venueId),
    toggleFavorite: () => toggleFavorite(venueId),
    loading,
  };
}
```

**When to Use:**
- Multiple related data sources
- Complex derived state
- Frequently used combinations

**When NOT to Use:**
- Simple cases (compose in component instead)
- One-off combinations
- Tight coupling to specific UI

### Pattern 6: Paginated Data Hook

**Use Case**: Fetch data with pagination

```typescript
interface UsePaginatedDataReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginatedData<T>(
  fetchFn: (offset: number, limit: number) => Promise<T[]>,
  limit: number = 20
): UsePaginatedDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const newData = await fetchFn(offset, limit);
      
      if (newData.length < limit) {
        setHasMore(false);
      }
      
      setData(prev => [...prev, ...newData]);
      setOffset(prev => prev + limit);
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      setLoading(false);
    }
  }, [offset, loading, hasMore, fetchFn, limit]);

  const refresh = useCallback(async () => {
    setData([]);
    setOffset(0);
    setHasMore(true);
    await loadMore();
  }, [loadMore]);

  useEffect(() => {
    loadMore();
  }, []);

  return {
    data,
    loading,
    error: null,
    hasMore,
    loadMore,
    refresh,
  };
}
```

### Pattern 7: Real-time Data Hook

**Use Case**: Subscribe to real-time updates

```typescript
export function useRealtimeData<T>(
  channel: string,
  event: string
): UseRealtimeDataReturn<T> {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', { event, schema: 'public' }, (payload) => {
        setData(prev => [...prev, payload.new as T]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channel, event]);

  return { data };
}
```

## Hook Testing Patterns

### Unit Testing

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

  it('should handle errors gracefully', async () => {
    // Mock service to throw error
    jest.spyOn(VenueService, 'getVenues').mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useVenues());
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.venues).toEqual([]);
    });
  });
});
```

### Property-Based Testing

```typescript
import fc from 'fast-check';
import { renderHook } from '@testing-library/react-hooks';
import { useDebounce } from '../useDebounce';

describe('useDebounce - Property Tests', () => {
  it('should eventually return the input value', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (value) => {
        const { result, waitForNextUpdate } = renderHook(() => 
          useDebounce(value, 100)
        );
        
        await waitForNextUpdate();
        
        expect(result.current).toBe(value);
      }),
      { numRuns: 100 }
    );
  });
});
```

## Common Pitfalls and Solutions

### Pitfall 1: Infinite Re-renders

**Problem:**
```typescript
// BAD: Missing dependency array
useEffect(() => {
  fetchData();
}); // Runs on every render!
```

**Solution:**
```typescript
// GOOD: Proper dependency array
useEffect(() => {
  fetchData();
}, [fetchData]); // Only runs when fetchData changes
```

### Pitfall 2: Stale Closures

**Problem:**
```typescript
// BAD: Callback doesn't update when state changes
const handleClick = () => {
  console.log(count); // Always logs initial value
};
```

**Solution:**
```typescript
// GOOD: Use useCallback with dependencies
const handleClick = useCallback(() => {
  console.log(count); // Always logs current value
}, [count]);
```

### Pitfall 3: Memory Leaks

**Problem:**
```typescript
// BAD: No cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    setData(newData);
  }, 1000);
}); // Timer continues after unmount!
```

**Solution:**
```typescript
// GOOD: Cleanup function
useEffect(() => {
  const timer = setTimeout(() => {
    setData(newData);
  }, 1000);
  
  return () => clearTimeout(timer);
}, []);
```

### Pitfall 4: Unnecessary Re-fetching

**Problem:**
```typescript
// BAD: Fetches on every render
useEffect(() => {
  fetchData(options);
}, [options]); // options is a new object every render!
```

**Solution:**
```typescript
// GOOD: Destructure options or use useMemo
const { filter, limit } = options;
useEffect(() => {
  fetchData({ filter, limit });
}, [filter, limit]);
```

## When to Create a New Hook

### Create a Hook When:
1. ✅ Logic is used in multiple components
2. ✅ Logic involves complex state management
3. ✅ Logic involves side effects (API calls, subscriptions)
4. ✅ Logic can be tested independently
5. ✅ Logic improves component readability

### Don't Create a Hook When:
1. ❌ Logic is only used once
2. ❌ Logic is trivial (simple calculations)
3. ❌ Logic is tightly coupled to specific UI
4. ❌ Logic is better as a utility function
5. ❌ Hook would have too many responsibilities

## Migration Checklist

When refactoring existing code to use hooks:

- [ ] Identify reusable logic in components
- [ ] Extract logic into custom hook
- [ ] Define TypeScript interfaces
- [ ] Add error handling
- [ ] Add loading states
- [ ] Write tests for the hook
- [ ] Update components to use the hook
- [ ] Remove old logic from components
- [ ] Verify functionality maintained
- [ ] Update documentation

## Future Hook Ideas

Based on the current application, here are potential hooks for future development:

1. **useGeolocation** - Get user's current location
2. **usePermissions** - Manage app permissions
3. **useNotifications** - Handle push notifications
4. **useImagePicker** - Handle image selection
5. **useCamera** - Handle camera access
6. **useKeyboard** - Track keyboard visibility
7. **useNetworkStatus** - Monitor network connectivity
8. **useAppState** - Track app foreground/background state
9. **useOrientation** - Track device orientation
10. **useThrottle** - Throttle rapidly changing values

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Testing Library Hooks](https://react-hooks-testing-library.com/)
- [TypeScript with React Hooks](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/hooks)

## Conclusion

Following these patterns ensures:
- Consistent code structure
- Better maintainability
- Improved testability
- Enhanced reusability
- Clearer separation of concerns

When in doubt, refer to existing hooks (`useVenues`, `useFavorites`, etc.) as examples of these patterns in practice.
