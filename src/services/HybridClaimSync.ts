/**
 * Hybrid Claim Sync Service
 * 
 * Provides backward compatibility by supporting both real-time subscriptions
 * and polling-based updates for legacy claims.
 * 
 * Features:
 * - Detects if claim supports real-time (based on creation date)
 * - Automatically falls back to polling for legacy claims
 * - Seamless transition between real-time and polling
 * - Unified interface for both update mechanisms
 * 
 * Requirements: 10.2 (Backward Compatibility)
 * 
 * @module HybridClaimSync
 * @category Services
 */

import { SubscriptionManager, type Subscription, type ClaimUpdate } from './SubscriptionManager';
import { ClaimService } from './api/flashOfferClaims';
import { stateCache } from '../utils/cache/StateCache';
import type { CachedClaim } from '../utils/cache/StateCache';

/**
 * Configuration for hybrid sync behavior
 */
export interface HybridSyncConfig {
  /**
   * Timestamp before which claims are considered legacy (no real-time support)
   * Format: ISO 8601 string
   * 
   * Example: '2024-01-15T00:00:00Z' means claims created before Jan 15, 2024
   * are legacy and will use polling instead of real-time.
   */
  legacyCutoffDate: string;
  
  /**
   * Polling interval for legacy claims (milliseconds)
   * Default: 5000 (5 seconds)
   */
  pollingInterval: number;
  
  /**
   * Whether to enable automatic fallback to polling if real-time fails
   * Default: true
   */
  enableFallback: boolean;
}

/**
 * Default configuration
 * 
 * By default, all claims support real-time (cutoff date is in the past).
 * This can be overridden when initializing the service.
 */
const DEFAULT_CONFIG: HybridSyncConfig = {
  // Set to a date in the past so all claims use real-time by default
  // Override this in production to match your real-time feature deployment date
  legacyCutoffDate: '2024-01-01T00:00:00Z',
  pollingInterval: 5000, // 5 seconds
  enableFallback: true,
};

/**
 * Sync mode for a claim
 */
export type SyncMode = 'realtime' | 'polling' | 'fallback';

/**
 * Callback for claim updates (unified interface)
 */
export type ClaimUpdateCallback = (update: ClaimUpdate) => void;

/**
 * Callback for sync errors
 */
export type ErrorCallback = (error: Error) => void;

/**
 * Internal tracking for claim sync
 */
interface ClaimSyncRecord {
  claimId: string;
  mode: SyncMode;
  subscription?: Subscription;
  pollingInterval?: NodeJS.Timeout;
  onUpdate: ClaimUpdateCallback;
  onError: ErrorCallback;
  lastPollTimestamp?: number;
}

/**
 * Hybrid Claim Sync Service
 * 
 * Provides backward compatibility by supporting both real-time subscriptions
 * and polling-based updates. Automatically detects legacy claims and uses
 * appropriate sync mechanism.
 * 
 * **Use Cases:**
 * 1. **Legacy Claims**: Claims created before real-time feature deployment
 *    - Uses polling to check for status updates
 *    - Configurable polling interval (default: 5 seconds)
 * 
 * 2. **New Claims**: Claims created after real-time feature deployment
 *    - Uses real-time subscriptions for instant updates
 *    - Falls back to polling if real-time fails
 * 
 * 3. **Fallback Mode**: Real-time subscription fails
 *    - Automatically switches to polling
 *    - Seamless transition without user intervention
 * 
 * **Design Philosophy:**
 * - Unified interface: Callers don't need to know which mode is used
 * - Automatic detection: Service determines best sync mode
 * - Graceful degradation: Falls back to polling if real-time unavailable
 * - Performance: Only polls when necessary (legacy claims or fallback)
 * 
 * @example
 * ```typescript
 * // Initialize with custom config
 * const hybridSync = HybridClaimSync.getInstance();
 * hybridSync.configure({
 *   legacyCutoffDate: '2024-03-01T00:00:00Z', // Claims before March 1, 2024 are legacy
 *   pollingInterval: 3000, // Poll every 3 seconds
 *   enableFallback: true,
 * });
 * 
 * // Subscribe to claim updates (automatically uses real-time or polling)
 * const unsubscribe = hybridSync.subscribeToClaimUpdates(
 *   'claim-123',
 *   (update) => {
 *     console.log('Claim updated:', update.status);
 *   },
 *   (error) => {
 *     console.error('Sync error:', error);
 *   }
 * );
 * 
 * // Later, unsubscribe
 * unsubscribe();
 * ```
 */
