/**
 * useClaimSync Hook
 * 
 * Custom hook for accessing the ClaimSyncService singleton in React components.
 * Provides easy access to sync methods and network state.
 * 
 * @module useClaimSync
 * @category Hooks
 */

import { useMemo, useState, useEffect } from 'react';
import { ClaimSyncService } from '../services/ClaimSyncService';
import type { SyncResult } from '../services/ClaimSyncService';

/**
 * Return type for useClaimSync hook
 */
export interface UseClaimSyncReturn {
  /**
   * Manually trigger a sync
   * 
   * **Use for:** Pull-to-refresh, manual refresh buttons
   * 
   * **Requirements:** 5.1, 5.2
   * 
   * @returns Sync result with information about what was synced
   * 
   * @example
   * ```tsx
   * const { manualSync } = useClaimSync();
   * 
   * const handleRefresh = async () => {
   *   const result = await manualSync();
   *   if (result.success) {
   *     showSuccessMessage('Claims updated');
   *   }
   * };
   * ```
   */
  manualSync: () => Promise<SyncResult>;

  /**
   * Check if device is currently online
   * 
   * **Use for:** Displaying offline indicators, disabling features
   * 
   * @returns True if device is online, false if offline
   * 
   * @example
   * ```tsx
   * const { isOnline } = useClaimSync();
   * 
   * return (
   *   <View>
   *     {!isOnline && <OfflineIndicator />}
   *     <ClaimsList />
   *   </View>
   * );
   * ```
   */
  isOnline: boolean;

  /**
   * Get timestamp of last successful sync
   * 
   * **Use for:** Displaying "last updated" time
   * 
   * @returns Timestamp in milliseconds, or null if never synced
   * 
   * @example
   * ```tsx
   * const { lastSyncTimestamp } = useClaimSync();
   * 
   * const lastSyncText = lastSyncTimestamp
   *   ? `Updated ${formatTimeAgo(lastSyncTimestamp)}`
   *   : 'Never synced';
   * ```
   */
  lastSyncTimestamp: number | null;
}

/**
 * useClaimSync Hook
 * 
 * Custom hook for accessing the ClaimSyncService singleton in React components.
 * Provides easy access to sync methods and network state without needing to
 * import and call getInstance() directly.
 * 
 * **Features:**
 * - Access to manual sync method
 * - Real-time online/offline state
 * - Last sync timestamp
 * - Memoized for performance
 * 
 * **Sync Methods:**
 * - **manualSync**: Manually trigger a sync (for pull-to-refresh)
 * 
 * **State:**
 * - **isOnline**: Current network connectivity state
 * - **lastSyncTimestamp**: When the last sync occurred
 * 
 * **Requirements Satisfied:**
 * - Requirement 5.1: Offline-to-online synchronization
 * - Requirement 5.2: App initialization status fetch
 * - Requirement 5.3: Missed update notifications
 * 
 * @returns Object containing sync methods and state
 * 
 * @example
 * ```tsx
 * // Basic usage in a component
 * function MyClaimsScreen() {
 *   const { manualSync, isOnline } = useClaimSync();
 *   const [refreshing, setRefreshing] = useState(false);
 *   
 *   const handleRefresh = async () => {
 *     setRefreshing(true);
 *     const result = await manualSync();
 *     setRefreshing(false);
 *     
 *     if (result.success) {
 *       showSuccessMessage(`Updated ${result.claimsSynced} claims`);
 *     }
 *   };
 *   
 *   return (
 *     <View>
 *       {!isOnline && <OfflineIndicator />}
 *       <FlatList
 *         data={claims}
 *         refreshing={refreshing}
 *         onRefresh={handleRefresh}
 *         renderItem={({ item }) => <ClaimCard claim={item} />}
 *       />
 *     </View>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Display last sync time
 * function SyncStatus() {
 *   const { lastSyncTimestamp, isOnline } = useClaimSync();
 *   
 *   const lastSyncText = useMemo(() => {
 *     if (!lastSyncTimestamp) return 'Never synced';
 *     
 *     const minutesAgo = Math.floor((Date.now() - lastSyncTimestamp) / 60000);
 *     if (minutesAgo < 1) return 'Just now';
 *     if (minutesAgo === 1) return '1 minute ago';
 *     return `${minutesAgo} minutes ago`;
 *   }, [lastSyncTimestamp]);
 *   
 *   return (
 *     <View>
 *       <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
 *       <Text>Last synced: {lastSyncText}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useClaimSync(): UseClaimSyncReturn {
  // Get singleton instance (memoized to prevent re-creation)
  const syncService = useMemo(() => ClaimSyncService.getInstance(), []);

  // Track online/offline state
  const [isOnline, setIsOnline] = useState(syncService.isDeviceOnline());
  
  // Track last sync timestamp
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(
    syncService.getLastSyncTimestamp()
  );

  // Poll for state changes (since ClaimSyncService doesn't expose events)
  // This is a simple approach; could be improved with event emitters
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(syncService.isDeviceOnline());
      setLastSyncTimestamp(syncService.getLastSyncTimestamp());
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [syncService]);

  // Return methods and state
  return useMemo(
    () => ({
      manualSync: () => syncService.manualSync(),
      isOnline,
      lastSyncTimestamp,
    }),
    [syncService, isOnline, lastSyncTimestamp]
  );
}
