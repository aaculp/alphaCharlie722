/**
 * Feedback Manager
 * 
 * Global singleton service for coordinating visual and haptic feedback
 * when claim status changes occur. Provides centralized feedback management
 * with debouncing to prevent feedback spam.
 * 
 * Features:
 * - Success feedback with haptic and visual confirmation
 * - Rejection feedback with error display
 * - Connection warning display/hide
 * - Debouncing logic to prevent rapid feedback spam
 * - Integration with React Native Haptics API
 * 
 * @module FeedbackManager
 * @category Services
 */

import {
  triggerMediumHaptic,
  triggerErrorHaptic,
} from '../utils/haptics';
import { ClaimErrorHandler, getActionableGuidance } from '../utils/errors/ClaimErrorHandler';

/**
 * Feedback type for tracking debouncing
 */
type FeedbackType = 'accepted' | 'rejected' | 'connection_warning';

/**
 * Callback for displaying toast notifications
 */
export type ToastCallback = (message: string, type: 'success' | 'error' | 'warning') => void;

/**
 * Callback for displaying connection warnings
 */
export type ConnectionWarningCallback = (visible: boolean) => void;

/**
 * Debounce configuration
 */
interface DebounceConfig {
  /** Minimum time between feedback events (ms) */
  minInterval: number;
  /** Last timestamp for each feedback type */
  lastTrigger: Map<string, number>;
}

/**
 * Global Feedback Manager
 * 
 * Singleton service for managing all feedback (visual and haptic) in the app.
 * Provides centralized feedback coordination with debouncing to prevent spam.
 * 
 * Design Philosophy:
 * - Single source of truth for feedback state
 * - Debouncing prevents rapid feedback spam
 * - Haptic feedback integrated with visual feedback
 * - Easy to extend with new feedback types
 * 
 * @example
 * ```typescript
 * // Get the singleton instance
 * const manager = FeedbackManager.getInstance();
 * 
 * // Set up callbacks (typically in a root component or context)
 * manager.setToastCallback((message, type) => {
 *   if (type === 'success') {
 *     showSuccessToast(message);
 *   } else if (type === 'error') {
 *     showErrorToast(message);
 *   }
 * });
 * 
 * manager.setConnectionWarningCallback((visible) => {
 *   setShowConnectionWarning(visible);
 * });
 * 
 * // Show feedback when claim is accepted
 * manager.showAcceptedFeedback('claim-123');
 * 
 * // Show feedback when claim is rejected
 * manager.showRejectedFeedback('claim-456', 'Invalid claim code');
 * 
 * // Show connection warning
 * manager.showConnectionWarning();
 * 
 * // Hide connection warning
 * manager.hideConnectionWarning();
 * ```
 */
export class FeedbackManager {
  private static instance: FeedbackManager | null = null;
  
  /** Callback for displaying toast notifications */
  private toastCallback: ToastCallback | null = null;
  
  /** Callback for displaying connection warnings */
  private connectionWarningCallback: ConnectionWarningCallback | null = null;
  
  /** Debounce configuration */
  private debounce: DebounceConfig = {
    minInterval: 1000, // 1 second minimum between same feedback type
    lastTrigger: new Map(),
  };
  