export class HybridClaimSync {
  private static instance: HybridClaimSync | null = null;
  
  /** Configuration */
  private config: HybridSyncConfig = DEFAULT_CONFIG;
  
  /** Active claim sync records */
  private syncRecords: Map<string, ClaimSyncRecord> = new Map();
  
  /** Subscription manager for real-time updates */
  private subscriptionManager: SubscriptionManager;

  /**
   * Private constructor to enforce singleton pattern
   * 
   * @param subscriptionManager - Optional subscription manager for testing
   */
  private constructor(subscriptionManager?: SubscriptionManager) {
    this.subscriptionManager = subscriptionManager || SubscriptionManager.getInstance();
    console.log('🔄 HybridClaimSync initialized');
  }

  /**
   * Get the singleton instance
   * 
   * @param subscriptionManager - Optional subscription manager for testing
   */
  static getInstance(subscriptionManager?: SubscriptionManager): HybridClaimSync {
    if (!HybridClaimSync.instance) {
      HybridClaimSync.instance = new HybridClaimSync(subscriptionManager);
    }
    return HybridClaimSync.instance;
  }

  /**
   * Configure hybrid sync behavior
   * 
   * @param config - Partial configuration (merged with defaults)
   * 
   * @example
   * ```typescript
   * // Set legacy cutoff date to match real-time feature deployment
   * hybridSync.configure({
   *   legacyCutoffDate: '2024-03-15T00:00:00Z',
   *   pollingInterval: 4000,
   * });
   * ```
   */
  configure(config: Partial<HybridSyncConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    
    console.log('⚙️ HybridClaimSync configured:', this.config);
  }

  /**
   * Subscribe to claim updates with automatic mode detection
   * 
   * Automatically determines whether to use real-time or polling based on:
   * 1. Claim creation date (legacy vs new)
   * 2. Real-time availability (fallback if unavailable)
   * 
   * Returns an unsubscribe function that works for both modes.
   * 
   * Requirements: 10.2 (Backward Compatibility)
   * 
   * @param claimId - ID of the claim to subscribe to
   * @param onUpdate - Callback invoked when claim is updated
   * @param onError - Callback invoked when sync error occurs
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * // Subscribe to claim updates (mode is automatic)
   * const unsubscribe = hybridSync.subscribeToClaimUpdates(
   *   'claim-123',
   *   (update) => {
   *     if (update.status === 'redeemed') {
   *       showSuccessMessage('Claim redeemed!');
   *     }
   *   },
   *   (error) => {
   *     console.error('Sync error:', error);
   *   }
   * );
   * 
   * // Clean up when component unmounts
   * useEffect(() => {
   *   return () => unsubscribe();
   * }, []);
   * ```
   */
  subscribeToClaimUpdates(
    claimId: string,
    onUpdate: ClaimUpdateCallback,
    onError: ErrorCallback
  ): () => void {
    console.log(`🔄 Setting up hybrid sync for claim: ${claimId}`);
    
    // Check if already syncing this claim
    if (this.syncRecords.has(claimId)) {
      console.warn(`⚠️ Already syncing claim ${claimId}, unsubscribing previous sync`);
      this.unsubscribe(claimId);
    }
    
    // Determine sync mode
    const mode = this.determineSyncMode(claimId);
    
    console.log(`📊 Sync mode for claim ${claimId}: ${mode}`);
    
    // Create sync record
    const record: ClaimSyncRecord = {
      claimId,
      mode,
      onUpdate,
      onError,
    };
    
    this.syncRecords.set(claimId, record);
    
    // Start syncing based on mode
    if (mode === 'realtime') {
      this.startRealtimeSync(record);
    } else {
      this.startPollingSync(record);
    }
    
    // Return unsubscribe function
    return () => this.unsubscribe(claimId);
  }

