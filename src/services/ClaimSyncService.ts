/**
 * Claim Sync Service
 * 
 * Coordinates network state monitoring with claim synchronization.
 * Integrates StateCache, SubscriptionManager, FeedbackManager, and network monitoring
 * to provide seamless offline-to-online synchronization for claims.
 * 
 * Features:
 * - Monitors network connectivity changes
 * - Syncs claims when device comes back online
 * - Fetches latest claim status on app launch
 * - Displays notifications for missed status updates
 * - Manages offline indicator display
 * 
 * Requirements: 5.1, 5.2, 5.3
 * 
 * @module ClaimSyncService
 * @category Services
 */

import NetInfo from '@react-native-community/netinfo';
import { stateCache } from '../utils/cache/StateCache';
import { SubscriptionManager } from './SubscriptionManager';
import { FeedbackManager } from './FeedbackManager';
import { ClaimService } from './api/flashOfferClaims';
import { ClaimErrorHandler } from '../utils/errors/ClaimErrorHandler';
import type { CachedClaim } from '../utils/cache/StateCache';

/**
 * Sync result containing information about what was synced
 */
export interface SyncResult {
  /** Number of claims synced */
  claimsSynced: number;
  /** Number of claims with status changes */
  statusChanges: number;
  /** Claims that changed while offline */
  changedClaims: CachedClaim[];
  /** Whether sync was successful */
  success: boolean;
  /** Error message if sync failed */
  error?: string;
}

/**
 * Claim Sync Service
 * 
 * Singleton service that coordinates network state monitoring with claim synchronization.
 * Automatically syncs claims when the device comes back online and on app launch.
 * 
 * Design Philosophy:
 * - Automatic sync on network reconnection
 * - Sync on app launch to ensure fresh data
 * - Display notifications for missed updates
 * - Coordinate with FeedbackManager for user feedback
 * - Integrate with SubscriptionManager for real-time updates
 * 
 * @example
 * ```typescript
 * // Initialize on app launch
 * const syncService = ClaimSyncService.getInstance();
 * await syncService.initialize('user-123');
 * 
 * // Service automatically handles:
 * // - Network state changes
 * // - Offline-to-online sync
 * // - Missed update notifications
 * 
 * // Manually trigger sync if needed
 * const result = await syncService.syncClaims('user-123');
 * console.log(`Synced ${result.claimsSynced} claims`);
 * 
 * // Clean up on logout
 * syncService.cleanup();
 * ```
 */
export class ClaimSyncService {
  private static instance: ClaimSyncService | null = null;
  
  /** Network state listener cleanup function */
  private networkUnsubscribe: (() => void) | null = null;
  
  /** Current user ID */
  private currentUserId: string | null = null;
  
  /** Whether the device is currently online */
  private isOnline: boolean = true;
  
  /** Whether initial sync has been performed */
  private initialSyncDone: boolean = false;
  
