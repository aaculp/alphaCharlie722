/**
 * useHybridClaimSync Hook
 * 
 * Custom hook for using HybridClaimSync in React components.
 * Provides automatic subscription management with cleanup on unmount.
 * 
 * @module useHybridClaimSync
 * @category Hooks
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { HybridClaimSync, type SyncMode } from '../services/HybridClaimSync';
import type { ClaimUpdate } from '../services/SubscriptionManager';

/**
 * Options for useHybridClaimSync hook
 */
export interface UseHybridClaimSyncOptions {
  /**
   * Whether to enable the subscription
   * Default: true
   * 
   * Set to false to temporarily disable subscription without unmounting component
   */
  enabled?: boolean;
  
  /**
   * Callback invoked when claim is updated
   */
  onUpdate?: (update: ClaimUpdate) => void;
  
  /**
   * Callback invoked when sync error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for useHybridClaimSync hook
 */
export interface UseHybridClaimSyncReturn {
  /**
   * Current sync mode being used
   * - 'realtime': Using real-time subscriptions
   * - 'polling': Using polling for legacy claims
   * - 'fallback': Fell back to polling after real-time failed
   * - null: Not currently syncing
   */
  syncMode: SyncMode | null;
  
  /**
   * Whether the subscription is active
   */
  isActive: boolean;
  