  /**
   * Subscribe to all user claims with hybrid sync
   * 
   * Subscribes to updates for all claims belonging to a user.
   * Uses real-time for new claims and polling for legacy claims.
   * 
   * Note: This is more complex than single claim sync because different
   * claims may use different modes. For simplicity, we use real-time
   * for all claims and fall back to polling if real-time fails.
   * 
   * @param userId - ID of the user
   * @param onUpdate - Callback invoked when any claim is updated
   * @param onError - Callback invoked when sync error occurs
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * const unsubscribe = hybridSync.subscribeToUserClaims(
   *   'user-456',
   *   (update) => {
   *     updateClaimInList(update.claimId, update);
   *   },
   *   (error) => {
   *     console.error('Sync error:', error);
   *   }
   * );
   * ```
   */
  subscribeToUserClaims(
    userId: string,
    onUpdate: ClaimUpdateCallback,
    onError: ErrorCallback
  ): () => void {
    console.log(`🔄 Setting up hybrid sync for user claims: ${userId}`);
    
    const syncId = `user:${userId}`;
    
    // Check if already syncing
    if (this.syncRecords.has(syncId)) {
      console.warn(`⚠️ Already syncing user ${userId}, unsubscribing previous sync`);
      this.unsubscribe(syncId);
    }
    
    // For user claims, try real-time first
    const record: ClaimSyncRecord = {
      claimId: syncId,
      mode: 'realtime',
      onUpdate,
      onError,
    };
    
    this.syncRecords.set(syncId, record);
    
    // Start real-time sync for all user claims
    this.startRealtimeUserSync(userId, record);
    
    // Return unsubscribe function
    return () => this.unsubscribe(syncId);
  }

  /**
   * Determine sync mode for a claim
   * 
   * Checks if claim is legacy (created before cutoff date) or new.
   * Legacy claims use polling, new claims use real-time.
   * 
   * @param claimId - ID of the claim
   * @returns Sync mode to use
   * @private
   */
  private determineSyncMode(claimId: string): SyncMode {
    // Get claim from cache
    const claim = stateCache.getClaim(claimId);
    
    if (!claim) {
      // Claim not in cache, assume it's new and try real-time
      console.log(`📊 Claim ${claimId} not in cache, defaulting to real-time`);
      return 'realtime';
    }
    
    // Check if claim is legacy
    const createdAt = new Date(claim.createdAt).getTime();
    const cutoffDate = new Date(this.config.legacyCutoffDate).getTime();
    
    if (createdAt < cutoffDate) {
      console.log(`📊 Claim ${claimId} is legacy (created ${claim.createdAt}), using polling`);
      return 'polling';
    }
    
    // Claim is new, use real-time
    console.log(`📊 Claim ${claimId} is new (created ${claim.createdAt}), using real-time`);
    return 'realtime';
  }