  /** Timestamp of last successful sync */
  private lastSyncTimestamp: number | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    console.log('🔄 ClaimSyncService initialized');
  }

  /**
   * Get the singleton instance of ClaimSyncService
   * 
   * @returns The singleton instance
   */
  static getInstance(): ClaimSyncService {
    if (!ClaimSyncService.instance) {
      ClaimSyncService.instance = new ClaimSyncService();
    }
    return ClaimSyncService.instance;
  }

  /**
   * Initialize the sync service
   * 
   * Sets up network state monitoring and performs initial sync on app launch.
   * Should be called once when the app starts and user is authenticated.
   * 
   * @param userId - ID of the authenticated user
   * 
   * @example
   * ```typescript
   * // In App.tsx or AuthContext after user logs in
   * useEffect(() => {
   *   if (user) {
   *     ClaimSyncService.getInstance().initialize(user.id);
   *   }
   * }, [user]);
   * ```
   */
  async initialize(userId: string): Promise<void> {
    console.log(`🔄 Initializing ClaimSyncService for user: ${userId}`);
    
    this.currentUserId = userId;
    
    // Initialize StateCache
    await stateCache.initialize();
    
    // Set up network state monitoring
    this.setupNetworkMonitoring();
    
    // Perform initial sync on app launch (Requirement 5.2)
    await this.performInitialSync(userId);
    
    console.log('✅ ClaimSyncService initialized');
  }

  /**
   * Set up network state monitoring
   * 
   * Listens for network connectivity changes and triggers sync when
   * device comes back online.
   * 
   * @private
   */
  private setupNetworkMonitoring(): void {
    console.log('📡 Setting up network state monitoring');
    
    // Subscribe to network state changes
    this.networkUnsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      console.log(`📡 Network state changed: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      // Show/hide offline indicator
      const feedbackManager = FeedbackManager.getInstance();
      if (!this.isOnline) {
        feedbackManager.showConnectionWarning();
      } else {
        feedbackManager.hideConnectionWarning();
        
        // Trigger sync when coming back online (Requirement 5.1)
        if (wasOffline && this.currentUserId) {
          console.log('🔄 Device came back online, triggering sync...');
          this.syncClaims(this.currentUserId).catch((error) => {
            console.error('Error syncing claims after reconnection:', error);
          });
        }
      }
    });
  }

  /**
   * Perform initial sync on app launch
   * 
   * Fetches latest claim status for all active claims when the app starts.
   * Displays notifications for any missed status updates.
   * 
   * Requirement 5.2: Fetch latest claim status for all active claims on app launch
   * 
   * @param userId - ID of the user
   * @private
   */
  private async performInitialSync(userId: string): Promise<void> {
    if (this.initialSyncDone) {
      console.log('⏭️ Initial sync already performed');
      return;
    }
    
    console.log('🔄 Performing initial sync on app launch...');
    
    try {
      const result = await this.syncClaims(userId);
      
      if (result.success) {
        console.log(`✅ Initial sync complete: ${result.claimsSynced} claims synced`);
        
        // Display notifications for missed updates (Requirement 5.3)
        if (result.statusChanges > 0) {
          this.displayMissedUpdateNotifications(result.changedClaims);
        }
      } else {
        console.error('❌ Initial sync failed:', result.error);
      }
      
      this.initialSyncDone = true;
    } catch (error) {
      console.error('Error during initial sync:', error);
      this.initialSyncDone = true; // Mark as done even on error to prevent retry loops
    }
  }

  /**
   * Sync claims with server
   * 
   * Fetches latest claim data from server and updates local cache.
   * Identifies claims that changed while offline and returns them.
   * 
   * Requirements: 5.1, 5.2, 5.4
   * 
   * @param userId - ID of the user whose claims to sync
   * @returns Sync result with information about what was synced
   * 
   * @example
   * ```typescript
   * const result = await syncService.syncClaims('user-123');
   * 
   * if (result.success) {
   *   console.log(`Synced ${result.claimsSynced} claims`);
   *   console.log(`${result.statusChanges} claims changed`);
   * }
   * ```
   */
  async syncClaims(userId: string): Promise<SyncResult> {
    console.log(`🔄 Syncing claims for user: ${userId}`);
    
    try {
      // Get cached claims before sync to detect changes
      const cachedClaims = stateCache.getUserClaims(userId);
      const cachedClaimsMap = new Map(
        cachedClaims.map(claim => [claim.claimId, claim])
      );
      
      // Fetch latest claims from server
      const fetchClaimsFn = async (uid: string) => {
        const result = await ClaimService.getUserClaimsWithDetails(uid);
        
        // Transform to CachedClaim format
        return result.claims.map(claim => ({
          claimId: claim.id,
          userId: claim.user_id,
          status: claim.status,
          claimToken: claim.token, // Database field is 'token', not 'claim_token'
          promotionId: claim.offer_id, // Database field is 'offer_id', not 'promotion_id'
          createdAt: claim.created_at,
          updatedAt: claim.updated_at,
          lastSyncedAt: new Date().toISOString(),
        }));
      };
      
      // Sync with server using StateCache
      await stateCache.syncWithServer(userId, fetchClaimsFn);
      
      // Get updated claims after sync
      const updatedClaims = stateCache.getUserClaims(userId);
      
      // Identify claims that changed (Requirement 5.4: display final status)
      const changedClaims: CachedClaim[] = [];
      updatedClaims.forEach(updatedClaim => {
        const cachedClaim = cachedClaimsMap.get(updatedClaim.claimId);
        
        // Check if status changed
        if (cachedClaim && cachedClaim.status !== updatedClaim.status) {
          changedClaims.push(updatedClaim);
        }
      });
      
      this.lastSyncTimestamp = Date.now();
      
      const result: SyncResult = {
        claimsSynced: updatedClaims.length,
        statusChanges: changedClaims.length,
        changedClaims,
        success: true,
      };
      
      console.log(`✅ Sync complete: ${result.claimsSynced} claims, ${result.statusChanges} changes`);
      
      return result;
    } catch (error) {
      console.error('Error syncing claims:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        claimsSynced: 0,
        statusChanges: 0,
        changedClaims: [],
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Display notifications for missed status updates
   * 
   * Shows user-friendly notifications for claims that changed while offline.
   * Uses FeedbackManager to display appropriate feedback based on status.
   * Uses ClaimErrorHandler for consistent error messaging (Requirement 9.5).
   * 
   * Requirement 5.3: Display notifications for missed status updates
   * Requirement 9.2: Add actionable guidance to rejection messages
   * Requirement 9.3: Implement expiration handling with appropriate messaging
   * 
   * @param changedClaims - Claims that changed while offline
   * @private
   */
  private displayMissedUpdateNotifications(changedClaims: CachedClaim[]): void {
    console.log(`📢 Displaying notifications for ${changedClaims.length} missed updates`);
    
    const feedbackManager = FeedbackManager.getInstance();
    
    changedClaims.forEach(claim => {
      // Display appropriate feedback based on status
      if (claim.status === 'redeemed') {
        feedbackManager.showAcceptedFeedback(claim.claimId);
      } else if (claim.status === 'expired') {
        // Show expired notification with appropriate messaging (Requirement 9.3)
        feedbackManager.showExpiredFeedback(claim.claimId);
      } else if (claim.status === 'rejected') {
        // Show rejected notification with actionable guidance (Requirement 9.2)
        feedbackManager.showRejectedFeedback(
          claim.claimId,
          claim.rejectionReason || 'Unknown reason'
        );
      }
    });
  }

  /**
   * Get current online/offline state
   * 
   * @returns True if device is online, false if offline
   * 
   * @example
   * ```typescript
   * const isOnline = syncService.isDeviceOnline();
   * 
   * if (!isOnline) {
   *   showOfflineMessage();
   * }
   * ```
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get timestamp of last successful sync
   * 
   * @returns Timestamp in milliseconds, or null if never synced
   * 
   * @example
   * ```typescript
   * const lastSync = syncService.getLastSyncTimestamp();
   * 
   * if (lastSync) {
   *   const minutesAgo = Math.floor((Date.now() - lastSync) / 60000);
   *   console.log(`Last synced ${minutesAgo} minutes ago`);
   * }
   * ```
   */
  getLastSyncTimestamp(): number | null {
    return this.lastSyncTimestamp;
  }

  /**
   * Manually trigger a sync
   * 
   * Useful for pull-to-refresh or manual refresh buttons.
   * 
   * @returns Sync result
   * 
   * @example
   * ```typescript
   * // In a pull-to-refresh handler
   * const handleRefresh = async () => {
   *   setRefreshing(true);
   *   const result = await syncService.manualSync();
   *   setRefreshing(false);
   *   
   *   if (result.success) {
   *     showSuccessMessage('Claims updated');
   *   }
   * };
   * ```
   */
  async manualSync(): Promise<SyncResult> {
    if (!this.currentUserId) {
      console.warn('⚠️ Cannot sync: no user ID set');
      return {
        claimsSynced: 0,
        statusChanges: 0,
        changedClaims: [],
        success: false,
        error: 'No user ID set',
      };
    }
    
    console.log('🔄 Manual sync triggered');
    return this.syncClaims(this.currentUserId);
  }

  /**
   * Clean up resources
   * 
   * Unsubscribes from network monitoring and resets state.
   * Should be called when user logs out or app is shutting down.
   * 
   * @example
   * ```typescript
   * // In logout handler
   * const handleLogout = () => {
   *   ClaimSyncService.getInstance().cleanup();
   *   // ... other logout logic
   * };
   * ```
   */
  cleanup(): void {
    console.log('🧹 Cleaning up ClaimSyncService');
    
    // Unsubscribe from network monitoring
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
    
    // Reset state
    this.currentUserId = null;
    this.initialSyncDone = false;
    this.lastSyncTimestamp = null;
    
    console.log('✅ ClaimSyncService cleaned up');
  }
}

/**
 * Get the singleton instance of ClaimSyncService
 * 
 * Convenience function for accessing the ClaimSyncService singleton.
 * 
 * @returns The singleton instance
 * 
 * @example
 * ```typescript
 * import { getClaimSyncService } from './services/ClaimSyncService';
 * 
 * const syncService = getClaimSyncService();
 * await syncService.initialize('user-123');
 * ```
 */
export function getClaimSyncService(): ClaimSyncService {
  return ClaimSyncService.getInstance();
}
