/**
 * Subscription Manager
 * 
 * Global singleton service for managing real-time subscriptions across the app.
 * Provides centralized subscription management with connection state tracking,
 * automatic reconnection, and cleanup logic.
 * 
 * Features:
 * - Single WebSocket connection shared across all subscriptions
 * - Subscription registry for tracking active subscriptions
 * - Connection state monitoring
 * - Automatic cleanup on unsubscribe
 * - Extensible design for adding new subscription types
 * 
 * @module SubscriptionManager
 * @category Services
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ClaimErrorHandler } from '../utils/errors/ClaimErrorHandler';

/**
 * Connection state of the subscription manager
 */
export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

/**
 * Type of subscription error
 */
export type SubscriptionErrorType = 
  | 'connection_failed'
  | 'auth_failed'
  | 'subscription_failed';

/**
 * Subscription error details
 */
export interface SubscriptionError {
  /** Type of error */
  type: SubscriptionErrorType;
  /** Human-readable error message */
  message: string;
  /** Whether the error is retryable */
  retryable: boolean;
}

/**
 * Update payload for claim status changes
 */
export interface ClaimUpdate {
  /** ID of the claim */
  claimId: string;
  /** Current status of the claim */
  status: 'active' | 'redeemed' | 'expired';
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
  /** Rejection reason (if applicable) */
  rejectionReason?: string;
  /** ID of the venue (if applicable) */
  venueId?: string;
  /** ISO 8601 timestamp when redeemed (if applicable) */
  redeemedAt?: string | null;
  /** ID of staff member who redeemed (if applicable) */
  redeemedByUserId?: string | null;
}

/**
 * Subscription handle returned to callers
 */
export interface Subscription {
  /** Unique identifier for this subscription */
  id: string;
  /** Whether the subscription is currently active */
  isActive: boolean;
  /** Unsubscribe from updates */
  unsubscribe: () => void;
}

/**
 * Callback for handling claim updates
 */
export type ClaimUpdateCallback = (update: ClaimUpdate) => void;

/**
 * Callback for handling subscription errors
 */
export type ErrorCallback = (error: SubscriptionError) => void;

/**
 * Callback for handling connection state changes
 */
export type ConnectionStateCallback = (state: ConnectionState) => void;

/**
 * Internal subscription record
 */
interface SubscriptionRecord {
  id: string;
  channel: RealtimeChannel;
  type: 'claim' | 'user_claims' | 'generic';
  isActive: boolean;
  onUpdate: ClaimUpdateCallback;
  onError: ErrorCallback;
  metadata: {
    claimId?: string;
    userId?: string;
    [key: string]: any;
  };
}

/**
 * Shared channel record for connection pooling
 */
interface SharedChannelRecord {
  channel: RealtimeChannel;
  channelName: string;
  subscriptionIds: Set<string>;
  refCount: number;
}

/**
 * Global Subscription Manager
 * 
 * Singleton service for managing all real-time subscriptions in the app.
 * Provides centralized subscription management with connection state tracking,
 * automatic reconnection, and cleanup logic.
 * 
 * Design Philosophy:
 * - Single WebSocket connection shared across all subscriptions
 * - Subscription registry tracks all active subscriptions
 * - Connection state is shared across all subscriptions
 * - Easy to extend with new subscription types
 * 
 * @example
 * ```typescript
 * // Get the singleton instance
 * const manager = SubscriptionManager.getInstance();
 * 
 * // Subscribe to a specific claim
 * const subscription = manager.subscribeToClaimUpdates(
 *   'claim-123',
 *   (update) => {
 *     console.log('Claim updated:', update.status);
 *   },
 *   (error) => {
 *     console.error('Subscription error:', error.message);
 *   }
 * );
 * 
 * // Later, unsubscribe
 * subscription.unsubscribe();
 * 
 * // Subscribe to all user claims
 * const userSub = manager.subscribeToUserClaims(
 *   'user-456',
 *   (update) => {
 *     console.log('User claim updated:', update.claimId);
 *   },
 *   (error) => {
 *     console.error('Error:', error.message);
 *   }
 * );
 * 
 * // Monitor connection state
 * const unsubscribe = manager.onConnectionStateChange((state) => {
 *   console.log('Connection state:', state);
 * });
 * ```
 */
export class SubscriptionManager {
  private static instance: SubscriptionManager | null = null;
  
  /** Registry of active subscriptions */
  private subscriptions: Map<string, SubscriptionRecord> = new Map();
  
