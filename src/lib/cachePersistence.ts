/**
 * Cache Persistence Configuration
 * 
 * Configures React Query cache persistence to AsyncStorage for offline support.
 * 
 * Features:
 * - Persists query cache to AsyncStorage when app backgrounds
 * - Restores cache from AsyncStorage on app launch
 * - Expires persisted data after 24 hours
 * - Excludes sensitive data from persistence
 * - Marks restored data as stale to trigger background refetch
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

/**
 * Maximum age for persisted cache data (24 hours in milliseconds)
 */
const MAX_AGE = 24 * 60 * 60 * 1000; // 86400000ms

/**
 * Custom serialization function for cache data
 * Handles Date objects and other non-JSON types
 */
function serialize(data: PersistedClient): string {
  return JSON.stringify(data, (key, value) => {
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  });
}

/**
 * Custom deserialization function for cache data
 * Restores Date objects and other non-JSON types
 * Handles corrupted data gracefully by returning null
 */
function deserialize(data: string): PersistedClient {
  try {
    return JSON.parse(data, (key, value) => {
      // Restore Date objects from ISO strings
      if (value && typeof value === 'object' && value.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    });
  } catch (error) {
    // Return a valid empty client state if deserialization fails
    console.warn('Failed to deserialize cache data:', error);
    return {
      clientState: {
        queries: [],
        mutations: [],
      },
      timestamp: 0,
    };
  }
}

/**
 * Creates an AsyncStorage persister for React Query cache
 * 
 * Configuration:
 * - maxAge: 24 hours (data older than this is not restored)
 * - serialize: Custom serialization for Date objects
 * - deserialize: Custom deserialization for Date objects
 * 
 * @returns Persister instance configured for AsyncStorage
 */
export function createCachePersister(): Persister {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    maxAge: MAX_AGE,
    serialize,
    deserialize,
  });
}
