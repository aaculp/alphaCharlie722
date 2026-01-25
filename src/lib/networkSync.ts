/**
 * Network Connectivity Monitoring for React Query
 * 
 * Integrates React Native NetInfo with React Query to:
 * - Detect network connectivity changes
 * - Resume paused mutations when online
 * - Invalidate all queries when connectivity is restored
 * - Provide network status to the application
 * 
 * This ensures that queries and mutations behave correctly when
 * the device goes offline and comes back online.
 */

import NetInfo from '@react-native-community/netinfo';
import { QueryClient } from '@tanstack/react-query';

/**
 * Sets up network connectivity monitoring for React Query
 * 
 * When the device comes back online:
 * 1. Resumes any paused mutations
 * 2. Invalidates all queries to trigger refetch
 * 
 * @param queryClient - The QueryClient instance to monitor
 * @returns Cleanup function to unsubscribe from network events
 * 
 * @example
 * ```typescript
 * const cleanup = setupNetworkSync(queryClient);
 * 
 * // Later, when component unmounts:
 * cleanup();
 * ```
 */
export function setupNetworkSync(queryClient: QueryClient): () => void {
  // Subscribe to network state changes
  const unsubscribe = NetInfo.addEventListener((state) => {
    // When device comes back online
    if (state.isConnected) {
      // Resume any mutations that were paused while offline
      queryClient.resumePausedMutations();
      
      // Invalidate all queries to trigger refetch with fresh data
      queryClient.invalidateQueries();
    }
  });
  
  // Return cleanup function
  return unsubscribe;
}

/**
 * Gets the current network connectivity status
 * 
 * @returns Promise that resolves to the current network state
 * 
 * @example
 * ```typescript
 * const state = await getNetworkState();
 * if (state.isConnected) {
 *   console.log('Device is online');
 * }
 * ```
 */
export async function getNetworkState() {
  return NetInfo.fetch();
}

/**
 * Checks if the device is currently connected to the internet
 * 
 * @returns Promise that resolves to true if connected, false otherwise
 * 
 * @example
 * ```typescript
 * const isOnline = await isConnected();
 * if (!isOnline) {
 *   showOfflineMessage();
 * }
 * ```
 */
export async function isConnected(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}