  /**
   * Start real-time sync for a claim
   * 
   * Subscribes to real-time updates via SubscriptionManager.
   * If subscription fails and fallback is enabled, switches to polling.
   * 
   * @param record - Sync record
   * @private
   */
  private startRealtimeSync(record: ClaimSyncRecord): void {
    console.log(`📡 Starting real-time sync for claim: ${record.claimId}`);
    
    try {
      const subscription = this.subscriptionManager.subscribeToClaimUpdates(
        record.claimId,
        (update) => {
          console.log(`🔄 Real-time update for claim ${record.claimId}:`, update);
          record.onUpdate(update);
        },
        (error) => {
          console.error(`❌ Real-time error for claim ${record.claimId}:`, error);
          
          // If error is not retryable and fallback is enabled, switch to polling
          if (!error.retryable && this.config.enableFallback) {
            console.log(`🔄 Falling back to polling for claim ${record.claimId}`);
            
            // Update mode
            record.mode = 'fallback';
            
            // Unsubscribe from real-time
            if (record.subscription) {
              record.subscription.unsubscribe();
              record.subscription = undefined;
            }
            
            // Start polling
            this.startPollingSync(record);
          } else {
            // Pass error to caller
            record.onError(new Error(error.message));
          }
        }
      );
      
      // Store subscription
      record.subscription = subscription;
      
      console.log(`✅ Real-time sync started for claim: ${record.claimId}`);
    } catch (error) {
      console.error(`❌ Failed to start real-time sync for claim ${record.claimId}:`, error);
      
      // If fallback is enabled, switch to polling
      if (this.config.enableFallback) {
        console.log(`🔄 Falling back to polling for claim ${record.claimId}`);
        record.mode = 'fallback';
        this.startPollingSync(record);
      } else {
        record.onError(error instanceof Error ? error : new Error('Failed to start real-time sync'));
      }
    }
  }

  /**
   * Start real-time sync for all user claims
   * 
   * @param userId - ID of the user
   * @param record - Sync record
   * @private
   */
  private startRealtimeUserSync(userId: string, record: ClaimSyncRecord): void {
    console.log(`📡 Starting real-time sync for user claims: ${userId}`);
    
    try {
      const subscription = this.subscriptionManager.subscribeToUserClaims(
        userId,
        (update) => {
          console.log(`🔄 Real-time update for user claim:`, update);
          record.onUpdate(update);
        },
        (error) => {
          console.error(`❌ Real-time error for user ${userId}:`, error);
          
          // If error is not retryable and fallback is enabled, switch to polling
          if (!error.retryable && this.config.enableFallback) {
            console.log(`🔄 Falling back to polling for user ${userId}`);
            
            // Update mode
            record.mode = 'fallback';
            
            // Unsubscribe from real-time
            if (record.subscription) {
              record.subscription.unsubscribe();
              record.subscription = undefined;
            }
            
            // Start polling for user claims
            this.startPollingUserSync(userId, record);
          } else {
            // Pass error to caller
            record.onError(new Error(error.message));
          }
        }
      );
      
      // Store subscription
      record.subscription = subscription;
      
      console.log(`✅ Real-time sync started for user claims: ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to start real-time sync for user ${userId}:`, error);
      
      // If fallback is enabled, switch to polling
      if (this.config.enableFallback) {
        console.log(`🔄 Falling back to polling for user ${userId}`);
        record.mode = 'fallback';
        this.startPollingUserSync(userId, record);
      } else {
        record.onError(error instanceof Error ? error : new Error('Failed to start real-time sync'));
      }
    }
  }

  /**
   * Start polling sync for a claim
   * 
   * Periodically fetches claim data from server and checks for updates.
   * Used for legacy claims or as fallback when real-time fails.
   * 
   * @param record - Sync record
   * @private
   */
  private startPollingSync(record: ClaimSyncRecord): void {
    console.log(`⏱️ Starting polling sync for claim: ${record.claimId} (interval: ${this.config.pollingInterval}ms)`);
    
    // Poll immediately
    this.pollClaim(record);
    
    // Set up polling interval
    const interval = setInterval(() => {
      this.pollClaim(record);
    }, this.config.pollingInterval);
    
    // Store interval
    record.pollingInterval = interval;
    
    console.log(`✅ Polling sync started for claim: ${record.claimId}`);
  }

  /**
   * Start polling sync for all user claims
   * 
   * @param userId - ID of the user
   * @param record - Sync record
   * @private
   */
  private startPollingUserSync(userId: string, record: ClaimSyncRecord): void {
    console.log(`⏱️ Starting polling sync for user claims: ${userId} (interval: ${this.config.pollingInterval}ms)`);
    
    // Poll immediately
    this.pollUserClaims(userId, record);
    
    // Set up polling interval
    const interval = setInterval(() => {
      this.pollUserClaims(userId, record);
    }, this.config.pollingInterval);
    
    // Store interval
    record.pollingInterval = interval;
    
    console.log(`✅ Polling sync started for user claims: ${userId}`);
  }

