/**
 * useFeedbackManager Hook
 * 
 * Custom hook for accessing the FeedbackManager singleton in React components.
 * Provides easy access to feedback methods for displaying success, error, and
 * connection warning feedback.
 * 
 * @module useFeedbackManager
 * @category Hooks
 */

import { useMemo } from 'react';
import { FeedbackManager } from '../services/FeedbackManager';

/**
 * Return type for useFeedbackManager hook
 */
export interface UseFeedbackManagerReturn {
  /**
   * Show success feedback for accepted claim
   * 
   * **Use for:** Claim accepted/redeemed by venue
   * 
   * **Pattern:** Success haptic + success toast
   * 
   * **Requirements:** 2.1, 2.2
   * 
   * @param claimId - ID of the accepted claim
   * 
   * @example
   * ```tsx
   * const { showAcceptedFeedback } = useFeedbackManager();
   * 
   * // In subscription callback
   * if (update.status === 'redeemed') {
   *   showAcceptedFeedback(claimId);
   * }
   * ```
   */
  showAcceptedFeedback: (claimId: string) => void;

  /**
   * Show error feedback for rejected claim
   * 
   * **Use for:** Claim rejected by venue
   * 
   * **Pattern:** Error haptic + error toast with reason
   * 
   * **Requirements:** 2.3
   * 
   * @param claimId - ID of the rejected claim
   * @param reason - Reason for rejection
   * 
   * @example
   * ```tsx
   * const { showRejectedFeedback } = useFeedbackManager();
   * 
   * // In subscription callback
   * if (update.status === 'rejected') {
   *   showRejectedFeedback(claimId, update.rejectionReason || 'Unknown reason');
   * }
   * ```
   */
  showRejectedFeedback: (claimId: string, reason: string) => void;

  /**
   * Show connection warning
   * 
   * **Use for:** Real-time connection failures
   * 
   * **Pattern:** Warning banner display
   * 
   * **Requirements:** 4.1
   * 
   * @example
   * ```tsx
   * const { showConnectionWarning } = useFeedbackManager();
   * 
   * // In subscription error callback
   * if (error.type === 'connection_failed') {
   *   showConnectionWarning();
   * }
   * ```
   */
  showConnectionWarning: () => void;

  /**
   * Hide connection warning
   * 
   * **Use for:** Connection restored
   * 
   * **Pattern:** Warning banner hide
   * 
   * **Requirements:** 4.1
   * 
   * @example
   * ```tsx
   * const { hideConnectionWarning } = useFeedbackManager();
   * 
   * // In connection state change listener
   * if (state === 'connected') {
   *   hideConnectionWarning();
   * }
   * ```
   */
  hideConnectionWarning: () => void;

  /**
   * Get connection warning visibility state
   * 
   * **Use for:** Checking if warning is currently visible
   * 
   * @returns True if connection warning is visible
   * 
   * @example
   * ```tsx
   * const { isConnectionWarningVisible } = useFeedbackManager();
   * 
   * const warningVisible = isConnectionWarningVisible();
   * ```
   */
  isConnectionWarningVisible: () => boolean;
}

/**
 * useFeedbackManager Hook
 * 
 * Custom hook for accessing the FeedbackManager singleton in React components.
 * Provides easy access to feedback methods without needing to import and call
 * getInstance() directly.
 * 
 * **Features:**
 * - Access to all FeedbackManager methods
 * - Singleton instance management
 * - Memoized for performance
 * - Simple, intuitive API
 * 
 * **Feedback Methods:**
 * - **showAcceptedFeedback**: Success haptic + success toast
 * - **showRejectedFeedback**: Error haptic + error toast with reason
 * - **showConnectionWarning**: Display connection warning banner
 * - **hideConnectionWarning**: Hide connection warning banner
 * 
 * **Requirements Satisfied:**
 * - Requirement 2.1: Visual feedback for accepted claims
 * - Requirement 2.2: Haptic feedback for accepted claims
 * - Requirement 2.3: Error feedback for rejected claims
 * - Requirement 4.1: Connection warning display
 * 
 * @returns Object containing feedback manager methods
 * 
 * @example
 * ```tsx
 * // Basic usage in a component
 * function ClaimDetailScreen({ claimId }: Props) {
 *   const { showAcceptedFeedback, showRejectedFeedback } = useFeedbackManager();
 *   const subscriptionManager = useSubscriptionManager();
 *   
 *   useEffect(() => {
 *     const subscription = subscriptionManager.subscribeToClaimUpdates(
 *       claimId,
 *       (update) => {
 *         if (update.status === 'redeemed') {
 *           showAcceptedFeedback(claimId);
 *         } else if (update.status === 'rejected') {
 *           showRejectedFeedback(claimId, update.rejectionReason || 'Unknown');
 *         }
 *       },
 *       (error) => {
 *         console.error('Subscription error:', error);
 *       }
 *     );
 *     
 *     return () => subscription.unsubscribe();
 *   }, [claimId]);
 *   
 *   return <View>...</View>;
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Connection warning usage
 * function MyClaimsScreen() {
 *   const { showConnectionWarning, hideConnectionWarning } = useFeedbackManager();
 *   const subscriptionManager = useSubscriptionManager();
 *   
 *   useEffect(() => {
 *     // Monitor connection state
 *     const unsubscribe = subscriptionManager.onConnectionStateChange((state) => {
 *       if (state === 'connected') {
 *         hideConnectionWarning();
 *       } else if (state === 'failed') {
 *         showConnectionWarning();
 *       }
 *     });
 *     
 *     return unsubscribe;
 *   }, []);
 *   
 *   return <View>...</View>;
 * }
 * ```
 */
export function useFeedbackManager(): UseFeedbackManagerReturn {
  // Get singleton instance (memoized to prevent re-creation)
  const manager = useMemo(() => FeedbackManager.getInstance(), []);

  // Return methods bound to the singleton instance
  return useMemo(
    () => ({
      showAcceptedFeedback: (claimId: string) => manager.showAcceptedFeedback(claimId),
      showRejectedFeedback: (claimId: string, reason: string) => 
        manager.showRejectedFeedback(claimId, reason),
      showConnectionWarning: () => manager.showConnectionWarning(),
      hideConnectionWarning: () => manager.hideConnectionWarning(),
      isConnectionWarningVisible: () => manager.isConnectionWarningVisible(),
    }),
    [manager]
  );
}