  /** Connection warning visibility state */
  private connectionWarningVisible = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    console.log('🎯 FeedbackManager initialized');
  }

  /**
   * Get the singleton instance of FeedbackManager
   * 
   * @returns The singleton instance
   */
  static getInstance(): FeedbackManager {
    if (!FeedbackManager.instance) {
      FeedbackManager.instance = new FeedbackManager();
    }
    return FeedbackManager.instance;
  }

  /**
   * Set the toast callback for displaying notifications
   * 
   * This callback will be invoked when feedback needs to display a toast.
   * Typically set up in a root component or context provider.
   * 
   * @param callback - Function to display toast notifications
   * 
   * @example
   * ```typescript
   * manager.setToastCallback((message, type) => {
   *   if (type === 'success') {
   *     Toast.show({ type: 'success', text1: message });
   *   } else if (type === 'error') {
   *     Toast.show({ type: 'error', text1: message });
   *   }
   * });
   * ```
   */
  setToastCallback(callback: ToastCallback): void {
    this.toastCallback = callback;
  }

  /**
   * Set the connection warning callback
   * 
   * This callback will be invoked when connection warning visibility changes.
   * Typically set up in a root component or context provider.
   * 
   * @param callback - Function to show/hide connection warning
   * 
   * @example
   * ```typescript
   * manager.setConnectionWarningCallback((visible) => {
   *   setShowConnectionWarning(visible);
   * });
   * ```
   */
  setConnectionWarningCallback(callback: ConnectionWarningCallback): void {
    this.connectionWarningCallback = callback;
  }

  /**
   * Show success feedback for accepted claim
   * 
   * Displays success animation/toast and triggers haptic feedback.
   * Debounced to prevent spam if multiple claims are accepted rapidly.
   * 
   * @param claimId - ID of the accepted claim
   * 
   * @example
   * ```typescript
   * // In subscription callback
   * subscriptionManager.subscribeToClaimUpdates(
   *   claimId,
   *   (update) => {
   *     if (update.status === 'redeemed') {
   *       feedbackManager.showAcceptedFeedback(claimId);
   *     }
   *   },
   *   (error) => { ... }
   * );
   * ```
   */
  showAcceptedFeedback(claimId: string): void {
    // Check debouncing
    if (!this.shouldTriggerFeedback('accepted', claimId)) {
      console.log(`⏭️ Skipping accepted feedback for ${claimId} (debounced)`);
      return;
    }
    
    console.log(`✅ Showing accepted feedback for claim: ${claimId}`);
    
    // Trigger haptic feedback (medium impact for success)
    triggerMediumHaptic();
    
    // Display success toast
    if (this.toastCallback) {
      this.toastCallback('Your claim was redeemed!', 'success');
    } else {
      console.warn('⚠️ Toast callback not set, cannot display success message');
    }
    
    // Update debounce timestamp
    this.updateDebounceTimestamp('accepted', claimId);
  }

  /**
   * Show error feedback for rejected claim
   * 
   * Displays error message with rejection reason and triggers error haptic.
   * Includes actionable guidance per Requirement 9.2.
   * Debounced to prevent spam if multiple claims are rejected rapidly.
   * 
   * Requirements: 9.2 (actionable guidance), 9.5 (consistent messaging)
   * 
   * @param claimId - ID of the rejected claim
   * @param reason - Reason for rejection
   * 
   * @example
   * ```typescript
   * // In subscription callback
   * subscriptionManager.subscribeToClaimUpdates(
   *   claimId,
   *   (update) => {
   *     if (update.status === 'rejected') {
   *       feedbackManager.showRejectedFeedback(
   *         claimId,
   *         update.rejectionReason || 'Unknown reason'
   *       );
   *     }
   *   },
   *   (error) => { ... }
   * );
   * ```
   */
  showRejectedFeedback(claimId: string, reason: string): void {
    // Check debouncing
    if (!this.shouldTriggerFeedback('rejected', claimId)) {
      console.log(`⏭️ Skipping rejected feedback for ${claimId} (debounced)`);
      return;
    }
    
    console.log(`❌ Showing rejected feedback for claim: ${claimId}`);
    
    // Trigger error haptic feedback
    triggerErrorHaptic();
    
    // Create structured error with actionable guidance (Requirement 9.2)
    const error = ClaimErrorHandler.createError('rejected', reason);
    
    // Display error toast with reason and actionable guidance
    if (this.toastCallback) {
      const message = `${error.message}\n${error.actionableGuidance}`;
      this.toastCallback(message, 'error');
    } else {
      console.warn('⚠️ Toast callback not set, cannot display error message');
    }
    
    // Update debounce timestamp
    this.updateDebounceTimestamp('rejected', claimId);
  }

  /**
   * Show error feedback for expired claim
   * 
   * Displays expiration message with appropriate messaging and triggers error haptic.
   * Includes actionable guidance per Requirement 9.3.
   * Debounced to prevent spam if multiple claims expire rapidly.
   * 
   * Requirements: 9.3 (expiration handling), 9.5 (consistent messaging)
   * 
   * @param claimId - ID of the expired claim
   * @param expiresAt - Optional expiration timestamp for detailed message
   * 
   * @example
   * ```typescript
   * // In subscription callback
   * subscriptionManager.subscribeToClaimUpdates(
   *   claimId,
   *   (update) => {
   *     if (update.status === 'expired') {
   *       feedbackManager.showExpiredFeedback(claimId);
   *     }
   *   },
   *   (error) => { ... }
   * );
   * ```
   */
  showExpiredFeedback(claimId: string, expiresAt?: string): void {
    // Check debouncing
    if (!this.shouldTriggerFeedback('rejected', claimId)) {
      console.log(`⏭️ Skipping expired feedback for ${claimId} (debounced)`);
      return;
    }
    
    console.log(`⏰ Showing expired feedback for claim: ${claimId}`);
    
    // Trigger error haptic feedback
    triggerErrorHaptic();
    
    // Create structured error with expiration message (Requirement 9.3)
    const error = ClaimErrorHandler.createError('expired');
    
    // Display error toast with expiration message and actionable guidance
    if (this.toastCallback) {
      const message = `${error.message}\n${error.actionableGuidance}`;
      this.toastCallback(message, 'error');
    } else {
      console.warn('⚠️ Toast callback not set, cannot display error message');
    }
    
    // Update debounce timestamp
    this.updateDebounceTimestamp('rejected', claimId);
  }

  /**
   * Show connection warning
   * 
   * Displays a warning banner indicating real-time updates are unavailable.
   * Idempotent - calling multiple times has no additional effect.
   * 
   * @example
   * ```typescript
   * // In subscription error callback
   * subscriptionManager.subscribeToClaimUpdates(
   *   claimId,
   *   (update) => { ... },
   *   (error) => {
   *     if (error.type === 'connection_failed') {
   *       feedbackManager.showConnectionWarning();
   *     }
   *   }
   * );
   * ```
   */
  showConnectionWarning(): void {
    // Check if already visible (idempotent)
    if (this.connectionWarningVisible) {
      console.log('⏭️ Connection warning already visible');
      return;
    }
    
    console.log('⚠️ Showing connection warning');
    
    this.connectionWarningVisible = true;
    
    // Display connection warning
    if (this.connectionWarningCallback) {
      this.connectionWarningCallback(true);
    } else {
      console.warn('⚠️ Connection warning callback not set');
    }
  }

  /**
   * Hide connection warning
   * 
   * Hides the connection warning banner.
   * Idempotent - calling multiple times has no additional effect.
   * 
   * @example
   * ```typescript
   * // In connection state change listener
   * subscriptionManager.onConnectionStateChange((state) => {
   *   if (state === 'connected') {
   *     feedbackManager.hideConnectionWarning();
   *   } else if (state === 'failed') {
   *     feedbackManager.showConnectionWarning();
   *   }
   * });
   * ```
   */
  hideConnectionWarning(): void {
    // Check if already hidden (idempotent)
    if (!this.connectionWarningVisible) {
      console.log('⏭️ Connection warning already hidden');
      return;
    }
    
    console.log('✅ Hiding connection warning');
    
    this.connectionWarningVisible = false;
    
    // Hide connection warning
    if (this.connectionWarningCallback) {
      this.connectionWarningCallback(false);
    } else {
      console.warn('⚠️ Connection warning callback not set');
    }
  }

  /**
   * Check if feedback should be triggered (debouncing logic)
   * 
   * Prevents feedback spam by enforcing a minimum interval between
   * feedback events of the same type for the same claim.
   * 
   * @param type - Type of feedback
   * @param claimId - ID of the claim
   * @returns True if feedback should be triggered, false if debounced
   * @private
   */
  private shouldTriggerFeedback(type: FeedbackType, claimId: string): boolean {
    const key = `${type}:${claimId}`;
    const lastTrigger = this.debounce.lastTrigger.get(key);
    
    if (!lastTrigger) {
      // First time triggering this feedback
      return true;
    }
    
    const now = Date.now();
    const elapsed = now - lastTrigger;
    
    // Check if enough time has passed
    return elapsed >= this.debounce.minInterval;
  }

  /**
   * Update debounce timestamp for a feedback type
   * 
   * Records the current timestamp for debouncing future feedback events.
   * 
   * @param type - Type of feedback
   * @param claimId - ID of the claim
   * @private
   */
  private updateDebounceTimestamp(type: FeedbackType, claimId: string): void {
    const key = `${type}:${claimId}`;
    this.debounce.lastTrigger.set(key, Date.now());
  }

  /**
   * Get connection warning visibility state
   * 
   * Returns whether the connection warning is currently visible.
   * Useful for testing or debugging.
   * 
   * @returns True if connection warning is visible
   */
  isConnectionWarningVisible(): boolean {
    return this.connectionWarningVisible;
  }

  /**
   * Set debounce interval
   * 
   * Configures the minimum time between feedback events of the same type.
   * Useful for testing or customizing feedback behavior.
   * 
   * @param intervalMs - Minimum interval in milliseconds
   * 
   * @example
   * ```typescript
   * // Reduce debounce interval for testing
   * manager.setDebounceInterval(100);
   * ```
   */
  setDebounceInterval(intervalMs: number): void {
    this.debounce.minInterval = intervalMs;
    console.log(`🎯 Debounce interval set to ${intervalMs}ms`);
  }

  /**
   * Clear debounce state
   * 
   * Clears all debounce timestamps. Useful for testing or resetting state.
   * 
   * @example
   * ```typescript
   * // Clear debounce state between tests
   * manager.clearDebounceState();
   * ```
   */
  clearDebounceState(): void {
    this.debounce.lastTrigger.clear();
    console.log('🧹 Debounce state cleared');
  }

  /**
   * Reset the FeedbackManager (for testing)
   * 
   * Resets all state and callbacks. Useful for testing to ensure clean state.
   */
  reset(): void {
    console.log('🔄 Resetting FeedbackManager');
    this.toastCallback = null;
    this.connectionWarningCallback = null;
    this.connectionWarningVisible = false;
    this.clearDebounceState();
  }
}

/**
 * Get the singleton instance of FeedbackManager
 * 
 * Convenience function for accessing the FeedbackManager singleton.
 * 
 * @returns The singleton instance
 * 
 * @example
 * ```typescript
 * import { getFeedbackManager } from './services/FeedbackManager';
 * 
 * const manager = getFeedbackManager();
 * manager.showAcceptedFeedback('claim-123');
 * ```
 */
export function getFeedbackManager(): FeedbackManager {
  return FeedbackManager.getInstance();
}