  /**
   * Poll a single claim for updates
   * 
   * Fetches claim data from server and compares with cached version.
   * If status changed, invokes update callback.
   * 
   * @param record - Sync record
   * @private
   */
  private async pollClaim(record: ClaimSyncRecord): Promise<void> {
    try {
      console.log(`⏱️ Polling claim: ${record.claimId}`);
      
      // Get cached claim for comparison
      const cachedClaim = stateCache.getClaim(record.claimId);
      
      // Fetch latest claim data from server
      const latestClaim = await ClaimService.getClaimWithDetails(record.claimId);
      
      if (!latestClaim) {
        console.warn(`⚠️ Claim ${record.claimId} not found on server`);
        return;
      }
      
      // Check if status changed
      const statusChanged = !cachedClaim || cachedClaim.status !== latestClaim.status;
      
      if (statusChanged) {
        console.log(`🔄 Claim ${record.claimId} status changed: ${cachedClaim?.status} -> ${latestClaim.status}`);
        
        // Update cache
        stateCache.updateClaim(record.claimId, {
          claimId: latestClaim.id,
          userId: latestClaim.user_id,
          status: latestClaim.status,
          claimToken: latestClaim.token,
          promotionId: latestClaim.offer_id,
          createdAt: latestClaim.created_at,
          updatedAt: latestClaim.updated_at,
          lastSyncedAt: new Date().toISOString(),
        });
        
        // Invoke update callback
        const update: ClaimUpdate = {
          claimId: latestClaim.id,
          status: latestClaim.status,
          updatedAt: latestClaim.updated_at,
          redeemedAt: latestClaim.redeemed_at,
          redeemedByUserId: latestClaim.redeemed_by_user_id,
        };
        
        record.onUpdate(update);
      }
      
      record.lastPollTimestamp = Date.now();
    } catch (error) {
      console.error(`❌ Error polling claim ${record.claimId}:`, error);
      record.onError(error instanceof Error ? error : new Error('Failed to poll claim'));
    }
  }

  /**
   * Poll all user claims for updates
   * 
   * @param userId - ID of the user
   * @param record - Sync record
   * @private
   */
  private async pollUserClaims(userId: string, record: ClaimSyncRecord): Promise<void> {
    try {
      console.log(`⏱️ Polling user claims: ${userId}`);
      
      // Get cached claims for comparison
      const cachedClaims = stateCache.getUserClaims(userId);
      const cachedClaimsMap = new Map(
        cachedClaims.map(claim => [claim.claimId, claim])
      );
      
      // Fetch latest claims from server
      const result = await ClaimService.getUserClaimsWithDetails(userId);
      
      // Check each claim for status changes
      result.claims.forEach((latestClaim) => {
        const cachedClaim = cachedClaimsMap.get(latestClaim.id);
        const statusChanged = !cachedClaim || cachedClaim.status !== latestClaim.status;
        
        if (statusChanged) {
          console.log(`🔄 User claim ${latestClaim.id} status changed: ${cachedClaim?.status} -> ${latestClaim.status}`);
          
          // Update cache
          stateCache.updateClaim(latestClaim.id, {
            claimId: latestClaim.id,
            userId: latestClaim.user_id,
            status: latestClaim.status,
            claimToken: latestClaim.token,
            promotionId: latestClaim.offer_id,
            createdAt: latestClaim.created_at,
            updatedAt: latestClaim.updated_at,
            lastSyncedAt: new Date().toISOString(),
          });
          
          // Invoke update callback
          const update: ClaimUpdate = {
            claimId: latestClaim.id,
            status: latestClaim.status,
            updatedAt: latestClaim.updated_at,
            redeemedAt: latestClaim.redeemed_at,
            redeemedByUserId: latestClaim.redeemed_by_user_id,
          };
          
          record.onUpdate(update);
        }
      });
      
      record.lastPollTimestamp = Date.now();
    } catch (error) {
      console.error(`❌ Error polling user claims ${userId}:`, error);
      record.onError(error instanceof Error ? error : new Error('Failed to poll user claims'));
    }
  }