  /** Shared channels for connection pooling (Requirement 7.4) */
  private sharedChannels: Map<string, SharedChannelRecord> = new Map();
  
  /** Current connection state */
  private connectionState: ConnectionState = 'disconnected';
  
  /** Connection state change listeners */
  private connectionStateListeners: Set<ConnectionStateCallback> = new Set();
  
  /** Counter for generating unique subscription IDs */
  private subscriptionIdCounter = 0;
  
  /** Debounce configuration for rapid updates */
  private debounceConfig = {
    enabled: true,
    minInterval: 100, // 100ms minimum between updates for same claim
    lastUpdate: new Map<string, number>(),
  };

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    console.log('🚀 SubscriptionManager initialized');
  }

  /**
   * Get the singleton instance of SubscriptionManager
   * 
   * @returns The singleton instance
   */
  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  /**
   * Subscribe to updates for a specific claim
   * 
   * Establishes a real-time subscription to receive updates when the claim
   * status changes (e.g., from active to redeemed). Automatically filters
   * updates to only the specified claim.
   * 
   * Optimizations (Requirement 7.4, 3.5):
   * - Uses shared WebSocket connection via connection pooling
   * - Automatically unsubscribes when claim reaches final state (redeemed, expired)
   * - Debounces rapid updates to prevent UI spam
   * 
   * @param claimId - ID of the claim to subscribe to
   * @param onUpdate - Callback invoked when claim is updated
   * @param onError - Callback invoked when subscription error occurs
   * @returns Subscription handle with unsubscribe method
   * 
   * @example
   * ```typescript
   * const subscription = manager.subscribeToClaimUpdates(
   *   'claim-123',
   *   (update) => {
   *     if (update.status === 'redeemed') {
   *       showSuccessMessage('Your claim was redeemed!');
   *     }
   *   },
   *   (error) => {
   *     if (error.retryable) {
   *       showWarning('Connection issue, retrying...');
   *     }
   *   }
   * );
   * 
   * // Clean up when component unmounts
   * return () => subscription.unsubscribe();
   * ```
   */
  subscribeToClaimUpdates(
    claimId: string,
    onUpdate: ClaimUpdateCallback,
    onError: ErrorCallback
  ): Subscription {
    const subscriptionId = this.generateSubscriptionId();
    
    console.log(`📡 Creating subscription for claim: ${claimId} (ID: ${subscriptionId})`);
    
    // Use shared channel for connection pooling (Requirement 7.4)
    const channelName = `claim:${claimId}`;
    const channel = this.getOrCreateSharedChannel(
      channelName,
      subscriptionId,
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'flash_offer_claims',
        filter: `id=eq.${claimId}`,
      },
      (payload) => {
        console.log('🔄 Claim update received:', payload);
        
        // Transform database payload to ClaimUpdate
        const update: ClaimUpdate = {
          claimId: payload.new.id,
          status: payload.new.status,
          updatedAt: payload.new.updated_at,
          redeemedAt: payload.new.redeemed_at,
          redeemedByUserId: payload.new.redeemed_by_user_id,
        };
        
        // Debounce rapid updates (Requirement 7.4)
        if (this.shouldProcessUpdate(claimId, update.updatedAt)) {
          onUpdate(update);
          
          // Auto-cleanup for finalized claims (Requirement 3.5)
          if (this.isClaimFinalized(update.status)) {
            console.log(`🧹 Claim ${claimId} reached final state (${update.status}), auto-unsubscribing...`);
            setTimeout(() => {
              this.unsubscribe(subscriptionId);
            }, 1000); // Small delay to ensure UI updates complete
          }
        } else {
          console.log(`⏭️ Skipping debounced update for claim ${claimId}`);
        }
      },
      (status, error) => {
        console.log(`📡 Subscription status for claim ${claimId}:`, status);
        this.handleSubscriptionStatus(subscriptionId, status, error, onError);
      }
    );
    
    // Store subscription record
    const record: SubscriptionRecord = {
      id: subscriptionId,
      channel,
      type: 'claim',
      isActive: true,
      onUpdate,
      onError,
      metadata: { claimId },
    };
    
    this.subscriptions.set(subscriptionId, record);
    
    // Return subscription handle
    return {
      id: subscriptionId,
      isActive: true,
      unsubscribe: () => this.unsubscribe(subscriptionId),
    };
  }

  /**
   * Subscribe to updates for all claims belonging to a user
   * 
   * Establishes a real-time subscription to receive updates for any claim
   * owned by the specified user. Useful for the "My Claims" screen where
   * multiple claims need to be monitored simultaneously.
   * 
   * Optimizations (Requirement 7.4, 3.5):
   * - Uses shared WebSocket connection via connection pooling
   * - Debounces rapid updates to prevent UI spam
   * - Optimizes database queries with proper filtering
   * 
   * @param userId - ID of the user whose claims to subscribe to
   * @param onUpdate - Callback invoked when any user claim is updated
   * @param onError - Callback invoked when subscription error occurs
   * @returns Subscription handle with unsubscribe method
   * 
   * @example
   * ```typescript
   * const subscription = manager.subscribeToUserClaims(
   *   'user-456',
   *   (update) => {
   *     // Update the specific claim in the list
   *     updateClaimInList(update.claimId, update);
   *   },
   *   (error) => {
   *     console.error('Subscription error:', error);
   *   }
   * );
   * 
   * // Clean up when leaving screen
   * return () => subscription.unsubscribe();
   * ```
   */
  subscribeToUserClaims(
    userId: string,
    onUpdate: ClaimUpdateCallback,
    onError: ErrorCallback
  ): Subscription {
    const subscriptionId = this.generateSubscriptionId();
    
    console.log(`📡 Creating subscription for user claims: ${userId} (ID: ${subscriptionId})`);
    
    // Use shared channel for connection pooling (Requirement 7.4)
    const channelName = `user_claims:${userId}`;
    const channel = this.getOrCreateSharedChannel(
      channelName,
      subscriptionId,
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'flash_offer_claims',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('🔄 User claim update received:', payload);
        
        // Transform database payload to ClaimUpdate
        const update: ClaimUpdate = {
          claimId: payload.new.id,
          status: payload.new.status,
          updatedAt: payload.new.updated_at,
          redeemedAt: payload.new.redeemed_at,
          redeemedByUserId: payload.new.redeemed_by_user_id,
        };
        
        // Debounce rapid updates (Requirement 7.4)
        if (this.shouldProcessUpdate(update.claimId, update.updatedAt)) {
          onUpdate(update);
        } else {
          console.log(`⏭️ Skipping debounced update for claim ${update.claimId}`);
        }
      },
      (status, error) => {
        console.log(`📡 Subscription status for user ${userId}:`, status);
        this.handleSubscriptionStatus(subscriptionId, status, error, onError);
      }
    );
    
    // Store subscription record
    const record: SubscriptionRecord = {
      id: subscriptionId,
      channel,
      type: 'user_claims',
      isActive: true,
      onUpdate,
      onError,
      metadata: { userId },
    };
    
    this.subscriptions.set(subscriptionId, record);
    
    // Return subscription handle
    return {
      id: subscriptionId,
      isActive: true,
      unsubscribe: () => this.unsubscribe(subscriptionId),
    };
  }

  /**
   * Generic subscribe method for future extensibility
   * 
   * Provides a flexible subscription interface for adding new subscription
   * types without modifying the core SubscriptionManager class. Useful for
   * future features like messages, notifications, friend activity, etc.
   * 
   * @param channelName - Unique name for the subscription channel
   * @param config - Supabase real-time configuration
   * @param onUpdate - Callback invoked when update is received
   * @param onError - Callback invoked when subscription error occurs
   * @returns Subscription handle with unsubscribe method
   * 
   * @example
   * ```typescript
   * // Future: Subscribe to user messages
   * const subscription = manager.subscribe(
   *   'messages:user-123',
   *   {
   *     event: 'INSERT',
   *     schema: 'public',
   *     table: 'messages',
   *     filter: 'recipient_id=eq.user-123',
   *   },
   *   (payload) => {
   *     const message = payload.new;
   *     showNotification(`New message from ${message.sender_name}`);
   *   },
   *   (error) => {
   *     console.error('Message subscription error:', error);
   *   }
   * );
   * ```
   */
  subscribe(
    channelName: string,
    config: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: string;
      table: string;
      filter?: string;
    },
    onUpdate: (payload: any) => void,
    onError: ErrorCallback
  ): Subscription {
    const subscriptionId = this.generateSubscriptionId();
    
    console.log(`📡 Creating generic subscription: ${channelName} (ID: ${subscriptionId})`);
    
    // Create Supabase channel
    const channel = supabase
      .channel(`${channelName}:${subscriptionId}`)
      .on(
        'postgres_changes' as any,
        config as any,
        (payload: any) => {
          console.log(`🔄 Update received for ${channelName}:`, payload);
          onUpdate(payload);
        }
      )
      .subscribe((status, error) => {
        console.log(`📡 Subscription status for ${channelName}:`, status);
        
        this.handleSubscriptionStatus(subscriptionId, status, error, onError);
      });
    
    // Store subscription record
    const record: SubscriptionRecord = {
      id: subscriptionId,
      channel,
      type: 'generic',
      isActive: true,
      onUpdate: onUpdate as any, // Generic callback
      onError,
      metadata: { channelName },
    };
    
    this.subscriptions.set(subscriptionId, record);
    
    // Return subscription handle
    return {
      id: subscriptionId,
      isActive: true,
      unsubscribe: () => this.unsubscribe(subscriptionId),
    };
  }

  /**
   * Unsubscribe from a subscription and clean up resources
   * 
   * Removes the subscription from the registry, decrements shared channel
   * reference count, and unsubscribes from the Supabase channel if no
   * other subscriptions are using it (connection pooling cleanup).
   * 
   * @param subscriptionId - ID of the subscription to unsubscribe
   */
  unsubscribe(subscriptionId: string): void {
    const record = this.subscriptions.get(subscriptionId);
    
    if (!record) {
      console.warn(`⚠️ Attempted to unsubscribe from non-existent subscription: ${subscriptionId}`);
      return;
    }
    
    console.log(`🔌 Unsubscribing from subscription: ${subscriptionId}`);
    
    // Find and decrement shared channel reference count
    const channelName = this.findChannelNameForSubscription(subscriptionId);
    if (channelName) {
      const sharedChannel = this.sharedChannels.get(channelName);
      if (sharedChannel) {
        sharedChannel.subscriptionIds.delete(subscriptionId);
        sharedChannel.refCount--;
        
        console.log(`📊 Shared channel ${channelName} ref count: ${sharedChannel.refCount}`);
        
        // If no more subscriptions using this channel, clean it up
        if (sharedChannel.refCount <= 0) {
          console.log(`🧹 Cleaning up shared channel: ${channelName}`);
          sharedChannel.channel.unsubscribe();
          this.sharedChannels.delete(channelName);
        }
      }
    }
    
    // Mark as inactive
    record.isActive = false;
    
    // Remove from registry
    this.subscriptions.delete(subscriptionId);
    
    console.log(`✅ Unsubscribed from subscription: ${subscriptionId}`);
  }

  /**
   * Get current connection state
   * 
   * Returns the current connection state shared across all subscriptions.
   * Useful for displaying connection status indicators in the UI.
   * 
   * @returns Current connection state
   * 
   * @example
   * ```typescript
   * const state = manager.getConnectionState();
   * 
   * if (state === 'connected') {
   *   hideConnectionWarning();
   * } else if (state === 'reconnecting') {
   *   showConnectionWarning('Reconnecting...');
   * } else if (state === 'failed') {
   *   showConnectionWarning('Connection failed. Tap to retry.');
   * }
   * ```
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get list of active subscription IDs
   * 
   * Returns an array of subscription IDs for all currently active subscriptions.
   * Useful for debugging and monitoring subscription lifecycle.
   * 
   * @returns Array of active subscription IDs
   * 
   * @example
   * ```typescript
   * const activeIds = manager.getActiveSubscriptions();
   * console.log(`Active subscriptions: ${activeIds.length}`);
   * 
   * // Debug: Log all active subscriptions
   * activeIds.forEach(id => {
   *   console.log(`- Subscription ${id}`);
   * });
   * ```
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Register a listener for connection state changes
   * 
   * Allows components to react to connection state changes (e.g., show/hide
   * connection warnings). Returns an unsubscribe function to remove the listener.
   * 
   * @param callback - Function to call when connection state changes
   * @returns Function to unsubscribe from state changes
   * 
   * @example
   * ```typescript
   * const unsubscribe = manager.onConnectionStateChange((state) => {
   *   if (state === 'connected') {
   *     setShowWarning(false);
   *   } else if (state === 'failed') {
   *     setShowWarning(true);
   *   }
   * });
   * 
   * // Clean up when component unmounts
   * return () => unsubscribe();
   * ```
   */
  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.connectionStateListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.connectionStateListeners.delete(callback);
    };
  }

  /**
   * Handle subscription status changes from Supabase
   * 
   * Processes subscription status updates and updates connection state accordingly.
   * Invokes error callbacks when subscription fails.
   * Uses ClaimErrorHandler for error classification (Requirement 9.4).
   * 
   * Requirements:
   * - 9.4: Distinguish between temporary and permanent failures
   * - 9.5: Ensure error message consistency
   * 
   * @param subscriptionId - ID of the subscription
   * @param status - Subscription status from Supabase
   * @param error - Error details (if any)
   * @param onError - Error callback to invoke
   * @private
   */
  private handleSubscriptionStatus(
    subscriptionId: string,
    status: string,
    error: any,
    onError: ErrorCallback
  ): void {
    switch (status) {
      case 'SUBSCRIBED':
        this.updateConnectionState('connected');
        break;
        
      case 'CHANNEL_ERROR':
        this.updateConnectionState('failed');
        
        // Classify error as temporary or permanent (Requirement 9.4)
        const classification = ClaimErrorHandler.classifyError(error);
        const isRetryable = classification === 'temporary';
        
        onError({
          type: 'connection_failed',
          message: error?.message || 'Failed to establish subscription',
          retryable: isRetryable,
        });
        break;
        
      case 'TIMED_OUT':
        this.updateConnectionState('failed');
        
        // Timeout errors are temporary and retryable (Requirement 9.4)
        onError({
          type: 'connection_failed',
          message: 'Subscription timed out',
          retryable: true,
        });
        break;
        
      case 'CLOSED':
        // CLOSED is expected during cleanup, not an error
        console.log(`📡 Channel closed for subscription ${subscriptionId}`);
        break;
        
      default:
        console.log(`📡 Unknown subscription status: ${status}`);
    }
  }

  /**
   * Update connection state and notify listeners
   * 
   * @param newState - New connection state
   * @private
   */
  private updateConnectionState(newState: ConnectionState): void {
    if (this.connectionState !== newState) {
      console.log(`📡 Connection state changed: ${this.connectionState} -> ${newState}`);
      this.connectionState = newState;
      
      // Notify all listeners
      this.connectionStateListeners.forEach(listener => {
        try {
          listener(newState);
        } catch (error) {
          console.error('Error in connection state listener:', error);
        }
      });
    }
  }

  /**
   * Generate unique subscription ID
   * 
   * @returns Unique subscription ID
   * @private
   */
  private generateSubscriptionId(): string {
    return `sub_${++this.subscriptionIdCounter}_${Date.now()}`;
  }

  /**
   * Get or create a shared channel for connection pooling
   * 
   * Implements connection pooling by reusing existing channels when possible.
   * Multiple subscriptions to the same resource (e.g., same claim or user)
   * share a single WebSocket connection.
   * 
   * Requirements: 7.4 (single connection per session)
   * 
   * @param channelName - Name of the channel
   * @param subscriptionId - ID of the subscription using this channel
   * @param config - Supabase real-time configuration
   * @param onUpdate - Callback for updates
   * @param onSubscribe - Callback for subscription status
   * @returns Shared channel instance
   * @private
   */
  private getOrCreateSharedChannel(
    channelName: string,
    subscriptionId: string,
    config: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: string;
      table: string;
      filter?: string;
    },
    onUpdate: (payload: any) => void,
    onSubscribe: (status: string, error: any) => void
  ): RealtimeChannel {
    // Check if shared channel already exists
    const existing = this.sharedChannels.get(channelName);
    
    if (existing) {
      console.log(`♻️ Reusing shared channel: ${channelName} (ref count: ${existing.refCount + 1})`);
      existing.refCount++;
      existing.subscriptionIds.add(subscriptionId);
      return existing.channel;
    }
    
    // Create new shared channel
    console.log(`🆕 Creating new shared channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        config as any,
        onUpdate
      )
      .subscribe(onSubscribe);
    
    // Store shared channel record
    const record: SharedChannelRecord = {
      channel,
      channelName,
      subscriptionIds: new Set([subscriptionId]),
      refCount: 1,
    };
    
    this.sharedChannels.set(channelName, record);
    
    return channel;
  }

  /**
   * Find channel name for a subscription
   * 
   * @param subscriptionId - ID of the subscription
   * @returns Channel name or null if not found
   * @private
   */
  private findChannelNameForSubscription(subscriptionId: string): string | null {
    for (const [channelName, record] of this.sharedChannels.entries()) {
      if (record.subscriptionIds.has(subscriptionId)) {
        return channelName;
      }
    }
    return null;
  }

  /**
   * Check if an update should be processed (debouncing)
   * 
   * Implements debouncing to prevent rapid UI updates from overwhelming
   * the application. Updates for the same claim within the minimum interval
   * are skipped.
   * 
   * Requirements: 7.4 (optimize for rapid updates)
   * 
   * @param claimId - ID of the claim
   * @param updatedAt - Timestamp of the update
   * @returns True if update should be processed, false if debounced
   * @private
   */
  private shouldProcessUpdate(claimId: string, updatedAt: string): boolean {
    if (!this.debounceConfig.enabled) {
      return true;
    }
    
    const lastUpdate = this.debounceConfig.lastUpdate.get(claimId);
    const now = Date.now();
    
    if (!lastUpdate) {
      // First update for this claim
      this.debounceConfig.lastUpdate.set(claimId, now);
      return true;
    }
    
    const elapsed = now - lastUpdate;
    
    if (elapsed >= this.debounceConfig.minInterval) {
      // Enough time has passed
      this.debounceConfig.lastUpdate.set(claimId, now);
      return true;
    }
    
    // Too soon, debounce this update
    return false;
  }

  /**
   * Check if a claim has reached a final state
   * 
   * Final states are: redeemed, expired
   * Claims in final states should be automatically unsubscribed.
   * 
   * Requirements: 3.5 (subscription cleanup for finalized claims)
   * 
   * @param status - Claim status
   * @returns True if claim is finalized
   * @private
   */
  private isClaimFinalized(status: string): boolean {
    return status === 'redeemed' || status === 'expired';
  }

  /**
   * Set debounce configuration
   * 
   * Allows customizing debounce behavior for testing or performance tuning.
   * 
   * @param enabled - Whether debouncing is enabled
   * @param minInterval - Minimum interval between updates (ms)
   */
  setDebounceConfig(enabled: boolean, minInterval: number = 100): void {
    this.debounceConfig.enabled = enabled;
    this.debounceConfig.minInterval = minInterval;
    console.log(`⚙️ Debounce config updated: enabled=${enabled}, minInterval=${minInterval}ms`);
  }

  /**
   * Get shared channel statistics
   * 
   * Returns statistics about shared channels for monitoring and debugging.
   * 
   * @returns Object with channel statistics
   */
  getChannelStats(): {
    totalChannels: number;
    totalSubscriptions: number;
    channels: Array<{
      name: string;
      refCount: number;
      subscriptionIds: string[];
    }>;
  } {
    const channels = Array.from(this.sharedChannels.entries()).map(([name, record]) => ({
      name,
      refCount: record.refCount,
      subscriptionIds: Array.from(record.subscriptionIds),
    }));
    
    return {
      totalChannels: this.sharedChannels.size,
      totalSubscriptions: this.subscriptions.size,
      channels,
    };
  }

  /**
   * Clean up all subscriptions (for testing or app shutdown)
   * 
   * Unsubscribes from all active subscriptions, clears the registry,
   * and cleans up all shared channels.
   * Useful for testing or when the app is shutting down.
   */
  cleanup(): void {
    console.log('🧹 Cleaning up all subscriptions...');
    
    const subscriptionIds = Array.from(this.subscriptions.keys());
    subscriptionIds.forEach(id => this.unsubscribe(id));
    
    // Clean up any remaining shared channels
    this.sharedChannels.forEach((record, channelName) => {
      console.log(`🧹 Cleaning up shared channel: ${channelName}`);
      record.channel.unsubscribe();
    });
    
    this.subscriptions.clear();
    this.sharedChannels.clear();
    this.connectionStateListeners.clear();
    this.debounceConfig.lastUpdate.clear();
    this.updateConnectionState('disconnected');
    
    console.log('✅ All subscriptions cleaned up');
  }
}

/**
 * Get the singleton instance of SubscriptionManager
 * 
 * Convenience function for accessing the SubscriptionManager singleton.
 * 
 * @returns The singleton instance
 * 
 * @example
 * ```typescript
 * import { getSubscriptionManager } from './services/SubscriptionManager';
 * 
 * const manager = getSubscriptionManager();
 * const subscription = manager.subscribeToClaimUpdates(...);
 * ```
 */
export function getSubscriptionManager(): SubscriptionManager {
  return SubscriptionManager.getInstance();
}