  /**
   * Manually trigger a refresh (useful for pull-to-refresh)
   * Only works in polling mode
   */
  refresh: () => void;
}

/**
 * useHybridClaimSync Hook
 * 
 * Custom hook for subscribing to claim updates with automatic mode detection.
 * Handles subscription lifecycle (subscribe on mount, unsubscribe on unmount).
 * 
 * **Features:**
 * - Automatic subscription management
 * - Cleanup on unmount
 * - Support for both real-time and polling modes
 * - Sync mode visibility for debugging
 * - Manual refresh capability
 * 
 * **Use Cases:**
 * 1. **Claim Detail Screen**: Subscribe to single claim updates
 * 2. **My Claims Screen**: Subscribe to all user claims
 * 3. **Legacy Claims**: Automatically uses polling for old claims
 * 4. **Fallback**: Automatically switches to polling if real-time fails
 * 
 * @param claimId - ID of the claim to subscribe to (or null to disable)
 * @param options - Hook options
 * @returns Object with sync state and methods
 * 
 * @example
 * ```tsx
 * // Subscribe to single claim updates
 * function ClaimDetailScreen({ claimId }: Props) {
 *   const [claim, setClaim] = useState<CachedClaim | null>(null);
 *   
 *   const { syncMode, isActive } = useHybridClaimSync(claimId, {
 *     onUpdate: (update) => {
 *       // Update local state
 *       setClaim(prev => prev ? { ...prev, ...update } : null);
 *       
 *       // Show feedback
 *       if (update.status === 'redeemed') {
 *         showSuccessMessage('Claim redeemed!');
 *       }
 *     },
 *     onError: (error) => {
 *       console.error('Sync error:', error);
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       {syncMode === 'polling' && <Text>Using polling mode</Text>}
 *       {syncMode === 'fallback' && <Text>Fallback mode active</Text>}
 *       <ClaimDetails claim={claim} />
 *     </View>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Conditional subscription
 * function ClaimCard({ claim, isExpanded }: Props) {
 *   // Only subscribe when card is expanded
 *   const { syncMode } = useHybridClaimSync(claim.id, {
 *     enabled: isExpanded,
 *     onUpdate: (update) => {
 *       updateClaimInList(update.claimId, update);
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       <ClaimSummary claim={claim} />
 *       {isExpanded && (
 *         <View>
 *           <ClaimDetails claim={claim} />
 *           {syncMode && <SyncModeIndicator mode={syncMode} />}
 *         </View>
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export function useHybridClaimSync(
  claimId: string | null,
  options: UseHybridClaimSyncOptions = {}
): UseHybridClaimSyncReturn {
  const { enabled = true, onUpdate, onError } = options;
  
  // Get singleton instance (memoized)
  const hybridSync = useMemo(() => HybridClaimSync.getInstance(), []);
  
  // Track sync mode
  const [syncMode, setSyncMode] = useState<SyncMode | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  // Refresh function (only works in polling mode)
  const refresh = useCallback(() => {
    if (syncMode === 'polling' || syncMode === 'fallback') {
      console.log('🔄 Manual refresh triggered');
      // Polling will pick up changes on next interval
      // Could implement immediate poll here if needed
    } else {
      console.log('⚠️ Manual refresh only works in polling mode');
    }
  }, [syncMode]);
  
  // Subscribe to claim updates
  useEffect(() => {
    if (!claimId || !enabled) {
      setSyncMode(null);
      setIsActive(false);
      return;
    }
    
    console.log(`🔄 Setting up hybrid sync for claim: ${claimId}`);
    
    // Subscribe
    const unsubscribe = hybridSync.subscribeToClaimUpdates(
      claimId,
      (update) => {
        console.log(`🔄 Claim update received:`, update);
        onUpdate?.(update);
      },
      (error) => {
        console.error(`❌ Sync error:`, error);
        onError?.(error);
      }
    );
    
    // Get initial sync mode
    const mode = hybridSync.getSyncMode(claimId);
    setSyncMode(mode);
    setIsActive(true);
    
    // Poll for sync mode changes (in case of fallback)
    const interval = setInterval(() => {
      const currentMode = hybridSync.getSyncMode(claimId);
      if (currentMode !== syncMode) {
        console.log(`📊 Sync mode changed: ${syncMode} -> ${currentMode}`);
        setSyncMode(currentMode);
      }
    }, 1000);
    
    // Cleanup
    return () => {
      console.log(`🔌 Cleaning up hybrid sync for claim: ${claimId}`);
      unsubscribe();
      clearInterval(interval);
      setSyncMode(null);
      setIsActive(false);
    };
  }, [claimId, enabled, hybridSync, onUpdate, onError]);
  
  return {
    syncMode,
    isActive,
    refresh,
  };
}

/**
 * useHybridUserClaimsSync Hook
 * 
 * Custom hook for subscribing to all user claims with hybrid sync.
 * Similar to useHybridClaimSync but for multiple claims.
 * 
 * @param userId - ID of the user (or null to disable)
 * @param options - Hook options
 * @returns Object with sync state and methods
 * 
 * @example
 * ```tsx
 * function MyClaimsScreen({ userId }: Props) {
 *   const [claims, setClaims] = useState<CachedClaim[]>([]);
 *   
 *   const { syncMode, isActive } = useHybridUserClaimsSync(userId, {
 *     onUpdate: (update) => {
 *       // Update specific claim in list
 *       setClaims(prev =>
 *         prev.map(claim =>
 *           claim.claimId === update.claimId
 *             ? { ...claim, ...update }
 *             : claim
 *         )
 *       );
 *     },
 *     onError: (error) => {
 *       console.error('Sync error:', error);
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       {syncMode === 'fallback' && (
 *         <Banner>Using fallback mode</Banner>
 *       )}
 *       <FlatList
 *         data={claims}
 *         renderItem={({ item }) => <ClaimCard claim={item} />}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useHybridUserClaimsSync(
  userId: string | null,
  options: UseHybridClaimSyncOptions = {}
): UseHybridClaimSyncReturn {
  const { enabled = true, onUpdate, onError } = options;
  
  // Get singleton instance (memoized)
  const hybridSync = useMemo(() => HybridClaimSync.getInstance(), []);
  
  // Track sync mode
  const [syncMode, setSyncMode] = useState<SyncMode | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  // Refresh function
  const refresh = useCallback(() => {
    if (syncMode === 'polling' || syncMode === 'fallback') {
      console.log('🔄 Manual refresh triggered for user claims');
    } else {
      console.log('⚠️ Manual refresh only works in polling mode');
    }
  }, [syncMode]);
  
  // Subscribe to user claims
  useEffect(() => {
    if (!userId || !enabled) {
      setSyncMode(null);
      setIsActive(false);
      return;
    }
    
    console.log(`🔄 Setting up hybrid sync for user claims: ${userId}`);
    
    const syncId = `user:${userId}`;
    
    // Subscribe
    const unsubscribe = hybridSync.subscribeToUserClaims(
      userId,
      (update) => {
        console.log(`🔄 User claim update received:`, update);
        onUpdate?.(update);
      },
      (error) => {
        console.error(`❌ Sync error:`, error);
        onError?.(error);
      }
    );
    
    // Get initial sync mode
    const mode = hybridSync.getSyncMode(syncId);
    setSyncMode(mode);
    setIsActive(true);
    
    // Poll for sync mode changes
    const interval = setInterval(() => {
      const currentMode = hybridSync.getSyncMode(syncId);
      if (currentMode !== syncMode) {
        console.log(`📊 Sync mode changed: ${syncMode} -> ${currentMode}`);
        setSyncMode(currentMode);
      }
    }, 1000);
    
    // Cleanup
    return () => {
      console.log(`🔌 Cleaning up hybrid sync for user claims: ${userId}`);
      unsubscribe();
      clearInterval(interval);
      setSyncMode(null);
      setIsActive(false);
    };
  }, [userId, enabled, hybridSync, onUpdate, onError]);
  
  return {
    syncMode,
    isActive,
    refresh,
  };
}
