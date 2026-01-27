/**
 * useSubscriptionManager Hook
 * 
 * React hook for accessing the SubscriptionManager singleton in components.
 * Provides a convenient way to subscribe to real-time updates with automatic
 * cleanup on component unmount.
 * 
 * @module useSubscriptionManager
 * @category Hooks
 */

import { useMemo } from 'react';
import { SubscriptionManager } from '../services/SubscriptionManager';

/**
 * Hook to access the SubscriptionManager singleton
 * 
 * Returns the singleton instance of SubscriptionManager for use in React components.
 * The instance is memoized to ensure the same instance is returned across renders.
 * 
 * @returns SubscriptionManager singleton instance
 * 
 * @example
 * ```typescript
 * function ClaimDetailScreen({ claimId }: Props) {
 *   const subscriptionManager = useSubscriptionManager();
 *   const [claim, setClaim] = useState(null);
 *   
 *   useEffect(() => {
 *     // Subscribe to claim updates
 *     const subscription = subscriptionManager.subscribeToClaimUpdates(
 *       claimId,
 *       (update) => {
 *         setClaim(prev => ({ ...prev, ...update }));
 *       },
 *       (error) => {
 *         console.error('Subscription error:', error);
 *       }
 *     );
 *     
 *     // Cleanup on unmount
 *     return () => subscription.unsubscribe();
 *   }, [claimId, subscriptionManager]);
 *   
 *   return <View>...</View>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * function MyClaimsScreen({ userId }: Props) {
 *   const subscriptionManager = useSubscriptionManager();
 *   const [claims, setClaims] = useState([]);
 *   
 *   useEffect(() => {
 *     // Subscribe to all user claims
 *     const subscription = subscriptionManager.subscribeToUserClaims(
 *       userId,
 *       (update) => {
 *         setClaims(prev => 
 *           prev.map(claim => 
 *             claim.id === update.claimId 
 *               ? { ...claim, ...update }
 *               : claim
 *           )
 *         );
 *       },
 *       (error) => {
 *         console.error('Subscription error:', error);
 *       }
 *     );
 *     
 *     return () => subscription.unsubscribe();
 *   }, [userId, subscriptionManager]);
 *   
 *   return <FlatList data={claims} ... />;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * function ConnectionIndicator() {
 *   const subscriptionManager = useSubscriptionManager();
 *   const [connectionState, setConnectionState] = useState(
 *     subscriptionManager.getConnectionState()
 *   );
 *   
 *   useEffect(() => {
 *     // Monitor connection state changes
 *     const unsubscribe = subscriptionManager.onConnectionStateChange(
 *       setConnectionState
 *     );
 *     
 *     return unsubscribe;
 *   }, [subscriptionManager]);
 *   
 *   if (connectionState !== 'connected') {
 *     return <ConnectionWarning state={connectionState} />;
 *   }
 *   
 *   return null;
 * }
 * ```
 */
export function useSubscriptionManager(): SubscriptionManager {
  // Memoize the instance to ensure same instance across renders
  const manager = useMemo(() => SubscriptionManager.getInstance(), []);
  
  return manager;
}