  /**
   * Unsubscribe from claim sync
   * 
   * Stops real-time subscription or polling interval and cleans up resources.
   * 
   * @param claimId - ID of the claim (or sync ID for user claims)
   * @private
   */
  private unsubscribe(claimId: string): void {
    const record = this.syncRecords.get(claimId);
    
    if (!record) {
      console.warn(`⚠️ No sync record found for: ${claimId}`);
      return;
    }
    
    console.log(`🔌 Unsubscribing from sync: ${claimId} (mode: ${record.mode})`);
    
    // Clean up based on mode
    if (record.subscription) {
      record.subscription.unsubscribe();
    }
    
    if (record.pollingInterval) {
      clearInterval(record.pollingInterval);
    }
    
    // Remove from registry
    this.syncRecords.delete(claimId);
    
    console.log(`✅ Unsubscribed from sync: ${claimId}`);
  }

  /**
   * Get sync mode for a claim
   * 
   * Returns the current sync mode being used for a claim.
   * Useful for debugging and monitoring.
   * 
   * @param claimId - ID of the claim
   * @returns Sync mode or null if not syncing
   * 
   * @example
   * ```typescript
   * const mode = hybridSync.getSyncMode('claim-123');
   * console.log(`Claim is using ${mode} sync`);
   * ```
   */
  getSyncMode(claimId: string): SyncMode | null {
    const record = this.syncRecords.get(claimId);
    return record ? record.mode : null;
  }

  /**
   * Get sync statistics
   * 
   * Returns statistics about active syncs for monitoring and debugging.
   * 
   * @returns Object with sync statistics
   * 
   * @example
   * ```typescript
   * const stats = hybridSync.getSyncStats();
   * console.log(`Active syncs: ${stats.totalSyncs}`);
   * console.log(`Real-time: ${stats.realtimeCount}, Polling: ${stats.pollingCount}`);
   * ```
   */
  getSyncStats(): {
    totalSyncs: number;
    realtimeCount: number;
    pollingCount: number;
    fallbackCount: number;
    syncs: Array<{
      claimId: string;
      mode: SyncMode;
      lastPollTimestamp?: number;
    }>;
  } {
    const syncs = Array.from(this.syncRecords.values());
    
    return {
      totalSyncs: syncs.length,
      realtimeCount: syncs.filter(s => s.mode === 'realtime').length,
      pollingCount: syncs.filter(s => s.mode === 'polling').length,
      fallbackCount: syncs.filter(s => s.mode === 'fallback').length,
      syncs: syncs.map(s => ({
        claimId: s.claimId,
        mode: s.mode,
        lastPollTimestamp: s.lastPollTimestamp,
      })),
    };
  }

  /**
   * Clean up all syncs
   * 
   * Unsubscribes from all active syncs and clears the registry.
   * Useful for testing or when user logs out.
   * 
   * @example
   * ```typescript
   * // On logout
   * hybridSync.cleanup();
   * ```
   */
  cleanup(): void {
    console.log('🧹 Cleaning up all hybrid syncs...');
    
    const syncIds = Array.from(this.syncRecords.keys());
    syncIds.forEach(id => this.unsubscribe(id));
    
    console.log('✅ All hybrid syncs cleaned up');
  }
}

/**
 * Get the singleton instance of HybridClaimSync
 * 
 * Convenience function for accessing the HybridClaimSync singleton.
 * 
 * @returns The singleton instance
 * 
 * @example
 * ```typescript
 * import { getHybridClaimSync } from './services/HybridClaimSync';
 * 
 * const hybridSync = getHybridClaimSync();
 * const unsubscribe = hybridSync.subscribeToClaimUpdates(...);
 * ```
 */
export function getHybridClaimSync(): HybridClaimSync {
  return HybridClaimSync.getInstance();
}
